import { describe, expect, it } from 'vitest';
import { ControleVidas, textoQueda } from '../../src/core/vidas';

describe('ControleVidas', () => {
  it('começa com 3 vidas, ou sem limite no modo assistido', () => {
    expect(new ControleVidas(false).vidas).toBe(3);
    expect(new ControleVidas(true).vidas).toBe(Infinity);
  });

  it('ao cair, devolve só o que foi coletado depois da última bandeira', () => {
    const v = new ControleVidas(false);
    v.coletou(1);
    v.coletou(2);
    v.ativouBandeira();
    v.coletou(3);
    expect(v.caiu()).toEqual({ resultado: 'reaparecer', devolver: [3] });
    expect(v.vidas).toBe(2);
    expect([...v.guardados].sort()).toEqual([1, 2]);
  });

  it('a terceira queda acaba as vidas', () => {
    const v = new ControleVidas(false);
    expect(v.caiu().resultado).toBe('reaparecer');
    expect(v.caiu().resultado).toBe('reaparecer');
    expect(v.caiu().resultado).toBe('acabou');
    expect(v.vidas).toBe(0);
  });

  it('o que foi devolvido numa queda pode ser coletado de novo', () => {
    const v = new ControleVidas(false);
    v.coletou(5);
    expect(v.caiu().devolver).toEqual([5]);
    expect(v.caiu().devolver).toEqual([]);
  });

  it('no modo assistido nunca acabam', () => {
    const v = new ControleVidas(true);
    for (let i = 0; i < 10; i++) expect(v.caiu().resultado).toBe('reaparecer');
    expect(v.vidas).toBe(Infinity);
  });

  it('recomeçar devolve tudo, inclusive o guardado, e volta a 3 vidas', () => {
    const v = new ControleVidas(false);
    v.coletou(1);
    v.ativouBandeira();
    v.coletou(2);
    v.caiu();
    v.caiu();
    v.caiu();
    v.coletou(4);
    expect(v.recomecar().devolver.sort()).toEqual([1, 4]);
    expect(v.vidas).toBe(3);
    expect(v.guardados.size).toBe(0);
  });
});

describe('textoQueda', () => {
  it('conta as vidas que restam e avisa dos coletáveis devolvidos', () => {
    expect(textoQueda(2, 1, 'cristais')).toBe('Ops! Você caiu. Restam 2 vidas. Os cristais desde a última bandeira voltaram para o lugar.');
    expect(textoQueda(1, 0, 'cristais')).toBe('Ops! Você caiu. Resta 1 vida.');
    expect(textoQueda(Infinity, 0, 'cristais')).toBe('Opa! Vamos tentar de novo daqui.');
  });
});
