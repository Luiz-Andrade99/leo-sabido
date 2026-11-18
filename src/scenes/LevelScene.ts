import Phaser from 'phaser';
import { audio } from '../audio/audio';
import { ChallengeSession, dificuldadePara } from '../challenges/engine/session';
import { fewestPieces } from '../challenges/formats/money';
import { resolveItem } from '../challenges/formats/registry';
import { createMechanism, type CellRun, type Mechanism } from '../challenges/mechanisms/mechanisms';
import { openChallengeDialog, type DialogHandle } from '../challenges/ui/ChallengeDialog';
import { BUILD_MODE, TILE_SIZE } from '../core/config';
import type { LaunchOptions } from '../core/launch';
import { createRng, type Rng } from '../core/rng';
import { getState, reducedMotion } from '../core/state';
import { ActionInput } from '../input/actions';
import { Checkpoint, Crystal, MovingPlatform, PushBox } from '../interactions/objects';
import type { MechanismType } from '../levels/ascii';
import { getProp } from '../levels/tiled';
import { Leo } from '../player/Leo';
import { announce, setCrystals, showHud } from '../ui/hud';
import { speak } from '../ui/speech';
import { narrador } from '../voz/narrador';
import { mountTouch, textoParaToque, touchWanted } from '../ui/touch';
import { themeFor, type WorldTheme } from './themes';
import { EV, type LevelResultEvent, type LevelStartData } from './events';
import type { LeoTestState, LevelPoints, TestSolution } from './testHooks';

interface ChallengePanel {
  painel: string;
  pool: string;
  titulo: string;
  dificuldade: 1 | 2 | 3;
  mechanism: Mechanism;
  bounds: { x: number; y: number; w: number; h: number };
  dy: number;
  image: Phaser.GameObjects.Image;
  prompt: Phaser.GameObjects.Text;
  x: number;
  y: number;
  session: ChallengeSession | null;
}

interface Sign {
  x: number;
  y: number;
  texto: string;
  bubble: Phaser.GameObjects.Text;
  near: boolean;
}

const INTERACT_RANGE_X = 44;
const INTERACT_RANGE_Y = 48;
/** A esta distância de um painel (6 tiles), a instrução do desafio já é gerada pela voz Faber. */
const PREPARAR_VOZ_PX = 6 * TILE_SIZE;
/** No modo assistido as plataformas móveis ficam mais lentas. */
const ASSIST_SLOWDOWN = 1.6;

const MECH_MESSAGES: Record<MechanismType, [string, string]> = {
  porta: ['🚪 A porta de engrenagens está se abrindo!', 'Passagem livre. Siga em frente!'],
  ponte: ['🌉 A ponte está subindo!', 'A ponte está pronta. Pode atravessar!'],
  blocos: ['🧱 Os blocos estão se encaixando!', 'A escada está pronta. Pode subir!'],
  elevador: ['⬆ O elevador ligou!', 'Suba na plataforma para usar o elevador.'],
};

const TEXT_STYLE = { fontFamily: 'Segoe UI, system-ui, sans-serif', color: '#1E1D3A', backgroundColor: '#F6EEDC' };

/** Cena de fase genérica: monta tudo a partir do JSON do Tiled. Não conhece nenhuma fase específica. */
export class LevelScene extends Phaser.Scene {
  private data_!: LevelStartData;
  private leo!: Leo;
  private input_!: ActionInput;
  private rng!: Rng;
  private reduced = false;
  private theme!: WorldTheme;
  private assist = false;
  private platforms: MovingPlatform[] = [];
  private mechanisms: Mechanism[] = [];
  private boxes: PushBox[] = [];
  private checkpoints: Checkpoint[] = [];
  private crystals: Crystal[] = [];
  private panels: ChallengePanel[] = [];
  private signs: Sign[] = [];
  private vozPreparada = new Set<ChallengePanel>();
  private respawnPoint = { x: 0, y: 0 };
  private spawnPoint = { x: 0, y: 0 };
  private goalPoint = { x: 0, y: 0 };
  private worldBottom = 0;
  private dialog: DialogHandle | null = null;
  private respawns = 0;
  private physicsSteps = 0;
  private completed = false;
  private respawning = false;
  private activeMs = 0;
  private minY = Number.POSITIVE_INFINITY;
  private destroyTouch: (() => void) | null = null;
  private ready = false;

