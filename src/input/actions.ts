import Phaser from 'phaser';
import type { PlayerInput } from '../player/controller';
import { ACTIONS, DEFAULT_BINDINGS, type Action, type Bindings } from '../core/settings';

export type { Action, Bindings };

/**
 * Lê as ações do teclado e dos controles de toque.
 * Teclas registradas SEM captura global, para que campos de texto (HTML) recebam espaço, letras e setas.
 */
export class ActionInput {
  private keys: Record<Action, Phaser.Input.Keyboard.Key[]>;
  /** Estados virtuais (controles de toque e testes automatizados). */
  readonly virtual: Record<Action, boolean> = { left: false, right: false, jump: false, interact: false };
  private enabled = true;
  /** Toques rápidos (apertar e soltar no mesmo quadro) não se perdem: ficam registrados até serem lidos. */
  private interactLatched = false;
  private jumpLatched = false;

  constructor(
    private readonly scene: Phaser.Scene,
    bindings: Bindings = DEFAULT_BINDINGS,
  ) {
    const kb = scene.input.keyboard!;
    const make = (codes: string[]): Phaser.Input.Keyboard.Key[] =>
      codes.flatMap((c) => {
        try {
          return [kb.addKey(c, false)];
        } catch {
          return [];
        }
      });
    this.keys = Object.fromEntries(ACTIONS.map((a) => [a, make(bindings[a])])) as Record<Action, Phaser.Input.Keyboard.Key[]>;
    for (const k of this.keys.interact) k.on('down', () => (this.interactLatched = this.enabled));
    for (const k of this.keys.jump) k.on('down', () => (this.jumpLatched = this.enabled));
  }

  /** Desliga o controle do Leo (ex.: enquanto um desafio está aberto). */
  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) {
      this.interactLatched = false;
      this.jumpLatched = false;
      Object.values(this.keys)
        .flat()
        .forEach((k) => k.reset());
      for (const a of ACTIONS) this.virtual[a] = false;
    }
  }

  private down(a: Action): boolean {
    return this.enabled && (this.virtual[a] || this.keys[a].some((k) => k.isDown));
  }

  /** Toque: pressionar o botão de pulo também registra um toque rápido. */
  pressVirtual(a: Action, on: boolean): void {
    if (!this.enabled) return;
    this.virtual[a] = on;
    if (on && a === 'jump') this.jumpLatched = true;
    if (on && a === 'interact') this.interactLatched = true;
  }

  read(): PlayerInput {
    const jump = this.down('jump') || (this.enabled && this.jumpLatched);
    this.jumpLatched = false;
    return { left: this.down('left'), right: this.down('right'), jump };
  }

  interactPressed(): boolean {
    if (!this.enabled) return false;
    const pressed = this.interactLatched || this.virtual.interact;
    this.interactLatched = false;
    this.virtual.interact = false;
    return pressed;
  }

  destroy(): void {
    Object.values(this.keys)
      .flat()
      .forEach((k) => this.scene.input.keyboard?.removeKey(k, true));
  }
}
