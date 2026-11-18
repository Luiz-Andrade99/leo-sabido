import type { Rng } from '../../core/rng';

export type TemplateVars = Record<string, string | number>;

/** Resultado de avaliar uma resposta, antes de a sessão contar tentativas e dicas. */
export interface Evaluation {
  status: 'correct' | 'incorrect' | 'invalid';
  /** Por espaço/máquina: true se aquela parte está certa. */
  perSlot?: boolean[];
  /** Mensagem específica do formato (opcional; a sessão tem mensagens padrão). */
  message?: string;
}

/** Contrato comum de todo formato de desafio. P = parâmetros do conteúdo, R = desafio sorteado. */
export interface FormatModule<P, R extends { vars: TemplateVars }> {
  resolve(p: P, rng: Rng): R;
  enumerate(p: P): R[];
  /** Erros dos parâmetros (lista vazia = válido). */
  validate(p: P): string[];
  countVariants(p: P): number;
  evaluate(r: R, answer: unknown): Evaluation;
}

/** Converte texto digitado em número natural; null se não for. */
export function parseNatural(raw: unknown): number | null {
  if (typeof raw === 'number') return Number.isInteger(raw) && raw >= 0 ? raw : null;
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  return /^\d{1,7}$/.test(t) ? Number(t) : null;
}

export function range(a: number, b: number): number[] {
  return Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
}
