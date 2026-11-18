import type { ResolvedArea } from '../formats/area';
import type { ResolvedArray } from '../formats/array';
import type { ResolvedDecimal } from '../formats/decimal';
import type { ResolvedDivisibility } from '../formats/divisibility';
import type { ResolvedExpression } from '../formats/expression';
import type { ResolvedProgram } from '../formats/program';
import type { ResolvedPercent } from '../formats/percent';
import type { ResolvedChart } from '../formats/chart';
import { ICONES, NOME_FORMA, type ResolvedChoice } from '../formats/choice';
import type { ResolvedOrder } from '../formats/order';
import type { Icone } from '../../content/schema';
import type { ResolvedEquality } from '../formats/equality';
import type { ResolvedFraction } from '../formats/fraction';
import { fmtHora, PASSO_MIN, type ResolvedClock } from '../formats/clock';
import type { ResolvedDistribute } from '../formats/distribute';
import { MAX_POR_VALOR, formatReais, type ResolvedMoney } from '../formats/money';
import { MAX_PECAS, type ResolvedPlace } from '../formats/place';
import type { Resolved } from '../formats/registry';
import type { ResolvedSequence } from '../formats/sequence';
import { el } from '../../ui/dom';

/** Parte específica de cada formato dentro da janela de desafio. */
export interface ChallengeView {
  readonly root: HTMLElement;
  getAnswer(): unknown;
  /** Marca ✓/✗ por espaço/máquina. */
  showSlots(perSlot: boolean[] | undefined): void;
  lock(): void;
  focusFirst(): void;
}

function mark(): HTMLSpanElement {
  return el('span', { className: 'mark', attrs: { 'aria-hidden': 'true' } });
}

function setMark(m: HTMLSpanElement, ok: boolean): void {
  m.textContent = ok ? '✓' : '✗';
  m.className = ok ? 'mark ok' : 'mark err';
}

// ---------- Sequência ----------
function sequenceView(r: ResolvedSequence): ChallengeView {
  const gapCount = r.valores.filter((v) => v === null).length;
  const inputs: HTMLInputElement[] = [];
  const marks: HTMLSpanElement[] = [];
  const list = el('ol', { className: 'seq', attrs: { 'aria-label': `Sequência com ${r.valores.length} pedras e ${gapCount} espaços vazios` } });
  r.valores.forEach((v, i) => {
    const li = el('li', { className: v === null ? 'stone gap' : 'stone' });
    if (v === null) {
      const input = el('input', {
        type: 'text',
        inputMode: 'numeric',
        autocomplete: 'off',
        maxLength: 5,
        className: 'gap-input',
        attrs: { 'aria-label': `Espaço ${inputs.length + 1} de ${gapCount}, posição ${i + 1} da sequência`, pattern: '-?[0-9]*' },
      });
      const m = mark();
      inputs.push(input);
      marks.push(m);
      li.append(input, m);
    } else {
      li.append(el('span', { textContent: String(v) }));
    }
    list.append(li);
  });
  return {
    root: list,
    getAnswer: () => inputs.map((i) => i.value),
    showSlots: (perSlot) =>
      perSlot?.forEach((ok, k) => {
        inputs[k]!.classList.toggle('ok', ok);
        inputs[k]!.classList.toggle('err', !ok);
        inputs[k]!.setAttribute('aria-invalid', String(!ok));
        setMark(marks[k]!, ok);
      }),
    lock: () => inputs.forEach((i) => (i.readOnly = true)),
    focusFirst: () => (inputs.find((i) => i.value.trim() === '' || i.classList.contains('err')) ?? inputs[0])?.focus(),
  };
}

// ---------- Problema numérico ----------
function numericView(): ChallengeView {
  const input = el('input', {
    type: 'text',
    inputMode: 'numeric',
    autocomplete: 'off',
    maxLength: 7,
    className: 'answer-input',
    id: 'resposta-numerica',
    attrs: { pattern: '[0-9]*' },
  });
  const m = mark();
  const root = el('div', { className: 'numeric' }, el('label', { htmlFor: 'resposta-numerica', textContent: 'Sua resposta:' }), el('span', { className: 'answer-wrap' }, input, m));
  return {
    root,
    getAnswer: () => input.value,
    showSlots: (perSlot) => {
      const ok = perSlot?.[0];
      if (ok === undefined) return;
      input.classList.toggle('ok', ok);
      input.classList.toggle('err', !ok);
      input.setAttribute('aria-invalid', String(!ok));
      setMark(m, ok);
    },
    lock: () => (input.readOnly = true),
    focusFirst: () => {
      input.focus();
      input.select();
    },
  };
}

// ---------- Distribuir ----------
function gems(n: number): string {
  return '◆'.repeat(n);
}

