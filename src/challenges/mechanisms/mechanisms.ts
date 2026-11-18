import Phaser from 'phaser';
import { TILE_SIZE } from '../../core/config';
import { MovingPlatform } from '../../interactions/objects';
import type { MechanismType } from '../../levels/ascii';

/**
 * Mecanismos de cenário: o que o acerto de um desafio muda no mundo.
 * Não sabem nada de matemática — só obedecem a activate().
 */
export interface Mechanism {
  readonly tipo: MechanismType;
  activated: boolean;
  /** Corpos sólidos para colidir com o Leo e as caixas. */
  readonly colliders: Phaser.Types.Physics.Arcade.ArcadeColliderType[];
  activate(onDone?: () => void): void;
  physicsStep?(dtMs: number): void;
}

export interface CellRun {
  x: number;
  y: number;
  width: number;
}

function cells(runs: CellRun[]): { x: number; y: number }[] {
  return runs.flatMap((r) => Array.from({ length: Math.round(r.width / TILE_SIZE) }, (_, i) => ({ x: r.x + i * TILE_SIZE, y: r.y })));
}

/** Ponte ou blocos: pedras escondidas que sobem e viram chão. A ordem segue de baixo para cima, da esquerda para a direita. */
export class RisingBlocks implements Mechanism {
  activated = false;
  readonly colliders: Phaser.Types.Physics.Arcade.ArcadeColliderType[];
  private readonly group: Phaser.Physics.Arcade.StaticGroup;
  private readonly stones: { img: Phaser.Physics.Arcade.Image; finalY: number }[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    readonly tipo: 'ponte' | 'blocos',
    runs: CellRun[],
    private readonly reducedMotion: boolean,
  ) {
    this.group = scene.physics.add.staticGroup();
    this.colliders = [this.group];
    const texture = tipo === 'ponte' ? 'pedra-ponte' : 'bloco';
    const ordered = cells(runs).sort((a, b) => b.y - a.y || a.x - b.x);
    for (const c of ordered) {
      const finalY = c.y + TILE_SIZE / 2;
      const img = this.group.create(c.x + TILE_SIZE / 2, finalY, texture) as Phaser.Physics.Arcade.Image;
      (img.body as Phaser.Physics.Arcade.StaticBody).enable = false;
      img.setY(finalY + TILE_SIZE * 3).setAlpha(0).setDepth(2);
      this.stones.push({ img, finalY });
    }
  }

  activate(onDone?: () => void): void {
    if (this.activated) return;
    this.activated = true;
    const settle = (s: { img: Phaser.Physics.Arcade.Image; finalY: number }): void => {
      s.img.setY(s.finalY).setAlpha(1);
      const body = s.img.body as Phaser.Physics.Arcade.StaticBody;
      body.enable = true;
      body.updateFromGameObject();
    };
    if (this.reducedMotion) {
      this.stones.forEach(settle);
      onDone?.();
      return;
    }
    this.stones.forEach((s, i) => {
      this.scene.tweens.add({
        targets: s.img,
        y: s.finalY,
        alpha: 1,
        delay: i * 110,
        duration: 380,
        ease: 'Back.easeOut',
        onComplete: () => {
          settle(s);
          if (i === this.stones.length - 1) onDone?.();
        },
      });
    });
  }
}

/** Porta de engrenagens: sólida até o desafio ser resolvido; então desliza para cima e libera a passagem. */
export class Door implements Mechanism {
  readonly tipo = 'porta' as const;
  activated = false;
  readonly colliders: Phaser.Types.Physics.Arcade.ArcadeColliderType[];
  private readonly group: Phaser.Physics.Arcade.StaticGroup;

  constructor(
    private readonly scene: Phaser.Scene,
    runs: CellRun[],
    private readonly reducedMotion: boolean,
  ) {
    this.group = scene.physics.add.staticGroup();
    this.colliders = [this.group];
    for (const c of cells(runs)) {
      (this.group.create(c.x + TILE_SIZE / 2, c.y + TILE_SIZE / 2, 'porta') as Phaser.Physics.Arcade.Image).setDepth(2);
    }
  }

  activate(onDone?: () => void): void {
    if (this.activated) return;
    this.activated = true;
    const parts = this.group.getChildren() as Phaser.Physics.Arcade.Image[];
    for (const p of parts) (p.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    if (this.reducedMotion) {
      parts.forEach((p) => p.setVisible(false));
      onDone?.();
      return;
    }
    this.scene.tweens.add({
      targets: parts,
      y: `-=${TILE_SIZE * 3}`,
      alpha: 0,
      duration: 900,
      ease: 'Sine.easeIn',
      onComplete: () => onDone?.(),
    });
  }
}

/** Elevador: plataforma parada até o desafio ser resolvido; depois sobe e desce continuamente. */
export class Elevator implements Mechanism {
  readonly tipo = 'elevador' as const;
  activated = false;
  readonly colliders: Phaser.Types.Physics.Arcade.ArcadeColliderType[];
  readonly platform: MovingPlatform;

  constructor(scene: Phaser.Scene, run: CellRun, dy: number, periodMs: number) {
    // A plataforma fica no topo da célula, rente ao chão do mapa.
    this.platform = new MovingPlatform(scene, run.x, run.y + TILE_SIZE - 16, run.width, 0, dy, periodMs, false);
    this.colliders = [this.platform.image];
  }

  activate(onDone?: () => void): void {
    if (this.activated) return;
    this.activated = true;
    this.platform.active = true;
    onDone?.();
  }

  physicsStep(dtMs: number): void {
    this.platform.physicsStep(dtMs);
  }
}

export function createMechanism(
  scene: Phaser.Scene,
  tipo: MechanismType,
  runs: CellRun[],
  opts: { reducedMotion: boolean; dy: number; periodMs: number },
): Mechanism {
  switch (tipo) {
    case 'porta':
      return new Door(scene, runs, opts.reducedMotion);
    case 'elevador':
      return new Elevator(scene, runs[0]!, opts.dy, opts.periodMs);
    default:
      return new RisingBlocks(scene, tipo, runs, opts.reducedMotion);
  }
}
