/** Pequeno ajudante para montar HTML com segurança (textContent, nunca innerHTML com conteúdo). */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> & { attrs?: Record<string, string> } = {},
  ...children: (Node | string | null | undefined | false)[]
): HTMLElementTagNameMap[K] {
  const { attrs, ...rest } = props;
  const e = Object.assign(document.createElement(tag), rest);
  if (attrs) for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  for (const c of children) if (c !== null && c !== undefined && c !== false) e.append(c);
  return e;
}

export function button(text: string, onClick: () => void, className = 'btn', attrs: Record<string, string> = {}): HTMLButtonElement {
  const b = el('button', { type: 'button', className, textContent: text, attrs });
  b.addEventListener('click', onClick);
  return b;
}

/** Mantém o Tab dentro de um contêiner (janelas modais). */
export function trapFocus(container: HTMLElement, e: KeyboardEvent): void {
  if (e.key !== 'Tab') return;
  const focusables = Array.from(
    container.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([readonly]):not([disabled]), select, textarea, [tabindex="0"]'),
  ).filter((x) => x.offsetParent !== null);
  if (focusables.length === 0) return;
  const first = focusables[0]!;
  const last = focusables[focusables.length - 1]!;
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