function distributeView(r: ResolvedDistribute): ChallengeView {
  const counts = Array<number>(r.grupos).fill(0);
  const remaining = (): number => r.total - counts.reduce((s, n) => s + n, 0);
  const poolCount = el('strong', { className: 'pool-count' });
  const poolGems = el('span', { className: 'gems', attrs: { 'aria-hidden': 'true' } });
  const pool = el('p', { className: 'dist-pool' }, 'Cristais fora das máquinas: ', poolCount, ' ', poolGems);
  const live = el('p', { className: 'sr-only', attrs: { 'aria-live': 'polite' } });
  const machines = el('ul', { className: 'machines', attrs: { 'aria-label': `${r.grupos} máquinas` } });
  const marks: HTMLSpanElement[] = [];
  const views: { count: HTMLElement; g: HTMLElement; minus: HTMLButtonElement; plus: HTMLButtonElement; card: HTMLElement }[] = [];
  let locked = false;

  const refresh = (): void => {
    const left = remaining();
    poolCount.textContent = String(left);
    poolGems.textContent = gems(left);
    views.forEach((v, i) => {
      const n = counts[i]!;
      v.count.textContent = `${n} ${n === 1 ? 'cristal' : 'cristais'}`;
      v.g.textContent = gems(n);
      v.minus.disabled = locked || n === 0;
      v.plus.disabled = locked || left === 0 || n >= 10;
      v.minus.setAttribute('aria-label', `Tirar um cristal da máquina ${i + 1} (tem ${n})`);
      v.plus.setAttribute('aria-label', `Colocar um cristal na máquina ${i + 1} (tem ${n})`);
    });
  };

  for (let i = 0; i < r.grupos; i++) {
    const count = el('p', { className: 'count' });
    const g = el('p', { className: 'gems', attrs: { 'aria-hidden': 'true' } });
    const change = (d: number): void => {
      counts[i] = Math.max(0, counts[i]! + d);
      views.forEach((v) => v.card.classList.remove('ok', 'err'));
      marks.forEach((m) => (m.className = 'mark'));
      refresh();
      live.textContent = `Máquina ${i + 1}: ${counts[i]}. Fora das máquinas: ${remaining()}.`;
    };
    const minus = el('button', { type: 'button', className: 'btn small', textContent: '−' });
    const plus = el('button', { type: 'button', className: 'btn small', textContent: '+' });
    minus.addEventListener('click', () => change(-1));
    plus.addEventListener('click', () => change(+1));
    const m = mark();
    marks.push(m);
    const card = el('li', { className: 'machine' }, el('h3', { textContent: `Máquina ${i + 1}` }), g, count, el('div', { className: 'ctrl' }, minus, plus), m);
    views.push({ count, g, minus, plus, card });
    machines.append(card);
  }
  refresh();
  const root = el('div', { className: 'dist' }, pool, machines, live, el('p', { className: 'note', textContent: 'Os cristais que ficarem de fora vão para o cesto de sobras.' }));
  return {
    root,
    getAnswer: () => [...counts],
    showSlots: (perSlot) =>
      perSlot?.forEach((ok, k) => {
        views[k]!.card.classList.toggle('ok', ok);
        views[k]!.card.classList.toggle('err', !ok);
        setMark(marks[k]!, ok);
      }),
    lock: () => {
      locked = true;
      refresh();
    },
    focusFirst: () => views[0]?.plus.focus(),
  };
}

// ---------- Arranjo retangular ----------
function arrayView(r: ResolvedArray): ChallengeView {
  let cols = 1;
  let locked = false;
  const out = el('output', { className: 'arr-count', attrs: { 'aria-live': 'polite' } });
  const grid = el('div', { className: 'arr-grid', attrs: { role: 'img' } });
  const minus = el('button', { type: 'button', className: 'btn small', textContent: '−', attrs: { 'aria-label': 'Um bloco a menos por linha' } });
  const plus = el('button', { type: 'button', className: 'btn small', textContent: '+', attrs: { 'aria-label': 'Um bloco a mais por linha' } });
  const m = mark();
  const refresh = (): void => {
    out.textContent = `${cols} ${cols === 1 ? 'bloco' : 'blocos'} por linha`;
    minus.disabled = locked || cols <= 1;
    plus.disabled = locked || cols >= 10;
    grid.style.gridTemplateColumns = `repeat(${cols}, var(--block))`;
    grid.replaceChildren(...Array.from({ length: r.linhas * cols }, () => el('span', { className: 'block' })));
    grid.setAttribute('aria-label', `Plataforma com ${r.linhas} linhas de ${cols} ${cols === 1 ? 'bloco' : 'blocos'}`);
    grid.classList.remove('ok', 'err');
    m.className = 'mark';
  };
  minus.addEventListener('click', () => {
    cols = Math.max(1, cols - 1);
    refresh();
  });
  plus.addEventListener('click', () => {
    cols = Math.min(10, cols + 1);
    refresh();
  });
  refresh();
  const root = el(
    'div',
    { className: 'arr' },
    el('p', { className: 'arr-info', textContent: `Linhas: ${r.linhas} · Blocos pedidos: ${r.total}` }),
    el('div', { className: 'arr-ctrl' }, minus, out, plus),
    el('div', { className: 'arr-wrap' }, grid, m),
  );
  return {
    root,
    getAnswer: () => cols,
    showSlots: (perSlot) => {
      const ok = perSlot?.[0];
      if (ok === undefined) return;
      grid.classList.toggle('ok', ok);
      grid.classList.toggle('err', !ok);
      setMark(m, ok);
    },
    lock: () => {
      locked = true;
      minus.disabled = true;
      plus.disabled = true;
    },
    focusFirst: () => (plus.disabled ? minus : plus).focus(),
  };
}

// ---------- Contador genérico (− valor +) usado pelos formatos de montar ----------
interface Counter {
  root: HTMLElement;
  value: () => number;
  set: (n: number) => void;
  lock: () => void;
  plus: HTMLButtonElement;
}

function counter(o: {
  title: string;
  visual: (n: number) => HTMLElement;
  countText: (n: number) => string;
  plusLabel: (n: number) => string;
  minusLabel: (n: number) => string;
  max: number;
  className: string;
  onChange: () => void;
}): Counter {
  let n = 0;
  let locked = false;
  const vis = el('div', { className: 'piece-visual', attrs: { 'aria-hidden': 'true' } });
  const count = el('p', { className: 'count' });
  const minus = el('button', { type: 'button', className: 'btn small', textContent: '−' });
  const plus = el('button', { type: 'button', className: 'btn small', textContent: '+' });
  const refresh = (): void => {
    vis.replaceChildren(o.visual(n));
    count.textContent = o.countText(n);
    minus.disabled = locked || n === 0;
    plus.disabled = locked || n >= o.max;
    minus.setAttribute('aria-label', o.minusLabel(n));
    plus.setAttribute('aria-label', o.plusLabel(n));
  };
  minus.addEventListener('click', () => {
    n = Math.max(0, n - 1);
    refresh();
    o.onChange();
  });
  plus.addEventListener('click', () => {
    n = Math.min(o.max, n + 1);
    refresh();
    o.onChange();
  });
  refresh();
  return {
    root: el('li', { className: `piece ${o.className}` }, el('h3', { textContent: o.title }), vis, count, el('div', { className: 'ctrl' }, minus, plus)),
    value: () => n,
    set: (v) => {
      n = v;
      refresh();
    },
    lock: () => {
      locked = true;
      refresh();
    },
    plus,
  };
}

