/**
 * Gera docs/pedagogico/inventario-exercicios.md a partir do banco de desafios (fonte única: content/).
 * Uso: npm run docs:inventario
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { countItemVariants } from '../src/challenges/formats/registry';
import { DesafioListSchema, type Desafio } from '../src/content/schema';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.json') ? [p] : [];
  });
}

const items: Desafio[] = walk('content/anos').flatMap((f) => DesafioListSchema.parse(JSON.parse(readFileSync(f, 'utf8'))));
items.sort((a, b) => a.ano - b.ano || a.id.localeCompare(b.id));

const FORMATO: Record<Desafio['formato'], string> = {
  sequencia: 'Completar sequência',
  numerico: 'Problema numérico',
  distribuir: 'Distribuir igualmente',
  arranjo: 'Arranjo retangular',
  posicional: 'Valor posicional',
  dinheiro: 'Dinheiro',
  relogio: 'Relógio',
  fracao: 'Fração',
  grafico: 'Gráfico de colunas',
  igualdade: 'Igualdade',
  porcentagem: 'Porcentagem',
  decimal: 'Número decimal',
  area: 'Área e perímetro',
  programa: 'Programa (algoritmo)',
  expressao: 'Expressão numérica',
  divisibilidade: 'Divisibilidade',
  contagem: 'Contagem (escolha por imagem)',
  formas: 'Figuras planas (escolha por imagem)',
  padrao: 'Padrão (escolha por imagem)',
  ordenar: 'Ordenar números (toque)',
};

const total = items.reduce((s, d) => s + countItemVariants(d), 0);
const lines = [
  '# Inventário de Exercícios',
  '',
  '> Gerado automaticamente por `npm run docs:inventario` a partir de `content/`. Não edite à mão.',
  '',
  `Total: **${items.length} itens**, **${total} variações** verificadas automaticamente. Itens aprovados para produção: **${items.filter((d) => d.revisao.status === 'aprovado').length}**.`,
  '',
  '## Resumo por ano',
  '',
  '| Ano | Itens | Variações validadas | Formatos | Meta da versão 1.0 (≥ 120 variações, ≥ 4 formatos) |',
  '|---|---|---|---|---|',
  ...[1, 2, 3, 4, 5, 6].map((ano) => {
    const its = items.filter((d) => d.ano === ano);
    const v = its.reduce((s, d) => s + countItemVariants(d), 0);
    const f = new Set(its.map((d) => d.formato)).size;
    return `| ${ano}º | ${its.length} | ${v} | ${f} | ${v >= 120 && f >= 4 ? '✅ atingida' : '⏳ pendente'} |`;
  }),
  '',
  '## Itens',
  '',
  '| ID | Ano | Pool | Formato | Tema | BNCC (status) | Dif. | Variações | Revisão |',
  '|---|---|---|---|---|---|---|---|---|',
  ...items.map(
    (d) =>
      `| ${d.id} | ${d.ano}º | \`${d.pool}\` | ${FORMATO[d.formato]} | ${d.tema} | ${d.bncc.map((b) => `${b.codigo} (${b.status === 'validado' ? 'validado' : 'a validar'})`).join(', ')} | ${d.dificuldade} | ${countItemVariants(d)} | ${d.revisao.status.replace('_', ' ')} |`,
  ),
  '',
  '## Objetivos por item',
  '',
  ...items.map((d) => `- **${d.id}** — ${d.objetivo}`),
  '',
];
writeFileSync('docs/pedagogico/inventario-exercicios.md', lines.join('\n'));
console.log(`✔ docs/pedagogico/inventario-exercicios.md (${items.length} itens, ${total} variações)`);