  constructor() {
    super('level');
  }

  /** Chamado a cada start/restart: zera o estado da partida anterior. */
  init(data: LevelStartData): void {
    this.data_ = data;
    this.ready = false;
    this.platforms = [];
    this.mechanisms = [];
    this.boxes = [];
    this.checkpoints = [];
    this.crystals = [];
    this.panels = [];
    this.signs = [];
    this.vozPreparada = new Set();
    this.dialog = null;
    this.respawns = 0;
    this.physicsSteps = 0;
    this.completed = false;
    this.respawning = false;
    this.activeMs = 0;
    this.minY = Number.POSITIVE_INFINITY;
  }

  create(): void {
    const st = getState();
    const opts = this.registry.get('options') as LaunchOptions;
    this.rng = createRng(opts.seed);
    this.reduced = reducedMotion();
    this.assist = st.settings.modoAssistido;
    const slow = this.assist ? ASSIST_SLOWDOWN : 1;

    const map = this.make.tilemap({ key: this.data_.mapa });
    this.theme = themeFor(getProp({ properties: map.properties as { name: string; value: unknown }[] }, 'tema', 'caverna'));
    const tilesetName = map.tilesets[0]?.name ?? 'caverna';
    const tiles = map.addTilesetImage(tilesetName, `tiles-${tilesetName}`)!;
    this.theme.drawBackground(this, map.widthInPixels, map.heightInPixels);
    audio.startMusic(this.theme.music);
    const ground = map.createLayer('chao', tiles)!;
    ground.setCollisionByExclusion([-1, 0]);
    this.worldBottom = map.heightInPixels;
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels + 400, true, true, true, false);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBackgroundColor(this.theme.bg);

    const objects = map.getObjectLayer('objetos')?.objects ?? [];

    // Mecanismos agrupados por painel.
    const runs = new Map<string, { tipo: MechanismType; dy: number; periodo: number; runs: CellRun[] }>();
    for (const o of objects.filter((x) => x.type === 'mechanism')) {
      const painel = getProp(o, 'painel', '');
      const entry = runs.get(painel) ?? {
        tipo: getProp(o, 'tipo', 'ponte') as MechanismType,
        dy: getProp(o, 'dy', -160),
        periodo: getProp(o, 'periodo', 3600),
        runs: [],
      };
      entry.runs.push({ x: o.x!, y: o.y!, width: o.width! });
      runs.set(painel, entry);
    }
    const mechByPanel = new Map<string, Mechanism>();
    const boundsByPanel = new Map<string, { x: number; y: number; w: number; h: number; dy: number }>();
    for (const [painel, m] of runs) {
      const x0 = Math.min(...m.runs.map((r) => r.x));
      const y0 = Math.min(...m.runs.map((r) => r.y));
      const x1 = Math.max(...m.runs.map((r) => r.x + r.width));
      const y1 = Math.max(...m.runs.map((r) => r.y + TILE_SIZE));
      boundsByPanel.set(painel, { x: x0, y: y0, w: x1 - x0, h: y1 - y0, dy: m.dy });
    }
    for (const [painel, m] of runs) {
      const mech = createMechanism(this, m.tipo, m.runs, { reducedMotion: this.reduced, dy: m.dy, periodMs: m.periodo * slow });
      mechByPanel.set(painel, mech);
      this.mechanisms.push(mech);
    }

