import Phaser from 'phaser';
import { createRng } from '../core/rng';

/** Fundo da caverna em camadas (paralaxe): estalactites, estalagmites e pontos de cristal. */
export function drawCaveBackground(scene: Phaser.Scene, w: number, h: number, seed = 7): void {
  const layers: [number, number, number][] = [
    [0.2, 0x2a2950, 0.9],
    [0.45, 0x34336a, 0.8],
  ];
  const rng = createRng(seed);
  for (const [factor, color, alpha] of layers) {
    const g = scene.add.graphics().setScrollFactor(factor, 1).setDepth(-10 + factor);
    g.fillStyle(color, alpha);
    for (let x = 0; x < w * factor + 960; x += 90 + rng.int(0, 120)) {
      g.fillTriangle(x, 0, x + 50, 0, x + 25, 60 + rng.int(0, 160));
      const hgt = 50 + rng.int(0, 140);
      g.fillTriangle(x + 40, h, x + 100, h, x + 70, h - hgt);
    }
    g.fillStyle(0x5ed3e0, 0.25);
    for (let i = 0; i < 18; i++) g.fillCircle(rng.int(0, w * factor + 960), rng.int(40, h - 80), rng.int(1, 3));
  }
}

/** Fundo do castelo: céu de entardecer, montanhas, muralhas e torres com bandeiras. */
export function drawCastleBackground(scene: Phaser.Scene, w: number, h: number, seed = 9): void {
  const rng = createRng(seed);
  const stars = scene.add.graphics().setScrollFactor(0.05, 1).setDepth(-11);
  stars.fillStyle(0xfff4c2, 0.7);
  for (let i = 0; i < 30; i++) stars.fillCircle(rng.int(0, w * 0.05 + 960), rng.int(10, 200), rng.int(1, 2));
  const mountains = scene.add.graphics().setScrollFactor(0.15, 1).setDepth(-10);
  mountains.fillStyle(0x47446e, 1);
  for (let x = -120; x < w * 0.15 + 1100; x += 220) mountains.fillTriangle(x, h - 100, x + 160, h - 100, x + 80, h - 260 - rng.int(0, 60));
  const walls = scene.add.graphics().setScrollFactor(0.45, 1).setDepth(-8);
  for (let x = 0; x < w * 0.45 + 960; x += 180 + rng.int(0, 80)) {
    const base = h - 100;
    const th = 140 + rng.int(0, 80);
    walls.fillStyle(0x6b6f86, 1).fillRect(x, base - th, 46, th);
    for (let k = 0; k < 4; k++) walls.fillRect(x - 2 + k * 13, base - th - 10, 8, 10);
    walls.fillStyle(0x5a5e74, 1).fillRect(x + 46, base - 70, 120, 70);
    for (let k = 0; k < 9; k++) walls.fillRect(x + 48 + k * 13, base - 80, 8, 10);
    walls.lineStyle(3, 0x3b2f2a, 1).lineBetween(x + 23, base - th - 10, x + 23, base - th - 50);
    walls.fillStyle(rng.next() < 0.5 ? 0xa3405a : 0xc9973a, 1).fillTriangle(x + 24, base - th - 50, x + 24, base - th - 34, x + 48, base - th - 42);
    walls.fillStyle(0xf2d27a, 0.9).fillRect(x + 18, base - th + 30, 10, 14);
  }
}

/** Fundo da cidade: prédios de cobre com janelas acesas, hélices e canos. */
export function drawCityBackground(scene: Phaser.Scene, w: number, h: number, seed = 13): void {
  const rng = createRng(seed);
  const far = scene.add.graphics().setScrollFactor(0.2, 1).setDepth(-10);
  far.fillStyle(0x2f5560, 1);
  for (let x = 0; x < w * 0.2 + 1000; x += 70 + rng.int(0, 40)) far.fillRect(x, h - 120 - rng.int(60, 200), 60, 400);
  const near = scene.add.graphics().setScrollFactor(0.45, 1).setDepth(-8);
  for (let x = 20; x < w * 0.45 + 960; x += 130 + rng.int(0, 90)) {
    const bw = 80 + rng.int(0, 30);
    const bh = 120 + rng.int(0, 140);
    const base = h - 100;
    near.fillStyle(0x8b4d29, 1).fillRect(x, base - bh, bw, bh);
    near.fillStyle(0xffe27a, 0.85);
    for (let wy = base - bh + 14; wy < base - 20; wy += 26) for (let wx = x + 10; wx < x + bw - 14; wx += 22) if (rng.next() < 0.7) near.fillRect(wx, wy, 10, 12);
    if (rng.next() < 0.5) {
      near.lineStyle(4, 0x3fb59a, 1).lineBetween(x + bw / 2, base - bh, x + bw / 2, base - bh - 30);
      near.lineBetween(x + bw / 2 - 22, base - bh - 30, x + bw / 2 + 22, base - bh - 30);
    } else {
      near.fillStyle(0x5b6b73, 1).fillRect(x + bw - 18, base - bh - 34, 10, 34);
    }
  }
}

