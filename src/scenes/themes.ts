import type Phaser from 'phaser';
import type { MusicTheme } from '../audio/audio';
import { drawCastleBackground, drawCaveBackground, drawCityBackground, drawForestBackground, drawLabBackground, drawVillageBackground } from './background';

/** Identidade visual e sonora de cada mundo. A cena de fase é a mesma; só o tema muda. */
export interface WorldTheme {
  bg: string;
  collectible: string;
  /** Nome do coletável no singular e no plural (mensagens e HUD). */
  collectibleName: [string, string];
  collectibleIcon: string;
  music: MusicTheme;
  drawBackground(scene: Phaser.Scene, w: number, h: number): void;
}

export const THEMES: Record<string, WorldTheme> = {
  caverna: {
    bg: '#1E1D3A',
    collectible: 'cristal',
    collectibleName: ['cristal', 'cristais'],
    collectibleIcon: '◆',
    music: 'caverna',
    drawBackground: drawCaveBackground,
  },
  vila: {
    bg: '#9ED3EE',
    collectible: 'parafuso',
    collectibleName: ['parafuso dourado', 'parafusos dourados'],
    collectibleIcon: '⬢',
    music: 'vila',
    drawBackground: drawVillageBackground,
  },
  castelo: {
    bg: '#55527F',
    collectible: 'chave',
    collectibleName: ['chave dourada', 'chaves douradas'],
    collectibleIcon: '⚷',
    music: 'castelo',
    drawBackground: drawCastleBackground,
  },
  cidade: {
    bg: '#3E6F78',
    collectible: 'lampada',
    collectibleName: ['lâmpada', 'lâmpadas'],
    collectibleIcon: '💡',
    music: 'cidade',
    drawBackground: drawCityBackground,
  },
  laboratorio: {
    bg: '#2B3442',
    collectible: 'frasco',
    collectibleName: ['frasco', 'frascos'],
    collectibleIcon: '⚗',
    music: 'laboratorio',
    drawBackground: drawLabBackground,
  },
  floresta: {
    bg: '#B7E4C7',
    collectible: 'bolota',
    collectibleName: ['bolota', 'bolotas'],
    collectibleIcon: '🌰',
    music: 'floresta',
    drawBackground: drawForestBackground,
  },
};

export function themeFor(name: string): WorldTheme {
  return THEMES[name] ?? THEMES.caverna!;
}
