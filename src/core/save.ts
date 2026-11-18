import { z } from 'zod';
import { SettingsSchema, defaultSettings } from './settings';

/**
 * Salvamento local (seção 12). Sem dados pessoais: só progresso, tentativas, dicas, tempo e configurações.
 * Dados inválidos nunca travam o jogo: são guardados como cópia de segurança e o jogo recomeça limpo.
 */

export const SAVE_KEY = 'leo-sabido:save';
export const BACKUP_KEY = 'leo-sabido:save:backup';
export const SAVE_VERSION = 1;

const DesafioProgressSchema = z.object({
  tentativas: z.number().int().min(0),
  dicas: z.number().int().min(0),
  resolvido: z.boolean(),
});

export const FaseProgressSchema = z.object({
  concluida: z.boolean().default(false),
  vezes: z.number().int().min(0).default(0),
  /** Melhor quantidade de cristais coletados numa mesma partida. */
  cristais: z.number().int().min(0).default(0),
  cristaisTotal: z.number().int().min(0).default(0),
  desafios: z.record(z.string(), DesafioProgressSchema).default({}),
});

export const AnoProgressSchema = z.object({
  fases: z.record(z.string(), FaseProgressSchema).default({}),
  pecaRecuperada: z.boolean().default(false),
});

export const SaveSchema = z.object({
  versao: z.literal(SAVE_VERSION),
  /** Ano escolar escolhido na tela inicial (null = ainda não escolheu). */
  ano: z.number().int().min(1).max(6).nullable().default(null),
  introVista: z.boolean().default(false),
  settings: SettingsSchema.default(defaultSettings()),
  anos: z.record(z.string(), AnoProgressSchema).default({}),
  conquistas: z.array(z.string()).default([]),
  /** Tempo aproximado de atividade, em segundos. */
  tempoSegundos: z.number().min(0).default(0),
});

export type Save = z.infer<typeof SaveSchema>;
export type FaseProgress = z.infer<typeof FaseProgressSchema>;
export type LoadStatus = 'novo' | 'ok' | 'recuperado' | 'indisponivel';

export function defaultSave(): Save {
  return SaveSchema.parse({ versao: SAVE_VERSION });
}

/** Lê o texto salvo. Nunca lança erro. */
export function parseSave(raw: string | null): { save: Save; status: 'novo' | 'ok' | 'recuperado' } {
  if (raw === null || raw === '') return { save: defaultSave(), status: 'novo' };
  try {
    const parsed = SaveSchema.safeParse(migrate(JSON.parse(raw)));
    if (parsed.success) return { save: parsed.data, status: 'ok' };
  } catch {
    // JSON inválido: cai no caso de recuperação abaixo.
  }
  return { save: defaultSave(), status: 'recuperado' };
}

/** Ponto único para converter versões antigas do salvamento. Hoje só existe a versão 1. */
function migrate(data: unknown): unknown {
  return data;
}

/** Interface mínima de armazenamento (localStorage ou um falso nos testes). */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class SaveStore {
  constructor(private readonly storage: KeyValueStorage | null) {}

  load(): { save: Save; status: LoadStatus } {
    if (!this.storage) return { save: defaultSave(), status: 'indisponivel' };
    let raw: string | null;
    try {
      raw = this.storage.getItem(SAVE_KEY);
    } catch {
      return { save: defaultSave(), status: 'indisponivel' };
    }
    const result = parseSave(raw);
    if (result.status === 'recuperado' && raw !== null) {
      try {
        this.storage.setItem(BACKUP_KEY, raw);
      } catch {
        // sem espaço: segue sem cópia
      }
    }
    return result;
  }

  /** Grava; devolve false se o navegador recusar (modo privado, cota cheia). */
  write(save: Save): boolean {
    if (!this.storage) return false;
    try {
      this.storage.setItem(SAVE_KEY, JSON.stringify(save));
      return true;
    } catch {
      return false;
    }
  }
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function fromBase64(code: string): string {
  const bin = atob(code);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** Código de texto para levar o progresso a outro navegador (ex.: outro computador da escola). */
export function exportSave(save: Save): string {
  return toBase64(JSON.stringify(save));
}

export function importSave(code: string): Save | null {
  try {
    const parsed = SaveSchema.safeParse(migrate(JSON.parse(fromBase64(code.trim()))));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
