/**
 * Gera a arte vetorial original do protótipo (Leo, tileset da caverna e objetos) em public/assets.
 * Arte criada para o projeto Leo Sabido — ver docs/inventario-assets.md.
 * Uso: npx tsx scripts/gen-art.ts
 */
import { writeFileSync } from 'node:fs';

const C = {
  ink: '#3B2F2A',
  skin: '#8D5A3B',
  hair: '#3A2418',
  brass: '#C9973A',
  brassDark: '#9A6F22',
  lens: '#7FD6E8',
  scarf: '#F08A24',
  vest: '#2F6F7E',
  shirt: '#F6EEDC',
  pants: '#4A3B5C',
  boot: '#5A3A22',
};

/** Engrenagem com n dentes centrada em (cx, cy). */
function gear(cx: number, cy: number, r: number, teeth: number, fill: string, stroke = C.ink): string {
  const pts: string[] = [];
  for (let i = 0; i < teeth * 2; i++) {
    const a = (Math.PI * i) / teeth;
    const rr = i % 2 === 0 ? r : r * 0.78;
    const a1 = a - Math.PI / teeth / 2;
    const a2 = a + Math.PI / teeth / 2;
    pts.push(`${(cx + rr * Math.cos(a1)).toFixed(2)},${(cy + rr * Math.sin(a1)).toFixed(2)}`);
    pts.push(`${(cx + rr * Math.cos(a2)).toFixed(2)},${(cy + rr * Math.sin(a2)).toFixed(2)}`);
  }
  return (
    `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${(r * 0.32).toFixed(2)}" fill="${C.brassDark}" stroke="${stroke}" stroke-width="1.2"/>`
  );
}

interface Pose {
  /** deslocamento [x, y] do pé de trás e do pé da frente */
  legBack: [number, number];
  legFront: [number, number];
  /** ângulo do braço da frente em graus (0 = para baixo) */
  arm: number;
  /** deslocamento vertical do corpo */
  bob: number;
  face: 'smile' | 'open' | 'focus';
}

