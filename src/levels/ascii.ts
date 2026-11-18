import type { TiledMap, TiledObject, TiledProperty } from './tiled';

/**
 * Converte um mapa em texto (fácil de desenhar e revisar) para o formato do Tiled.
 * O arquivo gerado pode ser aberto e refinado no editor Tiled.
 *
 * Legenda:
 *   #  rocha (o tile de topo é escolhido automaticamente)    =  plataforma de pedra
 *   S  início do Leo        C  ponto de controle (bandeira)   B  caixa empurrável
 *   M  plataforma móvel horizontal    V  plataforma móvel vertical
 *   1–9  painel de desafio N          a–i  células do mecanismo do painel 1–9
 *   !  placa com texto (na ordem de "placas")    +  bloco de apoio (só existe no modo assistido)
 *   *  cristal coletável    G  saída da fase
 *
 * O tipo de cada mecanismo (porta, ponte, blocos, elevador) vem do cabeçalho, em "paineis".
 */

export type MechanismType = 'porta' | 'ponte' | 'blocos' | 'elevador';

export interface PanelConfig {
  pool: string;
  mecanismo: MechanismType;
  titulo: string;
  dificuldade?: 1 | 2 | 3;
  /** Elevador: deslocamento vertical (px, negativo = sobe) e duração da ida e volta (ms). */
  dy?: number;
  periodo?: number;
}

export interface AsciiLevelConfig {
  nome: string;
  tileset: { name: string; image: string; columns: number; tilecount: number };
  objetos?: Record<string, Record<string, string | number | boolean>>;
  paineis?: Record<string, PanelConfig>;
  placas?: string[];
  saida?: 'portal' | 'engrenagem';
  /** Tema visual/sonoro do mundo (ver src/scenes/themes.ts). */
  tema?: string;
}

export const TILE = { top: 1, fill: 2, ledge: 3 } as const;

const SIMPLE: Record<string, string> = {
  S: 'spawn',
  C: 'checkpoint',
  B: 'box',
  M: 'moving_platform',
  V: 'moving_platform',
  G: 'goal',
  '*': 'crystal',
  '!': 'sign',
};

const MECH_LETTERS = 'abcdefghi';

function toProps(values: Record<string, string | number | boolean | undefined>): TiledProperty[] {
  return Object.entries(values)
    .filter((e): e is [string, string | number | boolean] => e[1] !== undefined)
    .map(([name, value]) => ({
      name,
      value,
      type: typeof value === 'boolean' ? 'bool' : typeof value === 'number' ? (Number.isInteger(value) ? 'int' : 'float') : 'string',
    }));
}

