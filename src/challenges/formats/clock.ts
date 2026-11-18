import type { Rng } from '../../core/rng';
import type { RelogioParams } from '../../content/schema';
import { range, type Evaluation, type FormatModule, type TemplateVars } from './types';

/**
 * Formato "Relógio": dado o início e a duração, marcar no relógio digital a hora do fim (EF02MA19).
 * Horas cheias e "e meia", entre 6:00 e 22:00.
 */

export const MIN_INICIO = 6 * 60;
export const MAX_FIM = 22 * 60;
export const PASSO_MIN = 30;

export interface ResolvedClock {
  formato: 'relogio';
  inicio: number;
  duracao: number;
  fim: number;
  vars: TemplateVars;
}

export function fmtHora(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

export function fmtDuracao(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const hs = h === 0 ? '' : h === 1 ? '1 hora' : `${h} horas`;
  const ms = m === 0 ? '' : `${m} minutos`;
  return [hs, ms].filter(Boolean).join(' e ');
}

function parseHora(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return h! * 60 + m!;
}

function build(inicio: number, duracao: number): ResolvedClock {
  const fim = inicio + duracao;
  return {
    formato: 'relogio',
    inicio,
    duracao,
    fim,
    vars: { inicio: fmtHora(inicio), fim: fmtHora(fim), duracao: fmtDuracao(duracao) },
  };
}

function validatePair(inicio: number, duracao: number): string[] {
  const errs: string[] = [];
  if (inicio % PASSO_MIN !== 0 || duracao % PASSO_MIN !== 0) errs.push('Use horas cheias ou "e meia" (múltiplos de 30 minutos).');
  if (duracao < 30 || duracao > 300) errs.push('Duração entre 30 minutos e 5 horas.');
  if (inicio < MIN_INICIO || inicio + duracao > MAX_FIM) errs.push('O intervalo precisa ficar entre 06:00 e 22:00.');
  return errs;
}

function enumerate(p: RelogioParams): ResolvedClock[] {
  if (p.tipo === 'fixo') return [build(parseHora(p.inicio), p.duracaoMin)];
  const out: ResolvedClock[] = [];
  for (const h of range(p.horaInicio[0], p.horaInicio[1])) {
    for (const m of p.meiaHora ? [0, 30] : [0]) {
      for (const d of p.duracoesMin) if (validatePair(h * 60 + m, d).length === 0) out.push(build(h * 60 + m, d));
    }
  }
  return out;
}

function validate(p: RelogioParams): string[] {
  if (p.tipo === 'fixo') return validatePair(parseHora(p.inicio), p.duracaoMin);
  return enumerate(p).length === 0 ? ['Modelo não gera nenhuma variação válida.'] : [];
}

function resolve(p: RelogioParams, rng: Rng): ResolvedClock {
  return structuredClone(rng.pick(enumerate(p)));
}

/** Resposta: [horas, minutos]. */
function evaluate(r: ResolvedClock, answer: unknown): Evaluation {
  if (!Array.isArray(answer) || answer.length !== 2 || answer.some((n) => !Number.isInteger(n) || n < 0)) {
    return { status: 'invalid', message: 'Ajuste as horas e os minutos no relógio.' };
  }
  const [h, m] = answer as [number, number];
  if (h > 23 || m > 59) return { status: 'invalid', message: 'Ajuste as horas e os minutos no relógio.' };
  const t = h * 60 + m;
  if (t === r.fim) return { status: 'correct', message: `Isso! Das ${fmtHora(r.inicio)} até as ${fmtHora(t)} passam ${fmtDuracao(r.duracao)}.` };
  if (t <= r.inicio) return { status: 'incorrect', message: `${fmtHora(t)} é antes do começo (${fmtHora(r.inicio)}). O fim vem depois!` };
  const diff = t < r.fim ? `ainda faltam ${fmtDuracao(r.fim - t)}` : `passou ${fmtDuracao(t - r.fim)}`;
  return { status: 'incorrect', message: `Das ${fmtHora(r.inicio)} até ${fmtHora(t)} passam ${fmtDuracao(t - r.inicio)}: ${diff}.` };
}

export const clock: FormatModule<RelogioParams, ResolvedClock> = {
  resolve,
  enumerate,
  validate,
  countVariants: (p) => enumerate(p).length,
  evaluate,
};
