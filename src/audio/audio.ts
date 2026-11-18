/**
 * Áudio original sintetizado com Web Audio: nenhum arquivo de terceiros, nenhuma licença a gerenciar.
 * Três canais com volume próprio (música, efeitos, voz). Só toca depois de um gesto do jogador.
 * Sons de erro são suaves e nunca punitivos.
 */

export type Sfx =
  | 'click'
  | 'jump'
  | 'collect'
  | 'checkpoint'
  | 'open'
  | 'correct'
  | 'incorrect'
  | 'hint'
  | 'mechanism'
  | 'complete'
  | 'respawn';

export type MusicTheme = 'menu' | 'caverna' | 'vila' | 'castelo' | 'cidade' | 'laboratorio' | 'floresta';

type Note = [freq: number, start: number, dur: number, type?: OscillatorType, gain?: number];

const SFX: Record<Sfx, Note[]> = {
  click: [[880, 0, 0.05, 'triangle', 0.25]],
  jump: [
    [392, 0, 0.08, 'square', 0.08],
    [523, 0.05, 0.08, 'square', 0.06],
  ],
  collect: [
    [988, 0, 0.08, 'triangle', 0.3],
    [1319, 0.07, 0.12, 'triangle', 0.3],
  ],
  checkpoint: [
    [523, 0, 0.1, 'triangle', 0.3],
    [659, 0.1, 0.1, 'triangle', 0.3],
    [784, 0.2, 0.18, 'triangle', 0.3],
  ],
  open: [[660, 0, 0.12, 'sine', 0.25]],
  correct: [
    [523, 0, 0.12, 'triangle', 0.35],
    [659, 0.1, 0.12, 'triangle', 0.35],
    [784, 0.2, 0.12, 'triangle', 0.35],
    [1047, 0.3, 0.3, 'triangle', 0.35],
  ],
  incorrect: [
    [330, 0, 0.18, 'sine', 0.25],
    [294, 0.16, 0.24, 'sine', 0.22],
  ],
  hint: [
    [1175, 0, 0.1, 'sine', 0.25],
    [1568, 0.08, 0.2, 'sine', 0.2],
  ],
  mechanism: [
    [98, 0, 0.5, 'sawtooth', 0.12],
    [147, 0.1, 0.5, 'triangle', 0.15],
  ],
  complete: [
    [523, 0, 0.15, 'triangle', 0.35],
    [659, 0.15, 0.15, 'triangle', 0.35],
    [784, 0.3, 0.15, 'triangle', 0.35],
    [1047, 0.45, 0.5, 'triangle', 0.35],
    [784, 0.45, 0.5, 'sine', 0.2],
  ],
  respawn: [[440, 0, 0.15, 'sine', 0.18]],
};

/** Escala pentatônica (sem "notas erradas") para música generativa calma. */
const THEMES: Record<MusicTheme, { scale: number[]; drone: number; tempoMs: number }> = {
  menu: { scale: [392, 440, 523, 587, 659, 784], drone: 196, tempoMs: 600 },
  caverna: { scale: [220, 262, 294, 330, 392, 440, 523], drone: 110, tempoMs: 750 },
  vila: { scale: [523, 587, 659, 784, 880, 1047], drone: 262, tempoMs: 480 },
  castelo: { scale: [294, 330, 392, 440, 523, 587], drone: 147, tempoMs: 640 },
  cidade: { scale: [349, 392, 440, 523, 587, 698], drone: 175, tempoMs: 420 },
  laboratorio: { scale: [247, 294, 330, 370, 440, 494], drone: 123, tempoMs: 560 },
  floresta: { scale: [392, 440, 494, 587, 659, 784], drone: 196, tempoMs: 700 },
};

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private volumes = { musica: 0.4, efeitos: 0.8, voz: 1 };
  private musicTimer: number | undefined;
  private drone: OscillatorNode | null = null;
  private theme: MusicTheme | null = null;
  private step = 0;

  /** Chamar dentro de um clique/toque: navegadores só liberam áudio após um gesto. */
  unlock(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    try {
      this.ctx = new Ctor();
    } catch {
      return;
    }
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.musicBus = this.ctx.createGain();
    this.sfxBus = this.ctx.createGain();
    this.musicBus.connect(this.master);
    this.sfxBus.connect(this.master);
    this.applyVolumes();
    if (this.theme) this.startMusic(this.theme, true);
  }

  setVolumes(v: { musica: number; efeitos: number; voz: number }): void {
    this.volumes = { ...v };
    this.applyVolumes();
  }

  get voiceVolume(): number {
    return this.volumes.voz;
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.musicBus || !this.sfxBus) return;
    const t = this.ctx.currentTime;
    this.musicBus.gain.setTargetAtTime(this.volumes.musica * 0.35, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(this.volumes.efeitos, t, 0.02);
  }

  private tone(bus: GainNode, [freq, start, dur, type = 'sine', gain = 0.3]: Note, at: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t0 = at + start;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(bus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  play(name: Sfx): void {
    if (!this.ctx || !this.sfxBus || this.volumes.efeitos <= 0) return;
    const now = this.ctx.currentTime;
    for (const n of SFX[name]) this.tone(this.sfxBus, n, now);
  }

  startMusic(theme: MusicTheme, force = false): void {
    if (this.theme === theme && !force && this.musicTimer !== undefined) return;
    this.stopMusic();
    this.theme = theme;
    if (!this.ctx || !this.musicBus) return;
    const cfg = THEMES[theme];
    this.drone = this.ctx.createOscillator();
    this.drone.type = 'sine';
    this.drone.frequency.value = cfg.drone;
    const dg = this.ctx.createGain();
    dg.gain.value = 0.25;
    this.drone.connect(dg).connect(this.musicBus);
    this.drone.start();
    this.step = 0;
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || !this.musicBus || this.ctx.state !== 'running') return;
      this.step++;
      // Notas esparsas e previsíveis: calmas, sem picos de volume.
      if (this.step % 2 === 0 || this.step % 7 === 3) {
        const f = cfg.scale[(this.step * 5 + Math.floor(this.step / 4)) % cfg.scale.length]!;
        this.tone(this.musicBus, [f, 0, 1.4, 'triangle', 0.22], this.ctx.currentTime);
      }
    }, cfg.tempoMs);
  }

  stopMusic(): void {
    window.clearInterval(this.musicTimer);
    this.musicTimer = undefined;
    try {
      this.drone?.stop();
    } catch {
      // já parado
    }
    this.drone = null;
  }
}

export const audio = new AudioManager();
