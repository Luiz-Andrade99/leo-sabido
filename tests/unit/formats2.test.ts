import { describe, expect, it } from 'vitest';
import { clock, fmtDuracao, fmtHora } from '../../src/challenges/formats/clock';
import { fewestPieces, money } from '../../src/challenges/formats/money';
import { computeAnswer, numeric } from '../../src/challenges/formats/numeric';
import { place } from '../../src/challenges/formats/place';
import { validateItem } from '../../src/challenges/formats/registry';
import type { Desafio } from '../../src/content/schema';
import { createRng } from '../../src/core/rng';

const rng = createRng(1);

describe('dobro e metade (problema numérico)', () => {
  it('calcula e escreve a conta como soma de parcelas iguais', () => {
    expect(computeAnswer('dobro', 7, 0)).toBe(14);
    expect(computeAnswer('metade', 18, 0)).toBe(9);
    expect(numeric.resolve({ tipo: 'fixo', operacao: 'metade', a: 18, b: 0 }, rng).vars.conta).toBe('9 + 9 = 18');
  });

  it('modelo de metade só usa números pares', () => {
    const all = numeric.enumerate({ tipo: 'modelo', operacao: 'metade', a: [2, 40], b: [0, 0], maxResultado: 20 });
    expect(all.length).toBe(20);
    expect(all.every((r) => r.a % 2 === 0)).toBe(true);
  });

  it('recusa metade de número ímpar', () => {
    expect(numeric.validate({ tipo: 'fixo', operacao: 'metade', a: 7, b: 0 }).length).toBeGreaterThan(0);
  });
});

describe('formato valor posicional', () => {
  const r = place.resolve({ tipo: 'fixo', numero: 243 }, rng);

  it('decompõe em centenas, dezenas e unidades', () => {
    expect([r.c, r.d, r.u]).toEqual([2, 4, 3]);
  });

  it('aceita a forma usual e também outra composição correta', () => {
    expect(place.evaluate(r, [2, 4, 3]).status).toBe('correct');
    const other = place.evaluate(r, [1, 14, 3]);
    expect(other.status).toBe('correct');
    expect(other.message).toContain('jeito diferente');
  });

  it('erro diz quanto falta ou passou', () => {
    expect(place.evaluate(r, [2, 3, 3]).message).toContain('faltam 10');
    expect(place.evaluate(r, [3, 0, 0]).message).toContain('passou 57');
    expect(place.evaluate(r, [0, 0, 0]).status).toBe('invalid');
    expect(place.evaluate(r, [2, 4]).status).toBe('invalid');
  });

  it('modelo fica entre 10 e 999', () => {
    const all = place.enumerate({ tipo: 'modelo', numero: [1, 2000] });
    expect(all[0]!.numero).toBe(10);
    expect(all[all.length - 1]!.numero).toBe(999);
  });
});

describe('formato dinheiro', () => {
  it('encontra a menor quantidade de peças, mesmo quando "pegar a maior" falharia', () => {
    expect(fewestPieces(37, [20, 10, 5, 2, 1])).toEqual([20, 10, 5, 2]);
    expect(fewestPieces(6, [5, 2])).toEqual([2, 2, 2]);
    expect(fewestPieces(3, [5, 2])).toBeNull();
  });

  it('aceita qualquer combinação que dê o valor exato', () => {
    const r = money.resolve({ tipo: 'fixo', valor: 17, notas: [1, 2, 5, 10, 20] }, rng);
    expect(r.notas).toEqual([20, 10, 5, 2, 1]);
    expect(r.vars.exemplo).toBe('R$ 10 + R$ 5 + R$ 2 = R$ 17');
    expect(money.evaluate(r, [0, 1, 1, 1, 0]).status).toBe('correct');
    expect(money.evaluate(r, [0, 0, 3, 1, 0]).status).toBe('correct');
  });

  it('erro diz quanto falta ou passou', () => {
    const r = money.resolve({ tipo: 'fixo', valor: 17, notas: [1, 2, 5, 10, 20] }, rng);
    expect(money.evaluate(r, [0, 1, 1, 0, 0]).message).toContain('faltam R$ 2');
    expect(money.evaluate(r, [1, 0, 0, 0, 0]).message).toContain('passou R$ 3');
    expect(money.evaluate(r, [0, 0, 0, 0, 0]).status).toBe('invalid');
  });

  it('recusa valor impossível com as peças dadas', () => {
    expect(money.validate({ tipo: 'fixo', valor: 3, notas: [5, 2] }).length).toBeGreaterThan(0);
  });
});

describe('formato relógio', () => {
  it('formata horas e durações', () => {
    expect(fmtHora(9 * 60 + 30)).toBe('09:30');
    expect(fmtDuracao(90)).toBe('1 hora e 30 minutos');
    expect(fmtDuracao(120)).toBe('2 horas');
    expect(fmtDuracao(30)).toBe('30 minutos');
  });

  it('calcula o fim e avalia a resposta', () => {
    const r = clock.resolve({ tipo: 'fixo', inicio: '14:00', duracaoMin: 150 }, rng);
    expect(r.vars.fim).toBe('16:30');
    expect(clock.evaluate(r, [16, 30]).status).toBe('correct');
    expect(clock.evaluate(r, [16, 0]).message).toContain('ainda faltam 30 minutos');
    expect(clock.evaluate(r, [17, 0]).message).toContain('passou 30 minutos');
    expect(clock.evaluate(r, [13, 0]).message).toContain('antes do começo');
    expect(clock.evaluate(r, [25, 0]).status).toBe('invalid');
  });

  it('modelo fica entre 06:00 e 22:00, em múltiplos de 30 minutos', () => {
    const all = clock.enumerate({ tipo: 'modelo', horaInicio: [5, 21], meiaHora: true, duracoesMin: [30, 60, 120, 45] });
    expect(all.length).toBeGreaterThan(20);
    expect(all.every((r) => r.inicio >= 360 && r.fim <= 1320 && r.duracao % 30 === 0)).toBe(true);
  });
});

describe('limite de enunciado por ano', () => {
  const base = {
    id: '2A-PRB-SOM-900',
    ano: 2,
    area: 'matematica',
    tema: 't',
    bncc: [{ codigo: 'EF02MA06', status: 'a_validar', fonte: 'x' }],
    objetivo: 'o',
    formato: 'numerico',
    pool: '2ano.problemas',
    enunciado: { texto: 'Leo tem {a} parafusos e ganha {b}. Quantos ficou?' },
    parametros: { tipo: 'fixo', operacao: 'soma', a: 12, b: 5 },
    explicacao: '{conta}',
    dicas: ['a', 'b', 'c'],
    dificuldade: 1,
    revisao: { status: 'em_revisao' },
    publicacao: 'homologacao',
  } as const satisfies Desafio;

  it('aceita enunciado curto no 2º ano e recusa enunciado longo', () => {
    expect(validateItem(base)).toEqual([]);
    expect(validateItem({ ...base, enunciado: { texto: 'x'.repeat(140) } })[0]).toContain('limite para o 2º ano');
  });
});