function repeat(n: number, cls: string, max = 12): HTMLElement {
  const box = el('span', { className: 'pieces' });
  for (let i = 0; i < Math.min(n, max); i++) box.append(el('span', { className: cls }));
  if (n > max) box.append(el('span', { className: 'more', textContent: `+${n - max}` }));
  return box;
}

// ---------- Valor posicional ----------
function placeView(r: ResolvedPlace): ChallengeView {
  const live = el('p', { className: 'sr-only', attrs: { 'aria-live': 'polite' } });
  const parts: Counter[] = [];
  const ordens = [
    ['Centenas', 'centena', 'centenas', 'p-cent', 100],
    ['Dezenas', 'dezena', 'dezenas', 'p-dez', 10],
    ['Unidades', 'unidade', 'unidades', 'p-uni', 1],
  ] as const;
  const result = el('p', { className: 'msg-slot' });
  for (const [title, sing, plur, cls] of ordens) {
    const c = counter({
      title,
      className: cls,
      max: MAX_PECAS,
      visual: (n) => repeat(n, `blk ${cls}`, 10),
      countText: (n) => `${n} ${n === 1 ? sing : plur}`,
      plusLabel: (n) => `Uma ${sing} a mais (tem ${n})`,
      minusLabel: (n) => `Uma ${sing} a menos (tem ${n})`,
      onChange: () => {
        result.textContent = '';
        live.textContent = parts.map((p, i) => `${p.value()} ${ordens[i]![2]}`).join(', ');
      },
    });
    parts.push(c);
  }
  const root = el(
    'div',
    { className: 'place' },
    el('p', { className: 'target', textContent: `Número pedido: ${r.numero}` }),
    el('ul', { className: 'pieces-row', attrs: { 'aria-label': 'Peças para montar o número' } }, ...parts.map((p) => p.root)),
    live,
    result,
  );
  return {
    root,
    getAnswer: () => parts.map((p) => p.value()),
    showSlots: () => undefined,
    lock: () => parts.forEach((p) => p.lock()),
    focusFirst: () => parts[0]!.plus.focus(),
  };
}

// ---------- Dinheiro ----------
function moneyVisual(v: number, n: number): HTMLElement {
  const box = el('span', { className: 'pieces' });
  for (let i = 0; i < Math.min(n, 6); i++) box.append(el('span', { className: v === 1 ? 'coin' : `note n${v}`, textContent: String(v) }));
  if (n > 6) box.append(el('span', { className: 'more', textContent: `+${n - 6}` }));
  return box;
}

function moneyView(r: ResolvedMoney): ChallengeView {
  const live = el('p', { className: 'sr-only', attrs: { 'aria-live': 'polite' } });
  const parts: Counter[] = r.notas.map((v) => {
    const kind = v === 1 ? 'moeda' : 'cédula';
    return counter({
      title: `${kind === 'moeda' ? 'Moeda' : 'Cédula'} de ${formatReais(v)}`,
      className: v === 1 ? 'm-coin' : 'm-note',
      max: MAX_POR_VALOR,
      visual: (n) => moneyVisual(v, n),
      countText: (n) => `× ${n}`,
      plusLabel: (n) => `Pôr uma ${kind} de ${formatReais(v)} (tem ${n})`,
      minusLabel: (n) => `Tirar uma ${kind} de ${formatReais(v)} (tem ${n})`,
      onChange: () => {
        live.textContent = parts
          .map((p, i) => (p.value() > 0 ? `${p.value()} de ${formatReais(r.notas[i]!)}` : ''))
          .filter(Boolean)
          .join(', ');
      },
    });
  });
  const root = el(
    'div',
    { className: 'money' },
    el('p', { className: 'target', textContent: `A máquina pede: ${formatReais(r.valor)}` }),
    el('ul', { className: 'pieces-row', attrs: { 'aria-label': 'Moedas e cédulas' } }, ...parts.map((p) => p.root)),
    live,
    el('p', { className: 'note-text', textContent: 'As cédulas do jogo são ilustrações; não são as cédulas reais.' }),
  );
  return {
    root,
    getAnswer: () => parts.map((p) => p.value()),
    showSlots: () => undefined,
    lock: () => parts.forEach((p) => p.lock()),
    focusFirst: () => parts[0]!.plus.focus(),
  };
}

// ---------- Relógio digital ----------
function clockView(r: ResolvedClock): ChallengeView {
  let t = r.inicio;
  let locked = false;
  const display = el('output', { className: 'clock-face', attrs: { 'aria-live': 'polite', 'aria-label': 'Horário marcado' } });
  const m = mark();
  const mk = (text: string, delta: number): HTMLButtonElement => {
    const b = el('button', { type: 'button', className: 'btn small', textContent: text });
    b.addEventListener('click', () => {
      t = Math.min(23 * 60 + 30, Math.max(0, t + delta));
      refresh();
    });
    return b;
  };
  const hPlus = mk('Mais 1 hora', 60);
  const hMinus = mk('Menos 1 hora', -60);
  const mPlus = mk(`Mais ${PASSO_MIN} min`, PASSO_MIN);
  const mMinus = mk(`Menos ${PASSO_MIN} min`, -PASSO_MIN);
  const refresh = (): void => {
    display.textContent = fmtHora(t);
    for (const b of [hPlus, hMinus, mPlus, mMinus]) b.disabled = locked;
    m.className = 'mark';
    display.classList.remove('ok', 'err');
  };
  refresh();
  const root = el(
    'div',
    { className: 'clock' },
    el('p', { className: 'target' }, 'Começa às ', el('strong', { className: 'clock-start', textContent: fmtHora(r.inicio) })),
    el('div', { className: 'clock-wrap' }, display, m),
    el('div', { className: 'clock-ctrl' }, hMinus, hPlus, mMinus, mPlus),
  );
  return {
    root,
    getAnswer: () => [Math.floor(t / 60), t % 60],
    showSlots: (perSlot) => {
      const ok = perSlot?.[0];
      if (ok === undefined) return;
      display.classList.toggle('ok', ok);
      display.classList.toggle('err', !ok);
      setMark(m, ok);
    },
    lock: () => {
      locked = true;
      refresh();
    },
    focusFirst: () => hPlus.focus(),
  };
}

