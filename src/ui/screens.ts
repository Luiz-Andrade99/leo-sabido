import { audio } from '../audio/audio';
import type { AnoInfo, FaseInfo } from '../content/schema';
import { CONQUISTAS, isFaseConcluida, isFaseUnlocked, type Conquista } from '../core/progress';
import { defaultSave, exportSave, importSave } from '../core/save';
import { ACTIONS, ACTION_LABELS, DEFAULT_BINDINGS, keyFromCode, keyLabel, remapKey, type Action } from '../core/settings';
import { getState } from '../core/state';
import { button, el } from './dom';
import { canSpeak, onVoicesChanged, rankedVoices, speak, stopSpeaking, voiceScore } from './speech';

/** Telas de menu em HTML acessível, desenhadas sobre a cena de fundo. */

let container: HTMLElement | null = null;

export function mountScreens(c: HTMLElement): void {
  container = c;
}

/** Mostra uma tela e leva o foco ao título (leitores de tela anunciam a mudança). */
export function showScreen(screen: HTMLElement, overlay = false): void {
  if (!container) return;
  stopSpeaking();
  container.replaceChildren(screen);
  container.hidden = false;
  container.classList.toggle('overlay', overlay);
  const h = screen.querySelector<HTMLElement>('h1, h2');
  if (h) {
    h.tabIndex = -1;
    h.focus({ preventScroll: true });
  }
}

export function hideScreens(): void {
  if (!container) return;
  container.replaceChildren();
  container.hidden = true;
}

function screen(id: string, className: string, ...children: (Node | string | null | false)[]): HTMLElement {
  return el('section', { className: `screen ${className}`, id, attrs: { 'aria-labelledby': `${id}-h` } }, ...children);
}

function h(level: 'h1' | 'h2', id: string, text: string): HTMLElement {
  return el(level, { id: `${id}-h`, textContent: text });
}

function click(fn: () => void): () => void {
  return () => {
    audio.unlock();
    audio.play('click');
    fn();
  };
}

function leoImg(frame = 'leo-idle', cls = 'leo-portrait'): HTMLImageElement {
  return el('img', { src: `assets/leo/${frame}.svg`, alt: '', className: cls, width: 96, height: 128 });
}

// ---------- Abertura ----------
export function titleScreen(o: { notice?: string; onPlay: () => void; onStory: () => void; onSettings: () => void; onAbout: () => void }): HTMLElement {
  return screen(
    'inicio',
    'title',
    el('div', { className: 'title-art' }, leoImg('leo-jump', 'leo-hero')),
    el('h1', { id: 'inicio-h', className: 'logo' }, 'Leo Sabido', el('span', { className: 'logo-sub', textContent: 'Aventuras do Conhecimento' })),
    o.notice ? el('p', { className: 'notice', role: 'status', textContent: o.notice }) : null,
    el(
      'div',
      { className: 'menu' },
      button('▶ Jogar', click(o.onPlay), 'btn primary big'),
      button('📖 História', click(o.onStory)),
      button('⚙ Configurações', click(o.onSettings)),
      button('ℹ Sobre', click(o.onAbout)),
    ),
    el('p', { className: 'fine', textContent: 'Versão de homologação · 1º ao 6º ano · Conteúdo em revisão pedagógica' }),
  );
}

// ---------- Apresentação do Leo ----------
const STORY = [
  { frame: 'leo-idle', texto: 'Este é o Leo, um jovem inventor curioso. Ele adora descobrir como as coisas funcionam.' },
  { frame: 'leo-think', texto: 'A Grande Engrenagem do Saber parou! As seis peças que a faziam girar se espalharam por seis mundos.' },
  { frame: 'leo-jump', texto: 'Em cada mundo, Leo vai usar matemática e raciocínio para abrir portas, erguer pontes e ligar máquinas. Vamos ajudar?' },
];

