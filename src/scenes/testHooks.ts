import type { Save } from '../core/save';

/** Contrato do gancho de testes (window.__leo), exposto apenas com ?teste=1. */

export interface PanelPoint {
  painel: string;
  x: number;
  y: number;
  mecanismo: string;
  activated: boolean;
  /** Retângulo que envolve as células do mecanismo (px). */
  bounds: { x: number; y: number; w: number; h: number };
  /** Elevador: deslocamento vertical (px). */
  dy: number;
}

export interface LeoTestState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  anim: string;
  respawns: number;
  dialogOpen: boolean;
  completed: boolean;
  checkpoint: { x: number; y: number };
  actualFps: number;
  physicsSteps: number;
  minY: number;
  cristais: number;
  cristaisTotal: number;
  assist: boolean;
  /** Vidas restantes na fase (-1 = sem limite, modo assistido). */
  vidas: number;
  panels: PanelPoint[];
}

export interface LevelPoints {
  spawn: { x: number; y: number };
  goal: { x: number; y: number };
  crystals: { x: number; y: number; coletado: boolean }[];
  checkpoints: { x: number; y: number; ativa: boolean }[];
  panels: PanelPoint[];
}

/** Resposta esperada do painel, no formato que a interface usa. */
export type TestSolution =
  | { formato: 'sequencia'; valores: number[] }
  | { formato: 'numerico'; valor: number }
  | { formato: 'distribuir'; grupos: number; cada: number }
  | { formato: 'arranjo'; colunas: number }
  | { formato: 'posicional'; c: number; d: number; u: number }
  /** Quantidade de cada valor, na ordem em que aparecem na tela (do maior para o menor). */
  | { formato: 'dinheiro'; counts: number[] }
  /** Cliques a partir do horário inicial: +1 h e +30 min. */
  | { formato: 'relogio'; horas: number; meias: number }
  | { formato: 'fracao'; partes: number }
  | { formato: 'grafico'; valor: number }
  | { formato: 'igualdade'; valor: number }
  | { formato: 'porcentagem'; valor: number }
  | { formato: 'decimal'; u: number; d: number; c: number }
  | { formato: 'area'; largura: number; altura: number }
  /** Rótulos dos comandos de um programa que funciona, em ordem. */
  | { formato: 'programa'; comandos: string[] }
  | { formato: 'expressao'; valor: number }
  /** Números das lâmpadas que devem ser acesas. */
  | { formato: 'divisibilidade'; numeros: number[] }
  /** 1º ano: posição da resposta certa entre as opções. */
  | { formato: 'escolha'; indice: number }
  | { formato: 'ordenar'; ordem: number[] };

export interface LeoTestHooks {
  ready: boolean;
  /** id da tela HTML visível (null se nenhuma). */
  screen(): string | null;
  levelActive(): boolean;
  startLevel(faseId: string, ano?: number): void;
  state(): LeoTestState;
  points(): LevelPoints;
  teleport(x: number, y: number): void;
  apexReset(): void;
  /** Sorteia (se preciso) o desafio do painel e devolve a resposta. */
  solution(painel: string): TestSolution | null;
  save(): Save;
  /** Faz o Leo cair (vai para baixo do mundo). */
  cair(): void;
  /** Voz Faber, só com ?teste=1&voz=faber. */
  faber?: import('../voz/faber').FaberCliente;
  /** Quantas frases o narrador já tem geradas e guardadas. */
  vozCache(): number;
}