// ---------- Fração: ponte em partes iguais ----------
function fractionView(r: ResolvedFraction): ChallengeView {
  const selected = Array<boolean>(r.partes).fill(false);
  let locked = false;
  const count = el('p', { className: 'frac-count', attrs: { 'aria-live': 'polite' } });
  const m = mark();
  const bar = el('div', { className: 'frac-bar', attrs: { role: 'group', 'aria-label': `Ponte com ${r.partes} partes iguais` } });
  const refresh = (): void => {
    const n = selected.filter(Boolean).length;
    count.textContent = `Partes marcadas: ${n} de ${r.partes}`;
    bar.classList.remove('ok', 'err');
    m.className = 'mark';
  };
  const buttons = selected.map((_, i) => {
    const b = el('button', { type: 'button', className: 'frac-part', attrs: { 'aria-pressed': 'false', 'aria-label': `Parte ${i + 1}` } });
    b.addEventListener('click', () => {
      if (locked) return;
      selected[i] = !selected[i];
      b.setAttribute('aria-pressed', String(selected[i]));
      refresh();
    });
    bar.append(b);
    return b;
  });
  refresh();
  return {
    root: el(
      'div',
      { className: 'frac' },
      el('p', { className: 'target', textContent: `Marque ${r.numerador}/${r.denominador} das ${r.partes} partes` }),
      el('div', { className: 'frac-wrap' }, bar, m),
      count,
    ),
    getAnswer: () => selected.filter(Boolean).length,
    showSlots: (perSlot) => {
      const ok = perSlot?.[0];
      if (ok === undefined) return;
      bar.classList.toggle('ok', ok);
      bar.classList.toggle('err', !ok);
      setMark(m, ok);
    },
    lock: () => {
      locked = true;
      buttons.forEach((b) => (b.disabled = true));
    },
    focusFirst: () => buttons[0]?.focus(),
  };
}

// ---------- Gráfico de colunas ----------
const SVG_NS = 'http://www.w3.org/2000/svg';
function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, text?: string): SVGElementTagNameMap[K] {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (text !== undefined) e.textContent = text;
  return e;
}

let chartCount = 0;
function chartView(r: ResolvedChart): ChallengeView {
  const W = 440;
  const H = 250;
  const L = 44;
  const B = 36;
  const T = 14;
  const maxVal = Math.max(...r.dados.map((d) => d.valor));
  const rawLines = Math.max(5, Math.ceil(maxVal / r.passo));
  const labelEvery = rawLines > 10 ? 2 : 1;
  // O topo do eixo sempre cai numa linha com número.
  const lines = Math.ceil(rawLines / labelEvery) * labelEvery;
  const top = lines * r.passo;
  const y = (v: number): number => H - B - ((H - B - T) * v) / top;
  const id = `grafico-${++chartCount}`;
  const chartSvg = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart-svg', role: 'img', 'aria-labelledby': `${id}-t` });
  chartSvg.append(svg('title', { id: `${id}-t` }, `Gráfico de colunas: ${r.titulo}. Os valores também estão na tabela a seguir.`));
  for (let i = 0; i <= lines; i++) {
    const v = i * r.passo;
    chartSvg.append(svg('line', { x1: L, x2: W - 8, y1: y(v), y2: y(v), class: i === 0 ? 'axis' : 'grid' }));
    if (i % labelEvery === 0) chartSvg.append(svg('text', { x: L - 6, y: y(v) + 4, class: 'tick', 'text-anchor': 'end' }, String(v)));
  }
  const slot = (W - L - 16) / r.dados.length;
  r.dados.forEach((d, i) => {
    const bw = Math.min(54, slot * 0.6);
    const x = L + 8 + i * slot + (slot - bw) / 2;
    chartSvg.append(svg('rect', { x, y: y(d.valor), width: bw, height: Math.max(0, y(0) - y(d.valor)), class: 'bar', rx: 3 }));
    chartSvg.append(svg('text', { x: x + bw / 2, y: H - B + 18, class: 'bar-label', 'text-anchor': 'middle' }, d.rotulo));
  });
  const table = el(
    'table',
    { className: 'sr-only' },
    el('caption', { textContent: `${r.titulo} (${r.unidade})` }),
    el('thead', {}, el('tr', {}, el('th', { scope: 'col', textContent: 'Item' }), el('th', { scope: 'col', textContent: 'Quantidade' }))),
    el('tbody', {}, ...r.dados.map((d) => el('tr', {}, el('th', { scope: 'row', textContent: d.rotulo }), el('td', { textContent: String(d.valor) })))),
  );
  const num = numericView();
  return {
    root: el(
      'div',
      { className: 'chart' },
      el('p', { className: 'chart-title', textContent: `${r.titulo} (${r.unidade})` }),
      el('div', { className: 'chart-box' }, chartSvg),
      table,
      num.root,
    ),
    getAnswer: num.getAnswer,
    showSlots: num.showSlots,
    lock: num.lock,
    focusFirst: num.focusFirst,
  };
}

