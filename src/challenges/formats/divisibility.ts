import { createRng, type Rng } from '../../core/rng';
import type { DivisibilidadeParams, RegraDivisibilidade } from '../../content/schema';
import type { Evaluation, FormatModule, TemplateVars } from './types';

/**
 * Formato "Circuito de divisibilidade": acender as lâmpadas cujos números seguem a regra —
 * múltiplos de k, divisores de k ou números primos (EF06MA05, EF06MA06).
 * Modelos geram um conjunto fixo e reprodutível de amostras, todas validadas.
 */

export const AMOSTRAS_DIV = 120;

export function ehPrimo(n: number): boolean {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

export function segueRegra(regra: RegraDivisibilidade, k: number, n: number): boolean {
  if (regra === 'multiplo') return n % k === 0;
  if (regra === 'divisor') return k % n === 0;
  return ehPrimo(n);
}

export function descreverRegra(regra: RegraDivisibilidade, k: number): string {
  if (regra === 'multiplo') return `múltiplos de ${k}`;
  if (regra === 'divisor') return `divisores de ${k}`;
  return 'números primos';
}

export interface ResolvedDivisibility {
  formato: 'divisibilidade';
  regra: RegraDivisibilidade;
  k: number;
  numeros: number[];
  alvo: boolean[];
  vars: TemplateVars;
}

function build(regra: RegraDivisibilidade, k: number, numeros: number[]): ResolvedDivisibility {
  const alvo = numeros.map((n) => segueRegra(regra, k, n));
  return {
    formato: 'divisibilidade',
    regra,
    k,
    numeros,
    alvo,
    vars: { k, regra: descreverRegra(regra, k), corretos: numeros.filter((_, i) => alvo[i]).join(', '), quantidade: alvo.filter(Boolean).length },
  };
}

function validateOne(r: ResolvedDivisibility): string[] {
  const errs: string[] = [];
  const c = r.alvo.filter(Boolean).length;
  if (new Set(r.numeros).size !== r.numeros.length) errs.push('Números repetidos.');
  if (r.numeros.length < 4 || r.numeros.length > 10) errs.push('Use de 4 a 10 lâmpadas.');
  if (c < 2 || c > r.numeros.length - 2) errs.push('Pelo menos 2 lâmpadas certas e 2 erradas.');
  if (r.regra !== 'primo' && r.k < 2) errs.push('k deve ser pelo menos 2.');
  if (r.numeros.some((n) => n < 1 || n > 200)) errs.push('Números de 1 a 200.');
  return errs;
}

const cache = new Map<string, ResolvedDivisibility[]>();

function enumerate(p: DivisibilidadeParams): ResolvedDivisibility[] {
  if (p.tipo === 'fixo') return [build(p.regra, p.k, p.numeros)];
  const key = JSON.stringify(p);
  const hit = cache.get(key);
  if (hit) return hit;
  const out: ResolvedDivisibility[] = [];
  for (let seed = 1; seed <= AMOSTRAS_DIV; seed++) {
    const g = createRng(seed * 104729);
    const k = g.int(p.k[0], p.k[1]);
    const [lo, hi] = p.regra === 'divisor' ? [1, k] : p.numeros;
    const pool = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
    // Embaralha e pega metade "certos" e metade quaisquer, para não depender da sorte.
    const certos = pool.filter((n) => segueRegra(p.regra, k, n));
    const errados = pool.filter((n) => !segueRegra(p.regra, k, n));
    const nc = Math.min(certos.length, Math.max(2, Math.floor(p.quantidade / 2)));
    const pick = (arr: number[], n: number): number[] => {
      const a = [...arr];
      const r: number[] = [];
      while (r.length < n && a.length > 0) r.push(a.splice(g.int(0, a.length - 1), 1)[0]!);
      return r;
    };
    const numeros = [...pick(certos, nc), ...pick(errados, p.quantidade - nc)].sort((x, y) => x - y);
    const r = build(p.regra, k, numeros);
    if (validateOne(r).length === 0) out.push(r);
  }
  cache.set(key, out);
  return out;
}

function validate(p: DivisibilidadeParams): string[] {
  if (p.tipo === 'fixo') return validateOne(build(p.regra, p.k, p.numeros));
  return enumerate(p).length === 0 ? ['Modelo não gera nenhuma variação válida.'] : [];
}

function resolve(p: DivisibilidadeParams, rng: Rng): ResolvedDivisibility {
  return structuredClone(rng.pick(enumerate(p)));
}

/** Resposta: lâmpadas acesas (true/false), na ordem dos números. */
function evaluate(r: ResolvedDivisibility, answer: unknown): Evaluation {
  if (!Array.isArray(answer) || answer.length !== r.numeros.length || answer.some((x) => typeof x !== 'boolean')) {
    return { status: 'invalid', message: 'Acenda as lâmpadas certas.' };
  }
  const on = answer as boolean[];
  if (!on.some(Boolean)) return { status: 'invalid', message: 'Acenda pelo menos uma lâmpada.' };
  const perSlot = on.map((x, i) => x === r.alvo[i]);
  if (perSlot.every(Boolean)) return { status: 'correct', perSlot, message: `Isso! Os ${r.vars.regra} são: ${r.vars.corretos}.` };
  const certos = perSlot.filter(Boolean).length;
  return { status: 'incorrect', perSlot, message: `${certos} de ${r.numeros.length} lâmpadas estão certas. Confira as marcadas com ✗.` };
}

export const divisibility: FormatModule<DivisibilidadeParams, ResolvedDivisibility> = {
  resolve,
  enumerate,
  validate,
  countVariants: (p) => enumerate(p).length,
  evaluate,
};
