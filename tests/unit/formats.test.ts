import { describe, expect, it } from 'vitest';
import { arrayFormat } from '../../src/challenges/formats/array';
import { distribute } from '../../src/challenges/formats/distribute';
import { computeAnswer, numeric } from '../../src/challenges/formats/numeric';
import { validateItem } from '../../src/challenges/formats/registry';
import { ChallengeSession, dificuldadePara } from '../../src/challenges/engine/session';
import type { Desafio } from '../../src/content/schema';
import { createRng } from '../../src/core/rng';

describe('formato numérico', () => {
  it('calcula as quatro operações', () => {
    expect(computeAnswer('soma', 12, 7)).toBe(19);
    expect(computeAnswer('subtracao', 30, 8)).toBe(22);
    expect(computeAnswer('completar', 15, 40)).toBe(25);
    expect(computeAnswer('comparar', 50, 35)).toBe(15);
  });

  it('modelo nunca gera resultado negativo, zero ou acima do máximo', () => {
    const all = numeric.enumerate({ tipo: 'modelo', operacao: 'subtracao', a: [10, 60], b: [5, 60], maxResultado: 40 });
    expect(all.length).toBeGreaterThan(50);
    for (const r of all) {
      expect(r.resposta).toBeGreaterThan(0);
      expect(r.resposta).toBeLessThanOrEqual(40);
    }
  });

  it('respeita múltiplos (dezenas exatas)', () => {
    const all = numeric.enumerate({ tipo: 'modelo', operacao: 'soma', a: [10, 90], b: [10, 90], multiploDe: 10, maxResultado: 100 });
    expect(all.every((r) => r.a % 10 === 0 && r.b % 10 === 0)).toBe(true);
  });

  it('em "completar" escreve a conta na ordem b − a', () => {
    const r = numeric.resolve({ tipo: 'fixo', operacao: 'completar', a: 15, b: 40 }, createRng(1));
    expect(r.vars.conta).toBe('40 − 15 = 25');
  });

  it('avalia resposta certa, errada (com direção) e inválida', () => {
    const r = numeric.resolve({ tipo: 'fixo', operacao: 'soma', a: 12, b: 7 }, createRng(1));
    expect(numeric.evaluate(r, ' 19 ').status).toBe('correct');
    const wrong = numeric.evaluate(r, '17');
    expect(wrong.status).toBe('incorrect');
    expect(wrong.message).toContain('menor');
    expect(numeric.evaluate(r, 'dezenove').status).toBe('invalid');
    expect(numeric.evaluate(r, '').status).toBe('invalid');
  });

  it('recusa item fixo com resultado negativo', () => {
    expect(numeric.validate({ tipo: 'fixo', operacao: 'subtracao', a: 5, b: 9 }).length).toBeGreaterThan(0);
  });
});

describe('formato distribuir', () => {
  it('calcula quanto cada máquina recebe e quanto sobra', () => {
    const r = distribute.resolve({ tipo: 'fixo', total: 17, grupos: 3 }, createRng(1));
    expect([r.cada, r.sobra]).toEqual([5, 2]);
  });

  it('modelo sem resto só gera divisões exatas; com resto, só não exatas', () => {
    const exatas = distribute.enumerate({ tipo: 'modelo', total: [6, 40], grupos: [2, 5], comResto: false });
    const comResto = distribute.enumerate({ tipo: 'modelo', total: [6, 40], grupos: [2, 5], comResto: true });
    expect(exatas.length).toBeGreaterThan(10);
    expect(exatas.every((r) => r.sobra === 0)).toBe(true);
    expect(comResto.every((r) => r.sobra > 0 && r.sobra < r.grupos)).toBe(true);
    expect([...exatas, ...comResto].every((r) => r.cada >= 1 && r.cada <= 10 && r.grupos <= 5)).toBe(true);
  });

  it('aceita a divisão certa e deixa as sobras no cesto', () => {
    const r = distribute.resolve({ tipo: 'fixo', total: 17, grupos: 3 }, createRng(1));
    const ev = distribute.evaluate(r, [5, 5, 5]);
    expect(ev.status).toBe('correct');
    expect(ev.message).toContain('sobraram 2');
  });

  it('máquinas iguais mas com cristais suficientes para mais uma rodada é incorreto', () => {
    const r = distribute.resolve({ tipo: 'fixo', total: 15, grupos: 3 }, createRng(1));
    const ev = distribute.evaluate(r, [4, 4, 4]);
    expect(ev.status).toBe('incorrect');
    expect(ev.message).toContain('sobram 3');
  });

  it('máquinas diferentes é incorreto, com marcação por máquina', () => {
    const r = distribute.resolve({ tipo: 'fixo', total: 15, grupos: 3 }, createRng(1));
    const ev = distribute.evaluate(r, [5, 6, 4]);
    expect(ev.status).toBe('incorrect');
    expect(ev.perSlot).toEqual([true, false, false]);
  });

  it('nada colocado ou mais cristais do que existem é inválido', () => {
    const r = distribute.resolve({ tipo: 'fixo', total: 15, grupos: 3 }, createRng(1));
    expect(distribute.evaluate(r, [0, 0, 0]).status).toBe('invalid');
    expect(distribute.evaluate(r, [6, 6, 6]).status).toBe('invalid');
    expect(distribute.evaluate(r, [5, 5]).status).toBe('invalid');
  });

  it('recusa quociente acima de 10 e mais de 5 máquinas', () => {
    expect(distribute.validate({ tipo: 'fixo', total: 44, grupos: 2 }).length).toBeGreaterThan(0);
    expect(distribute.validate({ tipo: 'fixo', total: 12, grupos: 6 }).length).toBeGreaterThan(0);
  });
});