// ---------- Igualdade com lacuna ----------
const EQ_SYMBOL = { '+': '+', '-': '−', x: '×', '/': '÷' } as const;
function equalityView(r: ResolvedEquality): ChallengeView {
  const input = el('input', {
    type: 'text',
    inputMode: 'numeric',
    autocomplete: 'off',
    maxLength: 5,
    className: 'gap-input eq-input',
    attrs: { 'aria-label': 'Número que falta', pattern: '[0-9]*' },
  });
  const m = mark();
  const box = el('span', { className: 'stone gap eq-gap' }, input, m);
  const n = (v: number): HTMLElement => el('span', { className: 'eq-num', textContent: String(v) });
  const eq = el(
    'p',
    { className: 'eq' },
    r.lacuna === 'a' ? box : n(r.a),
    el('span', { className: 'eq-op', textContent: EQ_SYMBOL[r.op] }),
    r.lacuna === 'b' ? box : n(r.b),
    el('span', { className: 'eq-op', textContent: '=' }),
    n(r.c),
  );
  return {
    root: el('div', { className: 'equality' }, eq),
    getAnswer: () => input.value,
    showSlots: (perSlot) => {
      const ok = perSlot?.[0];
      if (ok === undefined) return;
      input.classList.toggle('ok', ok);
      input.classList.toggle('err', !ok);
      input.setAttribute('aria-invalid', String(!ok));
      setMark(m, ok);
    },
    lock: () => (input.readOnly = true),
    focusFirst: () => {
      input.focus();
      input.select();
    },
  };
}

// ---------- Porcentagem: medidor de energia ----------
function percentView(r: ResolvedPercent): ChallengeView {
  let v = 0;
  let locked = false;
  const fill = el('span', { className: 'gauge-fill' });
  const gauge = el('span', { className: 'gauge', attrs: { 'aria-hidden': 'true' } }, fill);
  const text = el('output', { className: 'gauge-text', attrs: { 'aria-live': 'polite' } });
  const m = mark();
  const mk = (label: string, delta: number): HTMLButtonElement => {
    const b = el('button', { type: 'button', className: 'btn small', textContent: label });
    b.addEventListener('click', () => {
      v = Math.min(r.total, Math.max(0, v + delta));
      refresh();
    });
    return b;
  };
  const btns = [mk('Menos 10', -10), mk('Menos 1', -1), mk('Mais 1', 1), mk('Mais 10', 10)];
  const refresh = (): void => {
    fill.style.width = `${(100 * v) / r.total}%`;
    text.textContent = `Carga: ${v} de ${r.total}`;
    btns.forEach((b) => (b.disabled = locked));
    gauge.classList.remove('ok', 'err');
    m.className = 'mark';
  };
  refresh();
  return {
    root: el(
      'div',
      { className: 'percent' },
      el('p', { className: 'target', textContent: `Carga pedida: ${r.porcentagem}% de ${r.total}` }),
      el('div', { className: 'gauge-wrap' }, gauge, m),
      text,
      el('div', { className: 'clock-ctrl' }, ...btns),
    ),
    getAnswer: () => v,
    showSlots: (perSlot) => {
      const ok = perSlot?.[0];
      if (ok === undefined) return;
      gauge.classList.toggle('ok', ok);
      gauge.classList.toggle('err', !ok);
      setMark(m, ok);
    },
    lock: () => {
      locked = true;
      refresh();
    },
    focusFirst: () => btns[3]!.focus(),
  };
}

// ---------- Número decimal ----------
function decimalView(r: ResolvedDecimal): ChallengeView {
  const live = el('p', { className: 'sr-only', attrs: { 'aria-live': 'polite' } });
  const parts: Counter[] = [];
  const ordens = [
    ['Inteiros (1)', 'inteiro', 'inteiros', 'p-cent'],
    ['Décimos (0,1)', 'décimo', 'décimos', 'p-dez'],
    ['Centésimos (0,01)', 'centésimo', 'centésimos', 'p-uni'],
  ] as const;
  for (const [title, sing, plur, cls] of ordens) {
    parts.push(
      counter({
        title,
        className: cls,
        max: 19,
        visual: (n) => repeat(n, `blk ${cls}`, 10),
        countText: (n) => `${n} ${n === 1 ? sing : plur}`,
        plusLabel: (n) => `Um ${sing} a mais (tem ${n})`,
        minusLabel: (n) => `Um ${sing} a menos (tem ${n})`,
        onChange: () => {
          live.textContent = parts.map((p, i) => `${p.value()} ${ordens[i]![2]}`).join(', ');
        },
      }),
    );
  }
  return {
    root: el(
      'div',
      { className: 'place' },
      el('p', { className: 'target', textContent: `Medida pedida: ${r.vars.numero}` }),
      el('ul', { className: 'pieces-row', attrs: { 'aria-label': 'Peças para montar a medida' } }, ...parts.map((p) => p.root)),
      live,
    ),
    getAnswer: () => parts.map((p) => p.value()),
    showSlots: () => undefined,
    lock: () => parts.forEach((p) => p.lock()),
    focusFirst: () => parts[0]!.plus.focus(),
  };
}

