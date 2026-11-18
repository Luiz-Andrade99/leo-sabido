/// <reference lib="webworker" />
/**
 * Worker da voz Faber (Piper): texto → fonemas (espeak-ng em WASM) → áudio (modelo ONNX).
 * Tudo vem do próprio site (pasta voz/) e fica guardado no Cache Storage para funcionar sem internet.
 */
import * as ort from 'onnxruntime-web/wasm';

export type PedidoFaber = { tipo: 'carregar'; base: string } | { tipo: 'gerar'; id: number; texto: string };
export type RespostaFaber =
  | { tipo: 'progresso'; fracao: number }
  | { tipo: 'pronta'; etapas?: Record<string, number> }
  | { tipo: 'audio'; id: number; pcm: Float32Array; ms: { fonemas: number; modelo: number } }
  | { tipo: 'erro'; id?: number; mensagem: string };

interface ConfigModelo {
  espeak: { voice: string };
  speaker_id_map?: Record<string, number>;
}
interface ModuloFonemas {
  callMain(args: string[]): void;
}
type CriarFonemas = (opts: { print: (d: string) => void; printErr: (m: string) => void; locateFile: (u: string) => string }) => Promise<ModuloFonemas>;

const CACHE = 'leo-voz-v1';
/** Arquivos grandes, com tamanho aproximado para a barra de progresso. */
const GRANDES: [string, number][] = [
  ['faber.onnx', 63_200_000],
  ['piper_phonemize.data', 18_100_000],
  ['ort/ort-wasm-simd-threaded.wasm', 14_900_000],
];
const ESCALAS = [0.667, 1.05, 0.8]; // noise_scale, length_scale, noise_w (amostras aprovadas)

const ctx = self as unknown as DedicatedWorkerGlobalScope;
const enviar = (m: RespostaFaber, transfer: Transferable[] = []): void => ctx.postMessage(m, transfer);

let sessao: ort.InferenceSession | null = null;
let cfg: ConfigModelo | null = null;
let criarFonemas: CriarFonemas | null = null;
let urlData = '';
let urlWasmFonemas = '';
let fila: Promise<unknown> = Promise.resolve();

/** Busca do cache; se não houver, baixa por partes (somando ao progresso) e só guarda o arquivo inteiro. */
async function obter(cache: Cache, url: string, aoBaixar: (n: number) => void): Promise<Blob> {
  const salvo = await cache.match(url);
  if (salvo) return salvo.blob();
  const r = await fetch(url);
  if (!r.ok || !r.body) throw new Error(`HTTP ${r.status} em ${url}`);
  // O corpo vai direto para o cache (em fluxo), contando os bytes para a barra de progresso.
  // cache.put só grava se o corpo chegar inteiro: download interrompido não deixa arquivo pela metade.
  const contador = new TransformStream<Uint8Array, Uint8Array>({
    transform(parte, ctrl) {
      aoBaixar(parte.byteLength);
      ctrl.enqueue(parte);
    },
  });
  await cache.put(url, new Response(r.body.pipeThrough(contador), { headers: r.headers }));
  const salvoAgora = await cache.match(url);
  if (!salvoAgora) throw new Error(`não foi possível guardar ${url}`);
  return salvoAgora.blob();
}

