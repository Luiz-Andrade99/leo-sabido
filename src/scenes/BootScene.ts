import Phaser from 'phaser';
import { getState } from '../core/state';
import { EV } from './events';

const LEO_FRAMES = ['leo-idle', 'leo-run1', 'leo-run2', 'leo-run3', 'leo-jump', 'leo-fall', 'leo-think'];
const OBJECTS = [
  'caixa',
  'plataforma',
  'bandeira-off',
  'bandeira-on',
  'painel',
  'painel-ok',
  'pedra-ponte',
  'cristal',
  'engrenagem',
  'porta',
  'portal',
  'placa',
  'bloco',
  'apoio',
  'parafuso',
  'chave',
  'lampada',
  'frasco',
  'bolota',
];

/** Carrega a arte e as fases e registra as animações. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    const { width, height } = this.scale;
    const label = this.add.text(width / 2, height / 2, 'Carregando…', { fontFamily: 'system-ui, sans-serif', fontSize: '24px', color: '#F6EEDC' }).setOrigin(0.5);
    this.load.on('progress', (p: number) => label.setText(`Carregando… ${Math.round(p * 100)}%`));

    for (const f of LEO_FRAMES) this.load.svg(f, `assets/leo/${f}.svg`);
    for (const o of OBJECTS) this.load.svg(o, `assets/objects/${o}.svg`);
    for (const t of ['caverna', 'vila', 'castelo', 'cidade', 'laboratorio', 'floresta']) this.load.svg(`tiles-${t}`, `assets/tiles/${t}.svg`);
    const maps = new Set(['teste']);
    for (const a of getState().mundos.anos) for (const f of a.fases) maps.add(f.mapa);
    for (const m of maps) this.load.tilemapTiledJSON(m, `levels/${m}.tmj`);
  }

  create(): void {
    for (const key of ['leo-idle', 'leo-jump', 'leo-fall', 'leo-think']) this.anims.create({ key, frames: [{ key }], frameRate: 1 });
    this.anims.create({
      key: 'leo-run',
      frames: [{ key: 'leo-run1' }, { key: 'leo-run2' }, { key: 'leo-run3' }, { key: 'leo-run2' }],
      frameRate: 10,
      repeat: -1,
    });
    this.game.events.emit(EV.bootDone);
  }
}
