import type { Rng } from '../../core/rng';
import type { ArranjoParams } from '../../content/schema';
import { parseNatural, range, type Evaluation, type FormatModule, type TemplateVars } from './types';

/**
 * Formato "Arranjo retangular": montar uma plataforma com N blocos em L linhas iguais
 * (multiplicação como disposição retangular — EF03MA07). A criança escolhe quantos blocos por linha.
 */

export const LINHAS = { min: 2, max: 5 } as const;
export const COLUNAS = { min: 1, max: 10 } as const;

export interface ResolvedArray {
  formato: 'arranjo';
  linhas: number;
  colunas: number;
  total: number;
  vars: TemplateVars;
}

function build(linhas: number, colunas: number): ResolvedArray {
  const total = linhas * colunas;
  return { formato: 'arranjo', linhas, colunas, total, vars: { linhas, colunas, total } };
}

function validatePair(l: number, c: number): string[] {
  const errs: string[] = [];
  if (l < LINHAS.min || l > LINHAS.max) errs.push(`Linhas devem ser de ${LINHAS.min} a ${LINHAS.max} (multiplicação por 2, 3, 4 e 5).`);
  if (c < 2 || c > COLUNAS.max) errs.push(`Blocos por linha devem ser de 2 a ${COLUNAS.max}.`);
  return errs;
}

function enumerate(p: ArranjoParams): ResolvedArray[] {
  if (p.tipo === 'fixo') return [build(p.linhas, p.colunas)];
  const out: ResolvedArray[] = [];
  for (const l of range(p.linhas[0], p.linhas[1])) {
    for (const c of range(p.colunas[0], p.colunas[1])) if (validatePair(l, c).length === 0) out.push(build(l, c));
  }
  return out;
}

function validate(p: ArranjoParams): string[] {
  if (p.tipo === 'fixo') return validatePair(p.linhas, p.colunas);
  return enumerate(p).length === 0 ? ['Modelo não gera nenhuma variação válida.'] : [];
}

function resolve(p: ArranjoParams, rng: Rng): ResolvedArray {
  return structuredClone(rng.pick(enumerate(p)));
}

/** Resposta: blocos por linha. */
function evaluate(r: ResolvedArray, answer: unknown): Evaluation {
  const c = parseNatural(answer);
  if (c === null || c < 1) return { status: 'invalid', message: 'Escolha quantos blocos vão em cada linha.' };
  const made = r.linhas * c;
  if (c === r.colunas) {
    return { status: 'correct', perSlot: [true], message: `Isso! ${r.linhas} linhas de ${c} blocos = ${r.total} blocos.` };
  }
  const diff = made < r.total ? `faltam ${r.total - made}` : `passou ${made - r.total}`;
  return { status: 'incorrect', perSlot: [false], message: `${r.linhas} linhas de ${c} = ${made} blocos — ${diff}. Tente de novo.` };
}

export const arrayFormat: FormatModule<ArranjoParams, ResolvedArray> = {
  resolve,
  enumerate,
  validate,
  countVariants: (p) => enumerate(p).length,
  evaluate,
};