/** Leo de perfil, olhando para a direita. Quadro de 48×64. */
function leo(p: Pose): string {
  const b = p.bob;
  const leg = (dx: number, dy: number, back: boolean): string => {
    const hipX = back ? 22 : 26;
    const footX = hipX + dx;
    const footY = 58 + dy;
    const col = back ? '#3A2E4A' : C.pants;
    return (
      `<path d="M${hipX} ${42 + b} L${footX} ${footY - 4}" stroke="${col}" stroke-width="6" stroke-linecap="round"/>` +
      `<rect x="${footX - 4}" y="${footY - 5}" width="10" height="6" rx="2.5" fill="${C.boot}" stroke="${C.ink}" stroke-width="1.2"/>`
    );
  };
  const rad = (p.arm * Math.PI) / 180;
  const sx = 27;
  const sy = 30 + b;
  const hx = (sx + 11 * Math.sin(rad)).toFixed(1);
  const hy = (sy + 11 * Math.cos(rad)).toFixed(1);
  const mouth =
    p.face === 'open'
      ? `<ellipse cx="35.5" cy="${21 + b}" rx="1.8" ry="2.2" fill="${C.ink}"/>`
      : p.face === 'focus'
        ? `<path d="M33.5 ${21.5 + b} h4" stroke="${C.ink}" stroke-width="1.4" stroke-linecap="round"/>`
        : `<path d="M33 ${20.5 + b} q2.5 2.5 5 0" fill="none" stroke="${C.ink}" stroke-width="1.4" stroke-linecap="round"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="64" viewBox="0 0 48 64">
  ${leg(p.legBack[0], p.legBack[1], true)}
  ${gear(14, 33 + b, 10, 8, C.brass)}
  <rect x="17" y="${25 + b}" width="15" height="19" rx="5" fill="${C.shirt}" stroke="${C.ink}" stroke-width="1.5"/>
  <path d="M17 ${28 + b} h9 v16 h-4 q-5 0 -5 -5 z" fill="${C.vest}" stroke="${C.ink}" stroke-width="1.5" stroke-linejoin="round"/>
  <rect x="19" y="${35 + b}" width="5" height="4" rx="1" fill="#24525D"/>
  ${leg(p.legFront[0], p.legFront[1], false)}
  <circle cx="29" cy="${15 + b}" r="10" fill="${C.skin}" stroke="${C.ink}" stroke-width="1.5"/>
  <path d="M19.5 ${15 + b} q-1 -11 10 -11 q10 0 9.5 8 q-4 -3 -9 -2 q-5 1 -10.5 5z" fill="${C.hair}" stroke="${C.ink}" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M20 ${9.5 + b} q9 -3.5 19 0" fill="none" stroke="${C.boot}" stroke-width="2.6"/>
  <circle cx="31" cy="${8 + b}" r="3.6" fill="${C.lens}" stroke="${C.brassDark}" stroke-width="1.8"/>
  <circle cx="37.5" cy="${8.5 + b}" r="3" fill="${C.lens}" stroke="${C.brassDark}" stroke-width="1.8"/>
  <circle cx="34.5" cy="${15 + b}" r="1.6" fill="${C.ink}"/>
  <circle cx="35" cy="${14.5 + b}" r="0.5" fill="#fff"/>
  <path d="M32 ${11.8 + b} q2.5 -1.3 5 0" fill="none" stroke="${C.hair}" stroke-width="1.2" stroke-linecap="round"/>
  ${mouth}
  <circle cx="24" cy="${16 + b}" r="2.2" fill="#7A4A30" stroke="${C.ink}" stroke-width="1"/>
  <path d="M20 ${25 + b} q9 4 15 -1 l-1 4 q-7 3 -14 0z" fill="${C.scarf}" stroke="${C.ink}" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M21 ${27 + b} l-6 4 l2 2 l6 -3z" fill="${C.scarf}" stroke="${C.ink}" stroke-width="1.1" stroke-linejoin="round"/>
  <path d="M${sx} ${sy} L${hx} ${hy}" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>
  <path d="M${sx} ${sy} L${hx} ${hy}" stroke="${C.shirt}" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="${hx}" cy="${hy}" r="2.6" fill="${C.skin}" stroke="${C.ink}" stroke-width="1.1"/>
</svg>
`;
}

const frames: Record<string, Pose> = {
  'leo-idle': { legBack: [-1, 0], legFront: [1, 0], arm: 10, bob: 0, face: 'smile' },
  'leo-run1': { legBack: [-6, -1], legFront: [6, 0], arm: 50, bob: -1, face: 'smile' },
  'leo-run2': { legBack: [0, -3], legFront: [0, 0], arm: 10, bob: 0, face: 'smile' },
  'leo-run3': { legBack: [6, 0], legFront: [-6, -1], arm: -30, bob: -1, face: 'smile' },
  'leo-jump': { legBack: [-5, -6], legFront: [4, -3], arm: 150, bob: -1, face: 'open' },
  'leo-fall': { legBack: [-3, -1], legFront: [5, -2], arm: 110, bob: 0, face: 'open' },
  'leo-think': { legBack: [-1, 0], legFront: [1, 0], arm: 160, bob: 0, face: 'focus' },
};
for (const [name, pose] of Object.entries(frames)) writeFileSync(`public/assets/leo/${name}.svg`, leo(pose));

