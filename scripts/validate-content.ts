/**
 * Valida todo o banco de desafios, os mundos e as fases.
 *   npm run validate:content              → schema, todas as variações parametrizadas e textos
 *   npm run validate:content -- --producao → também exige que toda fase só use pools com itens APROVADOS
 * Sai com código 1 em qualquer erro (usado no CI e no build).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { countItemVariants, validateItem } from '../src/challenges/formats/registry';
import { isPublishable } from '../src/content/repository';
import { DesafioListSchema, MundosSchema, type Desafio } from '../src/content/schema';
import { getProp, type TiledMap } from '../src/levels/tiled';

const producao = process.argv.includes('--producao');
const mode = producao ? 'producao' : 'homologacao';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.json') ? [p] : [];
  });
}

const errors: string[] = [];
const items: Desafio[] = [];
for (const file of walk('content/anos')) {
  const parsed = DesafioListSchema.safeParse(JSON.parse(readFileSync(file, 'utf8')));
  if (!parsed.success) {
    errors.push(`${file}: ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`);
    continue;
  }
  for (const d of parsed.data) {
    for (const e of validateItem(d)) errors.push(`${d.id}: ${e}`);
    if (!file.includes(`${join('anos', String(d.ano))}`)) errors.push(`${d.id}: está na pasta de outro ano (${file}).`);
    items.push(d);
  }
}

const ids = new Set<string>();
for (const d of items) {
  if (ids.has(d.id)) errors.push(`ID duplicado entre arquivos: ${d.id}`);
  ids.add(d.id);
}

// Mundos e fases
const mundos = MundosSchema.safeParse(JSON.parse(readFileSync('content/mundos.json', 'utf8')));
if (!mundos.success) errors.push(`content/mundos.json: ${mundos.error.message}`);
const usedMaps = new Set<string>();
if (mundos.success) {
  for (const a of mundos.data.anos) {
    for (const fase of a.fases) {
      const file = join('public/levels', `${fase.mapa}.tmj`);
      if (!existsSync(file)) {
        errors.push(`Ano ${a.ano}, ${fase.id}: mapa ${file} não existe (rode npm run gen:levels).`);
        continue;
      }
      usedMaps.add(fase.mapa);
      const map = JSON.parse(readFileSync(file, 'utf8')) as TiledMap;
      for (const o of map.layers[1].objects.filter((x) => x.type === 'challenge')) {
        const pool = getProp(o, 'pool', '');
        if (!pool.startsWith(`${a.ano}ano.`)) errors.push(`${fase.mapa}: painel usa "${pool}", de outro ano escolar.`);
        const n = items.filter((d) => d.pool === pool && isPublishable(d, mode)).length;
        if (n === 0) errors.push(`${fase.mapa}: painel usa o pool "${pool}", que não tem itens publicáveis em ${mode}.`);
      }
    }
  }
}

// Critérios da versão 1.0 (seção 15 do Prompt Mestre) para cada ano disponível
const porAno = new Map<number, { formatos: Set<string>; variacoes: number; itens: number }>();
for (const d of items) {
  const s = porAno.get(d.ano) ?? { formatos: new Set<string>(), variacoes: 0, itens: 0 };
  s.formatos.add(d.formato);
  s.variacoes += countItemVariants(d);
  s.itens++;
  porAno.set(d.ano, s);
}
if (mundos.success) {
  for (const a of mundos.data.anos.filter((x) => x.disponivel)) {
    const s = porAno.get(a.ano);
    if (a.fases.length < 5) errors.push(`${a.ano}º ano: ${a.fases.length} fases; a versão 1.0 pede 5.`);
    if (!s || s.formatos.size < 4) errors.push(`${a.ano}º ano: ${s?.formatos.size ?? 0} formatos de desafio; a versão 1.0 pede pelo menos 4.`);
    if (!s || s.variacoes < 120) errors.push(`${a.ano}º ano: ${s?.variacoes ?? 0} variações validadas; a meta é 120.`);
  }
}
for (const [ano, s] of [...porAno].sort((x, y) => x[0] - y[0])) {
  console.log(`  ${ano}º ano: ${s.itens} itens, ${s.variacoes} variações, ${s.formatos.size} formatos (${[...s.formatos].join(', ')})`);
}

// Resumo por pool e por ano (meta da versão completa: 120 variações validadas por ano)
const pools = new Map<string, { itens: number; variacoes: number; aprovados: number }>();
for (const d of items) {
  const s = pools.get(d.pool) ?? { itens: 0, variacoes: 0, aprovados: 0 };
  s.itens++;
  s.variacoes += countItemVariants(d);
  if (isPublishable(d, 'producao')) s.aprovados++;
  pools.set(d.pool, s);
}

console.log(`Conteúdo: ${items.length} itens (modo ${mode}); fases em uso: ${[...usedMaps].join(', ')}`);
for (const [pool, s] of [...pools].sort()) {
  console.log(`  ${pool}: ${s.itens} itens, ${s.variacoes} variações, ${s.aprovados} aprovados para produção`);
}
if (errors.length > 0) {
  console.error(`\n✖ ${errors.length} problema(s):\n  - ${errors.join('\n  - ')}`);
  process.exit(1);
}
console.log('✔ Conteúdo válido');
