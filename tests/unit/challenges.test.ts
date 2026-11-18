import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ChallengeSession } from '../../src/challenges/engine/session';
import { sequence } from '../../src/challenges/formats/sequence';
import { validateItem } from '../../src/challenges/formats/registry';
import { ContentRepository } from '../../src/content/repository';
import { DesafioListSchema, type Desafio, type SequenciaModelo } from '../../src/content/schema';
import { createRng } from '../../src/core/rng';

const base: Desafio = {
  id: '3A-SEQ-ARI-900',
  ano: 3,
  area: 'matematica',
  tema: 'Sequências',
  bncc: [{ codigo: 'EF03MA10', status: 'a_validar', fonte: 'teste' }],
  objetivo: 'Completar sequência',
  formato: 'sequencia',
  pool: '3ano.sequencias',
  enunciado: { texto: 'Complete a sequência.' },
  parametros: { tipo: 'fixo', valores: [3, 6, 9, null, 15, null], passo: 3 },
  explicacao: 'A sequência {direcao} de {passoAbs} em {passoAbs}.',
  dicas: ['Dica 1', 'Dica 2: diferença {passoAbs}', 'Dica 3'],
  dificuldade: 1,
  revisao: { status: 'em_revisao' },
  publicacao: 'homologacao',
};

const modelo: SequenciaModelo = {
  tipo: 'modelo',
  modelo: 'progressao_aritmetica',
  inicio: [1, 40],
  passo: [-10, 10],
  tamanho: [5, 6],
  lacunas: 2,
  minValor: 0,
  maxValor: 1000,
};

describe('formato sequência', () => {
  it('deriva a solução da regra em itens fixos', () => {
    const r = sequence.resolve(base.parametros, createRng(1));
    expect(r.valores).toEqual([3, 6, 9, null, 15, null]);
    expect(r.solucao).toEqual([12, 18]);
    expect(r.vars).toMatchObject({ passoAbs: 3, direcao: 'aumenta' });
  });

  it('acusa item fixo cujos números visíveis contradizem a regra', () => {
    const errs = sequence.validate({ tipo: 'fixo', valores: [3, 6, 10, null, 15], passo: 3 });
    expect(errs.length).toBeGreaterThan(0);
  });

  it('acusa lacuna nas duas primeiras posições (regra ficaria ambígua)', () => {
    expect(sequence.validate({ tipo: 'fixo', valores: [null, 6, 9, 12], passo: 3 }).length).toBeGreaterThan(0);
  });

  it('enumera variações do modelo dentro da faixa, sem passo zero e com solução única', () => {
    const all = sequence.enumerate(modelo);
    expect(all.length).toBeGreaterThan(100);
    for (const r of all) {
      const nums = r.valores.map((v, i) => v ?? r.solucao[r.valores.slice(0, i).filter((x) => x === null).length]!);
      expect(Math.min(...nums)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...nums)).toBeLessThanOrEqual(1000);
      expect(r.valores[0]).not.toBeNull();
      expect(r.valores[1]).not.toBeNull();
      expect(r.vars.passoAbs).not.toBe(0);
      expect(r.valores.filter((v) => v === null)).toHaveLength(2);
    }
  });

  it('sorteio do modelo é reprodutível com a mesma semente', () => {
    const a = sequence.resolve(modelo, createRng(42));
    const b = sequence.resolve(modelo, createRng(42));
    expect(a).toEqual(b);
  });
});

describe('ChallengeSession', () => {
  const resolved = sequence.resolve(base.parametros, createRng(1));

  it('aceita resposta correta com espaços em volta', () => {
    const s = new ChallengeSession(base, resolved, 'padrao');
    const r = s.submit([' 12 ', '18']);
    expect(r.status).toBe('correct');
    expect(r.explanation).toBe('A sequência aumenta de 3 em 3.');
    expect(s.solved).toBe(true);
  });

  it('resposta vazia ou não numérica é inválida e não conta tentativa', () => {
    const s = new ChallengeSession(base, resolved, 'padrao');
    expect(s.submit(['', 'x']).status).toBe('invalid');
    expect(s.attempts).toBe(0);
  });

  it('resposta errada informa quantos espaços estão certos', () => {
    const s = new ChallengeSession(base, resolved, 'padrao');
    const r = s.submit(['12', '20']);
    expect(r.status).toBe('incorrect');
    expect(r.message).toContain('1 de 2');
    expect(s.attempts).toBe(1);
  });

  it('no apoio acompanhado, a primeira dica aparece sozinha após um erro', () => {
    const s = new ChallengeSession(base, resolved, 'acompanhado');
    expect(s.submit(['1', '2']).autoHint).toBe('Dica 1');
    expect(s.hintsUsed).toBe(1);
  });

  it('no apoio padrão não há dica automática', () => {
    const s = new ChallengeSession(base, resolved, 'padrao');
    expect(s.submit(['1', '2']).autoHint).toBeUndefined();
  });

  it('dicas preenchem variáveis e se esgotam conforme o nível de apoio', () => {
    const p = new ChallengeSession(base, resolved, 'padrao');
    expect(p.nextHint()).toBe('Dica 1');
    expect(p.nextHint()).toBe('Dica 2: diferença 3');
    expect(p.nextHint()).toBe('Dica 3');
    expect(p.nextHint()).toBeNull();
    const d = new ChallengeSession(base, resolved, 'desafio');
    d.nextHint();
    d.nextHint();
    expect(d.nextHint()).toBeNull();
  });

  it('após três erros mostra a explicação', () => {
    const s = new ChallengeSession(base, resolved, 'padrao');
    s.submit(['1', '2']);
    s.submit(['1', '2']);
    expect(s.submit(['1', '2']).explanation).toBe('A sequência aumenta de 3 em 3.');
  });

  it('depois de resolvido, novos envios não alteram as tentativas', () => {
    const s = new ChallengeSession(base, resolved, 'padrao');
    s.submit(['12', '18']);
    s.submit(['0', '0']);
    expect(s.attempts).toBe(1);
    expect(s.solved).toBe(true);
  });
});

describe('ContentRepository', () => {
  const aprovado: Desafio = {
    ...base,
    id: '3A-SEQ-ARI-901',
    revisao: { status: 'aprovado', revisor: 'Prof. Teste', data: '2026-11-17' },
    publicacao: 'producao',
  };

  it('em produção nunca devolve item que não foi aprovado', () => {
    const repo = new ContentRepository([base]);
    expect(repo.pick('3ano.sequencias', createRng(1), 'producao')).toBeNull();
    expect(repo.pick('3ano.sequencias', createRng(1), 'homologacao')?.id).toBe(base.id);
  });

  it('em produção devolve item aprovado', () => {
    const repo = new ContentRepository([base, aprovado]);
    expect(repo.pick('3ano.sequencias', createRng(1), 'producao')?.id).toBe(aprovado.id);
  });

  it('schema recusa item aprovado sem revisor', () => {
    const r = DesafioListSchema.safeParse([{ ...base, revisao: { status: 'aprovado' } }]);
    expect(r.success).toBe(false);
  });
});

describe('arquivos de conteúdo', () => {
  const dir = 'content/anos/3/desafios';
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.json'))) {
    it(`${f} é válido e todas as variações passam na validação`, () => {
      const parsed = DesafioListSchema.parse(JSON.parse(readFileSync(join(dir, f), 'utf8')));
      expect(parsed.length).toBeGreaterThan(0);
      for (const d of parsed) {
        expect(validateItem(d), d.id).toEqual([]);
      }
    });
  }
});