    const assistBlocks = this.physics.add.staticGroup();
    for (const o of objects) {
      const x = o.x!;
      const y = o.y!;
      const footX = x + TILE_SIZE / 2;
      const footY = y + TILE_SIZE;
      switch (o.type) {
        case 'spawn':
          this.spawnPoint = { x: footX, y: footY };
          break;
        case 'checkpoint':
          this.checkpoints.push(new Checkpoint(this, footX, footY));
          break;
        case 'box':
          this.boxes.push(new PushBox(this, footX, footY));
          break;
        case 'moving_platform':
          this.platforms.push(new MovingPlatform(this, x, y, o.width!, getProp(o, 'dx', 0), getProp(o, 'dy', 0), getProp(o, 'periodo', 3000) * slow));
          break;
        case 'crystal':
          this.crystals.push(new Crystal(this, footX, y + TILE_SIZE / 2, this.reduced, this.theme.collectible));
          break;
        case 'assist':
          if (this.assist) {
            for (let i = 0; i < Math.round(o.width! / TILE_SIZE); i++) {
              (assistBlocks.create(x + i * TILE_SIZE + TILE_SIZE / 2, y + TILE_SIZE / 2, 'apoio') as Phaser.Physics.Arcade.Image).setDepth(1);
            }
          }
          break;
        case 'sign': {
          this.add.image(footX, footY, 'placa').setOrigin(0.5, 1).setDepth(1);
          const bruto = getProp(o, 'texto', '');
          const texto = touchWanted(getState().settings.controlesToque) ? textoParaToque(bruto) : bruto;
          const bubble = this.add
            .text(footX, footY - 76, texto, { ...TEXT_STYLE, fontSize: '17px', color: '#3B2F2A', padding: { x: 10, y: 6 }, wordWrap: { width: 260 }, align: 'center' })
            .setOrigin(0.5, 1)
            .setDepth(25)
            .setVisible(false);
          this.signs.push({ x: footX, y: footY, texto, bubble, near: false });
          break;
        }
        case 'challenge': {
          const painel = getProp(o, 'painel', '');
          const mechanism = mechByPanel.get(painel);
          if (!mechanism) throw new Error(`Painel ${painel} sem mecanismo`);
          const image = this.add.image(footX, footY, 'painel').setOrigin(0.5, 1).setDepth(3);
          const prompt = this.add
            .text(footX, footY - 58, 'E  examinar', { ...TEXT_STYLE, fontSize: '16px', padding: { x: 8, y: 4 } })
            .setOrigin(0.5, 1)
            .setDepth(20)
            .setVisible(false);
          this.panels.push({
            painel,
            pool: getProp(o, 'pool', ''),
            titulo: getProp(o, 'titulo', 'Painel'),
            dificuldade: Math.min(3, Math.max(1, getProp(o, 'dificuldade', 1))) as 1 | 2 | 3,
            mechanism,
            bounds: (({ x, y, w, h }) => ({ x, y, w, h }))(boundsByPanel.get(painel)!),
            dy: boundsByPanel.get(painel)!.dy,
            image,
            prompt,
            x: footX,
            y: footY,
            session: null,
          });
          break;
        }
        case 'goal':
          this.goalPoint = { x: footX, y: footY };
          this.addGoal(footX, footY, getProp(o, 'tipo', 'portal'));
          break;
      }
    }

    this.respawnPoint = { ...this.spawnPoint };
    this.leo = new Leo(this, this.spawnPoint.x, this.spawnPoint.y);
    this.input_ = new ActionInput(this, st.settings.teclas);

    const solids: Phaser.Types.Physics.Arcade.ArcadeColliderType[] = [
      ground,
      assistBlocks,
      ...this.platforms.map((p) => p.image),
      ...this.mechanisms.flatMap((m) => m.colliders),
    ];
    for (const s of solids) this.physics.add.collider(this.leo, s);
    for (const b of this.boxes) {
      for (const s of solids) this.physics.add.collider(b.sprite, s);
      this.physics.add.collider(this.leo, b.sprite);
    }
    for (const cp of this.checkpoints) {
      this.physics.add.overlap(this.leo, cp.zone, () => {
        if (cp.activate()) {
          this.respawnPoint = { x: cp.x, y: cp.y };
          audio.play('checkpoint');
          announce('🚩 Ponto de controle! Se cair, você volta para cá.');
        }
      });
    }
    for (const c of this.crystals) {
      this.physics.add.overlap(this.leo, c.zone, () => {
        if (c.collect()) {
          audio.play('collect');
          const n = this.collectedCount();
          this.updateCollectHud();
          const [sing, plural] = this.theme.collectibleName;
          const icon = this.theme.collectibleIcon;
          const nome = sing.charAt(0).toUpperCase() + sing.slice(1);
          announce(n === this.crystals.length ? `${icon} Coleção completa: ${n} de ${n} ${plural}!` : `${icon} ${nome}! ${n} de ${this.crystals.length}.`);
        }
      });
    }

