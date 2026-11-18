import type { Rng } from '../../core/rng';
import type { DinheiroParams, ValorDinheiro } from '../../content/schema';
import { range, type Evaluation, type FormatModule, type TemplateVars } from './types';

/**
 * Formato "Dinheiro": juntar um valor exato com moedas de R$ 1 e cédulas (EF02MA20).
 * Qualquer combinação correta vale. A ilustração é estilizada — não reproduz as cédulas reais.
 */

export const MAX_POR_VALOR = 10;
export const MAX_VALOR = 100;

export interface ResolvedMoney {
  formato: 'dinheiro';
  valor: number;
  /** Valores disponíveis, do maior para o menor. */
  notas: ValorDinheiro[];
  vars: TemplateVars;
}

/** Menor quantidade de peças para formar o valor (programação dinâmica). null = impossível. */
export function fewestPieces(valor: number, notas: readonly number[]): number[] | null {
  const best: (number[] | null)[] = Array(valor + 1).fill(null);
  best[0] = [];
  for (let v = 1; v <= valor; v++) {
    for (const n of notas) {
      const prev = v - n >= 0 ? best[v - n] : null;
      if (prev && (!best[v] || prev.length + 1 < best[v]!.length)) best[v] = [...prev, n];
    }
  }
  return best[valor] ? [...best[valor]!].sort((a, b) => b - a) : null;
}

export function formatReais(n: number): string {
  return `R$ ${n}`;
}

function build(valor: number, notas: readonly ValorDinheiro[]): ResolvedMoney {
  const sorted = [...new Set(notas)].sort((a, b) => b - a) as ValorDinheiro[];
  const pieces = fewestPieces(valor, sorted) ?? [];
  return {
    formato: 'dinheiro',
    valor,
    notas: sorted,
    vars: { valor, exemplo: `${pieces.map(formatReais).join(' + ')} = ${formatReais(valor)}` },
  };
}

function validateValue(valor: number, notas: readonly number[]): string[] {
  const errs: string[] = [];
  if (valor < 1 || valor > MAX_VALOR) errs.push(`Valor deve ser de R$ 1 a R$ ${MAX_VALOR}.`);
  const p = fewestPieces(Math.max(0, valor), notas);
  if (!p) errs.push('Não dá para formar esse valor com as cédulas/moedas disponíveis.');
  else if (p.length > MAX_POR_VALOR) errs.push('Seriam necessárias peças demais.');
  return errs;
}

function enumerate(p: DinheiroParams): ResolvedMoney[] {
  if (p.tipo === 'fixo') return [build(p.valor, p.notas)];
  return range(p.valor[0], p.valor[1])
    .filter((v) => validateValue(v, p.notas).length === 0)
    .map((v) => build(v, p.notas));
}

function validate(p: DinheiroParams): string[] {
  if (p.tipo === 'fixo') return validateValue(p.valor, p.notas);
  return enumerate(p).length === 0 ? ['Modelo não gera nenhuma variação válida.'] : [];
}

function resolve(p: DinheiroParams, rng: Rng): ResolvedMoney {
  return structuredClone(rng.pick(enumerate(p)));
}

/** Resposta: quantidade de cada valor, na ordem de `notas`. */
function evaluate(r: ResolvedMoney, answer: unknown): Evaluation {
  if (!Array.isArray(answer) || answer.length !== r.notas.length || answer.some((n) => !Number.isInteger(n) || n < 0 || n > MAX_POR_VALOR)) {
    return { status: 'invalid', message: 'Escolha moedas e cédulas para pagar.' };
  }
  const sum = (answer as number[]).reduce((s, n, i) => s + n * r.notas[i]!, 0);
  if (sum === 0) return { status: 'invalid', message: 'Escolha moedas e cédulas para pagar.' };
  if (sum === r.valor) return { status: 'correct', message: `Isso! Você juntou exatamente ${formatReais(sum)}.` };
  const diff = sum < r.valor ? `faltam ${formatReais(r.valor - sum)}` : `passou ${formatReais(sum - r.valor)}`;
  return { status: 'incorrect', message: `Você juntou ${formatReais(sum)}. A máquina pede ${formatReais(r.valor)}: ${diff}.` };
}

export const money: FormatModule<DinheiroParams, ResolvedMoney> = {
  resolve,
  enumerate,
  validate,
  countVariants: (p) => enumerate(p).length,
  evaluate,
};
