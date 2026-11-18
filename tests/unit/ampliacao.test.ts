import { describe, expect, it } from 'vitest';
import { counting } from '../../src/challenges/formats/choice';
import { numeric } from '../../src/challenges/formats/numeric';
import { order } from '../../src/challenges/formats/order';

describe('ordenar números (1º ano)', () => {
  const fixo = { tipo: 'fixo' as const, numeros: [7, 2, 12], ordem: 'crescente' as const };

  it('resposta certa: índices do menor para o maior', () => {
    const [r] = order.enumerate(fixo);
    expect(r!.correta).toEqual([1, 0, 2]);
    expect(r!.vars.ordenados).toBe('2, 7, 12');
    expect(order.evaluate(r!, [1, 0, 2]).status).toBe('correct');
  });

  it('ordem errada marca cada posição; resposta incompleta ou repetida é inválida', () => {
    const [r] = order.enumerate(fixo);
    const e = order.evaluate(r!, [0, 1, 2]);
    expect(e.status).toBe('incorrect');
    expect(e.perSlot).toEqual([false, false, true]);
    expect(order.evaluate(r!, [1, 0]).status).toBe('invalid');
    expect(order.evaluate(r!, [1, 1, 2]).status).toBe('invalid');
    expect(order.evaluate(r!, null).status).toBe('invalid');
  });

  it('decrescente', () => {
    const [r] = order.enumerate({ ...fixo, ordem: 'decrescente' });
    expect(order.evaluate(r!, [2, 0, 1]).status).toBe('correct');
  });

  it('recusa listas que já vêm ordenadas, repetidas ou fora da faixa', () => {
    expect(order.validate({ ...fixo, numeros: [1, 2, 3] })).not.toEqual([]);
    expect(order.validate({ ...fixo, numeros: [3, 2, 1] })).not.toEqual([]);
    expect(order.validate({ ...fixo, numeros: [3, 3, 1] })).not.toEqual([]);
    expect(order.validate({ ...fixo, numeros: [3, 120, 1] })).not.toEqual([]);
  });

  it('modelo: nenhuma variação aparece já em ordem e todas têm solução única', () => {
    const p = { tipo: 'modelo' as const, inicio: [1, 20] as [number, number], passo: [1, 5] as [number, number], quantidade: 4, ordem: 'crescente' as const };
    const all = order.enumerate(p);
    expect(all.length).toBe(100);
    for (const r of all) {
      const sorted = [...r.numeros].sort((a, b) => a - b);
      expect(r.numeros).not.toEqual(sorted);
      expect(r.numeros).not.toEqual([...sorted].reverse());
      expect(r.correta.map((i) => r.numeros[i])).toEqual(sorted);
      expect(order.evaluate(r, r.correta).status).toBe('correct');
    }
  });
});

describe('sequência numérica por toque (1º ano)', () => {
  it('mostra 4 números e pede o quinto', () => {
    const [r] = counting.enumerate({ tipo: 'fixo', modo: 'sequencia', a: 3, b: 2, icone: 'estrela' });
    expect(r!.estimulo).toEqual({ tipo: 'numeros', itens: [3, 5, 7, 9] });
    const certo = r!.opcoes[r!.correta]!;
    expect(certo).toEqual({ tipo: 'numero', n: 11 });
    expect(r!.vars.passo).toBe(2);
  });

  it('passo só de 1 ou 2 e resultado até 20', () => {
    expect(counting.validate({ tipo: 'fixo', modo: 'sequencia', a: 3, b: 3, icone: 'estrela' })).not.toEqual([]);
    expect(counting.validate({ tipo: 'fixo', modo: 'sequencia', a: 14, b: 2, icone: 'estrela' })).not.toEqual([]);
    expect(counting.countVariants({ tipo: 'modelo', modo: 'sequencia', a: [1, 15], b: [1, 1], icone: 'estrela' })).toBe(15);
  });
});

describe('porcentagem em problemas (5º ano)', () => {
  it('a% de b com porcentagens usuais', () => {
    const [r] = numeric.enumerate({ tipo: 'fixo', operacao: 'porcentagem', a: 25, b: 80 });
    expect(r!.resposta).toBe(20);
    expect(r!.vars.conta).toBe('25% de 80 = 20');
  });

  it('recusa porcentagens fora da lista ou resultado não inteiro', () => {
    expect(numeric.validate({ tipo: 'fixo', operacao: 'porcentagem', a: 30, b: 80 })).not.toEqual([]);
    expect(numeric.validate({ tipo: 'fixo', operacao: 'porcentagem', a: 10, b: 35 })).not.toEqual([]);
  });
});