describe('formato arranjo', () => {
  it('modelo respeita linhas de 2 a 5 e blocos por linha de 2 a 10', () => {
    const all = arrayFormat.enumerate({ tipo: 'modelo', linhas: [1, 8], colunas: [1, 12] });
    expect(all.every((r) => r.linhas >= 2 && r.linhas <= 5 && r.colunas >= 2 && r.colunas <= 10)).toBe(true);
    expect(all).toHaveLength(4 * 9);
  });

  it('avalia e explica com a multiplicação', () => {
    const r = arrayFormat.resolve({ tipo: 'fixo', linhas: 3, colunas: 4 }, createRng(1));
    expect(arrayFormat.evaluate(r, 4).status).toBe('correct');
    const low = arrayFormat.evaluate(r, 3);
    expect(low.status).toBe('incorrect');
    expect(low.message).toContain('3 linhas de 3 = 9 blocos');
    expect(low.message).toContain('faltam 3');
    expect(arrayFormat.evaluate(r, '5').message).toContain('passou 3');
    expect(arrayFormat.evaluate(r, 0).status).toBe('invalid');
  });
});

describe('validação de textos dos itens', () => {
  const base = {
    id: '3A-PRB-SOM-900',
    ano: 3,
    area: 'matematica',
    tema: 't',
    bncc: [{ codigo: 'EF03MA06', status: 'a_validar', fonte: 'x' }],
    objetivo: 'o',
    formato: 'numerico',
    pool: '3ano.problemas',
    enunciado: { texto: 'Há {a} e chegam {b}. Quantos?' },
    parametros: { tipo: 'modelo', operacao: 'soma', a: [1, 9], b: [1, 9], maxResultado: 18 },
    explicacao: '{conta}',
    dicas: ['d1', 'd2', 'd3'],
    dificuldade: 1,
    revisao: { status: 'em_revisao' },
    publicacao: 'homologacao',
  } as const satisfies Desafio;

  it('aceita textos cujas variáveis existem em todas as variações', () => {
    expect(validateItem(base)).toEqual([]);
  });

  it('acusa variável inexistente', () => {
    expect(validateItem({ ...base, explicacao: 'Resultado: {total}' })[0]).toContain('{total}');
  });
});

describe('sessão com formatos novos', () => {
  it('distribuir: acerto marca resolvido e explica', () => {
    const item = {
      id: '3A-DIV-REP-900',
      ano: 3,
      area: 'matematica',
      tema: 't',
      bncc: [{ codigo: 'EF03MA08', status: 'a_validar', fonte: 'x' }],
      objetivo: 'o',
      formato: 'distribuir',
      pool: '3ano.distribuir',
      enunciado: { texto: 'Reparta {total} cristais entre {grupos} máquinas.' },
      parametros: { tipo: 'fixo', total: 12, grupos: 3 },
      explicacao: '{total} ÷ {grupos} = {cada}',
      dicas: ['a', 'b', 'c'],
      dificuldade: 1,
      revisao: { status: 'em_revisao' },
      publicacao: 'homologacao',
    } as const satisfies Desafio;
    const s = new ChallengeSession(item, distribute.resolve(item.parametros, createRng(1)), 'padrao');
    expect(s.enunciado).toBe('Reparta 12 cristais entre 3 máquinas.');
    expect(s.submit([3, 3, 3]).status).toBe('incorrect');
    const ok = s.submit([4, 4, 4]);
    expect(ok.status).toBe('correct');
    expect(ok.explanation).toBe('12 ÷ 3 = 4');
    expect(s.attempts).toBe(2);
  });

  it('apoio "desafio" pede um nível acima, sem passar de 3', () => {
    expect(dificuldadePara(1, 'desafio')).toBe(2);
    expect(dificuldadePara(3, 'desafio')).toBe(3);
    expect(dificuldadePara(2, 'acompanhado')).toBe(2);
  });
});
