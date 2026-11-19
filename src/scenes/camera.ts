import { ALTURA_VISIVEL, LARGURA_MINIMA_VISIVEL } from '../core/config';

/**
 * Zoom da câmera da fase para qualquer tela (escala EXPAND do Phaser).
 * Mostra sempre ~540 px de altura do mundo (os mapas têm 17 × 32 = 544 px), sem passar de uma largura
 * mínima de 720 px do mundo (tablet em pé). `reservaInferior` é a faixa de baixo ocupada pelos botões de toque.
 */
export function zoomCamera(largura: number, altura: number, reservaInferior: number): number {
  const z = Math.min((altura - reservaInferior) / ALTURA_VISIVEL, largura / LARGURA_MINIMA_VISIVEL);
  return Math.max(0.5, z);
}
