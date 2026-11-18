import Phaser from 'phaser';
import { PlayerController, type PlayerInput, type PlayerState } from './controller';

const ANIM_BY_STATE: Record<PlayerState, string> = {
  idle: 'leo-idle',
  run: 'leo-run',
  jump: 'leo-jump',
  fall: 'leo-fall',
};

/** O Leo no mundo: sprite + corpo físico. Toda a decisão de movimento fica no PlayerController. */
export class Leo extends Phaser.Physics.Arcade.Sprite {
  readonly controller = new PlayerController();
  state_: PlayerState = 'idle';
  /** true no passo em que um pulo começou (para o som do pulo). */
  jumpedThisStep = false;
  private thinking = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'leo-idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    const body = this.arcadeBody;
    body.setSize(22, 50);
    body.setOffset(13, 9); // base do corpo = sola da bota (y=59 no quadro de 64)
    body.setMaxVelocityY(900);
    this.setDepth(10);
  }

  get arcadeBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  get onGround(): boolean {
    return this.arcadeBody.blocked.down || this.arcadeBody.touching.down;
  }

  /** Chamado a cada passo fixo da física (60 Hz), nunca por quadro de tela. */
  physicsStep(input: PlayerInput, dtMs: number): void {
    const b = this.arcadeBody;
    const cmd = this.controller.step(input, { onGround: this.onGround, vx: b.velocity.x, vy: b.velocity.y }, dtMs);
    b.setVelocityX(cmd.vx);
    if (cmd.vy !== undefined) b.setVelocityY(cmd.vy);
    if (cmd.vx > 1) this.setFlipX(false);
    else if (cmd.vx < -1) this.setFlipX(true);
    this.jumpedThisStep = cmd.vy !== undefined && cmd.vy <= -this.controller.params.jumpVelocity;
    this.state_ = cmd.state;
    if (!this.thinking) this.play(ANIM_BY_STATE[cmd.state], true);
  }

  /** Pose de "pensando" enquanto um desafio está aberto. */
  setThinking(on: boolean): void {
    this.thinking = on;
    if (on) {
      this.arcadeBody.setVelocityX(0);
      this.play('leo-think', true);
    }
  }

  respawn(x: number, y: number): void {
    this.controller.reset();
    this.arcadeBody.reset(x, y);
    this.setPosition(x, y);
  }
}
