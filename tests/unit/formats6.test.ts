import { describe, expect, it } from 'vitest';
import { divisibility, ehPrimo } from '../../src/challenges/formats/divisibility';
import { expression } from '../../src/challenges/formats/expression';
import { aplicar, menorPrograma, parseComando, program } from '../../src/challenges/formats/program';
import { DesafioListSchema } from '../../src/content/schema';
import { createRng } from '../../src/core/rng';

const rng = createRng(6);

describe('formato programa', () => {
  const cmds = ['+3', 'x2'].map(parseComando);

  it('interpreta e aplica comandos, recusando divisão não exata', () => {
    expect(parseComando('x2').rotulo).toBe('×2');
    expect(aplicar(7, parseComando('/2'))).toBeNull();
    expect(aplicar(8, parseComando('/2'))).toBe(4);
    expect(aplicar(1, parseComando('-3'))).toBeNull();
  });

  it('encontra o menor programa por busca em largura', () => {
    // 2 → ×2 = 4 → +3 = 7 → ×2 = 14
    expect(menorPrograma(2, 14, cmds, 4)).toHaveLength(3);
    expect(menorPrograma(2, 14, cmds, 2)).toBeNull();
  });

  it('aceita qualquer programa que chegue ao alvo dentro do limite', () => {
    const r = program.resolve({ tipo: 'fixo', inicio: 2, alvo: 14, comandos: ['+3', 'x2'], maxPassos: 4 }, rng);
    expect(program.evaluate(r, [1, 0, 1]).status).toBe('correct');
    // 2 +3 = 5 +3 = 8 +3 = 11 +3 = 14 — 4 passos, também vale
    expect(program.evaluate(r, [0, 0, 0, 0]).status).toBe('correct');
  });

  it('explica onde o programa terminou e quando passa do limite', () => {
    const r = program.resolve({ tipo: 'fixo', inicio: 2, alvo: 14, comandos: ['+3', 'x2'], maxPassos: 4 }, rng);
    expect(program.evaluate(r, [1, 1]).message).toContain('terminou em 8');
    expect(program.evaluate(r, [0, 0, 0, 0, 0]).message).toContain('limite é 4');
    expect(program.evaluate(r, []).status).toBe('invalid');
  });

  it('recusa desafios sem solução ou triviais', () => {
    expect(program.validate({ tipo: 'fixo', inicio: 2, alvo: 3, comandos: ['x2', '+2'], maxPassos: 4 }).length).toBeGreaterThan(0);
    expect(program.validate({ tipo: 'fixo', inicio: 2, alvo: 5, comandos: ['+3', 'x2'], maxPassos: 4 }).length).toBeGreaterThan(0);
  });
});

describe('formato expressão numérica', () => {
  it('respeita a ordem das operações e explica os passos', () => {
    const r = expression.resolve({ tipo: 'fixo', forma: 'a+bxc', termos: [3, 4, 5] }, rng);
    expect(r.resposta).toBe(23);
    expect(r.vars.passos).toContain('primeiro a multiplicação');
  });

  it('identifica o engano de calcular da esquerda para a direita', () => {
    const r = expression.resolve({ tipo: 'fixo', forma: 'a+bxc', termos: [3, 4, 5] }, rng);
    expect(expression.evaluate(r, '35').message).toContain('esquerda para a direita');
    expect(expression.evaluate(r, '30').message).toContain('não é o resultado');
    expect(expression.evaluate(r, '23').status).toBe('correct');
  });

  it('parênteses primeiro', () => {
    expect(expression.resolve({ tipo: 'fixo', forma: '(a+b)xc', termos: [3, 4, 5] }, rng).resposta).toBe(35);
    expect(expression.resolve({ tipo: 'fixo', forma: '(a-b)/c', termos: [20, 8, 4] }, rng).resposta).toBe(3);
  });

  it('modelos nunca geram resultado negativo, zero ou divisão não exata', () => {
    for (const forma of ['a-bxc', 'a+b/c', '(a-b)/c'] as const) {
      const all = expression.enumerate({ tipo: 'modelo', forma, termo: [2, 12], maxResultado: 100 });
      expect(all.length).toBeGreaterThan(5);
      expect(all.every((x) => Number.isInteger(x.resposta) && x.resposta > 0 && x.resposta <= 100)).toBe(true);
    }
  });

  it('recusa expressão fixa com número errado de termos', () => {
    expect(expression.validate({ tipo: 'fixo', forma: 'axb+cxd', termos: [1, 2, 3] }).length).toBeGreaterThan(0);
  });
});

describe('formato divisibilidade', () => {
  it('reconhece primos', () => {
    expect([2, 3, 5, 7, 11, 13, 29].every(ehPrimo)).toBe(true);
    expect([1, 4, 9, 15, 21, 27].some(ehPrimo)).toBe(false);
  });

  it('marca cada lâmpada certa ou errada', () => {
    const r = divisibility.resolve({ tipo: 'fixo', regra: 'multiplo', k: 3, numeros: [4, 6, 9, 10, 12, 14] }, rng);
    expect(r.alvo).toEqual([false, true, true, false, true, false]);
    expect(divisibility.evaluate(r, [false, true, true, false, true, false]).status).toBe('correct');
    const wrong = divisibility.evaluate(r, [true, true, true, false, false, false]);
    expect(wrong.status).toBe('incorrect');
    expect(wrong.perSlot).toEqual([false, true, true, true, false, true]);
    expect(divisibility.evaluate(r, [false, false, false, false, false, false]).status).toBe('invalid');
  });

  it('divisores vêm de 1 a k', () => {
    const all = divisibility.enumerate({ tipo: 'modelo', regra: 'divisor', k: [12, 36], numeros: [1, 1], quantidade: 6 });
    expect(all.length).toBeGreaterThan(20);
    expect(all.every((r) => r.numeros.every((n) => n <= r.k))).toBe(true);
  });

  it('modelos sempre têm pelo menos 2 lâmpadas certas e 2 erradas', () => {
    const all = divisibility.enumerate({ tipo: 'modelo', regra: 'primo', k: [0, 0], numeros: [2, 50], quantidade: 8 });
    expect(all.every((r) => r.alvo.filter(Boolean).length >= 2 && r.alvo.filter((x) => !x).length >= 2)).toBe(true);
  });

  it('schema aplica os valores padrão de k', () => {
    const base = {
      id: '6A-DIV-PRI-900',
      ano: 6,
      area: 'matematica',
      tema: 't',
      bncc: [{ codigo: 'EF06MA05', status: 'a_validar', fonte: 'x' }],
      objetivo: 'o',
      formato: 'divisibilidade',
      pool: '6ano.divisibilidade',
      enunciado: { texto: 'x' },
      parametros: { tipo: 'fixo', regra: 'primo', numeros: [2, 4, 5, 6] },
      explicacao: 'x',
      dicas: ['a', 'b', 'c'],
      dificuldade: 1,
      revisao: { status: 'em_revisao' },
      publicacao: 'homologacao',
    };
    const d = DesafioListSchema.parse([base])[0]!;
    expect(d.formato === 'divisibilidade' && d.parametros.tipo === 'fixo' && d.parametros.k).toBe(0);
  });
});
