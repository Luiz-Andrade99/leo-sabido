import { describe, expect, it } from 'vitest';
import { textoParaFala, voiceScore } from '../../src/ui/speech';

describe('narração mais humana', () => {
  it('lê símbolos por extenso', () => {
    expect(textoParaFala('Marque 3/4 da ponte.')).toBe('Marque 3 quartos da ponte.');
    expect(textoParaFala('1/2')).toBe('1 meio');
    expect(textoParaFala('7 × 6 = 42')).toBe('7 vezes 6 igual a 42');
    expect(textoParaFala('12 ÷ 3')).toBe('12 dividido por 3');
    expect(textoParaFala('50% de 80')).toBe('50 por cento de 80');
    expect(textoParaFala('Junte R$ 7.')).toBe('Junte 7 reais.');
    expect(textoParaFala('R$ 1')).toBe('1 real');
    expect(textoParaFala('Começa às 08:30 e termina às 10:00.')).toBe('Começa às 8 horas e 30 minutos e termina às 10 horas.');
    expect(textoParaFala('comandos (+3, x2, /2)')).toBe('comandos (+3, vezes 2, dividido por 2)');
    expect(textoParaFala('💡 Pense de novo')).toBe('Pense de novo');
  });

  it('prefere vozes naturais em português do Brasil', () => {
    const maria = { name: 'Microsoft Maria - Portuguese (Brazil)', lang: 'pt-BR', localService: true };
    const francisca = { name: 'Microsoft Francisca Online (Natural) - Portuguese (Brazil)', lang: 'pt-BR', localService: false };
    const google = { name: 'Google português do Brasil', lang: 'pt-BR', localService: false };
    const portugal = { name: 'Joana', lang: 'pt-PT', localService: true };
    const ingles = { name: 'Samantha', lang: 'en-US', localService: true };
    expect(voiceScore(francisca)).toBeGreaterThan(voiceScore(google));
    expect(voiceScore(google)).toBeGreaterThan(voiceScore(maria));
    expect(voiceScore(maria)).toBeGreaterThan(voiceScore(portugal));
    expect(voiceScore(ingles)).toBeLessThan(0);
  });
});

import { textoParaToque } from '../../src/ui/touch';

describe('placas em celulares e tablets', () => {
  it('troca instruções de teclado pelos botões da tela', () => {
    expect(textoParaToque('Use ← e → (ou A e D) para andar.')).toBe('Use ◀ e ▶ para andar.');
    expect(textoParaToque('Aperte Espaço para pular. Segure para pular mais alto!')).toBe('Toque em ⤒ para pular. Segure para pular mais alto!');
    expect(textoParaToque('Chegue perto e aperte E.')).toBe('Chegue perto e toque no botão E.');
    expect(textoParaToque('Ande com as setas. Pule com o Espaço.')).toBe('Ande com ◀ e ▶. Pule com ⤒.');
    expect(textoParaToque('Boas-vindas à Vila!')).toBe('Boas-vindas à Vila!');
  });
});