export function introScreen(onDone: () => void): HTMLElement {
  let i = 0;
  const img = leoImg();
  const text = el('p', { className: 'story-text', attrs: { 'aria-live': 'polite' } });
  const counter = el('p', { className: 'fine' });
  const next = button('', click(() => advance()), 'btn primary');
  const render = (): void => {
    const s = STORY[i]!;
    img.src = `assets/leo/${s.frame}.svg`;
    text.textContent = s.texto;
    counter.textContent = `${i + 1} de ${STORY.length}`;
    next.textContent = i < STORY.length - 1 ? 'Próximo ▶' : 'Começar ▶';
    if (getState().settings.narracaoAuto) speak(s.texto);
  };
  const advance = (): void => {
    if (i < STORY.length - 1) {
      i++;
      render();
      next.focus();
    } else onDone();
  };
  render();
  return screen(
    'historia',
    'story',
    h('h2', 'historia', 'A Grande Engrenagem do Saber'),
    img,
    text,
    counter,
    el(
      'div',
      { className: 'menu row' },
      canSpeak() ? button('🔊 Ouvir', () => speak(STORY[i]!.texto)) : null,
      next,
      button('Pular história', click(onDone), 'btn ghost'),
    ),
  );
}

// ---------- Escolha do ano ----------
export function gradeScreen(o: { onChoose: (ano: number) => void; onBack: () => void }): HTMLElement {
  const st = getState();
  const list = el('ul', { className: 'grades' });
  for (const a of st.mundos.anos) {
    const chosen = st.save.ano === a.ano;
    // O nome acessível sempre começa pelo texto visível (WCAG 2.5.3).
    const btn = a.disponivel
      ? button(chosen ? `Continuar no ${a.ano}º ano` : `Escolher o ${a.ano}º ano`, click(() => o.onChoose(a.ano)), 'btn primary')
      : button('Em construção', () => undefined, 'btn', { 'aria-label': `Em construção: ${a.ano}º ano, ${a.mundo}` });
    btn.disabled = !a.disponivel;
    list.append(
      el(
        'li',
        { className: `grade ${a.disponivel ? '' : 'locked'} ${chosen ? 'chosen' : ''}` },
        el('p', { className: 'grade-n', textContent: `${a.ano}º ano` }),
        el('p', { className: 'grade-w', textContent: a.mundo }),
        btn,
      ),
    );
  }
  return screen(
    'ano',
    'grade-select',
    h('h2', 'ano', 'Em que ano você está?'),
    el('p', { textContent: 'O ano escolhido define os desafios. Você pode trocar depois, sem perder o que já fez.' }),
    list,
    el('div', { className: 'menu row' }, button('◀ Voltar', click(o.onBack), 'btn ghost')),
  );
}

// ---------- Mapa do mundo ----------
export function mapScreen(o: { info: AnoInfo; onPlay: (faseId: string) => void; onGrade: () => void; onSettings: () => void; onHome: () => void }): HTMLElement {
  const st = getState();
  const prog = st.save.anos[String(o.info.ano)];
  const list = el('ol', { className: 'phases' });
  o.info.fases.forEach((f, i) => {
    const unlocked = isFaseUnlocked(st.save, o.info, f.id);
    const done = isFaseConcluida(st.save, o.info.ano, f.id);
    const fp = prog?.fases[f.id];
    const status = done ? '✓ Concluída' : unlocked ? '● Disponível' : '🔒 Bloqueada';
    const label = done ? 'Jogar de novo' : 'Jogar';
    const play = button(label, click(() => o.onPlay(f.id)), unlocked ? 'btn primary' : 'btn', {
      'aria-label': `${label}: fase ${i + 1}, ${f.nome} (${status.replace(/^\S+ /, '').toLowerCase()})`,
    });
    play.disabled = !unlocked;
    list.append(
      el(
        'li',
        { className: `phase ${done ? 'done' : unlocked ? 'open' : 'locked'}` },
        el('p', { className: 'phase-n', textContent: `Fase ${i + 1}` }),
        el('h3', { textContent: f.nome }),
        el('p', { className: 'phase-obj', textContent: unlocked ? f.objetivo : 'Conclua a fase anterior para abrir esta.' }),
        el('p', { className: 'phase-status', textContent: status }),
        fp && fp.cristaisTotal > 0 ? el('p', { className: 'phase-gems', textContent: `Coletáveis: ${fp.cristais}/${fp.cristaisTotal}` }) : null,
        play,
      ),
    );
  });
  const earned = CONQUISTAS.filter((c) => st.save.conquistas.includes(c.id));
  return screen(
    'mapa',
    'map',
    h('h2', 'mapa', o.info.mundo),
    el('p', { className: 'gear-status', textContent: prog?.pecaRecuperada ? `⚙ ${o.info.peca}: recuperada!` : `⚙ ${o.info.peca}: ainda escondida nesta caverna.` }),
    list,
    el(
      'details',
      { className: 'achievements' },
      el('summary', { textContent: `Conquistas (${earned.length} de ${CONQUISTAS.length})` }),
      el('ul', {}, ...CONQUISTAS.map((c) => el('li', { className: st.save.conquistas.includes(c.id) ? 'got' : 'not' }, el('strong', { textContent: `${st.save.conquistas.includes(c.id) ? '★' : '☆'} ${c.nome}` }), ` — ${c.descricao}`))),
    ),
    el('div', { className: 'menu row' }, button('◀ Início', click(o.onHome), 'btn ghost'), button('Trocar ano', click(o.onGrade)), button('⚙ Configurações', click(o.onSettings))),
  );
}

