import type { Rng } from '../../core/rng';
import type { ExpressaoParams, FormaExpressao } from '../../content/schema';
import { parseNatural, range, type Evaluation, type FormatModule, type TemplateVars } from './types';

/**
 * Formato "Expressão numérica": calcular respeitando a ordem das operações (EF06MA03).
 * Se a resposta for o resultado "da esquerda para a direita", o jogo aponta esse engano comum.
 */

interface Forma {
  termos: number;
  texto: (t: number[]) => string;
  valor: (t: number[]) => number | null;
  /** Resultado de quem ignora a ordem das operações e calcula da esquerda para a direita. */
  ingenuo: (t: number[]) => number | null;
  passos: (t: number[]) => string;
}

const exact = (a: number, b: number): number | null => (b !== 0 && a % b === 0 ? a / b : null);

export const FORMAS: Record<FormaExpressao, Forma> = {
  'a+bxc': {
    termos: 3,
    texto: ([a, b, c]) => `${a} + ${b} × ${c}`,
    valor: ([a, b, c]) => a! + b! * c!,
    ingenuo: ([a, b, c]) => (a! + b!) * c!,
    passos: ([a, b, c]) => `primeiro a multiplicação: ${b} × ${c} = ${b! * c!}; depois ${a} + ${b! * c!} = ${a! + b! * c!}`,
  },
  '(a+b)xc': {
    termos: 3,
    texto: ([a, b, c]) => `(${a} + ${b}) × ${c}`,
    valor: ([a, b, c]) => (a! + b!) * c!,
    ingenuo: ([a, b, c]) => a! + b! * c!,
    passos: ([a, b, c]) => `primeiro os parênteses: ${a} + ${b} = ${a! + b!}; depois ${a! + b!} × ${c} = ${(a! + b!) * c!}`,
  },
  'a-bxc': {
    termos: 3,
    texto: ([a, b, c]) => `${a} − ${b} × ${c}`,
    valor: ([a, b, c]) => a! - b! * c!,
    ingenuo: ([a, b, c]) => (a! - b!) * c!,
    passos: ([a, b, c]) => `primeiro a multiplicação: ${b} × ${c} = ${b! * c!}; depois ${a} − ${b! * c!} = ${a! - b! * c!}`,
  },
  'a+b/c': {
    termos: 3,
    texto: ([a, b, c]) => `${a} + ${b} ÷ ${c}`,
    valor: ([a, b, c]) => {
      const q = exact(b!, c!);
      return q === null ? null : a! + q;
    },
    ingenuo: ([a, b, c]) => exact(a! + b!, c!),
    passos: ([a, b, c]) => `primeiro a divisão: ${b} ÷ ${c} = ${b! / c!}; depois ${a} + ${b! / c!} = ${a! + b! / c!}`,
  },
  'axb+cxd': {
    termos: 4,
    texto: ([a, b, c, d]) => `${a} × ${b} + ${c} × ${d}`,
    valor: ([a, b, c, d]) => a! * b! + c! * d!,
    ingenuo: ([a, b, c, d]) => (a! * b! + c!) * d!,
    passos: ([a, b, c, d]) => `primeiro as multiplicações: ${a} × ${b} = ${a! * b!} e ${c} × ${d} = ${c! * d!}; depois ${a! * b!} + ${c! * d!} = ${a! * b! + c! * d!}`,
  },
  '(a-b)/c': {
    termos: 3,
    texto: ([a, b, c]) => `(${a} − ${b}) ÷ ${c}`,
    valor: ([a, b, c]) => (a! > b! ? exact(a! - b!, c!) : null),
    ingenuo: ([a, b, c]) => {
      const q = exact(b!, c!);
      return q === null ? null : a! - q;
    },
    passos: ([a, b, c]) => `primeiro os parênteses: ${a} − ${b} = ${a! - b!}; depois ${a! - b!} ÷ ${c} = ${(a! - b!) / c!}`,
  },
};

export interface ResolvedExpression {
  formato: 'expressao';
  forma: FormaExpressao;
  termos: number[];
  resposta: number;
  ingenuo: number | null;
  vars: TemplateVars;
}

function build(forma: FormaExpressao, termos: number[]): ResolvedExpression | null {
  const f = FORMAS[forma];
  const v = f.valor(termos);
  if (v === null || !Number.isInteger(v)) return null;
  return {
    formato: 'expressao',
    forma,
    termos,
    resposta: v,
    ingenuo: f.ingenuo(termos),
    vars: { expressao: f.texto(termos), resposta: v, passos: f.passos(termos) },
  };
}

function validateOne(r: ResolvedExpression | null, max: number): string[] {
  if (!r) return ['Expressão sem resultado natural (divisão não exata ou negativo).'];
  const errs: string[] = [];
  if (r.resposta <= 0) errs.push('Resultado precisa ser maior que zero.');
  if (r.resposta > max) errs.push(`Resultado acima de ${max}.`);
  if (r.termos.some((t) => t < 1)) errs.push('Termos devem ser naturais maiores que zero.');
  if (r.termos.some((t, i) => r.forma.includes('/') && i === r.termos.length - 1 && t < 2)) errs.push('Divisor deve ser pelo menos 2.');
  return errs;
}

function combos(n: number, values: number[]): number[][] {
  if (n === 0) return [[]];
  return combos(n - 1, values).flatMap((c) => values.map((v) => [...c, v]));
}

const cache = new Map<string, ResolvedExpression[]>();

function enumerate(p: ExpressaoParams): ResolvedExpression[] {
  if (p.tipo === 'fixo') {
    const r = build(p.forma, p.termos);
    return r ? [r] : [];
  }
  const key = JSON.stringify(p);
  const hit = cache.get(key);
  if (hit) return hit;
  const out: ResolvedExpression[] = [];
  for (const t of combos(FORMAS[p.forma].termos, range(p.termo[0], p.termo[1]))) {
    const r = build(p.forma, t);
    if (r && validateOne(r, p.maxResultado).length === 0) out.push(r);
  }
  cache.set(key, out);
  return out;
}

function validate(p: ExpressaoParams): string[] {
  if (p.tipo === 'fixo') {
    if (p.termos.length !== FORMAS[p.forma].termos) return [`A forma ${p.forma} pede ${FORMAS[p.forma].termos} termos.`];
    return validateOne(build(p.forma, p.termos), 100_000);
  }
  return enumerate(p).length === 0 ? ['Modelo não gera nenhuma variação válida.'] : [];
}

function resolve(p: ExpressaoParams, rng: Rng): ResolvedExpression {
  return structuredClone(rng.pick(enumerate(p)));
}

function evaluate(r: ResolvedExpression, answer: unknown): Evaluation {
  const n = parseNatural(answer);
  if (n === null) return { status: 'invalid', message: 'Digite o resultado da expressão.' };
  if (n === r.resposta) return { status: 'correct', perSlot: [true], message: `Isso! ${r.vars.expressao} = ${r.resposta}.` };
  if (r.ingenuo !== null && n === r.ingenuo && r.ingenuo !== r.resposta) {
    return {
      status: 'incorrect',
      perSlot: [false],
      message: 'Parece que você calculou da esquerda para a direita. Lembre: primeiro o que está entre parênteses, depois multiplicação e divisão, e por último adição e subtração.',
    };
  }
  return { status: 'incorrect', perSlot: [false], message: `${n} não é o resultado. Confira a ordem das operações e tente de novo.` };
}

export const expression: FormatModule<ExpressaoParams, ResolvedExpression> = {
  resolve,
  enumerate,
  validate,
  countVariants: (p) => enumerate(p).length,
  evaluate,
};
