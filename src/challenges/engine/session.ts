import type { Desafio } from '../../content/schema';
import { evaluateResolved, fillTemplate, type Resolved } from '../formats/registry';

export { fillTemplate };

/** Nível de apoio (seção 7): muda a ajuda oferecida, nunca o ano escolar. */
export type Apoio = 'acompanhado' | 'padrao' | 'desafio';
export const APOIOS: readonly Apoio[] = ['acompanhado', 'padrao', 'desafio'];

export const SUPPORT_RULES: Record<Apoio, { maxHints: number; autoHintAfterErrors: number | null; dificuldadeDelta: number }> = {
  acompanhado: { maxHints: 3, autoHintAfterErrors: 1, dificuldadeDelta: 0 },
  padrao: { maxHints: 3, autoHintAfterErrors: null, dificuldadeDelta: 0 },
  desafio: { maxHints: 2, autoHintAfterErrors: null, dificuldadeDelta: 1 },
};

/** Dificuldade pedida ao banco: o apoio "Desafio" sobe um nível, sempre dentro do mesmo ano. */
export function dificuldadePara(base: 1 | 2 | 3, apoio: Apoio): 1 | 2 | 3 {
  return Math.min(3, Math.max(1, base + SUPPORT_RULES[apoio].dificuldadeDelta)) as 1 | 2 | 3;
}

/** Após este número de erros a explicação completa é mostrada. */
export const EXPLAIN_AFTER_ERRORS = 3;

export interface SubmitResult {
  status: 'correct' | 'incorrect' | 'invalid';
  message: string;
  /** Por espaço/máquina: true se aquela parte está certa (feedback com ícone, não só cor). */
  perSlot?: boolean[];
  explanation?: string;
  autoHint?: string;
}

/** Uma tentativa de resolver um desafio. Não conhece Phaser nem a fase em que está. */
export class ChallengeSession {
  attempts = 0;
  hintsUsed = 0;
  solved = false;

  constructor(
    readonly item: Desafio,
    readonly resolved: Resolved,
    public apoio: Apoio,
  ) {}

  get hintsLeft(): number {
    return Math.max(0, SUPPORT_RULES[this.apoio].maxHints - this.hintsUsed);
  }

  get enunciado(): string {
    return fillTemplate(this.item.enunciado.texto, this.resolved.vars);
  }

  get narracao(): string {
    return fillTemplate(this.item.enunciado.narracao ?? this.item.enunciado.texto, this.resolved.vars);
  }

  get explanation(): string {
    return fillTemplate(this.item.explicacao, this.resolved.vars);
  }

  submit(answer: unknown): SubmitResult {
    if (this.solved) return { status: 'correct', message: 'Você já resolveu este desafio!', explanation: this.explanation };

    const ev = evaluateResolved(this.resolved, answer);
    if (ev.status === 'invalid') return { status: 'invalid', message: ev.message ?? 'Complete a resposta antes de verificar.' };

    this.attempts++;
    if (ev.status === 'correct') {
      this.solved = true;
      const r: SubmitResult = { status: 'correct', message: ev.message ?? 'Muito bem!', explanation: this.explanation };
      if (ev.perSlot) r.perSlot = ev.perSlot;
      return r;
    }

    const result: SubmitResult = { status: 'incorrect', message: ev.message ?? 'Ainda não. Tente de novo.' };
    if (ev.perSlot) result.perSlot = ev.perSlot;
    const rule = SUPPORT_RULES[this.apoio].autoHintAfterErrors;
    if (rule !== null && this.attempts >= rule && this.hintsUsed === 0) {
      const hint = this.nextHint();
      if (hint) result.autoHint = hint;
    }
    if (this.attempts >= EXPLAIN_AFTER_ERRORS) result.explanation = this.explanation;
    return result;
  }

  nextHint(): string | null {
    if (this.hintsLeft === 0) return null;
    const hint = this.item.dicas[this.hintsUsed];
    if (hint === undefined) return null;
    this.hintsUsed++;
    return fillTemplate(hint, this.resolved.vars);
  }
}