// ---------- Área e perímetro ----------
function areaView(r: ResolvedArea): ChallengeView {
  let w = 1;
  let h = 1;
  let locked = false;
  const grid = el('div', { className: 'arr-grid area-grid', attrs: { role: 'img' } });
  const m = mark();
  const outW = el('output', { className: 'arr-count' });
  const outH = el('output', { className: 'arr-count' });
  const live = el('p', { className: 'sr-only', attrs: { 'aria-live': 'polite' } });
  const mk = (label: string, fn: () => void): HTMLButtonElement => {
    const b = el('button', { type: 'button', className: 'btn small', textContent: label.startsWith('Mais') ? '+' : '−', attrs: { 'aria-label': label } });
    b.addEventListener('click', () => {
      fn();
      refresh();
    });
    return b;
  };
  const wMinus = mk('Menos comprimento', () => (w = Math.max(1, w - 1)));
  const wPlus = mk('Mais comprimento', () => (w = Math.min(10, w + 1)));
  const hMinus = mk('Menos largura', () => (h = Math.max(1, h - 1)));
  const hPlus = mk('Mais largura', () => (h = Math.min(10, h + 1)));
  const refresh = (): void => {
    outW.textContent = `Comprimento: ${w}`;
    outH.textContent = `Largura: ${h}`;
    grid.style.gridTemplateColumns = `repeat(${w}, var(--block))`;
    grid.replaceChildren(...Array.from({ length: w * h }, () => el('span', { className: 'block' })));
    grid.setAttribute('aria-label', `Plataforma de ${w} por ${h} quadradinhos`);
    live.textContent = `${w} por ${h}`;
    for (const b of [wMinus, wPlus, hMinus, hPlus]) b.disabled = locked;
    grid.classList.remove('ok', 'err');
    m.className = 'mark';
  };
  refresh();
  return {
    root: el(
      'div',
      { className: 'arr' },
      el('p', { className: 'target', textContent: `Área: ${r.area} quadradinhos · Perímetro: ${r.perimetro} lados de quadradinho` }),
      el('div', { className: 'arr-ctrl' }, wMinus, outW, wPlus),
      el('div', { className: 'arr-ctrl' }, hMinus, outH, hPlus),
      el('div', { className: 'arr-wrap' }, grid, m),
      live,
    ),
    getAnswer: () => [w, h],
    showSlots: (perSlot) => {
      const ok = perSlot?.[0];
      if (ok === undefined) return;
      grid.classList.toggle('ok', ok);
      grid.classList.toggle('err', !ok);
      setMark(m, ok);
    },
    lock: () => {
      locked = true;
      refresh();
    },
    focusFirst: () => wPlus.focus(),
  };
}

// ---------- Programa: sequência de comandos ----------
function programView(r: ResolvedProgram): ChallengeView {
  const prog: number[] = [];
  let locked = false;
  const list = el('ol', { className: 'prog-list', attrs: { 'aria-label': 'Programa' } });
  const live = el('p', { className: 'sr-only', attrs: { 'aria-live': 'polite' } });
  const m = mark();
  const box = el('div', { className: 'prog-box' }, el('span', { className: 'prog-start', textContent: String(r.inicio) }), list, m);
  const cmdButtons = r.comandos.map((c, i) => {
    const b = el('button', { type: 'button', className: 'btn prog-cmd', textContent: c.rotulo });
    b.addEventListener('click', () => {
      if (locked || prog.length >= r.maxPassos) return;
      prog.push(i);
      refresh();
    });
    return b;
  });
  const undo = el('button', { type: 'button', className: 'btn small', textContent: 'Apagar último' });
  const clear = el('button', { type: 'button', className: 'btn small ghost', textContent: 'Limpar' });
  undo.addEventListener('click', () => {
    prog.pop();
    refresh();
  });
  clear.addEventListener('click', () => {
    prog.length = 0;
    refresh();
  });
  const refresh = (): void => {
    list.replaceChildren(...prog.map((i) => el('li', { className: 'prog-step', textContent: r.comandos[i]!.rotulo })));
    live.textContent = prog.length === 0 ? 'Programa vazio' : `Programa: ${prog.map((i) => r.comandos[i]!.rotulo).join(', ')}`;
    cmdButtons.forEach((b) => (b.disabled = locked || prog.length >= r.maxPassos));
    undo.disabled = locked || prog.length === 0;
    clear.disabled = locked || prog.length === 0;
    box.classList.remove('ok', 'err');
    m.className = 'mark';
  };
  refresh();
  return {
    root: el(
      'div',
      { className: 'prog' },
      el('p', { className: 'target', textContent: `Começa em ${r.inicio} · Alvo: ${r.alvo} · Até ${r.maxPassos} comandos` }),
      el('div', { className: 'prog-cmds', attrs: { role: 'group', 'aria-label': 'Comandos' } }, ...cmdButtons),
      box,
      el('div', { className: 'clock-ctrl' }, undo, clear),
      live,
    ),
    getAnswer: () => [...prog],
    showSlots: (perSlot) => {
      const ok = perSlot?.[0];
      if (ok === undefined) return;
      box.classList.toggle('ok', ok);
      box.classList.toggle('err', !ok);
      setMark(m, ok);
    },
    lock: () => {
      locked = true;
      refresh();
    },
    focusFirst: () => cmdButtons[0]?.focus(),
  };
}

// ---------- Expressão numérica ----------
function expressionView(r: ResolvedExpression): ChallengeView {
  const num = numericView();
  return {
    root: el('div', { className: 'expr' }, el('p', { className: 'expr-text', textContent: `${r.vars.expressao} = ?` }), num.root),
    getAnswer: num.getAnswer,
    showSlots: num.showSlots,
    lock: num.lock,
    focusFirst: num.focusFirst,
  };
}

// ---------- Circuito de divisibilidade ----------
function divisibilityView(r: ResolvedDivisibility): ChallengeView {
  const on = r.numeros.map(() => false);
  let locked = false;
  const marks: HTMLSpanElement[] = [];
  const buttons = r.numeros.map((n, i) => {
    const b = el('button', { type: 'button', className: 'bulb', textContent: String(n), attrs: { 'aria-pressed': 'false' } });
    b.addEventListener('click', () => {
      if (locked) return;
      on[i] = !on[i];
      b.setAttribute('aria-pressed', String(on[i]));
      marks.forEach((mm) => (mm.className = 'mark'));
    });
    return b;
  });
  const grid = el(
    'ul',
    { className: 'bulbs', attrs: { 'aria-label': 'Lâmpadas do circuito' } },
    ...buttons.map((b) => {
      const mm = mark();
      marks.push(mm);
      return el('li', { className: 'bulb-cell' }, b, mm);
    }),
  );
  return {
    root: el('div', { className: 'div' }, el('p', { className: 'target', textContent: `Acenda as lâmpadas dos ${r.vars.regra}` }), grid),
    getAnswer: () => [...on],
    showSlots: (perSlot) => perSlot?.forEach((ok, i) => setMark(marks[i]!, ok)),
    lock: () => {
      locked = true;
      buttons.forEach((b) => (b.disabled = true));
    },
    focusFirst: () => buttons[0]?.focus(),
  };
}