/** Fundo do laboratório: estantes com frascos, telas com gráficos e trilhas de circuito. */
export function drawLabBackground(scene: Phaser.Scene, w: number, h: number, seed = 17): void {
  const rng = createRng(seed);
  const circuit = scene.add.graphics().setScrollFactor(0.15, 1).setDepth(-10);
  circuit.lineStyle(2, 0x4a3f78, 1);
  for (let i = 0; i < 40; i++) {
    const x = rng.int(0, w * 0.15 + 960);
    const y = rng.int(20, h - 140);
    circuit.lineBetween(x, y, x + 60, y).lineBetween(x + 60, y, x + 60, y + 40);
    circuit.fillStyle(0x9b7bf0, 0.7).fillCircle(x + 60, y + 40, 3);
  }
  const lab = scene.add.graphics().setScrollFactor(0.45, 1).setDepth(-8);
  for (let x = 20; x < w * 0.45 + 960; x += 170 + rng.int(0, 70)) {
    const base = h - 110;
    if (rng.next() < 0.5) {
      lab.fillStyle(0x3a4656, 1).fillRect(x, base - 150, 120, 150);
      for (let s = 0; s < 3; s++) {
        lab.fillStyle(0x56637a, 1).fillRect(x, base - 150 + s * 50 + 40, 120, 6);
        for (let f = 0; f < 4; f++) lab.fillStyle([0x9b7bf0, 0x3fb59a, 0xf08a24][(f + s) % 3]!, 0.9).fillRect(x + 10 + f * 28, base - 150 + s * 50 + 18, 12, 22);
      }
    } else {
      lab.fillStyle(0x1b222c, 1).fillRect(x, base - 170, 110, 80);
      lab.lineStyle(3, 0x5ed3e0, 1);
      let py = base - 110;
      for (let k = 0; k < 6; k++) {
        const ny = base - 110 - rng.int(0, 50);
        lab.lineBetween(x + 10 + k * 16, py, x + 26 + k * 16, ny);
        py = ny;
      }
      lab.fillStyle(0x56637a, 1).fillRect(x + 50, base - 90, 10, 90);
    }
  }
}

/** Fundo da floresta: copas redondas, troncos, arbustos e flores. */
export function drawForestBackground(scene: Phaser.Scene, w: number, h: number, seed = 3): void {
  const rng = createRng(seed);
  const far = scene.add.graphics().setScrollFactor(0.2, 1).setDepth(-10);
  for (let x = -40; x < w * 0.2 + 1000; x += 90 + rng.int(0, 50)) {
    far.fillStyle(0x7fbf7a, 1).fillCircle(x, h - 170 - rng.int(0, 60), 70 + rng.int(0, 30));
  }
  const near = scene.add.graphics().setScrollFactor(0.45, 1).setDepth(-8);
  for (let x = 30; x < w * 0.45 + 960; x += 150 + rng.int(0, 90)) {
    const base = h - 100;
    const th = 90 + rng.int(0, 70);
    near.fillStyle(0x7a5230, 1).fillRect(x - 10, base - th, 20, th);
    near.fillStyle(0x4e9a33, 1).fillCircle(x, base - th - 20, 50 + rng.int(0, 20));
    near.fillStyle(0x5fa34a, 1).fillCircle(x - 30, base - th, 34).fillCircle(x + 32, base - th + 4, 30);
    near.fillStyle(0x3e7a2f, 1).fillEllipse(x + 70, base - 10, 70, 34);
    for (let k = 0; k < 3; k++) near.fillStyle([0xf2c14e, 0xd9534f, 0xf6eedc][k]!, 1).fillCircle(x + 50 + k * 18, base - 6, 4);
  }
}

/** Fundo da vila: nuvens, colinas, casinhas de telhado terracota e moinhos. */
export function drawVillageBackground(scene: Phaser.Scene, w: number, h: number, seed = 5): void {
  const rng = createRng(seed);
  // Nuvens (bem lentas)
  const clouds = scene.add.graphics().setScrollFactor(0.1, 1).setDepth(-10);
  clouds.fillStyle(0xffffff, 0.85);
  for (let x = 40; x < w * 0.1 + 960; x += 220 + rng.int(0, 160)) {
    const y = 60 + rng.int(0, 90);
    clouds.fillEllipse(x, y, 110, 34).fillEllipse(x + 40, y - 14, 80, 36).fillEllipse(x - 35, y - 6, 60, 26);
  }
  // Colinas
  const hills = scene.add.graphics().setScrollFactor(0.2, 1).setDepth(-9);
  hills.fillStyle(0x8fd17a, 1);
  for (let x = -100; x < w * 0.2 + 1100; x += 260) hills.fillEllipse(x + rng.int(0, 60), h - 120, 420, 220);
  // Casas e moinhos
  const town = scene.add.graphics().setScrollFactor(0.45, 1).setDepth(-8);
  for (let x = 30; x < w * 0.45 + 960; x += 150 + rng.int(0, 120)) {
    const base = h - 110;
    if (rng.next() < 0.25) {
      town.fillStyle(0xe8d8b8, 1).fillRect(x + 20, base - 120, 34, 120);
      town.fillStyle(0xa35a3a, 1).fillTriangle(x + 14, base - 120, x + 60, base - 120, x + 37, base - 150);
      town.lineStyle(6, 0x7a4a2a, 1);
      town.lineBetween(x + 37 - 50, base - 140 - 50, x + 37 + 50, base - 140 + 50);
      town.lineBetween(x + 37 - 50, base - 140 + 50, x + 37 + 50, base - 140 - 50);
    } else {
      const hw = 70 + rng.int(0, 30);
      const hh = 50 + rng.int(0, 30);
      town.fillStyle(0xf3e3c3, 1).fillRect(x, base - hh, hw, hh);
      town.fillStyle(0xd2734a, 1).fillTriangle(x - 8, base - hh, x + hw + 8, base - hh, x + hw / 2, base - hh - 36);
      town.fillStyle(0x6bb6e0, 1).fillRect(x + 12, base - hh + 12, 16, 14);
      town.fillStyle(0x8c5e28, 1).fillRect(x + hw - 28, base - 30, 16, 30);
    }
  }
}
