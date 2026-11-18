import type { Rng } from '../../core/rng';
import type { IgualdadeParams, OpIgualdade } from '../../content/schema';
import { parseNatural, range, type Evaluation, type FormatModule, type TemplateVars } from './types';

/**
 * Formato "Igualdade": descobrir o número que torna a igualdade verdadeira (EF04MA15),
 * usando as relações inversas entre as operações (EF04MA13).
 */

const SIMBOLO: Record<OpIgualdade, string> = { '+': '+', '-': '−', x: '×', '/': '÷' };
const INVERSA: Record<OpIgualdade, string> = { '+': '−', '-': '+', x: '÷', '/': '×' };

export interface ResolvedEquality {
  formato: 'igualdade';
  op: OpIgualdade;
  a: number;
  b: number;
  c: number;
  lacuna: 'a' | 'b';
  resposta: number;
  vars: TemplateVars;
}

function result(op: OpIgualdade, a: number, b: number): number {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case 'x':
      return a * b;
    case '/':
      return b === 0 ? Number.NaN : a / b;
  }
}

/** Conta inversa que revela a lacuna, escrita como a criança faria. */
function inversa(op: OpIgualdade, a: number, b: number, c: number, lacuna: 'a' | 'b'): string {
  if (lacuna === 'a') {
    // □ op b = c  →  □ = c inv b
    return `${c} ${INVERSA[op]} ${b} = ${a}`;
  }
  // a op □ = c
  if (op === '+' || op === 'x') return `${c} ${INVERSA[op]} ${a} = ${b}`;
  // a − □ = c → □ = a − c ;  a ÷ □ = c → □ = a ÷ c
  return `${a} ${SIMBOLO[op]} ${c} = ${b}`;
}

function build(op: OpIgualdade, a: number, b: number, lacuna: 'a' | 'b'): ResolvedEquality {
  const c = result(op, a, b);
  const resposta = lacuna === 'a' ? a : b;
  const left = lacuna === 'a' ? `□ ${SIMBOLO[op]} ${b}` : `${a} ${SIMBOLO[op]} □`;
  return {
    formato: 'igualdade',
    op,
    a,
    b,
    c,
    lacuna,
    resposta,
    vars: { expressao: `${left} = ${c}`, conta: `${a} ${SIMBOLO[op]} ${b} = ${c}`, inversa: inversa(op, a, b, c, lacuna), resposta, c },
  };
}

function validateTriple(op: OpIgualdade, a: number, b: number, max: number): string[] {
  const c = result(op, a, b);
  const errs: string[] = [];
  if (!Number.isInteger(c)) errs.push('Divisão não exata (ou por zero).');
  if (c <= 0) errs.push('O resultado precisa ser maior que zero.');
  if (c > max) errs.push(`Resultado acima de ${max}.`);
  if ((op === 'x' || op === '/') && (a < 1 || b < 2)) errs.push('Multiplicação/divisão com fatores de pelo menos 1 e 2.');
  return errs;
}

const cache = new Map<string, ResolvedEquality[]>();

function enumerate(p: IgualdadeParams): ResolvedEquality[] {
  if (p.tipo === 'fixo') return [build(p.op, p.a, p.b, p.lacuna)];
  const key = JSON.stringify(p);
  const hit = cache.get(key);
  if (hit) return hit;
  const out: ResolvedEquality[] = [];
  for (const a of range(p.a[0], p.a[1])) {
    for (const b of range(p.b[0], p.b[1])) if (validateTriple(p.op, a, b, p.maxResultado).length === 0) out.push(build(p.op, a, b, p.lacuna));
  }
  cache.set(key, out);
  return out;
}

function validate(p: IgualdadeParams): string[] {
  if (p.tipo === 'fixo') return validateTriple(p.op, p.a, p.b, 100_000);
  return enumerate(p).length === 0 ? ['Modelo não gera nenhuma variação válida.'] : [];
}

function resolve(p: IgualdadeParams, rng: Rng): ResolvedEquality {
  return structuredClone(rng.pick(enumerate(p)));
}

function evaluate(r: ResolvedEquality, answer: unknown): Evaluation {
  const n = parseNatural(answer);
  if (n === null) return { status: 'invalid', message: 'Digite o número que falta.' };
  if (n === r.resposta) return { status: 'correct', perSlot: [true], message: `Isso! ${r.vars.conta} é verdade.` };
  const got = r.lacuna === 'a' ? result(r.op, n, r.b) : result(r.op, r.a, n);
  const shown = Number.isInteger(got) ? String(got) : 'um número que não é inteiro';
  return {
    status: 'incorrect',
    perSlot: [false],
    message: `Com ${n} no lugar do □, o resultado seria ${shown}, e não ${r.c}. Tente de novo.`,
  };
}

export const equality: FormatModule<IgualdadeParams, ResolvedEquality> = {
  resolve,
  enumerate,
  validate,
  countVariants: (p) => enumerate(p).length,
  evaluate,
};
