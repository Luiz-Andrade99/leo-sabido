import { APOIOS, type Apoio } from '../challenges/engine/session';

/** Opções lidas da URL (homologação e testes). Nenhuma delas identifica o jogador. */
export interface LaunchOptions {
  /** Expõe window.__leo para testes automatizados. */
  testHooks: boolean;
  /** Força a taxa do laço de jogo (ex.: 144) — usado para testar estabilidade da física. */
  fps: number | null;
  /** Semente dos sorteios de desafios (reprodutibilidade). */
  seed: number;
  debugPhysics: boolean;
  apoio: Apoio;
  /** true se ?apoio= veio na URL (sobrepõe a configuração salva). */
  apoioFromUrl: boolean;
  /** ?voz=faber: liga a voz Faber mesmo com ?teste=1 (nos testes ela fica desligada por padrão). */
  vozFaber: boolean;
}

export function readLaunchOptions(search: string): LaunchOptions {
  const q = new URLSearchParams(search);
  const fps = Number(q.get('fps'));
  const seed = Number(q.get('seed'));
  const apoio = q.get('apoio') as Apoio | null;
  const validApoio = apoio !== null && APOIOS.includes(apoio);
  return {
    testHooks: q.get('teste') === '1',
    fps: Number.isFinite(fps) && fps >= 15 && fps <= 240 ? fps : null,
    seed: Number.isInteger(seed) && q.has('seed') ? seed : Math.floor(Math.random() * 2 ** 31),
    debugPhysics: q.get('debug') === '1',
    apoio: validApoio ? apoio : 'padrao',
    apoioFromUrl: validApoio,
    vozFaber: q.get('voz') === 'faber',
  };
}
