import { audio } from '../../audio/audio';
import { button, el, trapFocus } from '../../ui/dom';
import { canSpeak, speak, stopSpeaking } from '../../ui/speech';
import type { ChallengeSession } from '../engine/session';
import { createView } from './views';

export interface ChallengeDialogOptions {
  title: string;
  /** Ano escolar: anos iniciais recebem texto maior. */
  ano: number;
  /** Mostra a faixa "conteúdo em revisão pedagógica". */
  underReview: boolean;
  /** Lê o enunciado em voz alta ao abrir. */
  narrate: boolean;
  /** Lê também as respostas do jogo (acerto, erro, dicas) — para quem ainda não lê. */
  narrateFeedback?: boolean;
  onSolved: () => void;
  onClose: () => void;
}

export interface DialogHandle {
  close(): void;
  readonly element: HTMLElement;
}

/**
 * Janela acessível comum a todos os formatos (HTML sobre o canvas):
 * foco preso, Esc fecha, Enter verifica, feedback por texto + ícone, sem limite de tempo.
 */
export function openChallengeDialog(root: HTMLElement, session: ChallengeSession, opts: ChallengeDialogOptions): DialogHandle {
  const previouslyFocused = document.activeElement as HTMLElement | null;
  const view = createView(session.resolved, () => submit());

  const header = el('div', { className: 'dlg-head' }, el('h2', { id: 'dlg-title', textContent: opts.title }));
  if (canSpeak()) header.append(button('🔊 Ouvir', () => speak(session.narracao), 'btn small', { 'aria-label': 'Ouvir a instrução' }));

  const feedback = el('p', { className: 'feedback', role: 'status', attrs: { 'aria-live': 'polite' } });
  const hintBox = el('div', { className: 'hint', attrs: { 'aria-live': 'polite' } });
  const explain = el('p', { className: 'explain', hidden: true });
  const btnHint = button('', () => {
    const h = session.nextHint();
    if (h) {
      audio.play('hint');
      addHint(h);
    }
  });
  const btnCheck = button('Verificar', () => submit(), 'btn primary');
  const btnClose = button('Voltar ao jogo', () => finish(false), 'btn ghost');
  const actions = el('div', { className: 'actions' }, btnCheck, btnHint, btnClose);

  const dialog = el(
    'section',
    { className: `dlg ano-${opts.ano}`, attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'dlg-title', 'aria-describedby': 'dlg-desc' } },
    opts.underReview ? el('p', { className: 'badge-review', textContent: 'Conteúdo em revisão pedagógica' }) : null,
    header,
    el('p', { id: 'dlg-desc', className: 'dlg-text', textContent: session.enunciado }),
    view.root,
    feedback,
    hintBox,
    explain,
    actions,
  );
  const backdrop = el('div', { className: 'dlg-backdrop' }, dialog);

  function refreshHintButton(): void {
    const left = session.hintsLeft;
    btnHint.textContent = left > 0 ? `💡 Pedir dica (${left})` : '💡 Sem dicas';
    btnHint.disabled = left === 0;
  }

  function addHint(text: string): void {
    hintBox.append(el('p', { textContent: `💡 ${text}` }));
    refreshHintButton();
    if (opts.narrateFeedback) speak(text);
  }

  function showSuccess(message: string, explanation?: string): void {
    feedback.className = 'feedback ok';
    feedback.textContent = `✓ ${message}`;
    if (explanation) {
      explain.hidden = false;
      explain.textContent = explanation;
    }
    view.lock();
    const btnContinue = button('Continuar ▶', () => finish(true), 'btn primary');
    actions.replaceChildren(btnContinue);
    btnContinue.focus();
  }

  function submit(): void {
    if (session.solved) return;
    const r = session.submit(view.getAnswer());
    view.showSlots(r.perSlot);
    if (opts.narrateFeedback) speak(r.status === 'correct' && r.explanation ? `${r.message} ${r.explanation}` : r.message);
    if (r.status === 'correct') {
      audio.play('correct');
      showSuccess(r.message, r.explanation);
      return;
    }
    if (r.status === 'incorrect') audio.play('incorrect');
    feedback.className = r.status === 'invalid' ? 'feedback warn' : 'feedback err';
    feedback.textContent = (r.status === 'invalid' ? '✎ ' : '↻ ') + r.message;
    if (r.autoHint) addHint(r.autoHint);
    if (r.explanation) {
      explain.hidden = false;
      explain.textContent = `Veja como funciona: ${r.explanation}`;
    }
    view.focusFirst();
  }

  function close(): void {
    backdrop.remove();
    stopSpeaking();
    previouslyFocused?.focus?.();
  }

  function finish(solved: boolean): void {
    close();
    if (solved || session.solved) opts.onSolved();
    else opts.onClose();
  }

  backdrop.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      e.preventDefault();
      finish(session.solved);
      return;
    }
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault();
      submit();
      return;
    }
    trapFocus(dialog, e);
  });

  refreshHintButton();
  root.append(backdrop);
  audio.play('open');
  if (session.solved) showSuccess('Você já resolveu este desafio!', session.explanation);
  else view.focusFirst();
  if (opts.narrate) speak(session.narracao);

  return { close, element: dialog };
}