// Tileset da caverna: 3 tiles de 32×32 (topo, preenchimento, plataforma de pedra).
writeFileSync(
  'public/assets/tiles/caverna.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="32" viewBox="0 0 96 32">
  <defs><linearGradient id="rock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A5996"/><stop offset="1" stop-color="#43427A"/></linearGradient></defs>
  <rect x="0" y="0" width="32" height="32" fill="url(#rock)"/>
  <path d="M0 0 h32 v7 q-4 3 -8 1 q-4 -2 -8 1 q-4 3 -8 0 q-4 -2 -8 0z" fill="#5ED3E0"/>
  <path d="M0 7 q4 -2 8 0 q4 3 8 0 q4 -3 8 -1 q4 2 8 -1" fill="none" stroke="#2C9FB0" stroke-width="1.5"/>
  <circle cx="9" cy="20" r="2" fill="#3B3A6E"/><circle cx="23" cy="25" r="1.5" fill="#3B3A6E"/>
  <rect x="32" y="0" width="32" height="32" fill="#43427A"/>
  <circle cx="40" cy="9" r="2" fill="#3B3A6E"/><circle cx="55" cy="18" r="2.5" fill="#3B3A6E"/><circle cx="44" cy="26" r="1.5" fill="#3B3A6E"/>
  <rect x="64" y="0" width="32" height="14" rx="3" fill="#8A7AB8" stroke="#3B2F2A" stroke-width="1.5"/>
  <path d="M66 4 h28" stroke="#B3A6DA" stroke-width="2" stroke-linecap="round"/>
  <path d="M74 1 v12 M86 1 v12" stroke="#5E5090" stroke-width="1.2"/>
</svg>
`,
);

const obj = (name: string, w: number, h: number, body: string): void =>
  writeFileSync(
    `public/assets/objects/${name}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>\n`,
  );

obj(
  'caixa',
  32,
  32,
  `<rect x="1.5" y="1.5" width="29" height="29" rx="3" fill="#B8823F"/><path d="M3 3 L29 29 M29 3 L3 29" stroke="#8C5E28" stroke-width="3"/><rect x="1.5" y="1.5" width="29" height="29" rx="3" fill="none" stroke="${C.ink}" stroke-width="2"/>`,
);
obj(
  'plataforma',
  64,
  16,
  `<rect x="1" y="1" width="62" height="14" rx="4" fill="${C.brass}" stroke="${C.ink}" stroke-width="2"/><circle cx="10" cy="8" r="2.5" fill="${C.brassDark}"/><circle cx="54" cy="8" r="2.5" fill="${C.brassDark}"/><path d="M18 8 h28" stroke="${C.brassDark}" stroke-width="2" stroke-dasharray="4 3"/>`,
);
obj(
  'bandeira-off',
  32,
  48,
  `<rect x="6" y="4" width="4" height="42" rx="2" fill="#6B5B4A" stroke="${C.ink}" stroke-width="1.2"/><path d="M10 6 h16 l-5 6 l5 6 h-16z" fill="#9AA0AE" stroke="${C.ink}" stroke-width="1.5" stroke-linejoin="round"/>`,
);
obj(
  'bandeira-on',
  32,
  48,
  `<rect x="6" y="4" width="4" height="42" rx="2" fill="#6B5B4A" stroke="${C.ink}" stroke-width="1.2"/><path d="M10 6 h16 l-5 6 l5 6 h-16z" fill="${C.scarf}" stroke="${C.ink}" stroke-width="1.5" stroke-linejoin="round"/><path d="M13 12 l2.5 2.5 l5 -5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
);
obj(
  'painel',
  40,
  48,
  `<rect x="16" y="26" width="8" height="22" fill="#6B5B4A" stroke="${C.ink}" stroke-width="1.5"/><rect x="2" y="2" width="36" height="28" rx="5" fill="#2F3A46" stroke="${C.brass}" stroke-width="3"/><path d="M15 11 q0 -5 5 -5 q5 0 5 5 q0 3 -4 4.5 v3" fill="none" stroke="#5ED3E0" stroke-width="3.2" stroke-linecap="round"/><circle cx="21" cy="24" r="2" fill="#5ED3E0"/>`,
);
obj(
  'painel-ok',
  40,
  48,
  `<rect x="16" y="26" width="8" height="22" fill="#6B5B4A" stroke="${C.ink}" stroke-width="1.5"/><rect x="2" y="2" width="36" height="28" rx="5" fill="#2F3A46" stroke="#3FB59A" stroke-width="3"/><path d="M11 16 l6 6 l12 -12" fill="none" stroke="#3FB59A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
);
obj(
  'pedra-ponte',
  32,
  32,
  `<rect x="1.5" y="1.5" width="29" height="29" rx="6" fill="#7B79B8" stroke="${C.ink}" stroke-width="2"/><path d="M5 8 h22" stroke="#A9A7DC" stroke-width="2.5" stroke-linecap="round"/>`,
);
obj(
  'cristal',
  32,
  32,
  `<path d="M16 2 L24 14 L16 30 L8 14z" fill="#5ED3E0" stroke="${C.ink}" stroke-width="1.5" stroke-linejoin="round"/><path d="M16 2 L16 30 M8 14 H24" stroke="#BFF3F8" stroke-width="1.2"/>`,
);
obj('engrenagem', 48, 48, gear(24, 24, 21, 10, C.brass));
obj(
  'porta',
  32,
  32,
  `<rect x="1" y="0" width="30" height="32" fill="#6E5A3E" stroke="${C.ink}" stroke-width="2"/><path d="M1 8 h30 M1 24 h30" stroke="#4E3F2B" stroke-width="2"/>${gear(16, 16, 8, 8, C.brass)}`,
);
obj(
  'portal',
  48,
  64,
  `<ellipse cx="24" cy="34" rx="20" ry="28" fill="#2A2950" stroke="${C.brass}" stroke-width="4"/><ellipse cx="24" cy="34" rx="13" ry="20" fill="none" stroke="#5ED3E0" stroke-width="3" stroke-dasharray="6 5"/><ellipse cx="24" cy="34" rx="6" ry="10" fill="#9B7BF0" opacity="0.8"/>`,
);
obj(
  'placa',
  32,
  40,
  `<rect x="14" y="20" width="4" height="20" fill="#6B5B4A" stroke="${C.ink}" stroke-width="1.2"/><rect x="2" y="2" width="28" height="20" rx="3" fill="#C9A46A" stroke="${C.ink}" stroke-width="2"/><path d="M7 9 h18 M7 15 h12" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>`,
);
obj(
  'bloco',
  32,
  32,
  `<rect x="1.5" y="1.5" width="29" height="29" rx="4" fill="${C.brass}" stroke="${C.ink}" stroke-width="2"/><rect x="6" y="6" width="20" height="20" rx="2" fill="none" stroke="${C.brassDark}" stroke-width="2"/>`,
);
obj(
  'apoio',
  32,
  32,
  `<rect x="2" y="2" width="28" height="28" rx="6" fill="#5ED3E0" fill-opacity="0.35" stroke="#5ED3E0" stroke-width="2" stroke-dasharray="4 3"/><path d="M10 16 h12 M16 10 v12" stroke="#BFF3F8" stroke-width="3" stroke-linecap="round"/>`,
);

// ---------- Mundo 2: Vila das Descobertas ----------
writeFileSync(
  'public/assets/tiles/vila.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="32" viewBox="0 0 96 32">
  <rect x="0" y="0" width="32" height="32" fill="#B5713F"/>
  <path d="M0 0 h32 v8 q-4 3 -8 0 q-4 -3 -8 0 q-4 3 -8 0 q-4 -3 -8 0z" fill="#6DBF4B"/>
  <path d="M3 8 l2 -5 l2 5 M14 8 l2 -6 l2 6 M25 8 l2 -5 l2 5" fill="#4E9A33"/>
  <ellipse cx="9" cy="21" rx="3" ry="2" fill="#94592F"/><ellipse cx="24" cy="26" rx="2.5" ry="1.8" fill="#94592F"/>
  <rect x="32" y="0" width="32" height="32" fill="#B5713F"/>
  <ellipse cx="40" cy="9" rx="3" ry="2" fill="#94592F"/><ellipse cx="55" cy="19" rx="3.5" ry="2.4" fill="#94592F"/><ellipse cx="44" cy="27" rx="2" ry="1.5" fill="#94592F"/>
  <rect x="64" y="0" width="32" height="14" rx="2" fill="#C98B4A" stroke="#3B2F2A" stroke-width="1.5"/>
  <path d="M75 1 v12 M86 1 v12" stroke="#8C5E28" stroke-width="1.5"/><circle cx="68" cy="7" r="1.3" fill="#3B2F2A"/><circle cx="92" cy="7" r="1.3" fill="#3B2F2A"/>
</svg>
`,
);
obj(
  'parafuso',
  32,
  32,
  `<path d="M16 3 l9 5 v10 l-9 5 l-9 -5 v-10z" fill="#E7B53C" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="16" cy="13" r="4" fill="#B98613" stroke="${C.ink}" stroke-width="1.2"/><rect x="14" y="22" width="4" height="8" rx="1" fill="#C9973A" stroke="${C.ink}" stroke-width="1.2"/>`,
);

