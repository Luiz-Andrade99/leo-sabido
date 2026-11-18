import type { Action } from '../core/settings';
import { el } from './dom';

/** Controles de toque para tablets e celulares: botões grandes, sem gestos de precisão. */

export interface TouchTarget {
  pressVirtual(a: Action, on: boolean): void;
}

export function touchWanted(mode: 'auto' | 'sempre' | 'nunca'): boolean {
  if (mode === 'sempre') return true;
  if (mode === 'nunca') return false;
  return window.matchMedia?.('(pointer: coarse)').matches === true || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/** Troca instruções de teclado das placas pelos botões da tela (celulares e tablets). */
export function textoParaToque(t: string): string {
  return t
    .replace(/← e → \(ou A e D\)/g, '◀ e ▶')
    .replace(/com as setas/g, 'com ◀ e ▶')
    .replace(/[Aa]perte Espaço/g, (m) => (m[0] === 'A' ? 'Toque em ⤒' : 'toque em ⤒'))
    .replace(/com o Espaço/g, 'com ⤒')
    .replace(/[Aa]perte E\b/g, (m) => (m[0] === 'A' ? 'Toque no botão E' : 'toque no botão E'));
}

export function mountTouch(container: HTMLElement, target: TouchTarget): () => void {
  const make = (action: Action, label: string, text: string): HTMLButtonElement => {
    const b = el('button', { type: 'button', className: `touch-btn touch-${action}`, textContent: text, attrs: { 'aria-label': label } });
    const on = (e: PointerEvent): void => {
      e.preventDefault();
      b.classList.add('pressed');
      target.pressVirtual(action, true);
      try {
        b.setPointerCapture?.(e.pointerId);
      } catch {
        // Alguns navegadores recusam a captura; o botão continua funcionando.
      }
    };
    const off = (): void => {
      b.classList.remove('pressed');
      target.pressVirtual(action, false);
    };
    b.addEventListener('pointerdown', on);
    // Soltar fora do botão, cancelar ou perder a captura sempre solta a ação.
    b.addEventListener('pointerup', off);
    b.addEventListener('pointercancel', off);
    b.addEventListener('lostpointercapture', off);
    b.addEventListener('pointerleave', off);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    return b;
  };
  container.replaceChildren(
    el('div', { className: 'touch-left' }, make('left', 'Andar para a esquerda', '◀'), make('right', 'Andar para a direita', '▶')),
    el('div', { className: 'touch-right' }, make('interact', 'Examinar', 'E'), make('jump', 'Pular', '⤒')),
  );
  container.hidden = false;
  document.documentElement.classList.add('toque');
  return () => {
    document.documentElement.classList.remove('toque');
    container.replaceChildren();
    container.hidden = true;
  };
}
