/**
 * Narrador do jogo: fala com a voz Faber quando ela está pronta e com a voz do navegador quando não está.
 * Gera frase por frase e já toca a primeira enquanto as outras são geradas; uma fala nova interrompe a anterior.
 */
import { audio } from '../audio/audio';
import { definirNarrador, falarNavegador, pararNavegador, textoParaFala } from '../ui/speech';
import { FaberCliente, type FaberProgresso } from './faber';

export interface Motor {
  gerar(frase: string): Promise<Float32Array>;
  taxa: number;
}
export interface Saida {
  tocar(pcm: Float32Array, taxa: number): { fim: Promise<void>; parar(): void };
}
interface Deps {
  motor: () => Motor | null;
  saida: Saida;
  navegador: (texto: string) => void;
  pararNavegador: () => void;
  volume: () => number;
}

/** Texto do jogo → frases prontas para falar (símbolos por extenso, sem itens vazios). */
export function dividirFrases(texto: string): string[] {
  return (textoParaFala(texto).match(/[^.!?…]+[.!?…]*/g) ?? []).map((f) => f.trim()).filter((f) => /[\p{L}\p{N}]/u.test(f));
}

const CACHE_MAX = 60;
class Cancelado extends Error {}

interface Pedido {
  frase: string;
  geracao: number | null; // null = preparo
  ok: (pcm: Float32Array) => void;
  erro: (e: Error) => void;
}

export class Narrador {
  private cache = new Map<string, Float32Array>();
  private filaFala: Pedido[] = [];
  private filaPreparo: Pedido[] = [];
  private emAndamento: Pedido | null = null;
  private geracao = 0;
  private tocando: { parar(): void } | null = null;

  constructor(private readonly deps: Deps) {}

  /** Verdadeiro enquanto há frase da fala atual sendo gerada. */
  get ocupado(): boolean {
    return this.filaFala.length > 0 || (this.emAndamento?.geracao ?? null) !== null;
  }

  falar(texto: string): void {
    this.parar();
    if (this.deps.volume() <= 0) return;
    const frases = dividirFrases(texto);
    if (!frases.length) return;
    const motor = this.deps.motor();
    if (!motor) {
      this.deps.navegador(texto);
      return;
    }
    const g = this.geracao;
    const audios = frases.map((f) => this.obter(f, g, motor));
    void this.tocarEmOrdem(frases, audios, g, motor.taxa);
  }

  /** Gera em segundo plano e guarda; não toca nada. */
  preparar(texto: string): void {
    const motor = this.deps.motor();
    if (!motor) return;
    for (const f of dividirFrases(texto)) this.obter(f, null, motor).catch(() => {});
  }

  parar(): void {
    this.geracao++;
    for (const p of this.filaFala) p.erro(new Cancelado());
    this.filaFala = [];
    this.tocando?.parar();
    this.tocando = null;
    this.deps.pararNavegador();
  }

  private async tocarEmOrdem(frases: string[], audios: Promise<Float32Array>[], g: number, taxa: number): Promise<void> {
    for (let i = 0; i < frases.length; i++) {
      let pcm: Float32Array;
      try {
        pcm = await audios[i]!;
      } catch (e) {
        if (e instanceof Cancelado || g !== this.geracao) return;
        // A Faber falhou: o resto da fala vai para a voz do navegador.
        this.deps.navegador(frases.slice(i).join(' '));
        return;
      }
      if (g !== this.geracao) return;
      if (!pcm.length) continue;
      const h = this.deps.saida.tocar(pcm, taxa);
      this.tocando = h;
      await h.fim;
      if (g !== this.geracao) return;
    }
    this.tocando = null;
  }

  private obter(frase: string, geracao: number | null, motor: Motor): Promise<Float32Array> {
    const salvo = this.cache.get(frase);
    if (salvo) {
      this.cache.delete(frase); // LRU: volta para o fim
      this.cache.set(frase, salvo);
      return Promise.resolve(salvo);
    }
    // Já sendo preparada? Promove para a fala.
    const iPrep = this.filaPreparo.findIndex((p) => p.frase === frase);
    return new Promise<Float32Array>((ok, erro) => {
      const pedido: Pedido = { frase, geracao, ok, erro };
      if (iPrep >= 0 && geracao !== null) {
        const [prep] = this.filaPreparo.splice(iPrep, 1);
        pedido.ok = (pcm) => {
          prep!.ok(pcm);
          ok(pcm);
        };
      }
      (geracao === null ? this.filaPreparo : this.filaFala).push(pedido);
      this.proximo(motor);
    });
  }

  private proximo(motor: Motor): void {
    if (this.emAndamento) return;
    const p = this.filaFala.shift() ?? this.filaPreparo.shift();
    if (!p) return;
    this.emAndamento = p;
    motor.gerar(p.frase).then(
      (pcm) => {
        this.guardar(p.frase, pcm);
        this.emAndamento = null;
        p.ok(pcm);
        this.proximo(motor);
      },
      (e: Error) => {
        this.emAndamento = null;
        p.erro(e);
        this.proximo(motor);
      },
    );
  }

  private guardar(frase: string, pcm: Float32Array): void {
    this.cache.set(frase, pcm);
    if (this.cache.size > CACHE_MAX) this.cache.delete(this.cache.keys().next().value!);
  }

  /** Quantas frases estão guardadas (testes). */
  get tamanhoCache(): number {
    return this.cache.size;
  }
}

// ---- Estado da voz Faber no jogo ----
let cliente: FaberCliente | null = null;
let estado: FaberProgresso = { estado: 'desligada', fracao: 0 };

export function faberEstado(): FaberProgresso {
  return estado;
}
/** Usado pela inicialização da Faber (Tarefa 3) para registrar o cliente e o estado. */
export function definirFaber(c: FaberCliente | null, p: FaberProgresso): void {
  cliente = c;
  estado = p;
}

export const narrador = new Narrador({
  motor: () => (estado.estado === 'pronta' ? cliente : null),
  saida: { tocar: (pcm, taxa) => audio.playPcm(pcm, taxa) },
  navegador: falarNavegador,
  pararNavegador,
  volume: () => audio.voiceVolume,
});

definirNarrador({ falar: (t) => narrador.falar(t), parar: () => narrador.parar() });
