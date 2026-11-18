import { createRng, type Rng } from '../../core/rng';
import type { GraficoParams } from '../../content/schema';
import { parseNatural, type Evaluation, type FormatModule, type TemplateVars } from './types';

/**
 * Formato "Gráfico de colunas": ler o gráfico para responder (EF04MA27).
 * Perguntas: valor de uma coluna, diferença entre duas, total de todas.
 * Modelos geram um conjunto fixo e reprodutível de variações (amostras com semente), todas validadas.
 */

export const MAX_VALOR_GRAFICO = 100;
export const AMOSTRAS_MODELO = 120;

export interface Barra {
  rotulo: string;
  valor: number;
}

export interface ResolvedChart {
  formato: 'grafico';
  titulo: string;
  unidade: string;
  dados: Barra[];
  passo: number;
  pergunta: 'valor' | 'diferenca' | 'total';
  alvo: number[];
  resposta: number;
  vars: TemplateVars;
}

function answerFor(dados: Barra[], pergunta: ResolvedChart['pergunta'], alvo: number[]): number {
  if (pergunta === 'total') return dados.reduce((s, d) => s + d.valor, 0);
  if (pergunta === 'diferenca') return dados[alvo[0]!]!.valor - dados[alvo[1]!]!.valor;
  return dados[alvo[0]!]!.valor;
}

function build(titulo: string, unidade: string, dados: Barra[], passo: number, pergunta: ResolvedChart['pergunta'], alvo: number[]): ResolvedChart {
  const resposta = answerFor(dados, pergunta, alvo);
  const a = dados[alvo[0] ?? 0]!;
  const b = dados[alvo[1] ?? 0]!;
  return {
    formato: 'grafico',
    titulo,
    unidade,
    dados,
    passo,
    pergunta,
    alvo,
    resposta,
    vars: { titulo, unidade, passo, a: a.rotulo, b: b.rotulo, va: a.valor, vb: b.valor, resposta, soma: dados.map((d) => d.valor).join(' + ') },
  };
}

function validateChart(r: ResolvedChart): string[] {
  const errs: string[] = [];
  if (new Set(r.dados.map((d) => d.rotulo)).size !== r.dados.length) errs.push('Rótulos repetidos.');
  if (r.dados.some((d) => d.valor < 0 || d.valor > MAX_VALOR_GRAFICO)) errs.push(`Valores de 0 a ${MAX_VALOR_GRAFICO}.`);
  if (r.dados.some((d) => d.valor % r.passo !== 0)) errs.push('Todos os valores devem cair numa linha do gráfico (múltiplos do passo).');
  if (r.pergunta !== 'total' && r.alvo.some((i) => i < 0 || i >= r.dados.length)) errs.push('Coluna-alvo inexistente.');
  if (r.pergunta === 'valor' && r.alvo.length !== 1) errs.push('Pergunta de valor precisa de uma coluna-alvo.');
  if (r.pergunta === 'diferenca' && (r.alvo.length !== 2 || r.alvo[0] === r.alvo[1] || r.resposta <= 0)) {
    errs.push('Diferença precisa de duas colunas, a primeira maior que a segunda.');
  }
  if (r.resposta <= 0) errs.push('A resposta precisa ser maior que zero.');
  return errs;
}

const cache = new Map<string, ResolvedChart[]>();

function enumerate(p: GraficoParams): ResolvedChart[] {
  if (p.tipo === 'fixo') return [build(p.titulo, p.unidade, p.dados, p.passo, p.pergunta, p.alvo)];
  const key = JSON.stringify(p);
  const hit = cache.get(key);
  if (hit) return hit;
  const out: ResolvedChart[] = [];
  const steps = Math.floor((p.valor[1] - p.valor[0]) / p.passo);
  for (let seed = 1; seed <= AMOSTRAS_MODELO; seed++) {
    const g = createRng(seed * 7919);
    const dados = p.rotulos.map((rotulo) => ({ rotulo, valor: p.valor[0] + g.int(0, steps) * p.passo }));
    const n = dados.length;
    let alvo: number[] = [];
    if (p.pergunta === 'valor') alvo = [g.int(0, n - 1)];
    if (p.pergunta === 'diferenca') {
      const i = g.int(0, n - 1);
      let j = g.int(0, n - 2);
      if (j >= i) j++;
      alvo = dados[i]!.valor >= dados[j]!.valor ? [i, j] : [j, i];
    }
    const r = build(p.titulo, p.unidade, dados, p.passo, p.pergunta, alvo);
    if (validateChart(r).length === 0) out.push(r);
  }
  cache.set(key, out);
  return out;
}

function validate(p: GraficoParams): string[] {
  if (p.tipo === 'fixo') return validateChart(enumerate(p)[0]!);
  return enumerate(p).length === 0 ? ['Modelo não gera nenhuma variação válida.'] : [];
}

function resolve(p: GraficoParams, rng: Rng): ResolvedChart {
  return structuredClone(rng.pick(enumerate(p)));
}

function evaluate(r: ResolvedChart, answer: unknown): Evaluation {
  const n = parseNatural(answer);
  if (n === null) return { status: 'invalid', message: 'Digite um número para responder.' };
  if (n === r.resposta) return { status: 'correct', perSlot: [true], message: `Isso! A resposta é ${r.resposta} ${r.unidade}.` };
  const dir = n < r.resposta ? 'menor' : 'maior';
  return { status: 'incorrect', perSlot: [false], message: `${n} é ${dir} do que a resposta. Olhe de novo a altura das colunas e as linhas do gráfico.` };
}

export const chart: FormatModule<GraficoParams, ResolvedChart> = {
  resolve,
  enumerate,
  validate,
  countVariants: (p) => enumerate(p).length,
  evaluate,
};
