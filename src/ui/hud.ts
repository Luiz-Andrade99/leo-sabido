import type { Apoio } from '../challenges/engine/session';
import { getState } from '../core/state';
import { button, el } from './dom';

/**
 * Barra superior durante a fase: nome da fase, cristais, nível de apoio, pausa
 * e uma linha de mensagens anunciadas a leitores de tela (legendas das ações).
 */

let root: HTMLElement | null = null;
let titleEl: HTMLElement | null = null;
let crystalsEl: HTMLElement | null = null;
let vidasEl: HTMLElement | null = null;
let statusEl: HTMLElement | null = null;
let apoioSelect: HTMLSelectElement | null = null;
let pauseHandler: (() => void) | null = null;
let statusTimer: number | undefined;

export function mountHud(container: HTMLElement): void {
  root = container;
  titleEl = el('strong', { className: 'hud-title' });
  crystalsEl = el('span', { className: 'hud-crystals' });
  vidasEl = el('span', { className: 'hud-vidas', attrs: { role: 'img' } });
  apoioSelect = el(
    'select',
    { id: 'apoio' },
    el('option', { value: 'acompanhado', textContent: 'Acompanhado' }),
    el('option', { value: 'padrao', textContent: 'Padrão' }),
    el('option', { value: 'desafio', textContent: 'Desafio' }),
  );
  apoioSelect.addEventListener('change', () => {
    getState().updateSettings({ apoio: apoioSelect!.value as Apoio });
    apoioSelect!.blur(); // devolve as setas ao jogo
  });
  const pause = button('⏸ ', () => pauseHandler?.(), 'btn small hud-pause', { 'aria-label': 'Pausar (Esc)' });
  pause.append(el('span', { className: 'hud-pause-texto', textContent: 'Pausar (Esc)' }));
  statusEl = el('p', { className: 'hud-status', id: 'hud-status', role: 'status', attrs: { 'aria-live': 'polite' } });
  container.replaceChildren(
    el(
      'div',
      { className: 'hud-bar' },
      titleEl,
      crystalsEl,
      vidasEl,
      el('span', { className: 'hud-help', attrs: { 'aria-hidden': 'true' }, textContent: '← → andar · Espaço pular · E examinar · Esc pausa' }),
      el('label', { className: 'hud-apoio' }, 'Apoio ', apoioSelect),
      pause,
    ),
    statusEl,
  );
  container.hidden = true;
}

export function showHud(titulo: string, onPause: () => void): void {
  if (!root) return;
  pauseHandler = onPause;
  titleEl!.textContent = titulo;
  apoioSelect!.value = getState().settings.apoio;
  root.hidden = false;
}

export function hideHud(): void {
  if (root) root.hidden = true;
  announce('', 0);
}

export function setCrystals(n: number, total: number, icon = '◆', plural = 'cristais'): void {
  if (!crystalsEl) return;
  crystalsEl.textContent = total > 0 ? `${icon} ${n}/${total}` : '';
  crystalsEl.setAttribute('aria-label', `${n} de ${total} ${plural}`);
}

/** Vidas da fase: um número, ou Infinity no modo assistido. */
export function setVidas(n: number): void {
  if (!vidasEl) return;
  const sem = !Number.isFinite(n);
  vidasEl.textContent = `❤️ ${sem ? '∞' : n}`;
  vidasEl.setAttribute('aria-label', sem ? 'vidas sem limite' : n === 1 ? '1 vida' : `${n} vidas`);
}

export function getApoio(): Apoio {
  return getState().settings.apoio;
}

/** Mostra (e anuncia) uma mensagem curta. durationMs = 0 mantém até a próxima. */
export function announce(message: string, durationMs = 3500): void {
  if (!statusEl) return;
  window.clearTimeout(statusTimer);
  statusEl.textContent = message;
  statusEl.classList.toggle('visible', message !== '');
  if (durationMs > 0) {
    statusTimer = window.setTimeout(() => {
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.classList.remove('visible');
      }
    }, durationMs);
  }
}
