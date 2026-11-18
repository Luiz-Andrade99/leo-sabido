import { describe, expect, it } from 'vitest';
import { readLaunchOptions } from '../../src/core/launch';
import { faberSuportada } from '../../src/voz/faber';

describe('opções da URL', () => {
  it('voz=faber liga a Faber nos testes', () => {
    expect(readLaunchOptions('?teste=1&voz=faber').vozFaber).toBe(true);
    expect(readLaunchOptions('?teste=1').vozFaber).toBe(false);
    expect(readLaunchOptions('?voz=outra').vozFaber).toBe(false);
  });
});

describe('suporte à Faber', () => {
  const base = { WebAssembly: {}, caches: {}, Worker: function () {}, navigator: {} };
  it('aceita aparelho com WebAssembly, Cache Storage e Worker', () => {
    expect(faberSuportada(base as unknown as typeof globalThis)).toBe(true);
  });
  it('recusa aparelho com pouca memória', () => {
    expect(faberSuportada({ ...base, navigator: { deviceMemory: 1 } } as unknown as typeof globalThis)).toBe(false);
  });
  it('recusa navegador sem Cache Storage', () => {
    const { caches: _c, ...semCache } = base;
    expect(faberSuportada(semCache as unknown as typeof globalThis)).toBe(false);
  });
});
