/** Mensagens entre as cenas Phaser e o controlador de fluxo (game.events). */

export const EV = {
  bootDone: 'leo:boot-done',
  levelComplete: 'leo:level-complete',
  pauseRequest: 'leo:pause-request',
} as const;

export interface LevelStartData {
  ano: number;
  faseId: string;
  mapa: string;
  titulo: string;
}

export interface LevelResultEvent {
  ano: number;
  faseId: string;
  cristais: number;
  cristaisTotal: number;
  /** Ex.: "◆ cristais" ou "⬢ parafusos dourados". */
  coletavel: string;
  activeSeconds: number;
  desafios: { id: string; tema: string; explicacao: string; tentativas: number; dicas: number; resolvido: boolean }[];
}