// ---------- 1º ano: escolha por imagem ----------
const ICON_SVG: Record<Icone, string> = {
  estrela: '<polygon points="16,2 20,12 31,12 22,19 25,30 16,23 7,30 10,19 1,12 12,12" fill="#F2C14E" stroke="#3B2F2A" stroke-width="1.5" stroke-linejoin="round"/>',
  maca: '<circle cx="16" cy="18" r="11" fill="#D9534F" stroke="#3B2F2A" stroke-width="1.5"/><path d="M16 7 q1 -4 4 -5" stroke="#6B4A2A" stroke-width="2" fill="none"/><ellipse cx="21" cy="6" rx="4" ry="2" fill="#5FA34A"/>',
  cogumelo: '<path d="M3 17 q13 -18 26 0z" fill="#D2734A" stroke="#3B2F2A" stroke-width="1.5"/><circle cx="11" cy="12" r="2" fill="#fff"/><circle cx="20" cy="10" r="2" fill="#fff"/><rect x="12" y="17" width="8" height="12" rx="3" fill="#F6EEDC" stroke="#3B2F2A" stroke-width="1.5"/>',
  folha: '<ellipse cx="16" cy="16" rx="13" ry="7" transform="rotate(-35 16 16)" fill="#5FA34A" stroke="#3B2F2A" stroke-width="1.5"/><path d="M7 24 L25 8" stroke="#3E7A2F" stroke-width="1.5"/>',
};
const FORMA_SVG: Record<string, string> = {
  circulo: '<circle cx="24" cy="24" r="18" />',
  quadrado: '<rect x="8" y="8" width="32" height="32" />',
  retangulo: '<rect x="3" y="14" width="42" height="20" />',
  triangulo: '<polygon points="24,5 44,41 4,41" />',
  estrela: '<polygon points="24,3 29,18 45,18 32,28 37,44 24,34 11,44 16,28 3,18 19,18" />',
};
const CORES_OPCAO = ['#6BB6E0', '#F2C14E', '#9B7BF0', '#5FA34A'];
const COR_SIMBOLO: Record<string, string> = { circulo: '#D9534F', quadrado: '#6BB6E0', triangulo: '#F2C14E', estrela: '#9B7BF0', retangulo: '#5FA34A' };

function iconEl(icone: Icone, crossed = false): HTMLElement {
  const span = el('span', { className: crossed ? 'ic crossed' : 'ic' });
  span.innerHTML = `<svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">${ICON_SVG[icone]}</svg>`;
  return span;
}
function formaEl(forma: string, cor: string, giro = 0, size = 64): HTMLElement {
  const span = el('span', { className: 'fig' });
  span.innerHTML = `<svg viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true"><g transform="rotate(${giro} 24 24)" fill="${cor}" stroke="#3B2F2A" stroke-width="2.5" stroke-linejoin="round">${FORMA_SVG[forma] ?? ''}</g></svg>`;
  return span;
}
function grupoEl(n: number, icone: Icone, crossedFrom = Infinity): HTMLElement {
  const g = el('span', { className: 'icon-group' });
  for (let i = 0; i < n; i++) g.append(iconEl(icone, i >= crossedFrom));
  return g;
}

function choiceView(r: ResolvedChoice, onPick: () => void): ChallengeView {
  let picked = -1;
  let locked = false;
  const nome = (icone: Icone, n: number): string => (n === 1 ? ICONES[icone][0] : ICONES[icone][1]);
  const e = r.estimulo;
  let stem: HTMLElement | null = null;
  if (e.tipo === 'grupo') stem = el('div', { className: 'stem', attrs: { role: 'img', 'aria-label': `Grupo de ${nome(e.icone, e.n)}` } }, grupoEl(e.n, e.icone));
  if (e.tipo === 'numero') stem = el('div', { className: 'stem stem-num' }, el('span', { className: 'big-num', textContent: String(e.n) }), iconEl(e.icone));
  if (e.tipo === 'soma') {
    stem = el('div', { className: 'stem', attrs: { role: 'img', 'aria-label': `${e.a} ${nome(e.icone, e.a)} e mais ${e.b} ${nome(e.icone, e.b)}` } }, grupoEl(e.a, e.icone), el('span', { className: 'stem-op', textContent: '+' }), grupoEl(e.b, e.icone));
  }
  if (e.tipo === 'retira') {
    stem = el('div', { className: 'stem', attrs: { role: 'img', 'aria-label': `${e.a} ${nome(e.icone, e.a)}; ${e.b} foram retiradas` } }, grupoEl(e.a, e.icone, e.a - e.b));
  }
  if (e.tipo === 'numeros') {
    stem = el(
      'div',
      { className: 'stem stem-pattern', attrs: { role: 'img', 'aria-label': `Números: ${e.itens.join(', ')}, e depois?` } },
      ...e.itens.map((n) => el('span', { className: 'num-box', textContent: String(n) })),
      el('span', { className: 'pattern-q', textContent: '?' }),
    );
  }
  if (e.tipo === 'padrao') {
    stem = el(
      'div',
      { className: 'stem stem-pattern', attrs: { role: 'img', 'aria-label': `Sequência: ${e.itens.map((s) => NOME_FORMA[s]).join(', ')}, e depois?` } },
      ...e.itens.map((s) => formaEl(s, COR_SIMBOLO[s]!, 0, 44)),
      el('span', { className: 'pattern-q', textContent: '?' }),
    );
  }
  const marks: HTMLSpanElement[] = [];
  const buttons = r.opcoes.map((o, i) => {
    const b = el('button', { type: 'button', className: `opt opt-${o.tipo}` });
    if (o.tipo === 'numero') b.append(el('span', { className: 'big-num', textContent: String(o.n) }));
    if (o.tipo === 'grupo') {
      b.append(grupoEl(o.n, o.icone));
      b.setAttribute('aria-label', `Grupo de ${nome(o.icone, o.n)}`);
    }
    if (o.tipo === 'forma') {
      b.append(formaEl(o.forma, r.formato === 'padrao' ? COR_SIMBOLO[o.forma]! : CORES_OPCAO[i % CORES_OPCAO.length]!, o.giro));
      b.setAttribute('aria-label', NOME_FORMA[o.forma]);
    }
    b.addEventListener('click', () => {
      if (locked) return;
      picked = i;
      buttons.forEach((x, j) => x.setAttribute('aria-pressed', String(j === i)));
      marks.forEach((m) => (m.className = 'mark'));
      onPick();
    });
    b.setAttribute('aria-pressed', 'false');
    return b;
  });
  const opts = el(
    'ul',
    { className: `opts opts-${r.opcoes.length}`, attrs: { 'aria-label': 'Respostas' } },
    ...buttons.map((b) => {
      const m = mark();
      marks.push(m);
      return el('li', { className: 'opt-cell' }, b, m);
    }),
  );
  return {
    root: el('div', { className: 'choice' }, stem, opts),
    getAnswer: () => (picked >= 0 ? picked : null),
    showSlots: (perSlot) => {
      if (picked < 0 || !perSlot) return;
      setMark(marks[picked]!, perSlot[picked]!);
    },
    lock: () => {
      locked = true;
      buttons.forEach((b) => (b.disabled = true));
    },
    focusFirst: () => buttons[0]?.focus(),
  };
}

