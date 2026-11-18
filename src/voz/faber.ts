/**
 * Voz Faber (Piper, pt-BR): voz neural gerada no próprio aparelho, num Web Worker.
 * Os arquivos vêm da pasta voz/ do próprio site e ficam no Cache Storage (funciona sem internet depois).
 */
import type { PedidoFaber, RespostaFaber } from './faber.worker';

export type FaberEstado = 'desligada' | 'baixando' | 'pronta' | 'indisponivel';
export interface FaberProgresso {
  estado: FaberEstado;
  /** 0 a 1 durante o download. */
  fracao: number;
}

/** O aparelho consegue rodar a Faber? (WebAssembly, Cache Storage, Worker e memória ≥ 2 GB quando informada.) */
export function faberSuportada(g: typeof globalThis = globalThis): boolean {
  const nav = (g as { navigator?: Navigator & { deviceMemory?: number } }).navigator;
  const mem = nav?.deviceMemory;
  return typeof g.WebAssembly === 'object' && 'caches' in g && typeof g.Worker === 'function' && (mem === undefined || mem >= 2);
}

export class FaberCliente {
  readonly taxa = 22050;
  private worker: Worker | null = null;
  private proximo = 1;
  private pendentes = new Map<number, { resolve: (pcm: Float32Array) => void; reject: (e: Error) => void }>();
  private carregando: Promise<void> | null = null;
  /** Tempos da última frase gerada (diagnóstico). */
  ultimoTempo = { fonemas: 0, modelo: 0 };
  /** Tempos do carregamento, em ms desde o início (diagnóstico). */
  etapasCarga: Record<string, number> = {};

  carregar(onProgresso: (p: FaberProgresso) => void): Promise<void> {
    if (this.carregando) return this.carregando;
    this.carregando = new Promise<void>((resolve, reject) => {
      const w = new Worker(new URL('./faber.worker.ts', import.meta.url), { type: 'module' });
      this.worker = w;
      w.onmessage = (ev: MessageEvent<RespostaFaber>) => {
        const m = ev.data;
        if (m.tipo === 'progresso') onProgresso({ estado: 'baixando', fracao: m.fracao });
        else if (m.tipo === 'pronta') {
          this.etapasCarga = m.etapas ?? {};
          onProgresso({ estado: 'pronta', fracao: 1 });
          resolve();
        } else if (m.tipo === 'audio') {
          this.ultimoTempo = m.ms;
          this.pendentes.get(m.id)?.resolve(m.pcm);
          this.pendentes.delete(m.id);
        } else if (m.id !== undefined) {
          this.pendentes.get(m.id)?.reject(new Error(m.mensagem));
          this.pendentes.delete(m.id);
        } else {
          onProgresso({ estado: 'indisponivel', fracao: 0 });
          reject(new Error(m.mensagem));
        }
      };
      w.onerror = (e) => {
        onProgresso({ estado: 'indisponivel', fracao: 0 });
        reject(new Error(e.message || 'falha no worker da voz'));
      };
      onProgresso({ estado: 'baixando', fracao: 0 });
      const pedido: PedidoFaber = { tipo: 'carregar', base: new URL('./voz/', document.baseURI).href };
      w.postMessage(pedido);
    });
    return this.carregando;
  }

  gerar(frase: string): Promise<Float32Array> {
    if (!this.worker) return Promise.reject(new Error('voz não carregada'));
    const id = this.proximo++;
    return new Promise((resolve, reject) => {
      this.pendentes.set(id, { resolve, reject });
      const pedido: PedidoFaber = { tipo: 'gerar', id, texto: frase };
      this.worker!.postMessage(pedido);
    });
  }

  encerrar(): void {
    this.worker?.terminate();
    this.worker = null;
    this.carregando = null;
    for (const p of this.pendentes.values()) p.reject(new Error('voz encerrada'));
    this.pendentes.clear();
  }
}
