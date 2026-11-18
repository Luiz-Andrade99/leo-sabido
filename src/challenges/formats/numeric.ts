import type { Rng } from '../../core/rng';
import type { NumericoFixo, NumericoParams, Operacao } from '../../content/schema';
import { parseNatural, range, type Evaluation, type FormatModule, type TemplateVars } from './types';

/** Formato "Problema numérico": um resultado digitado (adição/subtração — EF03MA06, EF02MA06; dobro/metade — EF02MA08). */

export interface ResolvedNumeric {
  formato: 'numerico';
  operacao: Operacao;
  a: number;
  b: number;
  resposta: number;
  vars: TemplateVars;
}

export function computeAnswer(op: Operacao, a: number, b: number): number {
  switch (op) {
    case 'soma':
      return a + b;
    case 'subtracao':
      return a - b;
    case 'completar':
      return b - a;
    case 'comparar':
      return a - b;
    case 'dobro':
      return 2 * a;
    case 'metade':
      return a / 2;
    case 'multiplicacao':
      return a * b;
    case 'divisao':
      return b === 0 ? Number.NaN : a / b;
    case 'porcentagem':
      return [10, 25, 50, 75, 100].includes(a) ? (a * b) / 100 : Number.NaN;
  }
}

/** Conta escrita na ordem que a criança faria. */
function conta(op: Operacao, a: number, b: number, r: number): string {
  switch (op) {
    case 'soma':
      return `${a} + ${b} = ${r}`;
    case 'completar':
      return `${b} − ${a} = ${r}`;
    case 'dobro':
      return `${a} + ${a} = ${r}`;
    case 'metade':
      return `${r} + ${r} = ${a}`;
    case 'multiplicacao':
      return `${a} × ${b} = ${r}`;
    case 'divisao':
      return `${a} ÷ ${b} = ${r}, porque ${r} × ${b} = ${a}`;
    case 'porcentagem':
      return `${a}% de ${b} = ${r}`;
    default:
      return `${a} − ${b} = ${r}`;
  }
}

function build(op: Operacao, a: number, b: number): ResolvedNumeric {
  const resposta = computeAnswer(op, a, b);
  return { formato: 'numerico', operacao: op, a, b, resposta, vars: { a, b, resposta, conta: conta(op, a, b, resposta) } };
}

function validateFixed(p: NumericoFixo): string[] {
  const r = computeAnswer(p.operacao, p.a, p.b);
  const errs: string[] = [];
  if (!Number.isInteger(r)) {
    errs.push(
      p.operacao === 'metade' ? 'Metade de número ímpar não é um número natural.' : p.operacao === 'porcentagem' ? 'Use 10%, 25%, 50%, 75% ou 100% com resultado inteiro.' : 'Divisão não exata (ou por zero).',
    );
  }
  if (r < 0) errs.push(`Resultado negativo (${r}) não é adequado aos anos iniciais.`);
  if (r === 0) errs.push('Resultado zero torna o problema trivial.');
  if (p.operacao === 'completar' && p.b <= p.a) errs.push('Em "completar", b precisa ser maior que a.');
  return errs;
}

const cache = new Map<string, ResolvedNumeric[]>();

function enumerate(p: NumericoParams): ResolvedNumeric[] {
  if (p.tipo === 'fixo') return [build(p.operacao, p.a, p.b)];
  const key = JSON.stringify(p);
  const hit = cache.get(key);
  if (hit) return hit;
  const m = p.multiploDe ?? 1;
  const out: ResolvedNumeric[] = [];
  for (const a of range(p.a[0], p.a[1])) {
    if (a % m !== 0) continue;
    for (const b of range(p.b[0], p.b[1])) {
      if (b % m !== 0) continue;
      if (validateFixed({ tipo: 'fixo', operacao: p.operacao, a, b }).length > 0) continue;
      const r = build(p.operacao, a, b);
      if (r.resposta <= p.maxResultado) out.push(r);
    }
  }
  cache.set(key, out);
  return out;
}

function validate(p: NumericoParams): string[] {
  if (p.tipo === 'fixo') return validateFixed(p);
  return enumerate(p).length === 0 ? ['Modelo não gera nenhuma variação válida.'] : [];
}

function resolve(p: NumericoParams, rng: Rng): ResolvedNumeric {
  return structuredClone(p.tipo === 'fixo' ? build(p.operacao, p.a, p.b) : rng.pick(enumerate(p)));
}

/** Resposta: o número digitado (texto ou número). */
function evaluate(r: ResolvedNumeric, answer: unknown): Evaluation {
  const n = parseNatural(answer);
  if (n === null) return { status: 'invalid', message: 'Digite um número para responder.' };
  if (n === r.resposta) return { status: 'correct', perSlot: [true], message: 'Isso mesmo! A máquina reconheceu o número.' };
  const dir = n < r.resposta ? 'menor' : 'maior';
  return { status: 'incorrect', perSlot: [false], message: `${n} é ${dir} do que a resposta. Tente de novo.` };
}

export const numeric: FormatModule<NumericoParams, ResolvedNumeric> = {
  resolve,
  enumerate,
  validate,
  countVariants: (p) => enumerate(p).length,
  evaluate,
};
