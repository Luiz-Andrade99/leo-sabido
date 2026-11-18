import { z } from 'zod';

/** Configurações do jogador (seção 9 — acessibilidade). Guardadas só neste navegador. */

export const ACTIONS = ['left', 'right', 'jump', 'interact'] as const;
export type Action = (typeof ACTIONS)[number];
export type Bindings = Record<Action, string[]>;

export const ACTION_LABELS: Record<Action, string> = {
  left: 'Andar para a esquerda',
  right: 'Andar para a direita',
  jump: 'Pular',
  interact: 'Examinar / interagir',
};

export const DEFAULT_BINDINGS: Bindings = {
  left: ['LEFT', 'A'],
  right: ['RIGHT', 'D'],
  jump: ['SPACE', 'UP', 'W'],
  interact: ['E', 'ENTER'],
};

const KeyList = z.array(z.string().regex(/^[A-Z0-9_]+$/)).min(1).max(4);
export const BindingsSchema = z.object({ left: KeyList, right: KeyList, jump: KeyList, interact: KeyList });

export const SettingsSchema = z.object({
  volumeMusica: z.number().min(0).max(1).default(0.4),
  volumeEfeitos: z.number().min(0).max(1).default(0.8),
  volumeVoz: z.number().min(0).max(1).default(1),
  reduzirAnimacoes: z.boolean().default(false),
  apoio: z.enum(['acompanhado', 'padrao', 'desafio']).default('padrao'),
  /** Plataformas extras e móveis mais lentas: dispensa saltos de precisão. */
  modoAssistido: z.boolean().default(false),
  /** Lê as instruções dos desafios em voz alta ao abrir. */
  narracaoAuto: z.boolean().default(false),
  /** Nome da voz escolhida para a narração ('' = a mais natural disponível no aparelho). */
  voz: z.string().max(200).default(''),
  textoGrande: z.boolean().default(false),
  controlesToque: z.enum(['auto', 'sempre', 'nunca']).default('auto'),
  teclas: BindingsSchema.default(DEFAULT_BINDINGS),
});

export type Settings = z.infer<typeof SettingsSchema>;

export function defaultSettings(): Settings {
  return SettingsSchema.parse({});
}

/** Nomes legíveis das teclas para a tela de configurações. */
export function keyLabel(key: string): string {
  const names: Record<string, string> = {
    LEFT: '←',
    RIGHT: '→',
    UP: '↑',
    DOWN: '↓',
    SPACE: 'Espaço',
    ENTER: 'Enter',
    SHIFT: 'Shift',
    CTRL: 'Ctrl',
    TAB: 'Tab',
  };
  return names[key] ?? key;
}

const DIGITS = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];

/** Converte KeyboardEvent.code no nome de tecla usado pelo Phaser. null = tecla não permitida. */
export function keyFromCode(code: string): string | null {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit\d$/.test(code)) return DIGITS[Number(code.slice(5))]!;
  const map: Record<string, string> = {
    ArrowLeft: 'LEFT',
    ArrowRight: 'RIGHT',
    ArrowUp: 'UP',
    ArrowDown: 'DOWN',
    Space: 'SPACE',
    Enter: 'ENTER',
    ShiftLeft: 'SHIFT',
    ShiftRight: 'SHIFT',
    ControlLeft: 'CTRL',
    ControlRight: 'CTRL',
  };
  return map[code] ?? null; // Esc e Tab ficam reservados para menus e navegação.
}

/**
 * Define `key` como tecla principal de `action`. Se outra ação usava essa tecla, ela perde a tecla;
 * se com isso ficaria sem nenhuma, recebe a antiga tecla principal de `action` (troca).
 */
export function remapKey(bindings: Bindings, action: Action, key: string): Bindings {
  const next: Bindings = structuredClone(bindings);
  const oldPrimary = next[action][0];
  next[action] = [key, ...next[action].filter((k) => k !== key)].slice(0, 4);
  for (const other of ACTIONS) {
    if (other === action || !next[other].includes(key)) continue;
    next[other] = next[other].filter((k) => k !== key);
    if (next[other].length === 0) {
      next[other] = [oldPrimary ?? DEFAULT_BINDINGS[other][0]!];
      next[action] = next[action].filter((k) => k !== oldPrimary);
    }
  }
  return next;
}
