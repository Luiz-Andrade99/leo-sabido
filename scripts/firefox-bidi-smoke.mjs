/**
 * Teste de fumaça no Firefox instalado no computador, via WebDriver BiDi (protocolo padrão do Firefox),
 * para quando o Firefox do Playwright não pode ser usado.
 *   node scripts/firefox-bidi-smoke.mjs ["C:/Program Files/Mozilla Firefox/firefox.exe"] [http://localhost:4173]
 * Usa cliques e teclas de verdade (input.performActions). Sai com código 1 se algo falhar.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const FIREFOX = process.argv[2] ?? 'C:/Program Files/Mozilla Firefox/firefox.exe';
const BASE = process.argv[3] ?? 'http://localhost:4173';
const EVID = 'docs/relatorios/evidencias';
const PORT = 9333;

const profile = mkdtempSync(join(tmpdir(), 'leo-ff-'));
const ff = spawn(FIREFOX, ['--headless', '--no-remote', '--profile', profile, `--remote-debugging-port=${PORT}`, '--width=1280', '--height=720'], { stdio: ['ignore', 'pipe', 'pipe'] });
const wsUrl = await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('Firefox não abriu o BiDi a tempo')), 30_000);
  const onData = (d) => {
    const m = String(d).match(/WebDriver BiDi listening on (ws:\/\/\S+)/);
    if (m) {
      clearTimeout(t);
      resolve(`${m[1]}/session`);
    }
  };
  ff.stderr.on('data', onData);
  ff.stdout.on('data', onData);
});

const ws = new WebSocket(wsUrl);
await new Promise((r, j) => ((ws.onopen = r), (ws.onerror = j)));
let nextId = 1;
const pending = new Map();
const errors = [];
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.type === 'error' ? reject(new Error(`${msg.error}: ${msg.message}`)) : resolve(msg.result);
  } else if (msg.method === 'log.entryAdded' && msg.params.level === 'error') errors.push(msg.params.text);
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

const results = [];
const check = (name, ok, extra = '') => {
  results.push({ name, ok });
  console.log(`${ok ? '  ✔' : '  ✖'} ${name}${extra ? ` (${extra})` : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  await send('session.new', { capabilities: {} });
  await send('session.subscribe', { events: ['log.entryAdded'] });
  const { contexts } = await send('browsingContext.getTree', {});
  const context = contexts[0].context;
  await send('browsingContext.setViewport', { context, viewport: { width: 1280, height: 720 } });

  const js = async (expression) => {
    // Volta como JSON para não depender da serialização de objetos do BiDi.
    const r = await send('script.evaluate', { expression: `(async () => JSON.stringify(await (${expression})))()`, target: { context }, awaitPromise: true, resultOwnership: 'none' });
    if (r.type === 'exception') throw new Error(r.exceptionDetails.text);
    return r.result.value === undefined ? undefined : JSON.parse(r.result.value);
  };
  const waitFor = async (expression, timeout = 20_000) => {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      // A página pode recarregar no meio (service worker da voz): erro de contexto conta como "ainda não".
      if (await js(`(() => { try { return !!(${expression}); } catch { return false; } })()`).catch(() => false)) return true;
      await sleep(100);
    }
    throw new Error(`Esperou demais por: ${expression}`);
  };
  const shot = async (name) => {
    const { data } = await send('browsingContext.captureScreenshot', { context });
    writeFileSync(`${EVID}/ff-${name}.png`, Buffer.from(data, 'base64'));
  };
  /** Clique real (ponteiro) no centro do elemento. */
  const click = async (selectorJs) => {
    const r = await js(`(() => { const e = ${selectorJs}; if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return [Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2)]; })()`);
    if (!r) throw new Error(`Elemento não encontrado: ${selectorJs}`);
    const [x, y] = r;
    await send('input.performActions', {
      context,
      actions: [{ type: 'pointer', id: 'mouse', parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', x, y }, { type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 }] }],
    });
  };
  const byText = (sel, re) => `[...document.querySelectorAll('${sel}')].find((e) => ${re}.test((e.getAttribute('aria-label') ?? '') + ' ' + e.textContent) && e.offsetParent !== null)`;
  /** Tecla real segurada por ms milissegundos. */
  const holdKey = async (value, ms) => {
    await send('input.performActions', { context, actions: [{ type: 'key', id: 'kb', actions: [{ type: 'keyDown', value }, { type: 'pause', duration: ms }, { type: 'keyUp', value }] }] });
  };
  const type = async (text) => {
    await send('input.performActions', { context, actions: [{ type: 'key', id: 'kb', actions: [...text].flatMap((c) => [{ type: 'keyDown', value: c }, { type: 'keyUp', value: c }]) }] });
  };
  const RIGHT = '\uE014';
  const state = () => js('window.__leo.state()');

  console.log(`Firefox: ${FIREFOX}`);
  await send('browsingContext.navigate', { context, url: `${BASE}/?teste=1&seed=1&animacoes=reduzidas`, wait: 'complete' });
  await waitFor('window.__leo?.ready === true', 30_000);
  check('o jogo carrega', true);
  await shot('abertura');

  // Menus com cliques reais
  await click(byText('button', /Jogar/));
  await click(byText('button', /Pular história/));
  await click(byText('button', /3º ano/));
  await waitFor(`[...document.querySelectorAll('h2')].some((h) => /Caverna dos Enigmas/.test(h.textContent))`);
  check('menus: Jogar → ano → mapa do mundo', true);
  await click(byText('button', /fase 1,/));
  await waitFor('window.__leo.levelActive() && window.__leo.state().onGround');
  await shot('fase');
  check('fase 1 abre', true);

  // Andar e pular com o teclado
  const s0 = await state();
  await holdKey(RIGHT, 800);
  const s1 = await state();
  check('seta para a direita anda', s1.x > s0.x + 40, `x ${Math.round(s0.x)} → ${Math.round(s1.x)}`);
  await waitFor('window.__leo.state().onGround');
  const y0 = (await state()).y;
  await holdKey(' ', 250);
  await sleep(400);
  const s2 = await state();
  check('espaço pula', s2.minY < y0 - 40, `subiu ${Math.round(y0 - s2.minY)} px`);
  const fps = (await state()).actualFps;
  check('desempenho', fps >= 30, `${Math.round(fps)} quadros/s`);

  // Desafio: abrir com E, responder digitando e clicando em Verificar
  const p = await js(`window.__leo.points().panels.find((x) => x.painel === '1')`);
  await js(`window.__leo.teleport(${p.x - 30}, ${p.y})`);
  await waitFor('window.__leo.state().onGround');
  await holdKey('e', 80);
  await waitFor(`document.querySelector('[role=dialog]')`);
  const sol = await js(`window.__leo.solution('1')`);
  await shot('desafio');
  if (sol.formato === 'numerico') {
    await click(`document.querySelector('[role=dialog] input')`);
    await type(String(sol.valor));
  } else if (sol.formato === 'sequencia') {
    for (let i = 0; i < sol.valores.length; i++) {
      await click(`document.querySelectorAll('[role=dialog] input')[${i}]`);
      await type(String(sol.valores[i]));
    }
  }
  await click(byText('[role=dialog] button', /Verificar/));
  await waitFor(`/Muito bem|Isso|Perfeito/.test(document.querySelector('[role=dialog] .feedback')?.textContent ?? '')`);
  check(`desafio (${sol.formato}) resolvido com teclado e clique`, true);
  await click(byText('[role=dialog] button', /Continuar/));
  await waitFor(`window.__leo.state().panels.find((x) => x.painel === '1')?.activated`);
  check('o mecanismo do painel é ativado', true);

  // Concluir a fase: ir até a saída
  const goal = await js('window.__leo.points().goal');
  await js(`window.__leo.teleport(${goal.x - 60}, ${goal.y})`);
  await sleep(300);
  await holdKey(RIGHT, 1500);
  await waitFor(`[...document.querySelectorAll('h2')].some((h) => /Fase 1 concluída/.test(h.textContent))`, 10_000);
  await shot('fase-concluida');
  check('fase concluída', true);

  // 1º ano: ordenar números com cliques
  await js(`window.__leo.startLevel('f4', 1)`);
  await waitFor('window.__leo.levelActive() && window.__leo.state().onGround');
  const p2 = await js(`window.__leo.points().panels.find((x) => x.painel === '2')`);
  await js(`window.__leo.teleport(${p2.x - 30}, ${p2.y})`);
  await waitFor('window.__leo.state().onGround');
  await holdKey('e', 80);
  await waitFor(`document.querySelector('[role=dialog] .ord-card')`);
  const ord = await js(`window.__leo.solution('2')`);
  for (const i of ord.ordem) await click(`document.querySelectorAll('[role=dialog] .ord-card')[${i}]`);
  await waitFor(`/Muito bem/.test(document.querySelector('[role=dialog] .feedback')?.textContent ?? '')`);
  await shot('ordenar');
  check('1º ano: ordenar números com cliques', true);

  // Voz
  const vozes = await js(`new Promise((r) => { const f = () => r(speechSynthesis.getVoices().filter((v) => v.lang.startsWith('pt')).map((v) => v.name)); speechSynthesis.getVoices().length ? f() : (speechSynthesis.onvoiceschanged = f, setTimeout(f, 2000)); })`);
  check('narração disponível', typeof (await js(`typeof speechSynthesis`)) === 'string', `vozes pt: ${(vozes ?? []).join(', ') || 'nenhuma no modo sem janela'}`);
  check('sem erros no console', errors.length === 0, errors.slice(0, 3).join(' | '));

  // --faber: a voz Faber (Piper) gerada no próprio navegador
  if (process.argv.includes('--faber')) {
    await send('browsingContext.navigate', { context, url: `${BASE}/?teste=1&seed=1&voz=faber`, wait: 'complete' });
    await waitFor('crossOriginIsolated && window.__leo?.ready === true', 30_000);
    await sleep(500);
    await waitFor('crossOriginIsolated && window.__leo?.ready === true', 30_000);
    await js('window.__leo.faber.carregar(() => {})');
    const r = await js(`(async () => { const t = performance.now(); const pcm = await window.__leo.faber.gerar('Para abrir a porta, descubra: quanto é três quartos de oito?'); let pico = 0; for (const v of pcm) pico = Math.max(pico, Math.abs(v)); return { ms: performance.now() - t, s: pcm.length / 22050, pico, p: window.__leo.faber.ultimoTempo }; })()`);
    check('voz Faber gera a frase do desafio', r.s > 2.5 && r.pico > 0.05, `${Math.round(r.ms)} ms para ${r.s.toFixed(2)} s de áudio; fonemas ${Math.round(r.p.fonemas)} ms, modelo ${Math.round(r.p.modelo)} ms`);
  }
} catch (e) {
  check(`erro: ${e.message}`, false);
} finally {
  try {
    await send('session.end', {});
  } catch {
    /* já fechado */
  }
  ws.close();
  ff.kill();
  await sleep(500);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    /* perfil ainda em uso */
  }
}
const falhas = results.filter((r) => !r.ok).length;
console.log(falhas ? `\n✖ ${falhas} verificação(ões) falharam` : `\n✔ ${results.length} verificações no Firefox`);
process.exit(falhas ? 1 : 0);
