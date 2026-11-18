import { describe, expect, it } from 'vitest';
import { defaultSettings, SettingsSchema } from '../../src/core/settings';
import { faberEstado, iniciarFaber, rotuloFaber } from '../../src/voz/narrador';

describe('rótulo da voz Faber nas Configurações', () => {
  it('mostra o estado de cada momento', () => {
    expect(rotuloFaber({ estado: 'baixando', fracao: 0.42 })).toBe('Leo (natural) — baixando 42%');
    expect(rotuloFaber({ estado: 'pronta', fracao: 1 })).toBe('Leo (natural) — recomendado');
    expect(rotuloFaber({ estado: 'indisponivel', fracao: 0 })).toBe('Leo (natural) — não disponível neste aparelho');
    expect(rotuloFaber({ estado: 'desligada', fracao: 0 })).toBe('Leo (natural) — desligada');
  });
});

describe('configuração vozNeural', () => {
  it('salvamento antigo, sem vozNeural, liga a Faber', () => {
    const { vozNeural: _v, ...antigo } = defaultSettings();
    expect(SettingsSchema.parse(antigo).vozNeural).toBe(true);
  });
});

describe('iniciarFaber', () => {
  it('em aparelho sem suporte fica "indisponível" sem erro', () => {
    const semSuporte = { navigator: { deviceMemory: 1 } } as unknown as typeof globalThis;
    expect(() => iniciarFaber({ teste: false, vozFaber: false }, semSuporte)).not.toThrow();
    expect(faberEstado().estado).toBe('indisponivel');
  });
  it('nos testes automáticos sem &voz=faber fica desligada', () => {
    iniciarFaber({ teste: true, vozFaber: false });
    expect(faberEstado().estado).toBe('desligada');
  });
});
