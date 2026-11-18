import type { Rng } from '../../core/rng';
import type { OrdenarParams } from '../../content/schema';
import { range, type Evaluation, type FormatModule, type TemplateVars } from './types';

/**
 * Ordenar números por toque (1º ano, EF01MA05): a criança toca os cartões do menor para o maior
 * (ou do maior para o menor). Não há digitação nem leitura de frases longas.
 * A ordem em que os cartões aparecem é determinística e nunca já vem ordenada.
 */

export const MAX_ORDENAR = 99;

export interface ResolvedOrder {
  formato: 'ordenar';
  /** Números na ordem em que aparecem na tela. */
  numeros: number[];
  ordem: 'crescente' | 'decrescente';
  /** Índices (da tela) na ordem certa de toque. */
  correta: number[];
  vars: TemplateVars;
}

/** Embaralhamentos fixos que nunca deixam a lista em ordem crescente nem decrescente. */
const EMBARALHAR: Record<number, number[][]> = {
  3: [
    [1, 2, 0],
    [2, 0, 1],
    [0, 2, 1],
    [1, 0, 2],
  ],
  4: [
    [2, 0, 3, 1],
    [1, 3, 0, 2],
    [3, 1, 2, 0],
    [0, 3, 1, 2],
  ],
  5: [
    [2, 4, 0, 3, 1],
    [3, 0, 4, 1, 2],
    [1, 4, 2, 0, 3],
  ],
};

const NOME_ORDEM = { crescente: 'do menor para o maior', decrescente: 'do maior para o menor' } as const;

function build(numeros: number[], ordem: ResolvedOrder['ordem']): ResolvedOrder {
  const ordenados = [...numeros].sort((x, y) => (ordem === 'crescente' ? x - y : y - x));
  return {
    formato: 'ordenar',
    numeros,
    ordem,
    correta: ordenados.map((n) => numeros.indexOf(n)),
    vars: { ordenados: ordenados.join(', '), ordem: NOME_ORDEM[ordem], menor: Math.min(...numeros), maior: Math.max(...numeros) },
  };
}

function validateNumeros(numeros: number[]): string[] {
  const errs: string[] = [];
  if (numeros.length < 3 || numeros.length > 5) errs.push('Use de 3 a 5 números.');
  if (numeros.some((n) => !Number.isInteger(n) || n < 0 || n > MAX_ORDENAR)) errs.push(`Números de 0 a ${MAX_ORDENAR}.`);
  if (new Set(numeros).size !== numeros.length) errs.push('Números repetidos.');
  const crescente = numeros.every((n, i) => i === 0 || n > numeros[i - 1]!);
  const decrescente = numeros.every((n, i) => i === 0 || n < numeros[i - 1]!);
  if (crescente || decrescente) errs.push('Os números não podem já aparecer em ordem.');
  return errs;
}

function enumerate(p: OrdenarParams): ResolvedOrder[] {
  if (p.tipo === 'fixo') return validateNumeros(p.numeros).length === 0 ? [build(p.numeros, p.ordem)] : [];
  const perms = EMBARALHAR[p.quantidade] ?? [];
  const out: ResolvedOrder[] = [];
  for (const a of range(p.inicio[0], p.inicio[1])) {
    for (const passo of range(p.passo[0], p.passo[1])) {
      const base = Array.from({ length: p.quantidade }, (_, i) => a + i * passo);
      if (passo < 1 || base[base.length - 1]! > MAX_ORDENAR) continue;
      const perm = perms[(a + passo) % perms.length]!;
      out.push(build(perm.map((i) => base[i]!), p.ordem));
    }
  }
  return out;
}

export const order: FormatModule<OrdenarParams, ResolvedOrder> = {
  resolve: (p, rng: Rng) => structuredClone(rng.pick(enumerate(p))),
  enumerate,
  validate: (p) => {
    if (p.tipo === 'fixo') return validateNumeros(p.numeros);
    if (!EMBARALHAR[p.quantidade]) return ['Use de 3 a 5 números.'];
    return enumerate(p).length === 0 ? ['Modelo não gera nenhuma variação válida.'] : [];
  },
  countVariants: (p) => enumerate(p).length,
  evaluate: (r, answer): Evaluation => {
    const n = r.numeros.length;
    const ok =
      Array.isArray(answer) &&
      answer.length === n &&
      answer.every((i) => typeof i === 'number' && Number.isInteger(i) && i >= 0 && i < n) &&
      new Set(answer).size === n;
    if (!ok) return { status: 'invalid', message: 'Toque em todos os números, um de cada vez.' };
    const perSlot = (answer as number[]).map((i, k) => r.numeros[i] === r.numeros[r.correta[k]!]);
    return perSlot.every(Boolean)
      ? { status: 'correct', perSlot, message: 'Muito bem! Os números ficaram em ordem.' }
      : { status: 'incorrect', perSlot, message: `Ainda não. Comece pelo ${r.ordem === 'crescente' ? 'menor' : 'maior'} número.` };
  },
};
