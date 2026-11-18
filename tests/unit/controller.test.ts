import { describe, expect, it } from 'vitest';
import { DEFAULT_PLAYER_PARAMS, PlayerController, type PlayerInput, type PlayerSense } from '../../src/player/controller';

const DT = 1000 / 60;
const idle: PlayerInput = { left: false, right: false, jump: false };
const ground = (vx = 0): PlayerSense => ({ onGround: true, vx, vy: 0 });
const air = (vx = 0, vy = 0): PlayerSense => ({ onGround: false, vx, vy });

describe('PlayerController', () => {
  it('acelera até a velocidade máxima e não passa dela', () => {
    const c = new PlayerController();
    let vx = 0;
    for (let i = 0; i < 120; i++) vx = c.step({ ...idle, right: true }, ground(vx), DT).vx;
    expect(vx).toBe(DEFAULT_PLAYER_PARAMS.runSpeed);
    expect(c.step({ ...idle, right: true }, ground(vx), DT).state).toBe('run');
  });

  it('desacelera até parar quando nenhuma direção é pressionada', () => {
    const c = new PlayerController();
    let vx = DEFAULT_PLAYER_PARAMS.runSpeed;
    for (let i = 0; i < 60; i++) vx = c.step(idle, ground(vx), DT).vx;
    expect(vx).toBe(0);
    expect(c.step(idle, ground(0), DT).state).toBe('idle');
  });

  it('pula do chão com a velocidade configurada', () => {
    const c = new PlayerController();
    const cmd = c.step({ ...idle, jump: true }, ground(), DT);
    expect(cmd.vy).toBe(-DEFAULT_PLAYER_PARAMS.jumpVelocity);
    expect(cmd.state).toBe('jump');
  });

  it('segurar o botão de pulo não repete o salto ao pousar', () => {
    const c = new PlayerController();
    c.step({ ...idle, jump: true }, ground(), DT);
    for (let i = 0; i < 30; i++) c.step({ ...idle, jump: true }, air(0, 100), DT);
    expect(c.step({ ...idle, jump: true }, ground(), DT).vy).toBeUndefined();
  });

  it('permite pular logo após sair da borda (coyote time de 100 ms) e não depois', () => {
    const ok = new PlayerController();
    ok.step(idle, ground(), DT);
    for (let i = 0; i < 5; i++) ok.step(idle, air(0, 50), DT); // ~83 ms no ar
    expect(ok.step({ ...idle, jump: true }, air(0, 50), DT).vy).toBe(-DEFAULT_PLAYER_PARAMS.jumpVelocity);

    const late = new PlayerController();
    late.step(idle, ground(), DT);
    for (let i = 0; i < 8; i++) late.step(idle, air(0, 50), DT); // ~133 ms no ar
    expect(late.step({ ...idle, jump: true }, air(0, 50), DT).vy).toBeUndefined();
  });

  it('guarda o pulo apertado pouco antes de tocar o chão (buffer de 120 ms)', () => {
    const c = new PlayerController();
    c.step({ ...idle, jump: true }, air(0, 200), DT);
    for (let i = 0; i < 5; i++) c.step({ ...idle, jump: true }, air(0, 200), DT); // ~100 ms depois
    expect(c.step({ ...idle, jump: true }, ground(), DT).vy).toBe(-DEFAULT_PLAYER_PARAMS.jumpVelocity);
  });

  it('pulo apertado muito antes de tocar o chão é descartado', () => {
    const c = new PlayerController();
    c.step({ ...idle, jump: true }, air(0, 200), DT);
    for (let i = 0; i < 10; i++) c.step(idle, air(0, 200), DT); // ~183 ms depois
    expect(c.step(idle, ground(), DT).vy).toBeUndefined();
  });

  it('soltar o pulo na subida corta a altura uma única vez', () => {
    const c = new PlayerController();
    c.step({ ...idle, jump: true }, ground(), DT);
    const cut = c.step(idle, air(0, -400), DT);
    expect(cut.vy).toBeCloseTo(-400 * DEFAULT_PLAYER_PARAMS.jumpCutMultiplier);
    expect(c.step(idle, air(0, -150), DT).vy).toBeUndefined();
  });

  it('indica queda quando está no ar descendo', () => {
    const c = new PlayerController();
    expect(c.step(idle, air(0, 120), DT).state).toBe('fall');
  });

  it('reset() limpa timers (usado no reaparecimento)', () => {
    const c = new PlayerController();
    c.step({ ...idle, jump: true }, air(0, 200), DT);
    c.reset();
    expect(c.step({ ...idle, jump: true }, ground(), DT).vy).toBe(-DEFAULT_PLAYER_PARAMS.jumpVelocity);
  });
});
