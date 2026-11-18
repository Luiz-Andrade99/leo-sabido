import { describe, expect, it } from 'vitest';
import { chart, AMOSTRAS_MODELO } from '../../src/challenges/formats/chart';
import { equality } from '../../src/challenges/formats/equality';
import { fraction } from '../../src/challenges/formats/fraction';
import { computeAnswer, numeric } from '../../src/challenges/formats/numeric';
import type { GraficoParams } from '../../src/content/schema';
import { createRng } from '../../src/core/rng';

const rng = createRng(3);

describe('multiplicação e divisão (problema numérico)', () => {
  it('calcula e explica a divisão pela multiplicação', () => {
    expect(computeAnswer('multiplicacao', 12, 7)).toBe(84);
    expect(numeric.resolve({ tipo: 'fixo', operacao: 'divisao', a: 96, b: 12 }, rng).vars.conta).toBe('96 ÷ 12 = 8, porque 8 × 12 = 96');
  });

  it('modelo de divisão só gera divisões exatas', () => {
    const all = numeric.enumerate({ tipo: 'modelo', operacao: 'divisao', a: [20, 200], b: [2, 12], maxResultado: 50 });
    expect(all.length).toBeGreaterThan(50);
    expect(all.every((r) => r.a % r.b === 0 && r.resposta <= 50)).toBe(true);
  });

  it('recusa divisão não exata', () => {
    expect(numeric.validate({ tipo: 'fixo', operacao: 'divisao', a: 50, b: 7 }).length).toBeGreaterThan(0);
  });
});

describe('formato fração', () => {
  const r = fraction.resolve({ tipo: 'fixo', partes: 12, numerador: 3, denominador: 4 }, rng);

  it('calcula quantas partes formam a fração', () => {
    expect(r.resposta).toBe(9);
    expect(r.vars.umaParte).toBe(3);
  });

  it('aceita a quantidade certa e orienta o erro', () => {
    expect(fraction.evaluate(r, 9).status).toBe('correct');
    expect(fraction.evaluate(r, 10).message).toContain('Marque menos');
    expect(fraction.evaluate(r, 4).message).toContain('Marque mais');
    expect(fraction.evaluate(r, 0).status).toBe('invalid');
    expect(fraction.evaluate(r, 13).status).toBe('invalid');
  });

  it('recusa denominadores fora dos usuais e partes não divisíveis', () => {
    expect(fraction.validate({ tipo: 'fixo', partes: 12, numerador: 1, denominador: 6 }).length).toBeGreaterThan(0);
    expect(fraction.validate({ tipo: 'fixo', partes: 10, numerador: 1, denominador: 4 }).length).toBeGreaterThan(0);
  });

  it('modelo só gera combinações válidas', () => {
    const all = fraction.enumerate({ tipo: 'modelo', fracoes: [[1, 2], [1, 3], [1, 4]], partes: [6, 8, 9, 12] });
    expect(all.every((x) => x.partes % x.denominador === 0)).toBe(true);
    expect(all).toHaveLength(3 + 3 + 2); // 1/2: 6,8,12 · 1/3: 6,9,12 · 1/4: 8,12
  });
});

describe('formato gráfico de colunas', () => {
  const dados = [
    { rotulo: 'Norte', valor: 8 },
    { rotulo: 'Sul', valor: 5 },
    { rotulo: 'Leste', valor: 11 },
  ];

  it('responde valor, diferença e total', () => {
    expect(chart.resolve({ tipo: 'fixo', passo: 1, titulo: 't', unidade: 'tochas', dados, pergunta: 'valor', alvo: [2] }, rng).resposta).toBe(11);
    expect(chart.resolve({ tipo: 'fixo', passo: 1, titulo: 't', unidade: 'tochas', dados, pergunta: 'diferenca', alvo: [2, 1] }, rng).resposta).toBe(6);
    expect(chart.resolve({ tipo: 'fixo', passo: 1, titulo: 't', unidade: 'tochas', dados, pergunta: 'total', alvo: [] }, rng).resposta).toBe(24);
  });

  it('recusa diferença com a coluna menor primeiro', () => {
    expect(chart.validate({ tipo: 'fixo', passo: 1, titulo: 't', unidade: 'u', dados, pergunta: 'diferenca', alvo: [1, 2] }).length).toBeGreaterThan(0);
  });

  it('modelo gera amostras reprodutíveis, com valores sobre as linhas do gráfico', () => {
    const p: GraficoParams = { tipo: 'modelo', titulo: 't', unidade: 'u', rotulos: ['A', 'B', 'C', 'D'], valor: [2, 20], passo: 2, pergunta: 'diferenca' };
    const a = chart.enumerate(p);
    expect(a.length).toBeGreaterThan(AMOSTRAS_MODELO / 2);
    expect(a.every((r) => r.dados.every((d) => d.valor % 2 === 0) && r.resposta > 0)).toBe(true);
    expect(JSON.stringify(chart.enumerate({ ...p }))).toBe(JSON.stringify(a));
  });

  it('avalia a resposta digitada', () => {
    const r = chart.resolve({ tipo: 'fixo', passo: 1, titulo: 't', unidade: 'tochas', dados, pergunta: 'valor', alvo: [0] }, rng);
    expect(chart.evaluate(r, '8').status).toBe('correct');
    expect(chart.evaluate(r, '9').message).toContain('maior');
  });
});

describe('formato igualdade', () => {
  it('lacuna no primeiro termo de uma multiplicação', () => {
    const r = equality.resolve({ tipo: 'fixo', op: 'x', a: 7, b: 6, lacuna: 'a' }, rng);
    expect(r.vars.expressao).toBe('□ × 6 = 42');
    expect(r.vars.inversa).toBe('42 ÷ 6 = 7');
    expect(equality.evaluate(r, '7').status).toBe('correct');
    expect(equality.evaluate(r, '6').message).toContain('seria 36');
  });

  it('lacuna no segundo termo de subtração e divisão', () => {
    expect(equality.resolve({ tipo: 'fixo', op: '-', a: 80, b: 35, lacuna: 'b' }, rng).vars.inversa).toBe('80 − 45 = 35');
    expect(equality.resolve({ tipo: 'fixo', op: '/', a: 56, b: 8, lacuna: 'b' }, rng).vars.inversa).toBe('56 ÷ 7 = 8');
  });

  it('modelo de divisão só gera divisões exatas e respeita o máximo', () => {
    const all = equality.enumerate({ tipo: 'modelo', op: '/', a: [10, 100], b: [2, 10], lacuna: 'a', maxResultado: 10 });
    expect(all.every((r) => r.a % r.b === 0 && r.c <= 10)).toBe(true);
  });

  it('número não inteiro na divisão vira mensagem clara', () => {
    const r = equality.resolve({ tipo: 'fixo', op: '/', a: 56, b: 8, lacuna: 'b' }, rng);
    expect(equality.evaluate(r, '5').message).toContain('não é inteiro');
  });
});
