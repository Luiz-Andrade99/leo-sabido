import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, GRAVITY_Y, PHYSICS_FPS } from './core/config';
import { Flow } from './core/flow';
import { readLaunchOptions } from './core/launch';
import { getState, initState } from './core/state';
import { BootScene } from './scenes/BootScene';
import { EV } from './scenes/events';
import { LevelScene } from './scenes/LevelScene';
import { MenuScene } from './scenes/MenuScene';
import type { LeoTestHooks } from './scenes/testHooks';
import { mountHud } from './ui/hud';
import { mountScreens } from './ui/screens';
import './ui/styles.css';
import { faberCliente, iniciarFaber, montarAvisosVoz, narrador } from './voz/narrador';

const options = readLaunchOptions(window.location.search);
const state = initState();
if (options.apoioFromUrl) state.updateSettings({ apoio: options.apoio });

mountHud(document.getElementById('hud')!);
mountScreens(document.getElementById('screen')!);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1E1D3A',
  // EXPAND: o jogo preenche a tela inteira (sem faixas pretas); a câmera das fases ajusta o zoom (scenes/camera.ts).
  scale: { mode: Phaser.Scale.EXPAND, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: GRAVITY_Y }, fps: PHYSICS_FPS, fixedStep: true, debug: options.debugPhysics },
  },
  // ?fps=144 força o laço de jogo em outra taxa para provar que a física não muda.
  fps: options.fps ? { target: options.fps, forceSetTimeOut: true } : undefined,
  input: { keyboard: true, touch: true },
  scene: [BootScene, MenuScene, LevelScene],
});
game.registry.set('options', options);

const flow = new Flow(game);
montarAvisosVoz(document.getElementById('app')!);

game.events.once(EV.bootDone, () => {
  flow.start();
  // Voz Faber: começa a baixar sozinha depois que o jogo carregou (uma vez; depois fica no aparelho).
  iniciarFaber({ teste: options.testHooks, vozFaber: options.vozFaber });
  if (options.testHooks) installTestHooks();
});

function installTestHooks(): void {
  const lvl = (): LevelScene => {
    const l = flow.activeLevel;
    if (!l) throw new Error('Nenhuma fase ativa');
    return l;
  };
  const hooks: LeoTestHooks = {
    ready: true,
    screen: () => document.querySelector('#screen:not([hidden]) .screen')?.id ?? null,
    levelActive: () => (flow.activeLevel?.isReady() ?? false) && game.scene.isActive('level'),
    startLevel: (faseId, ano) => flow.startLevel(faseId, ano ?? 3),
    state: () => lvl().testState(),
    points: () => lvl().testPoints(),
    teleport: (x, y) => lvl().testTeleport(x, y),
    apexReset: () => lvl().testApexReset(),
    cair: () => lvl().testCair(),
    leoNaTela: () => lvl().testLeoNaTela(),
    vazamentosDialogo: () => {
      const fora: string[] = [];
      const dlg = document.querySelector<HTMLElement>('[role=dialog] .dlg, .dlg[role=dialog]');
      if (!dlg) return ['sem janela de desafio aberta'];
      const d = dlg.getBoundingClientRect();
      if (d.left < -1 || d.right > window.innerWidth + 1) fora.push('a janela passa da largura da tela');
      for (const cartao of dlg.querySelectorAll<HTMLElement>('.opt, .ord-card')) {
        const c = cartao.getBoundingClientRect();
        for (const filho of cartao.querySelectorAll<HTMLElement>('*')) {
          const r = filho.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (r.left < c.left - 1 || r.right > c.right + 1 || r.top < c.top - 1 || r.bottom > c.bottom + 1) {
            const nomeCartao = cartao.getAttribute('aria-label') ?? cartao.textContent?.trim() ?? '';
            fora.push(`${nomeCartao}: <${filho.tagName.toLowerCase()} class="${filho.getAttribute('class') ?? ''}"> sai do cartão`);
            break;
          }
        }
      }
      return fora;
    },
    canvasRect: () => {
      const r = game.canvas.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    },
    solution: (painel) => lvl().testSolution(painel),
    save: () => structuredClone(getState().save),
    faber: options.vozFaber ? (faberCliente() ?? undefined) : undefined,
    vozCache: () => narrador.tamanhoCache,
  };
  window.__leo = hooks;
}