async function carregar(base: string): Promise<void> {
  const t0 = performance.now();
  const etapas: Record<string, number> = {};
  const marcar = (nome: string): void => {
    etapas[nome] = Math.round(performance.now() - t0);
  };
  const cache = await caches.open(CACHE);
  const total = GRANDES.reduce((s, [, n]) => s + n, 0);
  let baixado = 0;
  let ultimo = 0;
  const progresso = (n: number): void => {
    baixado += n;
    const f = Math.min(0.99, baixado / total);
    if (f - ultimo >= 0.01) {
      ultimo = f;
      enviar({ tipo: 'progresso', fracao: f });
    }
  };
  const [modelo, data, wasmOrt, cfgBlob, jsFonemas, wasmFonemas] = await Promise.all([
    obter(cache, `${base}faber.onnx`, progresso),
    obter(cache, `${base}piper_phonemize.data`, progresso),
    obter(cache, `${base}ort/ort-wasm-simd-threaded.wasm`, progresso),
    obter(cache, `${base}faber.onnx.json`, () => {}),
    obter(cache, `${base}piper_phonemize.js`, () => {}),
    obter(cache, `${base}piper_phonemize.wasm`, () => {}),
  ]);
  marcar('arquivos');
  cfg = JSON.parse(await cfgBlob.text()) as ConfigModelo;
  urlData = URL.createObjectURL(data);
  urlWasmFonemas = URL.createObjectURL(wasmFonemas);
  // piper_phonemize.js é um script UMD que define createPiperPhonemize; o worker é módulo (sem importScripts).
  criarFonemas = new Function(`${await jsFonemas.text()}\nreturn createPiperPhonemize;`)() as CriarFonemas;

  // Threads só existem com isolamento de origem (COOP/COEP); sem ele, uma thread.
  ort.env.wasm.numThreads = ctx.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;
  ort.env.wasm.wasmPaths = { mjs: `${base}ort/ort-wasm-simd-threaded.mjs`, wasm: URL.createObjectURL(wasmOrt) };
  const bytes = new Uint8Array(await modelo.arrayBuffer());
  marcar('leitura');
  sessao = await ort.InferenceSession.create(bytes, { executionProviders: ['wasm'], graphOptimizationLevel: 'disabled' });
  marcar('sessao');
  // Aquecimento: a primeira execução prepara o espeak-ng e o modelo; assim a primeira fala de verdade sai mais rápido.
  await sintetizar('Olá.');
  marcar('aquecimento');
  enviar({ tipo: 'pronta', etapas });
}

/** Uma instância só do espeak-ng: criar uma por frase custa ~1 s (carrega 17 MB de dados de pronúncia). */
let moduloFonemas: Promise<ModuloFonemas> | null = null;
let aoImprimir: ((d: string) => void) | null = null;
let aoErro: ((m: string) => void) | null = null;

async function fonemas(texto: string): Promise<number[]> {
  moduloFonemas ??= criarFonemas!({
    print: (d) => aoImprimir?.(d),
    printErr: (m) => aoErro?.(m),
    locateFile: (u) => (u.endsWith('.wasm') ? urlWasmFonemas : u.endsWith('.data') ? urlData : u),
  });
  const m = await moduloFonemas;
  return new Promise((resolve, reject) => {
    aoImprimir = (d) => resolve(JSON.parse(d).phoneme_ids as number[]);
    aoErro = (e) => reject(new Error(e));
    m.callMain(['-l', cfg!.espeak.voice, '--input', JSON.stringify([{ text: texto }]), '--espeak_data', '/espeak-ng-data']);
  });
}

async function gerar(id: number, texto: string): Promise<void> {
  const t = texto.trim();
  if (!t) {
    enviar({ tipo: 'audio', id, pcm: new Float32Array(0), ms: { fonemas: 0, modelo: 0 } });
    return;
  }
  const { pcm, ms } = await sintetizar(t);
  enviar({ tipo: 'audio', id, pcm, ms }, [pcm.buffer]);
}

async function sintetizar(t: string): Promise<{ pcm: Float32Array; ms: { fonemas: number; modelo: number } }> {
  const t0 = performance.now();
  const ids = await fonemas(t);
  const t1 = performance.now();
  const feeds: Record<string, ort.Tensor> = {
    input: new ort.Tensor('int64', BigInt64Array.from(ids, (n) => BigInt(n)), [1, ids.length]),
    input_lengths: new ort.Tensor('int64', BigInt64Array.from([BigInt(ids.length)]), [1]),
    scales: new ort.Tensor('float32', Float32Array.from(ESCALAS), [3]),
  };
  if (cfg!.speaker_id_map && Object.keys(cfg!.speaker_id_map).length) feeds.sid = new ort.Tensor('int64', BigInt64Array.from([0n]), [1]);
  const saida = await sessao!.run(feeds);
  const pcm = new Float32Array(saida.output!.data as Float32Array);
  return { pcm, ms: { fonemas: t1 - t0, modelo: performance.now() - t1 } };
}

ctx.onmessage = (ev: MessageEvent<PedidoFaber>) => {
  const p = ev.data;
  // Uma tarefa por vez: o modelo roda numa thread só.
  fila = fila.then(async () => {
    try {
      if (p.tipo === 'carregar') {
        if (!sessao) await carregar(p.base);
        else enviar({ tipo: 'pronta' });
      } else {
        if (!sessao) throw new Error('voz não carregada');
        await gerar(p.id, p.texto);
      }
    } catch (e) {
      enviar({ tipo: 'erro', id: p.tipo === 'gerar' ? p.id : undefined, mensagem: e instanceof Error ? e.message : String(e) });
    }
  });
};
