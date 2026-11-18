/**
 * Controle do Leo sem dependência do Phaser.
 * Recebe a intenção do jogador (input) e o que a física percebe (sense) a cada passo fixo
 * e devolve as velocidades a aplicar. Por ser puro, é testado sem navegador.
 */

export interface PlayerInput {
  left: boolean;
  right: boolean;
  /** Botão de pulo está pressionado neste passo. */
  jump: boolean;
}

export interface PlayerSense {
  onGround: boolean;
  vx: number;
  vy: number;
}

export type PlayerState = 'idle' | 'run' | 'jump' | 'fall';

export interface PlayerCommand {
  vx: number;
  /** Definido só quando o controle precisa alterar a velocidade vertical (pulo ou corte de pulo). */
  vy?: number;
  state: PlayerState;
}

export interface PlayerParams {
  /** px/s */
  runSpeed: number;
  /** px/s² ao acelerar no chão */
  groundAccel: number;
  /** px/s² ao acelerar no ar */
  airAccel: number;
  /** px/s² ao soltar as direções */
  decel: number;
  /** px/s (positivo; aplicado para cima) */
  jumpVelocity: number;
  /** Tempo após sair da borda em que o pulo ainda vale. */
  coyoteMs: number;
  /** Tempo em que um pulo apertado antes de pousar é lembrado. */
  bufferMs: number;
  /** Fração da velocidade de subida mantida ao soltar o pulo cedo. */
  jumpCutMultiplier: number;
}

export const DEFAULT_PLAYER_PARAMS: Readonly<PlayerParams> = Object.freeze({
  runSpeed: 220,
  groundAccel: 1800,
  airAccel: 1200,
  decel: 2200,
  jumpVelocity: 560,
  coyoteMs: 100,
  bufferMs: 120,
  jumpCutMultiplier: 0.45,
});

const RUN_THRESHOLD = 10;

function approach(value: number, target: number, maxDelta: number): number {
  if (value < target) return Math.min(value + maxDelta, target);
  if (value > target) return Math.max(value - maxDelta, target);
  return value;
}

export class PlayerController {
  readonly params: PlayerParams;
  private coyoteLeft = 0;
  private bufferLeft = 0;
  private prevJump = false;
  private jumping = false;
  private cutApplied = false;

  constructor(params: Partial<PlayerParams> = {}) {
    this.params = { ...DEFAULT_PLAYER_PARAMS, ...params };
  }

  reset(): void {
    this.coyoteLeft = 0;
    this.bufferLeft = 0;
    this.prevJump = false;
    this.jumping = false;
    this.cutApplied = false;
  }

  step(input: PlayerInput, sense: PlayerSense, dtMs: number): PlayerCommand {
    const p = this.params;
    const dt = dtMs / 1000;

    // Horizontal
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const target = dir * p.runSpeed;
    const rate = dir === 0 ? p.decel : sense.onGround ? p.groundAccel : p.airAccel;
    const vx = approach(sense.vx, target, rate * dt);

    // Timers de chão e de pulo
    if (sense.onGround) {
      this.coyoteLeft = p.coyoteMs;
      if (sense.vy >= 0) this.jumping = false;
    }
    if (input.jump && !this.prevJump) this.bufferLeft = p.bufferMs;
    this.prevJump = input.jump;

    let vy: number | undefined;
    let jumpedNow = false;
    if (this.bufferLeft > 0 && this.coyoteLeft > 0) {
      vy = -p.jumpVelocity;
      jumpedNow = true;
      this.bufferLeft = 0;
      this.coyoteLeft = 0;
      this.jumping = true;
      this.cutApplied = false;
    } else if (this.jumping && !this.cutApplied && !input.jump && sense.vy < 0) {
      vy = sense.vy * p.jumpCutMultiplier;
      this.cutApplied = true;
    }

    // Os timers só correm depois de usados neste passo.
    if (!sense.onGround) this.coyoteLeft = Math.max(0, this.coyoteLeft - dtMs);
    this.bufferLeft = Math.max(0, this.bufferLeft - dtMs);

    let state: PlayerState;
    if (jumpedNow) state = 'jump';
    else if (sense.onGround) state = Math.abs(vx) > RUN_THRESHOLD ? 'run' : 'idle';
    else state = (vy ?? sense.vy) < 0 ? 'jump' : 'fall';

    return vy === undefined ? { vx, state } : { vx, vy, state };
  }
}
