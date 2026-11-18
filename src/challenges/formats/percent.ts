import type { Rng } from '../../core/rng';
import type { PorcentagemParams } from '../../content/schema';
import { range, type Evaluation, type FormatModule, type TemplateVars } from './types';

/**
 * Formato "Porcentagem": carregar o medidor de energia até a porcentagem pedida (EF05MA06).
 * Usa só 10%, 25%, 50%, 75% e 100%, associadas a décima parte, quarta parte, metade, três quartos e inteiro.
 */

export const PORCENTAGENS = [10, 25, 50, 75, 100] as const;
export const MAX_TOTAL_ENERGIA = 200;

const PARTE: Record<number, string> = {
  10: 'a décima parte (dividir por 10)',
  25: 'a quarta parte (dividir por 4)',
  50: 'a metade (dividir por 2)',
  75: 'três quartos (dividir por 4 e multiplicar por 3)',
  100: 'o inteiro (tudo)',
};

export interface ResolvedPercent {
  formato: 'porcentagem';
  total: number;
  porcentagem: number;
  resposta: number;
  vars: TemplateVars;
}

function build(total: number, porcentagem: number): ResolvedPercent {
  const resposta = (total * porcentagem) / 100;
  return { formato: 'porcentagem', total, porcentagem, resposta, vars: { total, porcentagem, resposta, parte: PARTE[porcentagem] ?? '' } };
}

function validatePair(total: number, p: number): string[] {
  const errs: string[] = [];
  if (!(PORCENTAGENS as readonly number[]).includes(p)) errs.push('Use 10%, 25%, 50%, 75% ou 100%.');
  if (total < 4 || total > MAX_TOTAL_ENERGIA) errs.push(`Total de 4 a ${MAX_TOTAL_ENERGIA}.`);
  if (!Number.isInteger((total * p) / 100)) errs.push('A porcentagem precisa dar um número inteiro.');
  return errs;
}

function enumerate(p: PorcentagemParams): ResolvedPercent[] {
  if (p.tipo === 'fixo') return [build(p.total, p.porcentagem)];
  const m = p.multiploDe ?? 1;
  const out: ResolvedPercent[] = [];
  for (const total of range(p.total[0], p.total[1])) {
    if (total % m !== 0) continue;
    for (const pc of p.porcentagens) if (validatePair(total, pc).length === 0) out.push(build(total, pc));
  }
  return out;
}

function validate(p: PorcentagemParams): string[] {
  if (p.tipo === 'fixo') return validatePair(p.total, p.porcentagem);
  return enumerate(p).length === 0 ? ['Modelo não gera nenhuma variação válida.'] : [];
}

function resolve(p: PorcentagemParams, rng: Rng): ResolvedPercent {
  return structuredClone(rng.pick(enumerate(p)));
}

/** Resposta: a carga marcada no medidor. */
function evaluate(r: ResolvedPercent, answer: unknown): Evaluation {
  if (typeof answer !== 'number' || !Number.isInteger(answer) || answer < 0 || answer > r.total) {
    return { status: 'invalid', message: 'Use os botões para carregar o medidor.' };
  }
  if (answer === 0) return { status: 'invalid', message: 'Use os botões para carregar o medidor.' };
  if (answer === r.resposta) return { status: 'correct', perSlot: [true], message: `Isso! ${r.porcentagem}% de ${r.total} são ${r.resposta}.` };
  const diff = answer < r.resposta ? `faltam ${r.resposta - answer}` : `passou ${answer - r.resposta}`;
  return { status: 'incorrect', perSlot: [false], message: `Você carregou ${answer} de ${r.total}. Para ${r.porcentagem}%, ${diff}.` };
}

export const percent: FormatModule<PorcentagemParams, ResolvedPercent> = {
  resolve,
  enumerate,
  validate,
  countVariants: (p) => enumerate(p).length,
  evaluate,
};
