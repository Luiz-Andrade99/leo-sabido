import type Phaser from 'phaser';
import { audio } from '../audio/audio';
import { EV, type LevelResultEvent, type LevelStartData } from '../scenes/events';
import type { LevelScene } from '../scenes/LevelScene';
import { hideHud } from '../ui/hud';
import {
  aboutScreen,
  completeScreen,
  gradeScreen,
  hideScreens,
  introScreen,
  mapScreen,
  pauseScreen,
  settingsScreen,
  showScreen,
  titleScreen,
  worldCompleteScreen,
} from '../ui/screens';
import { addTime, chooseAno, completeFase, isFaseUnlocked, proximaFase } from './progress';
import { getState } from './state';
import type { Settings } from './settings';

/**
 * Controla a sequência de telas (seção 9): abertura → apresentação → ano → mapa → fase → conclusão → desbloqueio.
 * As telas são HTML; o jogo em si roda nas cenas Phaser.
 */
export class Flow {
  private current: LevelStartData | null = null;
  private paused = false;

  constructor(private readonly game: Phaser.Game) {
    const st = getState();
    this.applySettings(st.settings);
    st.onSettings((s) => this.applySettings(s));
    game.events.on(EV.levelComplete, (r: LevelResultEvent) => this.onLevelComplete(r));
    game.events.on(EV.pauseRequest, () => this.pause());
  }

  private applySettings(s: Settings): void {
    audio.setVolumes({ musica: s.volumeMusica, efeitos: s.volumeEfeitos, voz: s.volumeVoz });
    document.documentElement.classList.toggle('texto-grande', s.textoGrande);
    document.documentElement.classList.toggle('sem-animacao', s.reduzirAnimacoes);
  }

  private level(): LevelScene | null {
    const sc = this.game.scene.getScene('level') as LevelScene | null;
    return sc && this.game.scene.isActive('level') ? sc : sc && this.game.scene.isPaused('level') ? sc : null;
  }

  get activeLevel(): LevelScene | null {
    return this.current ? this.level() : null;
  }

  private toMenuScene(): void {
    if (this.game.scene.isActive('level') || this.game.scene.isPaused('level')) this.game.scene.stop('level');
    if (!this.game.scene.isActive('menu')) this.game.scene.start('menu');
    this.current = null;
    this.paused = false;
    hideHud();
    audio.startMusic('menu');
  }

  start(): void {
    const st = getState();
    const notice =
      st.loadStatus === 'recuperado'
        ? 'Não foi possível ler o progresso salvo, então o jogo começou do zero. Uma cópia do dado antigo foi guardada.'
        : st.loadStatus === 'indisponivel'
          ? 'Este navegador não permite salvar. Você pode jogar normalmente, mas o progresso não ficará guardado.'
          : undefined;
    this.toMenuScene();
    this.showTitle(notice);
  }

  showTitle(notice?: string): void {
    const o: Parameters<typeof titleScreen>[0] = {
      onPlay: () => this.play(),
      onStory: () => showScreen(introScreen(() => this.showTitle())),
      onSettings: () => this.showSettings(() => this.showTitle()),
      onAbout: () => showScreen(aboutScreen(() => this.showTitle())),
    };
    if (notice) o.notice = notice;
    showScreen(titleScreen(o));
  }

  play(): void {
    const st = getState();
    if (!st.save.introVista) {
      showScreen(
        introScreen(() => {
          st.commit({ ...st.save, introVista: true });
          this.play();
        }),
      );
      return;
    }
    if (st.save.ano === null) this.showGrade();
    else this.showMap();
  }

  showGrade(): void {
    showScreen(
      gradeScreen({
        onChoose: (ano) => {
          const st = getState();
          if (!st.anoInfo(ano).disponivel) return;
          st.commit(chooseAno(st.save, ano));
          this.showMap();
        },
        onBack: () => this.showTitle(),
      }),
    );
  }

  showMap(): void {
    const st = getState();
    if (st.save.ano === null || !st.anoInfo(st.save.ano).disponivel) {
      this.showGrade();
      return;
    }
    this.toMenuScene();
    const info = st.anoInfo(st.save.ano);
    showScreen(
      mapScreen({
        info,
        onPlay: (faseId) => this.startLevel(faseId),
        onGrade: () => this.showGrade(),
        onSettings: () => this.showSettings(() => this.showMap()),
        onHome: () => this.showTitle(),
      }),
    );
  }

  showSettings(back: () => void): void {
    showScreen(settingsScreen(back), this.current !== null);
  }

  startLevel(faseId: string, anoOverride?: number): void {
    const st = getState();
    const ano = anoOverride ?? st.save.ano ?? 3;
    const info = st.anoInfo(ano);
    if (!isFaseUnlocked(st.save, info, faseId) && anoOverride === undefined) return;
    const fase = st.faseInfo(ano, faseId);
    const idx = info.fases.findIndex((f) => f.id === faseId);
    hideScreens();
    if (this.game.scene.isActive('menu')) this.game.scene.stop('menu');
    if (this.game.scene.isActive('level') || this.game.scene.isPaused('level')) this.game.scene.stop('level');
    this.current = { ano, faseId, mapa: fase.mapa, titulo: `Fase ${idx + 1} · ${fase.nome}` };
    this.paused = false;
    this.game.scene.start('level', this.current);
  }

  pause(): void {
    if (!this.current || this.paused) return;
    this.paused = true;
    this.game.scene.pause('level');
    this.showPause();
  }

  private showPause(): void {
    showScreen(
      pauseScreen({
        onResume: () => this.resume(),
        onRestart: () => this.current && this.startLevel(this.current.faseId, this.current.ano),
        onSettings: () => this.showSettings(() => this.showPause()),
        onMap: () => this.exitToMap(),
      }),
      true,
    );
  }

  resume(): void {
    if (!this.current || !this.paused) return;
    hideScreens();
    this.paused = false;
    this.level()?.applySettings();
    this.game.scene.resume('level');
  }

  exitToMap(): void {
    this.showMap();
  }

  private onLevelComplete(r: LevelResultEvent): void {
    const st = getState();
    const info = st.anoInfo(r.ano);
    const out = completeFase(st.save, info, r.faseId, {
      cristais: r.cristais,
      cristaisTotal: r.cristaisTotal,
      desafios: r.desafios.map(({ id, tentativas, dicas, resolvido }) => ({ id, tentativas, dicas, resolvido })),
    });
    st.commit(addTime(out.save, r.activeSeconds));
    const next = proximaFase(info, r.faseId);
    const idx = info.fases.findIndex((f) => f.id === r.faseId);
    const fase = info.fases[idx]!;
    this.toMenuScene();
    const showComplete = (): void =>
      showScreen(
        completeScreen(
          {
            fase,
            index: idx,
            cristais: r.cristais,
            cristaisTotal: r.cristaisTotal,
            coletavel: r.coletavel,
            desafios: r.desafios.filter((d) => d.resolvido).map((d) => ({ tema: d.tema, explicacao: d.explicacao, dicas: d.dicas, tentativas: d.tentativas })),
            novasConquistas: out.novasConquistas,
            hasNext: next !== null,
          },
          {
            onNext: () => next && this.startLevel(next, r.ano),
            onReplay: () => this.startLevel(r.faseId, r.ano),
            onMap: () =>
              out.mundoConcluido
                ? showScreen(worldCompleteScreen(info, () => this.showMap(), [1, 2, 3, 4, 5, 6].every((a) => getState().save.anos[String(a)]?.pecaRecuperada)))
                : this.showMap(),
          },
        ),
      );
    showComplete();
  }
}
