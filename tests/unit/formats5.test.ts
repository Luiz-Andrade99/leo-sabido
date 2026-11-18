import { describe, expect, it } from 'vitest';
import { areaFormat } from '../../src/challenges/formats/area';
import { decimal, fmtDecimal } from '../../src/challenges/formats/decimal';
import { percent } from '../../src/challenges/formats/percent';
import { createRng } from '../../src/core/rng';

const rng = createRng(5);

describe('formato porcentagem', () => {
  const r = percent.resolve({ tipo: 'fixo', total: 80, porcentagem: 25 }, rng);

  it('calcula a porcentagem e associa à fração', () => {
    expect(r.resposta).toBe(20);
    expect(r.vars.parte).toContain('quarta parte');
  });

  it('avalia a carga marcada', () => {
    expect(percent.evaluate(r, 20).status).toBe('correct');
    expect(percent.evaluate(r, 15).message).toContain('faltam 5');
    expect(percent.evaluate(r, 30).message).toContain('passou 10');
    expect(percent.evaluate(r, 0).status).toBe('invalid');
    expect(percent.evaluate(r, 81).status).toBe('invalid');
  });

  it('recusa porcentagens fora das usuais e resultados não inteiros', () => {
    expect(percent.validate({ tipo: 'fixo', total: 80, porcentagem: 30 }).length).toBeGreaterThan(0);
    expect(percent.validate({ tipo: 'fixo', total: 30, porcentagem: 25 }).length).toBeGreaterThan(0);
  });

  it('modelo só gera resultados inteiros', () => {
    const all = percent.enumerate({ tipo: 'modelo', total: [4, 200], porcentagens: [10, 25, 50, 75] });
    expect(all.length).toBeGreaterThan(100);
    expect(all.every((x) => Number.isInteger(x.resposta) && x.resposta > 0)).toBe(true);
  });
});

describe('formato número decimal', () => {
  it('formata com vírgula e sem zeros desnecessários', () => {
    expect(fmtDecimal(275)).toBe('2,75');
    expect(fmtDecimal(250)).toBe('2,5');
    expect(fmtDecimal(205)).toBe('2,05');
    expect(fmtDecimal(5)).toBe('0,05');
  });

  it('aceita a forma usual e outra composição correta', () => {
    const r = decimal.resolve({ tipo: 'fixo', centesimos: 275 }, rng);
    expect([r.u, r.d, r.c]).toEqual([2, 7, 5]);
    expect(decimal.evaluate(r, [2, 7, 5]).status).toBe('correct');
    const alt = decimal.evaluate(r, [1, 17, 5]);
    expect(alt.status).toBe('correct');
    expect(alt.message).toContain('jeito diferente');
  });

  it('erro diz quanto falta ou passou, em decimal', () => {
    const r = decimal.resolve({ tipo: 'fixo', centesimos: 275 }, rng);
    expect(decimal.evaluate(r, [2, 5, 0]).message).toContain('faltam 0,25');
    expect(decimal.evaluate(r, [3, 0, 0]).message).toContain('passou 0,25');
  });

  it('modelo com uma casa só gera décimos', () => {
    const all = decimal.enumerate({ tipo: 'modelo', centesimos: [10, 990], casas: 1 });
    expect(all.every((x) => x.centesimos % 10 === 0 && x.centesimos % 100 !== 0)).toBe(true);
  });
});

describe('formato área e perímetro', () => {
  const r = areaFormat.resolve({ tipo: 'fixo', largura: 6, altura: 2 }, rng);

  it('calcula área e perímetro', () => {
    expect([r.area, r.perimetro]).toEqual([12, 16]);
  });

  it('aceita o retângulo em qualquer posição', () => {
    expect(areaFormat.evaluate(r, [6, 2]).status).toBe('correct');
    expect(areaFormat.evaluate(r, [2, 6]).status).toBe('correct');
  });

  it('mesma área com perímetro diferente não serve, e a mensagem explica', () => {
    const ev = areaFormat.evaluate(r, [4, 3]);
    expect(ev.status).toBe('incorrect');
    expect(ev.message).toContain('a área (12) está certa');
    expect(ev.message).toContain('o perímetro é 14');
  });

  it('modelo não repete retângulos girados', () => {
    const all = areaFormat.enumerate({ tipo: 'modelo', largura: [2, 6], altura: [2, 6] });
    expect(all.every((x) => x.altura <= x.largura)).toBe(true);
  });
});
