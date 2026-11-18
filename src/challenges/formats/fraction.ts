import type { Rng } from '../../core/rng';
import type { FracaoParams } from '../../content/schema';
import type { Evaluation, FormatModule, TemplateVars } from './types';

/**
 * Formato "Fração": a ponte está dividida em partes iguais; marque a fração pedida (EF04MA09).
 * Qualquer conjunto de partes com a quantidade certa vale — a posição não importa.
 */

export const DENOMINADORES = [2, 3, 4, 5, 10] as const;
export const MAX_PARTES = 20;

export interface ResolvedFraction {
  formato: 'fracao';
  partes: number;
  numerador: number;
  denominador: number;
  resposta: number;
  vars: TemplateVars;
}

function build(partes: number, numerador: number, denominador: number): ResolvedFraction {
  const umaParte = partes / denominador;
  const resposta = umaParte * numerador;
  return {
    formato: 'fracao',
    partes,
    numerador,
    denominador,
    resposta,
    vars: { partes, numerador, denominador, fracao: `${numerador}/${denominador}`, umaParte, resposta },
  };
}

function validateTriple(partes: number, num: number, den: number): string[] {
  const errs: string[] = [];
  if (!(DENOMINADORES as readonly number[]).includes(den)) errs.push('Use os denominadores usuais do 4º ano: 2, 3, 4, 5 ou 10.');
  if (num < 1 || num >= den) errs.push('O numerador deve ser de 1 até o denominador menos 1.');
  if (partes < den || partes > MAX_PARTES) errs.push(`A ponte deve ter de ${den} a ${MAX_PARTES} partes.`);
  if (partes % den !== 0) errs.push('O número de partes precisa ser divisível pelo denominador.');
  return errs;
}

function enumerate(p: FracaoParams): ResolvedFraction[] {
  if (p.tipo === 'fixo') return [build(p.partes, p.numerador, p.denominador)];
  const out: ResolvedFraction[] = [];
  for (const [n, d] of p.fracoes) for (const partes of p.partes) if (validateTriple(partes, n, d).length === 0) out.push(build(partes, n, d));
  return out;
}

function validate(p: FracaoParams): string[] {
  if (p.tipo === 'fixo') return validateTriple(p.partes, p.numerador, p.denominador);
  return enumerate(p).length === 0 ? ['Modelo não gera nenhuma variação válida.'] : [];
}

function resolve(p: FracaoParams, rng: Rng): ResolvedFraction {
  return structuredClone(rng.pick(enumerate(p)));
}

/** Resposta: quantas partes foram marcadas. */
function evaluate(r: ResolvedFraction, answer: unknown): Evaluation {
  if (typeof answer !== 'number' || !Number.isInteger(answer) || answer < 0 || answer > r.partes) {
    return { status: 'invalid', message: 'Marque as partes da ponte.' };
  }
  if (answer === 0) return { status: 'invalid', message: 'Marque as partes da ponte.' };
  const f = `${r.numerador}/${r.denominador}`;
  if (answer === r.resposta) {
    return { status: 'correct', message: `Isso! ${f} de ${r.partes} partes são ${r.resposta} partes.` };
  }
  const dir = answer > r.resposta ? 'Marque menos partes.' : 'Marque mais partes.';
  return { status: 'incorrect', message: `Você marcou ${answer} de ${r.partes} partes; isso ainda não é ${f}. ${dir}` };
}

export const fraction: FormatModule<FracaoParams, ResolvedFraction> = {
  resolve,
  enumerate,
  validate,
  countVariants: (p) => enumerate(p).length,
  evaluate,
};
