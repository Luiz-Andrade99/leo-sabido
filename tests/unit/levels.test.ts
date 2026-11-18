import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { asciiToTiled, TILE, type AsciiLevelConfig } from '../../src/levels/ascii';
import { getProp, type TiledMap } from '../../src/levels/tiled';
import { DesafioListSchema, MundosSchema } from '../../src/content/schema';

const cfg: AsciiLevelConfig = {
  nome: 'teste',
  tileset: { name: 'caverna', image: 'x.svg', columns: 3, tilecount: 3 },
  objetos: { M: { dx: 96, periodo: 2000 } },
  paineis: {
    1: { pool: '3ano.sequencias', mecanismo: 'ponte', titulo: 'Ponte' },
    2: { pool: '3ano.distribuir', mecanismo: 'elevador', titulo: 'Elevador', dy: -128, periodo: 3000, dificuldade: 2 },
  },
  placas: ['Olá!'],
  saida: 'portal',
};

const MAP = [' S!1 2 *   G ', '#=#M##aa##bb#+', '#############'].join('\n');

describe('asciiToTiled', () => {
  const map = asciiToTiled(MAP, cfg);
  const objs = map.layers[1].objects;
  const byType = (t: string) => objs.filter((o) => o.type === t);

  it('gera tiles de topo, preenchimento e plataforma; mecanismos não são tiles', () => {
    const d = map.layers[0].data;
    expect(d[map.width * 1 + 0]).toBe(TILE.top);
    expect(d[map.width * 1 + 1]).toBe(TILE.ledge);
    expect(d[map.width * 2 + 0]).toBe(TILE.fill);
    expect(d[map.width * 1 + 6]).toBe(0);
  });

  it('posiciona objetos em pixels', () => {
    expect([byType('spawn')[0]!.x, byType('spawn')[0]!.y]).toEqual([32, 0]);
  });

  it('painéis levam pool, tipo de mecanismo, título e dificuldade', () => {
    const p2 = byType('challenge').find((o) => getProp(o, 'painel', '') === '2')!;
    expect(getProp(p2, 'pool', '')).toBe('3ano.distribuir');
    expect(getProp(p2, 'mecanismo', '')).toBe('elevador');
    expect(getProp(p2, 'dificuldade', 0)).toBe(2);
    expect(getProp(byType('challenge')[0]!, 'dificuldade', 0)).toBe(1);
  });

  it('agrupa letras de mecanismo em sequências e liga ao painel', () => {
    const mechs = byType('mechanism');
    expect(mechs).toHaveLength(2);
    const a = mechs.find((m) => getProp(m, 'painel', '') === '1')!;
    expect(a.width).toBe(64);
    expect(getProp(a, 'tipo', '')).toBe('ponte');
    const b = mechs.find((m) => getProp(m, 'painel', '') === '2')!;
    expect(getProp(b, 'dy', 0)).toBe(-128);
  });

  it('placas, apoio, cristais e saída', () => {
    expect(getProp(byType('sign')[0]!, 'texto', '')).toBe('Olá!');
    expect(byType('assist')).toHaveLength(1);
    expect(byType('crystal')).toHaveLength(1);
    expect(getProp(byType('goal')[0]!, 'tipo', '')).toBe('portal');
  });

  it('plataforma móvel recebe propriedades e largura padrão de 2 tiles', () => {
    const m = byType('moving_platform')[0]!;
    expect(getProp(m, 'dx', 0)).toBe(96);
    expect(m.width).toBe(64);
  });

  it('recusa mapas inconsistentes', () => {
    expect(() => asciiToTiled([' S1  G', '######'].join('\n'), cfg)).toThrow(/não tem mecanismo/);
    expect(() => asciiToTiled([' S   G', '##aa##'].join('\n'), cfg)).toThrow(/sem painel no mapa/);
    expect(() => asciiToTiled([' S 3a G', '#######'].join('\n'), cfg)).toThrow(/não está em "paineis"/);
    expect(() => asciiToTiled([' S   G', '######'].join('\n'), cfg)).toThrow(/placa/);
    expect(() => asciiToTiled(['  ! G', '#####'].join('\n'), cfg)).toThrow(/início/);
    expect(() => asciiToTiled([' S!  ', '#####'].join('\n'), cfg)).toThrow(/saída/);
  });

  it('getProp usa o valor padrão quando o tipo não confere', () => {
    expect(getProp({ properties: [{ name: 'dx', value: 'abc' }] }, 'dx', 5)).toBe(5);
  });
});

describe('fases publicadas', () => {
  const pools = new Set(
    readdirSync('content/anos').flatMap((ano) =>
      readdirSync(`content/anos/${ano}/desafios`).flatMap((f) =>
        DesafioListSchema.parse(JSON.parse(readFileSync(`content/anos/${ano}/desafios/${f}`, 'utf8'))).map((d) => d.pool),
      ),
    ),
  );
  const maps = readdirSync('public/levels').filter((n) => n.endsWith('.tmj'));

  for (const f of maps) {
    it(`${f} só usa pools de desafio que existem`, () => {
      const map = JSON.parse(readFileSync(`public/levels/${f}`, 'utf8')) as TiledMap;
      for (const o of map.layers[1].objects.filter((x) => x.type === 'challenge')) {
        expect(pools.has(getProp(o, 'pool', ''))).toBe(true);
      }
    });
  }

  it('toda fase de mundos.json tem mapa publicado', () => {
    const mundos = MundosSchema.parse(JSON.parse(readFileSync('content/mundos.json', 'utf8')));
    for (const a of mundos.anos) for (const fase of a.fases) expect(maps).toContain(`${fase.mapa}.tmj`);
  });
});
