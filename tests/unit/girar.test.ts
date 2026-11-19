import { describe, expect, it } from 'vitest';
import { precisaGirar } from '../../src/ui/girar';

describe('precisaGirar', () => {
  it('celular em pé, com toque: pede para girar', () => {
    expect(precisaGirar(true, 390, true)).toBe(true);
  });
  it('tablet em pé: não pede', () => {
    expect(precisaGirar(true, 820, true)).toBe(false);
  });
  it('celular deitado: não pede', () => {
    expect(precisaGirar(false, 844, true)).toBe(false);
  });
  it('janela estreita no computador (sem toque): não pede', () => {
    expect(precisaGirar(true, 390, false)).toBe(false);
  });
});