// ---------- Pausa ----------
export function pauseScreen(o: { onResume: () => void; onRestart: () => void; onSettings: () => void; onMap: () => void }): HTMLElement {
  const s = screen(
    'pausa',
    'pause',
    h('h2', 'pausa', 'Jogo pausado'),
    el(
      'div',
      { className: 'menu' },
      button('▶ Continuar', click(o.onResume), 'btn primary big'),
      button('↺ Reiniciar a fase', click(o.onRestart)),
      button('⚙ Configurações', click(o.onSettings)),
      button('🗺 Sair para o mapa', click(o.onMap)),
    ),
    el('p', { className: 'fine', textContent: 'Reiniciar volta ao começo da fase. O progresso das fases já concluídas continua salvo.' }),
  );
  s.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      o.onResume();
    }
  });
  return s;
}

// ---------- Conclusão da fase ----------
export interface CompleteData {
  fase: FaseInfo;
  index: number;
  cristais: number;
  cristaisTotal: number;
  coletavel: string;
  desafios: { tema: string; explicacao: string; dicas: number; tentativas: number }[];
  novasConquistas: Conquista[];
  hasNext: boolean;
}

export function completeScreen(d: CompleteData, o: { onNext: () => void; onReplay: () => void; onMap: () => void }): HTMLElement {
  const dicas = d.desafios.reduce((s, x) => s + x.dicas, 0);
  return screen(
    'concluida',
    'complete',
    leoImg('leo-jump'),
    h('h2', 'concluida', `Fase ${d.index + 1} concluída!`),
    el('p', { className: 'lead', textContent: d.fase.nome }),
    el(
      'div',
      { className: 'learned' },
      el('h3', { textContent: 'O que você descobriu' }),
      el('ul', {}, ...d.desafios.map((x) => el('li', {}, el('strong', { textContent: x.tema }), el('br'), x.explicacao))),
    ),
    el(
      'ul',
      { className: 'stats' },
      el('li', { textContent: `${d.coletavel}: ${d.cristais} de ${d.cristaisTotal}` }),
      el('li', { textContent: dicas > 0 ? `💡 Você usou ${dicas} ${dicas === 1 ? 'dica' : 'dicas'}. Pedir ajuda faz parte de aprender!` : '💡 Lembre: as dicas estão sempre lá quando precisar.' }),
    ),
    d.novasConquistas.length > 0
      ? el('div', { className: 'new-ach', role: 'status' }, el('h3', { textContent: 'Conquista nova!' }), el('ul', {}, ...d.novasConquistas.map((c) => el('li', {}, el('strong', { textContent: `★ ${c.nome}` }), ` — ${c.descricao}`))))
      : null,
    el(
      'div',
      { className: 'menu row' },
      d.hasNext ? button('Próxima fase ▶', click(o.onNext), 'btn primary') : null,
      button('↺ Jogar de novo', click(o.onReplay)),
      button('🗺 Mapa', click(o.onMap), d.hasNext ? 'btn' : 'btn primary'),
    ),
  );
}