    // Lógica de jogo nos passos fixos da física (independe da taxa de quadros).
    this.physics.world.on(Phaser.Physics.Arcade.Events.WORLD_STEP, (delta: number) => {
      const dtMs = delta * 1000;
      this.physicsSteps++;
      for (const p of this.platforms) p.physicsStep(dtMs);
      for (const m of this.mechanisms) m.physicsStep?.(dtMs);
      if (!this.respawning) {
        this.leo.physicsStep(this.input_.read(), dtMs);
        if (this.leo.jumpedThisStep) audio.play('jump');
      }
      this.minY = Math.min(this.minY, this.leo.y);
    });

    this.cameras.main.startFollow(this.leo, true, 0.12, 0.12, 0, 40);
    this.cameras.main.setDeadzone(120, 80);

    const onEsc = (): void => {
      if (!this.dialog && !this.completed) this.game.events.emit(EV.pauseRequest);
    };
    this.input.keyboard?.on('keydown-ESC', onEsc);

    showHud(this.data_.titulo, () => this.game.events.emit(EV.pauseRequest));
    this.updateCollectHud();
    this.mountTouchIfWanted();
    announce(`${this.data_.titulo}${this.assist ? ' · modo assistido' : ''}`, 4000);
    // Voz Faber: gera antes as falas das placas (só quando a narração está ligada).
    if (this.narra()) for (const s of this.signs) narrador.preparar(s.texto);

