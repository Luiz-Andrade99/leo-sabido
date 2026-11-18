import type { Rng } from '../../core/rng';
import type { DecimalParams } from '../../content/schema';
import { range, type Evaluation, type FormatModule, type TemplateVars } from './types';

/**
 * Formato "Número decimal": montar uma medida com inteiros, décimos e centésimos (EF05MA02).
 * Os valores são guardados em centésimos (inteiros) para nunca haver erro de arredondamento.
 * Qualquer composição correta vale (ex.: 2 inteiros + 7 décimos + 5 centésimos ou 27 décimos + 5 centésimos).
 */

export const MAX_PECAS_DECIMAL = 19;

export interface ResolvedDecimal {
  formato: 'decimal';
  centesimos: number;
  u: number;
  d: number;
  c: number;
  vars: TemplateVars;
}

/** 275 → "2,75"; 250 → "2,5"; 300 → "3". */
export function fmtDecimal(centesimos: number): string {
  const inteiro = Math.floor(centesimos / 100);
  const resto = centesimos % 100;
  if (resto === 0) return String(inteiro);
  return resto % 10 === 0 ? `${inteiro},${resto / 10}` : `${inteiro},${String(resto).padStart(2, '0')}`;
}

function build(centesimos: number): ResolvedDecimal {
  const u = Math.floor(centesimos / 100);
  const d = Math.floor((centesimos % 100) / 10);
  const c = centesimos % 10;
  return { formato: 'decimal', centesimos, u, d, c, vars: { numero: fmtDecimal(centesimos), u, d, c } };
}

function validateValue(cent: number, casas: 1 | 2): string[] {
  const errs: string[] = [];
  if (cent < 1 || cent > 999) errs.push('Valor de 0,01 a 9,99.');
  if (cent % 100 === 0) errs.push('O número precisa ter parte decimal.');
  if (casas === 1 && cent % 10 !== 0) errs.push('Com uma casa decimal, use só décimos.');
  return errs;
}

function enumerate(p: DecimalParams): ResolvedDecimal[] {
  if (p.tipo === 'fixo') return [build(p.centesimos)];
  return range(p.centesimos[0], p.centesimos[1])
    .filter((n) => validateValue(n, p.casas).length === 0)
    .map(build);
}

function validate(p: DecimalParams): string[] {
  if (p.tipo === 'fixo') return validateValue(p.centesimos, p.centesimos % 10 === 0 ? 1 : 2);
  return enumerate(p).length === 0 ? ['Modelo não gera nenhuma variação válida.'] : [];
}

function resolve(p: DecimalParams, rng: Rng): ResolvedDecimal {
  return structuredClone(rng.pick(enumerate(p)));
}

/** Resposta: [inteiros, décimos, centésimos]. */
function evaluate(r: ResolvedDecimal, answer: unknown): Evaluation {
  if (!Array.isArray(answer) || answer.length !== 3 || answer.some((n) => !Number.isInteger(n) || n < 0 || n > MAX_PECAS_DECIMAL)) {
    return { status: 'invalid', message: 'Use as peças para montar a medida.' };
  }
  const [u, d, c] = answer as [number, number, number];
  const sum = u * 100 + d * 10 + c;
  if (sum === 0) return { status: 'invalid', message: 'Use as peças para montar a medida.' };
  if (sum === r.centesimos) {
    const canonical = u === r.u && d === r.d && c === r.c;
    return {
      status: 'correct',
      message: canonical ? `Isso! Você montou ${fmtDecimal(sum)}.` : `Isso! Você montou ${fmtDecimal(sum)} de um jeito diferente — também vale!`,
    };
  }
  const diff = sum < r.centesimos ? `faltam ${fmtDecimal(r.centesimos - sum)}` : `passou ${fmtDecimal(sum - r.centesimos)}`;
  return { status: 'incorrect', message: `Você montou ${fmtDecimal(sum)}. A medida pedida é ${fmtDecimal(r.centesimos)}: ${diff}.` };
}

export const decimal: FormatModule<DecimalParams, ResolvedDecimal> = {
  resolve,
  enumerate,
  validate,
  countVariants: (p) => enumerate(p).length,
  evaluate,
};