// ---------- Conclusão do mundo ----------
export function worldCompleteScreen(info: AnoInfo, onMap: () => void, todas = false): HTMLElement {
  return screen(
    'mundo',
    'world-complete',
    el('img', { src: 'assets/objects/engrenagem.svg', alt: '', className: 'gear-big', width: 120, height: 120 }),
    h('h2', 'mundo', `Você recuperou a ${info.peca}!`),
    el('p', { className: 'lead', textContent: `${info.mundo}: tudo em ordem outra vez! A Grande Engrenagem do Saber tem mais uma peça girando.` }),
    todas
      ? el('p', { className: 'notice', textContent: 'As seis peças voltaram ao lugar. A Grande Engrenagem do Saber está girando de novo — obrigado pela ajuda, inventor(a)!' })
      : el('p', { textContent: 'Você pode jogar as fases de novo e procurar todos os coletáveis.' }),
    el('div', { className: 'menu row' }, button('🗺 Voltar ao mapa', click(onMap), 'btn primary')),
  );
}

// ---------- Sobre ----------
export function aboutScreen(onBack: () => void): HTMLElement {
  return screen(
    'sobre',
    'about',
    h('h2', 'sobre', 'Sobre o jogo'),
    el('p', { textContent: 'Leo Sabido é um jogo educativo gratuito, sem anúncios e sem compras.' }),
    el('h3', { textContent: 'Privacidade' }),
    el('p', { textContent: 'O jogo não pede nome, e-mail nem cadastro e não envia nada pela internet. O progresso fica guardado apenas neste navegador.' }),
    el('h3', { textContent: 'Conteúdo' }),
    el('p', { textContent: 'Os desafios seguem habilidades da BNCC e estão em revisão pedagógica. Esta versão de homologação tem os seis mundos, do 1º ao 6º ano, com 3 fases cada.' }),
    el('h3', { textContent: 'Créditos' }),
    el('p', { textContent: 'Personagem, cenários e sons criados para o projeto. Motor de jogo: Phaser (licença MIT).' }),
    el('div', { className: 'menu row' }, button('◀ Voltar', click(onBack), 'btn primary')),
  );
}

