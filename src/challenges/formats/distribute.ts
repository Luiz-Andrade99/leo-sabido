import type { Rng } from '../../core/rng';
import type { DistribuirParams } from '../../content/schema';
import { range, type Evaluation, type FormatModule, type TemplateVars } from './types';

/**
 * Formato "Distribuir igualmente": repartir cristais entre máquinas (divisão — EF03MA08).
 * A criança coloca cristais em cada máquina; o que não for colocado fica no cesto de sobras.
 */

export const MAX_GRUPOS = 5;
export const MAX_CADA = 10;
export const MAX_TOTAL = 50;

export interface ResolvedDistribute {
  formato: 'distribuir';
  total: number;
  grupos: number;
  cada: number;
  sobra: number;
  vars: TemplateVars;
}

function build(total: number, grupos: number): ResolvedDistribute {
  const cada = Math.floor(total / grupos);
  const sobra = total % grupos;
  return { formato: 'distribuir', total, grupos, cada, sobra, vars: { total, grupos, cada, sobra, produto: grupos * cada } };
}

function validatePair(total: number, grupos: number): string[] {
  const errs: string[] = [];
  if (grupos < 2 || grupos > MAX_GRUPOS) errs.push(`Número de máquinas deve ser de 2 a ${MAX_GRUPOS}.`);
  if (total > MAX_TOTAL) errs.push(`No máximo ${MAX_TOTAL} cristais (limite da interface).`);
  const cada = Math.floor(total / Math.max(grupos, 1));
  if (cada < 1 || cada > MAX_CADA) errs.push(`Cada máquina deve receber de 1 a ${MAX_CADA} cristais (divisão por até 10).`);
  return errs;
}

const cache = new Map<string, ResolvedDistribute[]>();

function enumerate(p: DistribuirParams): ResolvedDistribute[] {
  if (p.tipo === 'fixo') return [build(p.total, p.grupos)];
  const key = JSON.stringify(p);
  const hit = cache.get(key);
  if (hit) return hit;
  const out: ResolvedDistribute[] = [];
  for (const total of range(p.total[0], p.total[1])) {
    for (const grupos of range(p.grupos[0], p.grupos[1])) {
      if (validatePair(total, grupos).length > 0) continue;
      if (p.comResto !== (total % grupos !== 0)) continue;
      out.push(build(total, grupos));
    }
  }
  cache.set(key, out);
  return out;
}

function validate(p: DistribuirParams): string[] {
  if (p.tipo === 'fixo') return validatePair(p.total, p.grupos);
  return enumerate(p).length === 0 ? ['Modelo não gera nenhuma variação válida.'] : [];
}

function resolve(p: DistribuirParams, rng: Rng): ResolvedDistribute {
  return structuredClone(p.tipo === 'fixo' ? build(p.total, p.grupos) : rng.pick(enumerate(p)));
}

/** Resposta: quantidade colocada em cada máquina. */
function evaluate(r: ResolvedDistribute, answer: unknown): Evaluation {
  if (!Array.isArray(answer) || answer.length !== r.grupos || answer.some((n) => !Number.isInteger(n) || n < 0)) {
    return { status: 'invalid', message: 'Coloque cristais nas máquinas.' };
  }
  const counts = answer as number[];
  const placed = counts.reduce((s, n) => s + n, 0);
  if (placed === 0) return { status: 'invalid', message: 'Coloque cristais nas máquinas.' };
  if (placed > r.total) return { status: 'invalid', message: `Só existem ${r.total} cristais.` };

  const perSlot = counts.map((n) => n === r.cada);
  if (perSlot.every(Boolean)) {
    return {
      status: 'correct',
      perSlot,
      message: r.sobra === 0 ? 'Perfeito! Todas as máquinas ficaram iguais.' : `Perfeito! Cada máquina ficou com ${r.cada} e sobraram ${r.sobra}.`,
    };
  }
  const allEqual = counts.every((n) => n === counts[0]);
  const left = r.total - placed;
  if (allEqual && left >= r.grupos) {
    return { status: 'incorrect', perSlot, message: `As máquinas estão iguais, mas ainda sobram ${left} cristais: dá para colocar mais um em cada.` };
  }
  return { status: 'incorrect', perSlot, message: 'As máquinas precisam ficar com a mesma quantidade. Tente de novo.' };
}

export const distribute: FormatModule<DistribuirParams, ResolvedDistribute> = {
  resolve,
  enumerate,
  validate,
  countVariants: (p) => enumerate(p).length,
  evaluate,
};
