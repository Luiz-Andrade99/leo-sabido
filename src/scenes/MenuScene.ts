import Phaser from 'phaser';
import { reducedMotion } from '../core/state';
import { drawCaveBackground } from './background';

/** Cena de fundo dos menus: a caverna com cristais flutuando. As telas em HTML ficam por cima. */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1E1D3A');
    // A escala EXPAND pode deixar a tela mais larga ou mais alta que 960×540: o fundo cobre a área toda.
    const { width: W, height: H } = this.scale.gameSize;
    drawCaveBackground(this, W, H, 11);
    const g = this.add.graphics();
    g.fillStyle(0x43427a, 1).fillRect(0, H - 48, W, 48);
    g.fillStyle(0x5ed3e0, 1).fillRect(0, H - 48, W, 6);
    const still = reducedMotion();
    for (let i = 0; i < 7; i++) {
      const c = this.add.image(80 + i * (W / 7), 120 + ((i * 97) % Math.max(260, H - 280)), 'cristal').setAlpha(0.55).setScale(0.8 + (i % 3) * 0.25);
      if (!still) this.tweens.add({ targets: c, y: c.y - 14, duration: 1600 + i * 170, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }
}
