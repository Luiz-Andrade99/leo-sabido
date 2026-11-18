/** Constantes globais do jogo. Valores de física ficam aqui para serem ajustados sem caçar números no código. */
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const TILE_SIZE = 32;

/** Física Arcade com passo fixo: o resultado não depende da taxa de quadros da tela. */
export const PHYSICS_FPS = 60;
export const GRAVITY_Y = 1500;

export type BuildMode = 'producao' | 'homologacao';

/** Em produção só entra conteúdo aprovado por revisão pedagógica. */
export const BUILD_MODE: BuildMode = import.meta.env.MODE === 'production' ? 'producao' : 'homologacao';