// ---------- Ordenar números (1º ano) ----------
function orderView(r: ResolvedOrder, onPick: () => void): ChallengeView {
  const seq: number[] = [];
  let locked = false;
  const slots = r.numeros.map(() => el('span', { className: 'ord-slot' }));
  const slotMarks = r.numeros.map(() => mark());
  const live = el('p', { className: 'sr-only', attrs: { 'aria-live': 'polite' } });
  const cards = r.numeros.map((n, i) => {
    const b = el('button', { type: 'button', className: 'opt ord-card' }, el('span', { className: 'big-num', textContent: String(n) }));
    b.addEventListener('click', () => {
      if (locked || seq.includes(i)) return;
      seq.push(i);
      refresh();
      if (seq.length === r.numeros.length) onPick();
    });
    return b;
  });
  const undo = el('button', { type: 'button', className: 'btn small', textContent: 'Apagar último' });
  const clear = el('button', { type: 'button', className: 'btn small ghost', textContent: 'Limpar' });
  undo.addEventListener('click', () => {
    seq.pop();
    refresh();
  });
  clear.addEventListener('click', () => {
    seq.length = 0;
    refresh();
  });
  const refresh = (): void => {
    slots.forEach((s, k) => {
      const i = seq[k];
      s.textContent = i === undefined ? '' : String(r.numeros[i]);
      s.classList.toggle('filled', i !== undefined);
      s.classList.remove('ok', 'err');
    });
    slotMarks.forEach((m) => (m.className = 'mark'));
    cards.forEach((b, i) => {
      b.disabled = locked || seq.includes(i);
      b.setAttribute('aria-pressed', String(seq.includes(i)));
    });
    undo.disabled = locked || seq.length === 0;
    clear.disabled = locked || seq.length === 0;
    live.textContent = seq.length === 0 ? 'Nenhum número escolhido' : `Sua ordem: ${seq.map((i) => r.numeros[i]).join(', ')}`;
  };
  refresh();
  return {
    root: el(
      'div',
      { className: 'choice ord' },
      el('p', { className: 'target', textContent: r.ordem === 'crescente' ? 'Do menor para o maior' : 'Do maior para o menor' }),
      el('ol', { className: 'ord-row', attrs: { 'aria-label': 'Sua ordem' } }, ...slots.map((s, k) => el('li', { className: 'ord-cell' }, s, slotMarks[k]!))),
      el('ul', { className: `opts opts-${r.numeros.length}`, attrs: { 'aria-label': 'Números' } }, ...cards.map((b) => el('li', { className: 'opt-cell' }, b))),
      el('div', { className: 'clock-ctrl' }, undo, clear),
      live,
    ),
    getAnswer: () => (seq.length === r.numeros.length ? [...seq] : null),
    showSlots: (perSlot) => {
      if (!perSlot) return;
      perSlot.forEach((ok, k) => {
        slots[k]?.classList.toggle('ok', ok);
        slots[k]?.classList.toggle('err', !ok);
        if (slotMarks[k]) setMark(slotMarks[k], ok);
      });
    },
    lock: () => {
      locked = true;
      cards.forEach((b) => (b.disabled = true));
      undo.disabled = true;
      clear.disabled = true;
    },
    focusFirst: () => (cards.find((b) => !b.disabled) ?? clear).focus(),
  };
}

export function createView(r: Resolved, onPick: () => void = () => undefined): ChallengeView {
  switch (r.formato) {
    case 'numerico':
      return numericView();
    case 'distribuir':
      return distributeView(r);
    case 'arranjo':
      return arrayView(r);
    case 'posicional':
      return placeView(r);
    case 'dinheiro':
      return moneyView(r);
    case 'relogio':
      return clockView(r);
    case 'fracao':
      return fractionView(r);
    case 'grafico':
      return chartView(r);
    case 'igualdade':
      return equalityView(r);
    case 'porcentagem':
      return percentView(r);
    case 'decimal':
      return decimalView(r);
    case 'area':
      return areaView(r);
    case 'programa':
      return programView(r);
    case 'expressao':
      return expressionView(r);
    case 'divisibilidade':
      return divisibilityView(r);
    case 'contagem':
    case 'formas':
    case 'padrao':
      return choiceView(r, onPick);
    case 'ordenar':
      return orderView(r, onPick);
    default:
      return sequenceView(r);
  }
}
