import { speak } from './speech';
import { button, el, trapFocus } from './dom';

/**
 * Janela gentil de vidas zeradas: sem "perdeu" nem "game over".
 * A fase recomeça do início; os desafios resolvidos continuam abertos.
 */
export function abrirRecomeco(overlay: HTMLElement, aoRecomecar: () => void): { fechar(): void } {
  const titulo = 'As vidas acabaram!';
  const texto = 'Vamos tentar de novo do começo da fase. Os desafios que você resolveu continuam abertos.';
  const fechar = (): void => backdrop.remove();
  const botao = button(
    'Recomeçar a fase',
    () => {
      fechar();
      aoRecomecar();
    },
    'btn primary',
  );
  const dialog = el(
    'div',
    { className: 'dlg recomeco', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'recomeco-titulo', 'aria-describedby': 'recomeco-texto' } },
    el('img', { src: 'assets/leo/leo-think.svg', alt: '', width: 72, height: 96, className: 'recomeco-leo' }),
    el('h2', { id: 'recomeco-titulo', textContent: titulo }),
    el('p', { id: 'recomeco-texto', className: 'dlg-text', textContent: texto }),
    el('div', { className: 'dlg-actions' }, botao),
  );
  const backdrop = el('div', { className: 'dlg-backdrop' }, dialog);
  backdrop.addEventListener('keydown', (e) => trapFocus(dialog, e));
  overlay.append(backdrop);
  botao.focus();
  speak(`${titulo} ${texto}`);
  return { fechar };
}
