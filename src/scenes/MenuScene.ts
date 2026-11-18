import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../core/config';
import { reducedMotion } from '../core/state';
import { drawCaveBackground } from './background';

/** Cena de fundo dos menus: a caverna com cristais flutuando. As telas em HTML ficam por cima. */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1E1D3A');
    drawCaveBackground(this, GAME_WIDTH, GAME_HEIGHT, 11);
    const g = this.add.graphics();
    g.fillStyle(0x43427a, 1).fillRect(0, GAME_HEIGHT - 48, GAME_WIDTH, 48);
    g.fillStyle(0x5ed3e0, 1).fillRect(0, GAME_HEIGHT - 48, GAME_WIDTH, 6);
    const still = reducedMotion();
    for (let i = 0; i < 7; i++) {
      const c = this.add.image(80 + i * 135, 120 + ((i * 97) % 260), 'cristal').setAlpha(0.55).setScale(0.8 + (i % 3) * 0.25);
      if (!still) this.tweens.add({ targets: c, y: c.y - 14, duration: 1600 + i * 170, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }
}