// ---------- Mundo 4: Castelo das Estratégias ----------
writeFileSync(
  'public/assets/tiles/castelo.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="32" viewBox="0 0 96 32">
  <rect x="0" y="0" width="32" height="32" fill="#8A8F9C"/>
  <rect x="0" y="0" width="32" height="6" fill="#A9AEBA"/>
  <path d="M0 6 h32 M0 19 h32 M10 6 v13 M24 6 v13 M4 19 v13 M18 19 v13" stroke="#6B707D" stroke-width="1.5"/>
  <rect x="32" y="0" width="32" height="32" fill="#7C818E"/>
  <path d="M32 6 h32 M32 19 h32 M40 0 v6 M54 0 v6 M44 6 v13 M58 6 v13 M38 19 v13 M52 19 v13" stroke="#62666F" stroke-width="1.5"/>
  <rect x="64" y="0" width="32" height="14" rx="2" fill="#7A4E2D" stroke="#3B2F2A" stroke-width="1.5"/>
  <path d="M66 5 h28 M66 10 h28" stroke="#5C3A20" stroke-width="1.2"/><circle cx="69" cy="7" r="1.4" fill="#C9973A"/><circle cx="91" cy="7" r="1.4" fill="#C9973A"/>
</svg>
`,
);
obj(
  'chave',
  32,
  32,
  `<circle cx="11" cy="16" r="7" fill="none" stroke="#E7B53C" stroke-width="4"/><circle cx="11" cy="16" r="7" fill="none" stroke="${C.ink}" stroke-width="1" opacity="0.6"/><path d="M17 16 h12 v5 M24 16 v4" fill="none" stroke="#E7B53C" stroke-width="4" stroke-linecap="round"/>`,
);

// ---------- Mundo 5: Cidade dos Inventores ----------
writeFileSync(
  'public/assets/tiles/cidade.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="32" viewBox="0 0 96 32">
  <rect x="0" y="0" width="32" height="32" fill="#B8693C"/>
  <rect x="0" y="0" width="32" height="8" fill="#3FB59A"/>
  <path d="M0 8 h32" stroke="#2A7F6B" stroke-width="2"/>
  <circle cx="5" cy="4" r="1.5" fill="#1F5C4E"/><circle cx="27" cy="4" r="1.5" fill="#1F5C4E"/>
  <path d="M0 20 h32 M16 8 v12 M8 20 v12 M24 20 v12" stroke="#94532D" stroke-width="1.5"/>
  <rect x="32" y="0" width="32" height="32" fill="#A85F35"/>
  <path d="M32 10 h32 M32 22 h32 M44 0 v10 M56 10 v12 M40 22 v10 M52 22 v10" stroke="#8B4D29" stroke-width="1.5"/>
  <rect x="64" y="1" width="32" height="12" fill="#5B6B73" stroke="#3B2F2A" stroke-width="1.5"/>
  <path d="M64 1 l8 12 l8 -12 l8 12 l8 -12" fill="none" stroke="#8FA3AD" stroke-width="1.5"/>
</svg>
`,
);
obj(
  'lampada',
  32,
  32,
  `<circle cx="16" cy="12" r="9" fill="#FFE27A" stroke="${C.ink}" stroke-width="1.6"/><path d="M12 13 q4 -5 8 0" fill="none" stroke="#E7A93C" stroke-width="1.5"/><rect x="11.5" y="20" width="9" height="7" rx="1.5" fill="#8FA3AD" stroke="${C.ink}" stroke-width="1.4"/><path d="M12 23 h8" stroke="${C.ink}" stroke-width="1"/>`,
);

