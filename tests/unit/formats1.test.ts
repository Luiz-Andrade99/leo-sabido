import { describe, expect, it } from 'vitest';
import { counting, pattern, shapes } from '../../src/challenges/formats/choice';
import { createRng } from '../../src/core/rng';

const rng = createRng(1);

describe('contagem (1º ano)', () => {
  it('"quantos": opções numéricas com uma só correta e distratores próximos', () => {
    const r = counting.resolve({ tipo: 'fixo', modo: 'quantos', a: 5, b: 0, icone: 'estrela' }, rng);
    const nums = r.opcoes.map((o) => (o.tipo === 'numero' ? o.n : -1));
    expect(nums).toContain(5);
    expect(nums.filter((n) => n === 5)).toHaveLength(1);
    expect(nums.every((n) => Math.abs(n - 5) <= 2)).toBe(true);
    expect(nums[r.correta]).toBe(5);
  });

  it('a posição da resposta certa varia entre itens', () => {
    const pos = new Set([3, 4, 5, 6, 7].map((a) => counting.resolve({ tipo: 'fixo', modo: 'quantos', a, b: 0, icone: 'maca' }, rng).correta));
    expect(pos.size).toBeGreaterThan(1);
  });

  it('"soma" e "retira" respeitam o limite de 20 e não geram zero', () => {
    const somas = counting.enumerate({ tipo: 'modelo', modo: 'soma', a: [1, 15], b: [1, 15], icone: 'folha' });
    expect(somas.every((r) => Number(r.vars.resposta) <= 20)).toBe(true);
    const tiras = counting.enumerate({ tipo: 'modelo', modo: 'retira', a: [2, 10], b: [1, 9], icone: 'folha' });
    expect(tiras.every((r) => Number(r.vars.resposta) >= 1)).toBe(true);
  });

  it('"compara": a resposta é o grupo maior; grupos iguais são recusados', () => {
    const r = counting.resolve({ tipo: 'fixo', modo: 'compara', a: 4, b: 7, icone: 'cogumelo' }, rng);
    expect(r.correta).toBe(1);
    expect(counting.validate({ tipo: 'fixo', modo: 'compara', a: 5, b: 5, icone: 'cogumelo' }).length).toBeGreaterThan(0);
  });

  it('avalia o toque', () => {
    const r = counting.resolve({ tipo: 'fixo', modo: 'quantos', a: 5, b: 0, icone: 'estrela' }, rng);
    expect(counting.evaluate(r, r.correta).status).toBe('correct');
    const wrong = (r.correta + 1) % r.opcoes.length;
    const ev = counting.evaluate(r, wrong);
    expect(ev.status).toBe('incorrect');
    expect(ev.perSlot![wrong]).toBe(false);
    expect(counting.evaluate(r, null).status).toBe('invalid');
  });
});

describe('figuras planas (1º ano)', () => {
  it('a figura-alvo aparece exatamente uma vez', () => {
    const all = shapes.enumerate({ tipo: 'modelo', alvos: ['circulo', 'quadrado', 'retangulo', 'triangulo'], quantidade: 3 });
    expect(all).toHaveLength(12);
    for (const r of all) {
      const alvo = r.opcoes[r.correta]!;
      expect(r.opcoes.filter((o) => JSON.stringify(o) === JSON.stringify(alvo))).toHaveLength(1);
    }
  });

  it('recusa alvo repetido', () => {
    expect(shapes.validate({ tipo: 'fixo', alvo: 'circulo', opcoes: ['circulo', 'circulo', 'quadrado'] }).length).toBeGreaterThan(0);
  });
});

describe('padrões (1º ano)', () => {
  it('AB: a próxima figura continua a alternância', () => {
    const r = pattern.resolve({ tipo: 'fixo', regra: 'AB', simbolos: ['circulo', 'triangulo'], tamanho: 6 }, rng);
    expect(r.estimulo.tipo === 'padrao' && r.estimulo.itens).toEqual(['circulo', 'triangulo', 'circulo', 'triangulo', 'circulo', 'triangulo']);
    const certa = r.opcoes[r.correta]!;
    expect(certa.tipo === 'forma' && certa.forma).toBe('circulo');
    expect(r.opcoes).toHaveLength(3); // duas do padrão + uma extra
  });

  it('AAB e ABB com 7 figuras', () => {
    const aab = pattern.resolve({ tipo: 'fixo', regra: 'AAB', simbolos: ['quadrado', 'estrela'], tamanho: 7 }, rng);
    const o = aab.opcoes[aab.correta]!;
    expect(o.tipo === 'forma' && o.forma).toBe('quadrado'); // q q e q q e q → q
  });

  it('modelo gera todas as combinações de figuras', () => {
    expect(pattern.enumerate({ tipo: 'modelo', regra: 'ABC', tamanho: 6 })).toHaveLength(24);
  });

  it('exige pelo menos duas repetições visíveis', () => {
    expect(pattern.validate({ tipo: 'modelo', regra: 'ABC', tamanho: 4 }).length).toBeGreaterThan(0);
  });
});
