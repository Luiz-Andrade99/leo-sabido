import type { Rng } from '../../core/rng';
import type { SequenciaFixa, SequenciaModelo, SequenciaParams } from '../../content/schema';
import type { Evaluation, FormatModule, TemplateVars } from './types';

/** Formato "Completar sequência" (regularidades com adições/subtrações sucessivas). */

export type { TemplateVars };

export interface ResolvedSequence {
  formato?: 'sequencia';
  valores: (number | null)[];
  solucao: number[];
  vars: TemplateVars;
}

function varsFor(passo: number): TemplateVars {
  return {
    passo,
    passoAbs: Math.abs(passo),
    direcao: passo >= 0 ? 'aumenta' : 'diminui',
    acao: passo >= 0 ? 'some' : 'tire',
  };
}

function fromFixed(p: SequenciaFixa): ResolvedSequence {
  const first = p.valores[0] ?? 0;
  const solucao = p.valores.flatMap((v, i) => (v === null ? [first + i * p.passo] : []));
  return { formato: 'sequencia', valores: [...p.valores], solucao, vars: varsFor(p.passo) };
}

function combinations(pool: number[], k: number): number[][] {
  if (k === 0) return [[]];
  const out: number[][] = [];
  pool.forEach((x, i) => {
    for (const rest of combinations(pool.slice(i + 1), k - 1)) out.push([x, ...rest]);
  });
  return out;
}

const cache = new Map<string, ResolvedSequence[]>();

function enumerateModel(m: SequenciaModelo): ResolvedSequence[] {
  const key = JSON.stringify(m);
  const hit = cache.get(key);
  if (hit) return hit;
  const out: ResolvedSequence[] = [];
  for (let inicio = m.inicio[0]; inicio <= m.inicio[1]; inicio++) {
    for (let passo = m.passo[0]; passo <= m.passo[1]; passo++) {
      if (passo === 0) continue;
      for (let tamanho = m.tamanho[0]; tamanho <= m.tamanho[1]; tamanho++) {
        const nums = Array.from({ length: tamanho }, (_, i) => inicio + i * passo);
        if (nums.some((n) => n < m.minValor || n > m.maxValor)) continue;
        // Lacunas nunca nas duas primeiras posições: a regra precisa estar visível.
        const positions = Array.from({ length: tamanho - 2 }, (_, i) => i + 2);
        for (const gaps of combinations(positions, m.lacunas)) {
          out.push({
            formato: 'sequencia',
            valores: nums.map((n, i) => (gaps.includes(i) ? null : n)),
            solucao: gaps.map((g) => nums[g]!),
            vars: varsFor(passo),
          });
        }
      }
    }
  }
  cache.set(key, out);
  return out;
}

function validateFixed(p: SequenciaFixa): string[] {
  const errs: string[] = [];
  const [a, b] = p.valores;
  if (p.passo === 0) errs.push('Passo zero não forma sequência.');
  if (a === null || a === undefined || b === null || b === undefined) {
    errs.push('As duas primeiras posições precisam estar visíveis para a regra ser deduzível.');
  }
  if (!p.valores.includes(null)) errs.push('Não há lacunas para completar.');
  const first = a ?? 0;
  p.valores.forEach((v, i) => {
    if (v !== null && v !== first + i * p.passo) errs.push(`Posição ${i + 1} (${v}) contradiz o passo ${p.passo}.`);
  });
  if (fromFixed(p).solucao.some((n) => n < 0)) errs.push('Solução com número negativo.');
  return errs;
}

function enumerate(p: SequenciaParams): ResolvedSequence[] {
  return p.tipo === 'fixo' ? [fromFixed(p)] : enumerateModel(p);
}

function validate(p: SequenciaParams): string[] {
  if (p.tipo === 'fixo') return validateFixed(p);
  const all = enumerateModel(p);
  if (all.length === 0) return ['Modelo não gera nenhuma variação válida.'];
  for (const r of all) {
    const errs = validateFixed({ tipo: 'fixo', valores: r.valores, passo: Number(r.vars.passo) });
    if (errs.length > 0) return [`Variação inválida ${JSON.stringify(r.valores)}: ${errs.join(' ')}`];
  }
  return [];
}

function resolve(p: SequenciaParams, rng: Rng): ResolvedSequence {
  return p.tipo === 'fixo' ? fromFixed(p) : structuredClone(rng.pick(enumerateModel(p)));
}

/** Por espaço: true se a resposta daquele espaço está certa. */
function check(solucao: readonly number[], resposta: readonly number[]): boolean[] {
  return solucao.map((s, i) => resposta[i] === s);
}

const INTEGER = /^-?\d{1,5}$/;

/** Resposta: um texto por lacuna. */
function evaluate(r: ResolvedSequence, answer: unknown): Evaluation {
  if (!Array.isArray(answer)) return { status: 'invalid', message: 'Preencha todos os espaços com números.' };
  const trimmed = answer.map((x) => String(x).trim());
  if (trimmed.length !== r.solucao.length || trimmed.some((t) => !INTEGER.test(t))) {
    return { status: 'invalid', message: 'Preencha todos os espaços com números.' };
  }
  const perSlot = check(r.solucao, trimmed.map(Number));
  if (perSlot.every(Boolean)) return { status: 'correct', perSlot, message: 'Muito bem! Você descobriu a regra.' };
  const right = perSlot.filter(Boolean).length;
  return {
    status: 'incorrect',
    perSlot,
    message:
      perSlot.length > 1
        ? `Quase! Você acertou ${right} de ${perSlot.length}. Tente de novo.`
        : 'Ainda não. Observe como os números mudam e tente de novo.',
  };
}

function countVariants(p: SequenciaParams): number {
  return p.tipo === 'fixo' ? 1 : enumerateModel(p).length;
}

export const sequence: FormatModule<SequenciaParams, ResolvedSequence> & { check: typeof check } = {
  resolve,
  enumerate,
  validate,
  countVariants,
  evaluate,
  check,
};