    this.ready = true;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.ready = false;
      this.input_.destroy();
      this.dialog?.close();
      this.dialog = null;
      this.destroyTouch?.();
      this.destroyTouch = null;
      this.input.keyboard?.off('keydown-ESC', onEsc);
    });
  }

  override update(_time: number, delta: number): void {
    if (this.dialog || this.completed) return;
    if (document.visibilityState === 'visible') this.activeMs += delta;

    // Queda: volta ao último ponto de controle, sem punição.
    if (!this.respawning && this.leo.y > this.worldBottom + 48) this.respawn();
    for (const b of this.boxes) if (b.sprite.y > this.worldBottom + 48) b.resetHome();

    for (const s of this.signs) {
      const near = Math.abs(this.leo.x - s.x) < 72 && Math.abs(this.leo.y - s.y) < 64;
      if (near && !s.near) {
        announce(`📜 ${s.texto}`, 6000);
        if (this.narra()) speak(s.texto);
      }
      s.near = near;
      s.bubble.setVisible(near);
    }

    // Voz Faber: chegando perto de um painel, prepara a instrução do desafio dele.
    if (this.narra()) {
      for (const p of this.panels) {
        if (p.mechanism.activated || this.vozPreparada.has(p)) continue;
        if (Math.abs(this.leo.x - p.x) < PREPARAR_VOZ_PX && Math.abs(this.leo.y - p.y) < PREPARAR_VOZ_PX) {
          this.vozPreparada.add(p);
          const session = this.ensureSession(p);
          if (session) narrador.preparar(session.narracao);
        }
      }
    }

    const near = this.panels.find((p) => Math.abs(this.leo.x - p.x) < INTERACT_RANGE_X && Math.abs(this.leo.y - p.y) < INTERACT_RANGE_Y) ?? null;
    for (const p of this.panels) p.prompt.setVisible(p === near && !p.mechanism.activated);
    // Lê sempre, para um E apertado longe do painel não disparar depois.
    const interact = this.input_.interactPressed();
    if (near && interact) this.openChallenge(near);

    if (Math.abs(this.leo.x - this.goalPoint.x) < 28 && Math.abs(this.leo.y - this.goalPoint.y) < 40) this.finish();
  }

  private mountTouchIfWanted(): void {
    const touchEl = document.getElementById('touch');
    if (touchEl && touchWanted(getState().settings.controlesToque)) this.destroyTouch = mountTouch(touchEl, this.input_);
  }

  /** Reaplica teclas, controles de toque e HUD depois de mudar configurações na pausa. */
  applySettings(): void {
    this.input_.destroy();
    this.input_ = new ActionInput(this, getState().settings.teclas);
    this.destroyTouch?.();
    this.destroyTouch = null;
    this.mountTouchIfWanted();
    showHud(this.data_.titulo, () => this.game.events.emit(EV.pauseRequest));
    this.updateCollectHud();
  }

  private updateCollectHud(): void {
    setCrystals(this.collectedCount(), this.crystals.length, this.theme.collectibleIcon, this.theme.collectibleName[1]);
  }

  private collectedCount(): number {
    return this.crystals.filter((c) => c.collected).length;
  }

  private ensureSession(panel: ChallengePanel): ChallengeSession | null {
    if (panel.session) return panel.session;
    const st = getState();
    const item = st.repo.pick(panel.pool, this.rng, BUILD_MODE, dificuldadePara(panel.dificuldade, st.settings.apoio));
    if (!item) return null;
    panel.session = new ChallengeSession(item, resolveItem(item, this.rng), st.settings.apoio);
    return panel.session;
  }

  /** A narração automática está ligada (configuração ou 1º ano, que lê tudo em voz alta)? */
  private narra(): boolean {
    return getState().settings.narracaoAuto || this.data_.ano === 1;
  }

  private openChallenge(panel: ChallengePanel): void {
    if (panel.mechanism.activated) {
      announce(MECH_MESSAGES[panel.mechanism.tipo][1]);
      return;
    }
    const session = this.ensureSession(panel);
    if (!session) {
      announce('Este painel ainda não tem desafios publicados.');
      return;
    }
    const st = getState();
    session.apoio = st.settings.apoio;
    this.input_.setEnabled(false);
    this.leo.setThinking(true);
    this.dialog = openChallengeDialog(document.getElementById('overlay')!, session, {
      title: panel.titulo,
      ano: this.data_.ano,
      underReview: session.item.revisao.status !== 'aprovado',
      // 1º ano: tudo é lido em voz alta, para quem está aprendendo a ler.
      narrate: st.settings.narracaoAuto || this.data_.ano === 1,
      narrateFeedback: this.data_.ano === 1,
      onSolved: () => this.afterDialog(() => this.solve(panel)),
      onClose: () => this.afterDialog(),
    });
  }

  private afterDialog(then?: () => void): void {
    this.dialog = null;
    this.leo.setThinking(false);
    // Espera um instante para a tecla que fechou a janela não acionar o painel de novo.
    this.time.delayedCall(80, () => this.input_.setEnabled(true));
    then?.();
  }

  private solve(panel: ChallengePanel): void {
    if (panel.mechanism.activated) return;
    panel.image.setTexture('painel-ok');
    panel.prompt.setVisible(false);
    const [start, done] = MECH_MESSAGES[panel.mechanism.tipo];
    audio.play('mechanism');
    announce(start);
    panel.mechanism.activate(() => announce(done));
  }

  private respawn(): void {
    this.respawning = true;
    this.respawns++;
    audio.play('respawn');
    const done = (): void => {
      this.leo.respawn(this.respawnPoint.x, this.respawnPoint.y);
      this.respawning = false;
    };
    announce('Opa! Vamos tentar de novo daqui.');
    if (this.reduced) {
      done();
      return;
    }
    this.cameras.main.fadeOut(180, 30, 29, 58);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      done();
      this.cameras.main.fadeIn(220, 30, 29, 58);
    });
  }

  private finish(): void {
    if (this.completed) return;
    this.completed = true;
    this.input_.setEnabled(false);
    this.leo.arcadeBody.setVelocity(0, 0);
    audio.play('complete');
    announce('🎉 Fase concluída!', 0);
    const result: LevelResultEvent = {
      ano: this.data_.ano,
      faseId: this.data_.faseId,
      cristais: this.collectedCount(),
      cristaisTotal: this.crystals.length,
      coletavel: `${this.theme.collectibleIcon} ${this.theme.collectibleName[1][0]!.toUpperCase()}${this.theme.collectibleName[1].slice(1)}`,
      activeSeconds: Math.round(this.activeMs / 1000),
      desafios: this.panels
        .filter((p) => p.session)
        .map((p) => ({
          id: p.session!.item.id,
          tema: p.session!.item.tema,
          explicacao: p.session!.explanation,
          tentativas: p.session!.attempts,
          dicas: p.session!.hintsUsed,
          resolvido: p.session!.solved,
        })),
    };
    this.time.delayedCall(this.reduced ? 100 : 900, () => this.game.events.emit(EV.levelComplete, result));
  }

  private addGoal(x: number, y: number, tipo: string): void {
    const img =
      tipo === 'engrenagem' ? this.add.image(x, y - 28, 'engrenagem').setDepth(4) : this.add.image(x, y, 'portal').setOrigin(0.5, 1).setDepth(1);
    if (this.reduced) return;
    if (tipo === 'engrenagem') {
      this.tweens.add({ targets: img, angle: 360, duration: 6000, repeat: -1 });
      this.tweens.add({ targets: img, y: img.y - 6, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else {
      this.tweens.add({ targets: img, scaleX: 0.92, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  // ---------- Ganchos de teste (usados só com ?teste=1) ----------
  isReady(): boolean {
    return this.ready;
  }

  private panelPoints(): LeoTestState['panels'] {
    return this.panels.map((p) => ({ painel: p.painel, x: p.x, y: p.y, mecanismo: p.mechanism.tipo, activated: p.mechanism.activated, bounds: { ...p.bounds }, dy: p.dy }));
  }

  testState(): LeoTestState {
    const b = this.leo.arcadeBody;
    return {
      x: this.leo.x,
      y: this.leo.y,
      vx: b.velocity.x,
      vy: b.velocity.y,
      onGround: this.leo.onGround,
      anim: this.leo.anims.currentAnim?.key ?? '',
      respawns: this.respawns,
      dialogOpen: this.dialog !== null,
      completed: this.completed,
      checkpoint: { ...this.respawnPoint },
      actualFps: this.game.loop.actualFps,
      physicsSteps: this.physicsSteps,
      minY: this.minY,
      cristais: this.collectedCount(),
      cristaisTotal: this.crystals.length,
      assist: this.assist,
      panels: this.panelPoints(),
    };
  }

  testPoints(): LevelPoints {
    return {
      spawn: { ...this.spawnPoint },
      goal: { ...this.goalPoint },
      crystals: this.crystals.map((c) => ({ x: c.x, y: c.y })),
      panels: this.panelPoints(),
    };
  }

  testTeleport(x: number, y: number): void {
    this.leo.respawn(x, y);
  }

  testApexReset(): void {
    this.minY = this.leo.y;
  }

  testSolution(painel: string): TestSolution | null {
    const p = this.panels.find((x) => x.painel === painel);
    const s = p ? this.ensureSession(p) : null;
    if (!s) return null;
    const r = s.resolved;
    switch (r.formato) {
      case 'numerico':
        return { formato: 'numerico', valor: r.resposta };
      case 'distribuir':
        return { formato: 'distribuir', grupos: r.grupos, cada: r.cada };
      case 'arranjo':
        return { formato: 'arranjo', colunas: r.colunas };
      case 'posicional':
        return { formato: 'posicional', c: r.c, d: r.d, u: r.u };
      case 'dinheiro': {
        const pieces = fewestPieces(r.valor, r.notas) ?? [];
        return { formato: 'dinheiro', counts: r.notas.map((v) => pieces.filter((p) => p === v).length) };
      }
      case 'relogio':
        return { formato: 'relogio', horas: Math.floor(r.duracao / 60), meias: (r.duracao % 60) / 30 };
      case 'fracao':
        return { formato: 'fracao', partes: r.resposta };
      case 'grafico':
        return { formato: 'grafico', valor: r.resposta };
      case 'igualdade':
        return { formato: 'igualdade', valor: r.resposta };
      case 'porcentagem':
        return { formato: 'porcentagem', valor: r.resposta };
      case 'decimal':
        return { formato: 'decimal', u: r.u, d: r.d, c: r.c };
      case 'area':
        return { formato: 'area', largura: r.largura, altura: r.altura };
      case 'programa':
        return { formato: 'programa', comandos: r.solucao.map((i) => r.comandos[i]!.rotulo) };
      case 'expressao':
        return { formato: 'expressao', valor: r.resposta };
      case 'divisibilidade':
        return { formato: 'divisibilidade', numeros: r.numeros.filter((_, i) => r.alvo[i]) };
      case 'contagem':
      case 'formas':
      case 'padrao':
        return { formato: 'escolha', indice: r.correta };
      case 'ordenar':
        return { formato: 'ordenar', ordem: [...r.correta] };
      default:
        return { formato: 'sequencia', valores: r.solucao };
    }
  }
}