export function asciiToTiled(ascii: string, cfg: AsciiLevelConfig, tileSize = 32): TiledMap {
  const rows = ascii.replace(/\r/g, '').split('\n');
  while (rows.length > 0 && rows[rows.length - 1]!.trim() === '') rows.pop();
  const height = rows.length;
  const width = Math.max(...rows.map((r) => r.length));
  const grid = rows.map((r) => r.padEnd(width, ' ').split(''));
  const at = (x: number, y: number): string => grid[y]?.[x] ?? ' ';

  const data: number[] = [];
  const objects: TiledObject[] = [];
  let nextId = 1;
  const signs: string[] = cfg.placas ?? [];
  let signIndex = 0;
  const panelsSeen = new Set<string>();
  const mechSeen = new Set<string>();

  const add = (type: string, x: number, y: number, w: number, props: Record<string, string | number | boolean | undefined> = {}): void => {
    const obj: TiledObject = { id: nextId++, name: '', type, x: x * tileSize, y: y * tileSize, width: w * tileSize, height: tileSize, rotation: 0, visible: true };
    const p = toProps(props);
    if (p.length > 0) obj.properties = p;
    objects.push(obj);
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const c = at(x, y);
      data.push(c === '#' ? (at(x, y - 1) === '#' ? TILE.fill : TILE.top) : c === '=' ? TILE.ledge : 0);

      const simple = SIMPLE[c];
      if (simple === 'sign') {
        const texto = signs[signIndex++];
        if (texto === undefined) throw new Error(`Placa "!" em (${x}, ${y}) sem texto em "placas".`);
        add('sign', x, y, 1, { texto });
      } else if (simple === 'goal') {
        add('goal', x, y, 1, { tipo: cfg.saida ?? 'portal' });
      } else if (simple === 'moving_platform') {
        const p = { ...(cfg.objetos?.[c] ?? {}) };
        if (c === 'M') p.dx ??= 128;
        if (c === 'V') p.dy ??= -160;
        const w = typeof p.largura === 'number' ? p.largura : 2;
        delete p.largura;
        add('moving_platform', x, y, w, p);
      } else if (simple !== undefined) {
        add(simple, x, y, 1);
      } else if (/[1-9]/.test(c)) {
        const cfgP = cfg.paineis?.[c];
        if (!cfgP) throw new Error(`Painel ${c} em (${x}, ${y}) não está em "paineis".`);
        if (panelsSeen.has(c)) throw new Error(`Painel ${c} aparece mais de uma vez.`);
        panelsSeen.add(c);
        add('challenge', x, y, 1, { painel: c, pool: cfgP.pool, mecanismo: cfgP.mecanismo, titulo: cfgP.titulo, dificuldade: cfgP.dificuldade ?? 1 });
      }

      // Sequências horizontais de mecanismo (a–i) e de apoio (+) viram um objeto por linha.
      const isRunChar = MECH_LETTERS.includes(c) || c === '+';
      if (isRunChar && c !== ' ' && at(x - 1, y) !== c) {
        let len = 1;
        while (at(x + len, y) === c) len++;
        if (c === '+') {
          add('assist', x, y, len);
        } else {
          const painel = String(MECH_LETTERS.indexOf(c) + 1);
          const cfgP = cfg.paineis?.[painel];
          if (!cfgP) throw new Error(`Mecanismo "${c}" em (${x}, ${y}) sem painel ${painel} configurado.`);
          mechSeen.add(painel);
          add('mechanism', x, y, len, { painel, tipo: cfgP.mecanismo, dy: cfgP.dy, periodo: cfgP.periodo });
        }
      }
    }
  }

  for (const p of panelsSeen) if (!mechSeen.has(p)) throw new Error(`Painel ${p} não tem mecanismo (letra ${MECH_LETTERS[Number(p) - 1]}).`);
  for (const p of mechSeen) if (!panelsSeen.has(p)) throw new Error(`Mecanismo do painel ${p} sem painel no mapa.`);
  if (signIndex !== signs.length) throw new Error(`Há ${signs.length} textos de placa, mas ${signIndex} placas "!" no mapa.`);
  if (!objects.some((o) => o.type === 'spawn')) throw new Error('Fase sem início (S).');
  if (!objects.some((o) => o.type === 'goal')) throw new Error('Fase sem saída (G).');

  return {
    type: 'map',
    version: '1.10',
    tiledversion: '1.11.0',
    orientation: 'orthogonal',
    renderorder: 'right-down',
    infinite: false,
    width,
    height,
    tilewidth: tileSize,
    tileheight: tileSize,
    nextlayerid: 3,
    nextobjectid: nextId,
    layers: [
      { id: 1, name: 'chao', type: 'tilelayer', width, height, x: 0, y: 0, opacity: 1, visible: true, data },
      { id: 2, name: 'objetos', type: 'objectgroup', draworder: 'topdown', x: 0, y: 0, opacity: 1, visible: true, objects },
    ],
    tilesets: [
      {
        firstgid: 1,
        name: cfg.tileset.name,
        image: cfg.tileset.image,
        imagewidth: cfg.tileset.columns * tileSize,
        imageheight: Math.ceil(cfg.tileset.tilecount / cfg.tileset.columns) * tileSize,
        tilewidth: tileSize,
        tileheight: tileSize,
        columns: cfg.tileset.columns,
        tilecount: cfg.tileset.tilecount,
        margin: 0,
        spacing: 0,
      },
    ],
    properties: toProps({ nome: cfg.nome, tema: cfg.tema ?? 'caverna' }),
  };
}
