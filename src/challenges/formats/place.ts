import type { Rng } from '../../core/rng';
import type { PosicionalParams } from '../../content/schema';
import { range, type Evaluation, type FormatModule, type TemplateVars } from './types';

/**
 * Formato "Valor posicional": montar um número com centenas, dezenas e unidades (EF02MA04).
 * Qualquer composição correta vale — 1 centena + 12 dezenas + 3 unidades também forma 223.
 */

export const MAX_PECAS = 19;

export interface ResolvedPlace {
  formato: 'posicional';
  numero: number;
  c: number;
  d: number;
  u: number;
  vars: TemplateVars;
}

function build(numero: number): ResolvedPlace {
  const c = Math.floor(numero / 100);
  const d = Math.floor((numero % 100) / 10);
  const u = numero % 10;
  return { formato: 'posicional', numero, c, d, u, vars: { numero, c, d, u, cValor: c * 100, dValor: d * 10 } };
}

function validateNumber(n: number): string[] {
  return n < 10 || n > 999 ? ['O número deve ter 2 ou 3 algarismos (10 a 999).'] : [];
}

function enumerate(p: PosicionalParams): ResolvedPlace[] {
  if (p.tipo === 'fixo') return [build(p.numero)];
  return range(p.numero[0], p.numero[1])
    .filter((n) => validateNumber(n).length === 0)
    .map(build);
}

function validate(p: PosicionalParams): string[] {
  if (p.tipo === 'fixo') return validateNumber(p.numero);
  return enumerate(p).length === 0 ? ['Modelo não gera nenhuma variação válida.'] : [];
}

function resolve(p: PosicionalParams, rng: Rng): ResolvedPlace {
  return structuredClone(rng.pick(enumerate(p)));
}

/** Resposta: [centenas, dezenas, unidades]. */
function evaluate(r: ResolvedPlace, answer: unknown): Evaluation {
  if (!Array.isArray(answer) || answer.length !== 3 || answer.some((n) => !Number.isInteger(n) || n < 0 || n > MAX_PECAS)) {
    return { status: 'invalid', message: 'Use as peças para montar o número.' };
  }
  const [c, d, u] = answer as [number, number, number];
  const sum = c * 100 + d * 10 + u;
  if (sum === 0) return { status: 'invalid', message: 'Use as peças para montar o número.' };
  if (sum === r.numero) {
    const canonical = c === r.c && d === r.d && u === r.u;
    return {
      status: 'correct',
      message: canonical
        ? `Isso! ${c} centenas, ${d} dezenas e ${u} unidades formam ${r.numero}.`
        : `Isso! Você montou ${r.numero} de um jeito diferente — também vale!`,
    };
  }
  const diff = sum < r.numero ? `faltam ${r.numero - sum}` : `passou ${sum - r.numero}`;
  return { status: 'incorrect', message: `Você montou ${sum}. A máquina precisa de ${r.numero}: ${diff}.` };
}

export const place: FormatModule<PosicionalParams, ResolvedPlace> = {
  resolve,
  enumerate,
  validate,
  countVariants: (p) => enumerate(p).length,
  evaluate,
};
