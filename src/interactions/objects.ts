import Phaser from 'phaser';

/**
 * Plataforma móvel com movimento suave de ida e volta.
 * A posição-alvo é calculada pelo tempo acumulado em passos fixos, e o corpo recebe a velocidade
 * necessária para chegar lá — assim quem está em cima é carregado corretamente pela física.
 * Inativa (elevador desligado), fica parada e sólida na posição inicial.
 */
export class MovingPlatform {
  readonly image: Phaser.Physics.Arcade.Image;
  private t = 0;
  private readonly x0: number;
  private readonly y0: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    private readonly dx: number,
    private readonly dy: number,
    private readonly periodMs: number,
    public active = true,
  ) {
    this.image = scene.physics.add.image(x, y, 'plataforma').setOrigin(0, 0).setDepth(4);
    this.image.setDisplaySize(width, 16);
    const body = this.image.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setSize(width / this.image.scaleX, 16 / this.image.scaleY);
    this.x0 = x;
    this.y0 = y;
  }

  private target(tMs: number): { x: number; y: number } {
    const k = (1 - Math.cos((2 * Math.PI * tMs) / this.periodMs)) / 2;
    return { x: this.x0 + this.dx * k, y: this.y0 + this.dy * k };
  }

  physicsStep(dtMs: number): void {
    const body = this.image.body as Phaser.Physics.Arcade.Body;
    if (!this.active) {
      body.setVelocity(0, 0);
      return;
    }
    this.t += dtMs;
    const next = this.target(this.t + dtMs);
    body.setVelocity(((next.x - body.x) * 1000) / dtMs, ((next.y - body.y) * 1000) / dtMs);
  }
}

/** Ponto de controle: ao tocar, vira o novo lugar de reaparecimento. */
export class Checkpoint {
  readonly image: Phaser.GameObjects.Image;
  readonly zone: Phaser.GameObjects.Zone;
  active = false;

  constructor(
    scene: Phaser.Scene,
    readonly x: number,
    readonly y: number,
  ) {
    this.image = scene.add.image(x, y, 'bandeira-off').setOrigin(0.5, 1).setDepth(2);
    this.zone = scene.add.zone(x, y - 32, 40, 64);
    scene.physics.add.existing(this.zone, true);
  }

  activate(): boolean {
    if (this.active) return false;
    this.active = true;
    this.image.setTexture('bandeira-on');
    return true;
  }
}

/** Caixa empurrável. Volta ao lugar de origem se cair num buraco. */
export class PushBox {
  readonly sprite: Phaser.Physics.Arcade.Sprite;

  constructor(
    scene: Phaser.Scene,
    readonly homeX: number,
    readonly homeY: number,
  ) {
    this.sprite = scene.physics.add.sprite(homeX, homeY, 'caixa').setOrigin(0.5, 1).setDepth(5);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setDragX(1400);
    body.setMaxVelocity(140, 900);
  }

  resetHome(): void {
    (this.sprite.body as Phaser.Physics.Arcade.Body).reset(this.homeX, this.homeY);
  }
}

/** Cristal coletável. */
export class Crystal {
  readonly image: Phaser.GameObjects.Image;
  readonly zone: Phaser.GameObjects.Zone;
  collected = false;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly x: number,
    readonly y: number,
    private readonly reducedMotion: boolean,
    texture = 'cristal',
  ) {
    this.image = scene.add.image(x, y, texture).setDepth(3);
    this.zone = scene.add.zone(x, y, 24, 28);
    scene.physics.add.existing(this.zone, true);
    if (!reducedMotion) scene.tweens.add({ targets: this.image, y: y - 5, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  collect(): boolean {
    if (this.collected) return false;
    this.collected = true;
    (this.zone.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    if (this.reducedMotion) this.image.setVisible(false);
    else this.scene.tweens.add({ targets: this.image, y: this.image.y - 30, alpha: 0, scale: 1.4, duration: 300, onComplete: () => this.image.setVisible(false) });
    return true;
  }
}
