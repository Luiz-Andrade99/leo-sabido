/**
 * Gera public/levels/<nome>.tmj (formato Tiled) a partir de levels/src/<nome>.txt.
 * Uso: npm run gen:levels
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { asciiToTiled, type AsciiLevelConfig } from '../src/levels/ascii';

const SRC = 'levels/src';
const OUT = 'public/levels';

export function parseLevelSource(text: string): { cfg: AsciiLevelConfig; ascii: string } {
  const [head, ...rest] = text.replace(/\r/g, '').split('\n---\n');
  if (head === undefined || rest.length === 0) throw new Error('Arquivo de fase precisa de cabeçalho JSON, linha "---" e o mapa.');
  return { cfg: JSON.parse(head) as AsciiLevelConfig, ascii: rest.join('\n---\n') };
}

for (const file of readdirSync(SRC).filter((f) => f.endsWith('.txt'))) {
  const { cfg, ascii } = parseLevelSource(readFileSync(join(SRC, file), 'utf8'));
  const map = asciiToTiled(ascii, cfg);
  const out = join(OUT, basename(file, '.txt') + '.tmj');
  writeFileSync(out, JSON.stringify(map, null, 1) + '\n');
  console.log(`✔ ${out} (${map.width}×${map.height} tiles, ${map.layers[1].objects.length} objetos)`);
}
