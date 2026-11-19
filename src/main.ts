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
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
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
    solution: (painel) => lvl().testSolution(painel),
    save: () => structuredClone(getState().save),
    faber: options.vozFaber ? (faberCliente() ?? undefined) : undefined,
    vozCache: () => narrador.tamanhoCache,
  };
  window.__leo = hooks;
}