// ---------- Configurações ----------
export function settingsScreen(onBack: () => void): HTMLElement {
  const st = getState();
  const s = st.settings;

  const slider = (id: string, label: string, value: number, onChange: (v: number) => void): HTMLElement => {
    const out = el('output', { attrs: { for: id }, textContent: `${Math.round(value * 100)}%` });
    const input = el('input', { type: 'range', id, min: '0', max: '100', step: '5', value: String(Math.round(value * 100)) });
    input.addEventListener('input', () => {
      out.textContent = `${input.value}%`;
      onChange(Number(input.value) / 100);
    });
    return el('div', { className: 'field' }, el('label', { htmlFor: id, textContent: label }), input, out);
  };
  const check = (id: string, label: string, hint: string, value: boolean, onChange: (v: boolean) => void): HTMLElement => {
    const input = el('input', { type: 'checkbox', id, checked: value });
    input.addEventListener('change', () => onChange(input.checked));
    return el('div', { className: 'field check' }, input, el('label', { htmlFor: id }, el('strong', { textContent: label }), el('span', { className: 'hint-text', textContent: hint })));
  };

  const apoio = el(
    'fieldset',
    { className: 'field radios' },
    el('legend', { textContent: 'Nível de apoio nos desafios' }),
    ...(
      [
        ['acompanhado', 'Acompanhado', 'Dica automática quando errar.'],
        ['padrao', 'Padrão', 'Dicas quando você pedir.'],
        ['desafio', 'Desafio', 'Menos dicas e desafios um pouco mais difíceis do mesmo ano.'],
      ] as const
    ).map(([v, l, d]) => {
      const r = el('input', { type: 'radio', name: 'apoio', id: `apoio-${v}`, value: v, checked: s.apoio === v });
      r.addEventListener('change', () => st.updateSettings({ apoio: v }));
      return el('div', { className: 'radio' }, r, el('label', { htmlFor: `apoio-${v}` }, el('strong', { textContent: l }), el('span', { className: 'hint-text', textContent: d })));
    }),
  );

  const touch = el(
    'select',
    { id: 'toque' },
    el('option', { value: 'auto', textContent: 'Automático' }),
    el('option', { value: 'sempre', textContent: 'Sempre mostrar' }),
    el('option', { value: 'nunca', textContent: 'Nunca mostrar' }),
  );
  touch.value = s.controlesToque;
  touch.addEventListener('change', () => st.updateSettings({ controlesToque: touch.value as 'auto' | 'sempre' | 'nunca' }));

  // Voz do narrador
  const voz = el('select', { id: 'voz' });
  const fillVoices = (): void => {
    const atual = getState().settings.voz;
    const vs = rankedVoices();
    voz.replaceChildren(
      el('option', { value: '', textContent: vs[0] ? `Automática (${vs[0].name})` : 'Automática' }),
      ...vs.map((v) => el('option', { value: v.name, textContent: `${v.name}${voiceScore(v) >= 80 ? ' — mais natural' : ''}${v.localService ? '' : ' (online)'}` })),
    );
    voz.value = vs.some((v) => v.name === atual) ? atual : '';
  };
  fillVoices();
  onVoicesChanged(fillVoices);
  voz.addEventListener('change', () => {
    st.updateSettings({ voz: voz.value });
    speak('Olá! Eu sou a voz do Leo Sabido. Vamos aprender brincando?');
  });
  const vozField = canSpeak()
    ? el(
        'div',
        { className: 'field' },
        el('label', { htmlFor: 'voz', textContent: 'Voz do narrador' }),
        voz,
        button('🔊 Testar voz', () => speak('Olá! Eu sou a voz do Leo Sabido. Três quartos de 8 são 6. Vamos aprender brincando?'), 'btn small'),
        el('p', { className: 'hint-text', textContent: 'Vozes "online" são geradas pelo serviço de voz do navegador, que recebe só o texto do jogo.' }),
      )
    : null;

  // Teclas
  const keysBody = el('tbody');
  let capturing: Action | null = null;
  const renderKeys = (): void => {
    keysBody.replaceChildren(
      ...ACTIONS.map((a) => {
        const b = button(capturing === a ? 'Pressione uma tecla…' : 'Mudar', () => {
          capturing = a;
          renderKeys();
          keysBody.querySelector<HTMLButtonElement>(`[data-action="${a}"]`)?.focus();
        }, 'btn small', { 'data-action': a, 'aria-label': `Mudar tecla de ${ACTION_LABELS[a]}` });
        return el('tr', {}, el('th', { scope: 'row', textContent: ACTION_LABELS[a] }), el('td', { textContent: st.settings.teclas[a].map(keyLabel).join(' · ') }), el('td', {}, b));
      }),
    );
  };
  renderKeys();
  const keyMsg = el('p', { className: 'fine', attrs: { 'aria-live': 'polite' } });

  // Progresso
  const codeOut = el('textarea', { id: 'codigo-exportado', readOnly: true, rows: 3, hidden: true });
  const codeIn = el('textarea', { id: 'codigo-importar', rows: 3 });
  const progMsg = el('p', { className: 'fine', attrs: { 'aria-live': 'polite' } });
  const confirmBox = el('div', { className: 'confirm', hidden: true });
  confirmBox.append(
    el('p', { textContent: 'Tem certeza? Todo o progresso deste navegador será apagado e não poderá ser recuperado.' }),
    button('Sim, apagar tudo', () => {
      st.commit({ ...defaultSave(), settings: st.settings });
      confirmBox.hidden = true;
      progMsg.textContent = 'Progresso apagado.';
    }, 'btn danger'),
    button('Cancelar', () => (confirmBox.hidden = true), 'btn ghost'),
  );

  const root = screen(
    'config',
    'settings',
    h('h2', 'config', 'Configurações'),
    el(
      'div',
      { className: 'settings-grid' },
      el(
        'section',
        { className: 'group' },
        el('h3', { textContent: 'Som' }),
        slider('vol-musica', 'Música', s.volumeMusica, (v) => st.updateSettings({ volumeMusica: v })),
        slider('vol-efeitos', 'Efeitos', s.volumeEfeitos, (v) => st.updateSettings({ volumeEfeitos: v })),
        slider('vol-voz', 'Voz (narração)', s.volumeVoz, (v) => st.updateSettings({ volumeVoz: v })),
        check('narracao', 'Ler instruções em voz alta', 'Os desafios e a história são lidos ao abrir.', s.narracaoAuto, (v) => st.updateSettings({ narracaoAuto: v })),
        vozField,
      ),
      el(
        'section',
        { className: 'group' },
        el('h3', { textContent: 'Jogo' }),
        apoio,
        check('assistido', 'Modo assistido', 'Aparecem blocos de apoio nos buracos e as plataformas andam mais devagar.', s.modoAssistido, (v) => st.updateSettings({ modoAssistido: v })),
      ),
      el(
        'section',
        { className: 'group' },
        el('h3', { textContent: 'Tela' }),
        check('animacoes', 'Reduzir animações', 'Menos movimento na tela.', s.reduzirAnimacoes, (v) => st.updateSettings({ reduzirAnimacoes: v })),
        check('texto-grande', 'Texto maior', 'Aumenta os textos dos menus e desafios.', s.textoGrande, (v) => st.updateSettings({ textoGrande: v })),
        el('div', { className: 'field' }, el('label', { htmlFor: 'toque', textContent: 'Botões de toque na tela' }), touch),
      ),
      el(
        'section',
        { className: 'group' },
        el('h3', { textContent: 'Teclas' }),
        el('table', { className: 'keys' }, el('thead', {}, el('tr', {}, el('th', { scope: 'col', textContent: 'Ação' }), el('th', { scope: 'col', textContent: 'Teclas' }), el('th', { scope: 'col', textContent: '' }))), keysBody),
        keyMsg,
        button('Restaurar teclas padrão', () => {
          st.updateSettings({ teclas: structuredClone(DEFAULT_BINDINGS) });
          capturing = null;
          renderKeys();
          keyMsg.textContent = 'Teclas padrão restauradas.';
        }, 'btn small'),
      ),
      el(
        'section',
        { className: 'group' },
        el('h3', { textContent: 'Progresso' }),
        el('p', { className: 'fine', textContent: st.persistent ? 'O progresso fica salvo neste navegador.' : 'Este navegador não está deixando salvar. Use o código abaixo para não perder o progresso.' }),
        button('Gerar código do progresso', () => {
          codeOut.value = exportSave(st.save);
          codeOut.hidden = false;
          codeOut.select();
          progMsg.textContent = 'Código gerado. Copie e guarde para continuar em outro computador.';
        }, 'btn small'),
        el('label', { htmlFor: 'codigo-exportado', className: 'sr-only', textContent: 'Código do progresso' }),
        codeOut,
        el('label', { htmlFor: 'codigo-importar', textContent: 'Carregar progresso de um código' }),
        codeIn,
        button('Carregar', () => {
          const loaded = importSave(codeIn.value);
          if (!loaded) {
            progMsg.textContent = 'Código inválido. Confira se copiou o código inteiro.';
            return;
          }
          st.commit(loaded);
          st.updateSettings({});
          progMsg.textContent = 'Progresso carregado!';
        }, 'btn small'),
        button('Apagar todo o progresso…', () => {
          confirmBox.hidden = false;
          confirmBox.querySelector('button')?.focus();
        }, 'btn small danger-outline'),
        confirmBox,
        progMsg,
      ),
    ),
    el('div', { className: 'menu row' }, button('◀ Voltar', click(onBack), 'btn primary')),
  );

  root.addEventListener(
    'keydown',
    (e) => {
      if (!capturing) {
        if (e.key === 'Escape') {
          e.preventDefault();
          onBack();
        }
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const action = capturing;
      capturing = null;
      if (e.key === 'Escape') {
        keyMsg.textContent = 'Troca de tecla cancelada.';
      } else {
        const key = keyFromCode(e.code);
        if (key) {
          st.updateSettings({ teclas: remapKey(st.settings.teclas, action, key) });
          keyMsg.textContent = `${ACTION_LABELS[action]}: ${keyLabel(key)}.`;
        } else keyMsg.textContent = 'Essa tecla não pode ser usada. Escolha letras, números, setas, Espaço, Enter, Shift ou Ctrl.';
      }
      renderKeys();
      keysBody.querySelector<HTMLButtonElement>(`[data-action="${action}"]`)?.focus();
    },
    true,
  );
  return root;
}