// ---------- Mundo 6: Laboratório do Saber ----------
writeFileSync(
  'public/assets/tiles/laboratorio.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="32" viewBox="0 0 96 32">
  <rect x="0" y="0" width="32" height="32" fill="#3A4656"/>
  <rect x="0" y="0" width="32" height="5" fill="#9B7BF0"/>
  <path d="M4 12 h10 v8 h12 M20 12 v-4" fill="none" stroke="#6E58B8" stroke-width="1.5"/>
  <circle cx="26" cy="20" r="2" fill="#B9A4FF"/>
  <rect x="32" y="0" width="32" height="32" fill="#323D4B"/>
  <path d="M36 6 h8 v10 h14 M50 16 v10" fill="none" stroke="#4E5B6C" stroke-width="1.5"/><circle cx="58" cy="16" r="1.6" fill="#6E58B8"/>
  <rect x="64" y="1" width="32" height="12" rx="3" fill="#BFF3F8" fill-opacity="0.55" stroke="#3B2F2A" stroke-width="1.5"/>
  <path d="M68 4 l6 6 M78 4 l6 6" stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>
</svg>
`,
);
obj(
  'frasco',
  32,
  32,
  `<path d="M12 3 h8 v8 l7 14 q1 4 -3 4 h-16 q-4 0 -3 -4 l7 -14z" fill="#E9E0FF" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 21 h16 l2 4 q0 2 -2 2 h-16 q-2 0 -2 -2z" fill="#9B7BF0"/><circle cx="14" cy="17" r="1.5" fill="#9B7BF0"/><circle cx="18" cy="14" r="1" fill="#9B7BF0"/>`,
);

