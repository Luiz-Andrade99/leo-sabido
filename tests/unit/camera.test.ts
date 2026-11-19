import { describe, expect, it } from 'vitest';
import { zoomCamera } from '../../src/scenes/camera';

describe('zoomCamera', () => {
  it('celular deitado: a altura da tela mostra 540 px do mundo', () => {
    expect(zoomCamera(844, 390, 0)).toBeCloseTo(390 / 540);
  });
  it('tablet deitado: limitado pela altura ou pela largura mínima de 720 px', () => {
    expect(zoomCamera(1024, 768, 0)).toBeCloseTo(Math.min(768 / 540, 1024 / 720));
  });
  it('tablet em pé: a largura manda (mostra 720 px do mundo)', () => {
    expect(zoomCamera(768, 1024, 0)).toBeCloseTo(768 / 720);
  });
  it('reserva embaixo para os botões de toque', () => {
    expect(zoomCamera(844, 390, 100)).toBeCloseTo(290 / 540);
  });
  it('nunca menor que 0,5', () => {
    expect(zoomCamera(200, 100, 90)).toBe(0.5);
  });
});
