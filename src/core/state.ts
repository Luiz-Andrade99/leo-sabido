import { loadAllContent, loadMundos } from '../content/bundle';
import { ContentRepository } from '../content/repository';
import type { AnoInfo, FaseInfo, Mundos } from '../content/schema';
import { SaveStore, type LoadStatus, type Save } from './save';
import type { Settings } from './settings';

/**
 * Estado global do jogo: salvamento, conteúdo e configurações.
 * Toda alteração passa por commit()/updateSettings(), que gravam no navegador.
 */
export class GameState {
  save: Save;
  readonly loadStatus: LoadStatus;
  readonly mundos: Mundos;
  readonly repo: ContentRepository;
  /** false quando o navegador recusa gravar (modo privado, cota cheia). */
  persistent = true;
  private readonly listeners = new Set<(s: Settings) => void>();

  constructor(private readonly store: SaveStore) {
    const loaded = store.load();
    this.save = loaded.save;
    this.loadStatus = loaded.status;
    this.persistent = loaded.status !== 'indisponivel';
    this.mundos = loadMundos();
    this.repo = new ContentRepository(loadAllContent());
  }

  get settings(): Settings {
    return this.save.settings;
  }

  commit(next: Save): void {
    this.save = next;
    this.persistent = this.store.write(next);
  }

  updateSettings(patch: Partial<Settings>): void {
    this.commit({ ...this.save, settings: { ...this.save.settings, ...patch } });
    for (const fn of this.listeners) fn(this.save.settings);
  }

  onSettings(fn: (s: Settings) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  anoInfo(ano: number): AnoInfo {
    const info = this.mundos.anos.find((a) => a.ano === ano);
    if (!info) throw new Error(`Ano ${ano} inexistente`);
    return info;
  }

  faseInfo(ano: number, faseId: string): FaseInfo {
    const f = this.anoInfo(ano).fases.find((x) => x.id === faseId);
    if (!f) throw new Error(`Fase ${faseId} inexistente no ${ano}º ano`);
    return f;
  }
}

let current: GameState | null = null;

function safeLocalStorage(): Storage | null {
  try {
    const ls = window.localStorage;
    const probe = '__leo_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    return null;
  }
}

export function initState(): GameState {
  current = new GameState(new SaveStore(safeLocalStorage()));
  return current;
}

export function getState(): GameState {
  if (!current) throw new Error('Estado do jogo não iniciado');
  return current;
}

/** Animações reduzidas: preferência do sistema, da URL ou das configurações do jogo. */
export function reducedMotion(): boolean {
  const os = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  const url = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('animacoes') === 'reduzidas';
  return os || url || (current?.settings.reduzirAnimacoes ?? false);
}