// ---------- Mundo 1: Floresta dos Números ----------
writeFileSync(
  'public/assets/tiles/floresta.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="32" viewBox="0 0 96 32">
  <rect x="0" y="0" width="32" height="32" fill="#7A5230"/>
  <path d="M0 0 h32 v9 q-4 4 -8 1 q-4 -3 -8 1 q-4 4 -8 0 q-4 -3 -8 1z" fill="#5FA34A"/>
  <circle cx="7" cy="4" r="2" fill="#F2C14E"/><circle cx="23" cy="5" r="1.6" fill="#F6EEDC"/>
  <path d="M6 18 q4 6 10 4 M20 26 q3 -4 8 -3" fill="none" stroke="#5C3B20" stroke-width="2"/>
  <rect x="32" y="0" width="32" height="32" fill="#6E4A2B"/>
  <path d="M36 8 q5 4 10 2 M48 20 q4 5 10 3 M38 27 q3 -3 7 -2" fill="none" stroke="#5C3B20" stroke-width="2"/>
  <rect x="64" y="2" width="32" height="11" rx="5" fill="#9A6A3C" stroke="#3B2F2A" stroke-width="1.5"/>
  <circle cx="69" cy="7.5" r="3" fill="#C9973A" stroke="#3B2F2A" stroke-width="1"/><path d="M75 5 h16 M75 10 h14" stroke="#7A5230" stroke-width="1.2"/>
</svg>
`,
);
obj(
  'bolota',
  32,
  32,
  `<ellipse cx="16" cy="19" rx="8" ry="10" fill="#C98B4A" stroke="${C.ink}" stroke-width="1.6"/><path d="M6 13 q10 -10 20 0 q-10 4 -20 0z" fill="#7A5230" stroke="${C.ink}" stroke-width="1.5"/><path d="M16 6 v-3" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>`,
);

console.log('✔ arte gerada em public/assets');
