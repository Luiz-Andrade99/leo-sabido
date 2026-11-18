import type { Rng } from '../../core/rng';
import type { ProgramaParams } from '../../content/schema';
import { range, type Evaluation, type FormatModule, type TemplateVars } from './types';

/**
 * Formato "Programa": montar uma sequência de comandos (+3, ×2, −1, ÷2…) que leva a máquina
 * do número inicial ao número-alvo (EF06MA04 — algoritmos). Qualquer programa que funcione dentro
 * do limite de passos vale; a validação garante, por busca em largura, que sempre existe solução.
 */

export const MAX_VALOR_PROGRAMA = 999;

export interface Comando {
  op: '+' | '-' | 'x' | '/';
  n: number;
  rotulo: string;
}

const SIMB = { '+': '+', '-': '−', x: '×', '/': '÷' } as const;

export function parseComando(s: string): Comando {
  const m = /^([+\-x/])(\d{1,3})$/.exec(s);
  if (!m) throw new Error(`Comando inválido: ${s}`);
  const op = m[1] as Comando['op'];
  const n = Number(m[2]);
  return { op, n, rotulo: `${SIMB[op]}${n}` };
}

/** Aplica um comando; null se não for possível (divisão não exata, resultado negativo ou grande demais). */
export function aplicar(v: number, c: Comando): number | null {
  let r: number;
  switch (c.op) {
    case '+':
      r = v + c.n;
      break;
    case '-':
      r = v - c.n;
      break;
    case 'x':
      r = v * c.n;
      break;
    case '/':
      if (c.n === 0 || v % c.n !== 0) return null;
      r = v / c.n;
      break;
  }
  return r < 0 || r > MAX_VALOR_PROGRAMA ? null : r;
}

/** Menor programa (índices dos comandos) do início ao alvo, ou null. */
export function menorPrograma(inicio: number, alvo: number, cmds: Comando[], maxPassos: number): number[] | null {
  const prev = new Map<number, [number, number]>();
  let frontier = [inicio];
  const seen = new Set([inicio]);
  for (let step = 0; step < maxPassos && frontier.length > 0; step++) {
    const next: number[] = [];
    for (const v of frontier) {
      cmds.forEach((c, i) => {
        const r = aplicar(v, c);
        if (r === null || seen.has(r)) return;
        seen.add(r);
        prev.set(r, [v, i]);
        next.push(r);
      });
    }
    if (seen.has(alvo)) break;
    frontier = next;
  }
  if (!prev.has(alvo)) return null;
  const path: number[] = [];
  let cur = alvo;
  while (cur !== inicio) {
    const [p, i] = prev.get(cur)!;
    path.unshift(i);
    cur = p;
  }
  return path;
}

export interface ResolvedProgram {
  formato: 'programa';
  inicio: number;
  alvo: number;
  comandos: Comando[];
  maxPassos: number;
  solucao: number[];
  vars: TemplateVars;
}

export function rastro(inicio: number, cmds: Comando[], programa: number[]): { texto: string; final: number | null; falhou: string | null } {
  let v = inicio;
  const partes = [String(inicio)];
  for (const i of programa) {
    const c = cmds[i]!;
    const r = aplicar(v, c);
    if (r === null) return { texto: partes.join(' → '), final: null, falhou: `não dá para fazer ${v} ${c.rotulo}` };
    partes.push(`${c.rotulo} = ${r}`);
    v = r;
  }
  return { texto: partes.join(' → '), final: v, falhou: null };
}

function build(inicio: number, alvo: number, comandos: Comando[], maxPassos: number, solucao: number[]): ResolvedProgram {
  return {
    formato: 'programa',
    inicio,
    alvo,
    comandos,
    maxPassos,
    solucao,
    vars: {
      inicio,
      alvo,
      maxPassos,
      passosMin: solucao.length,
      comandos: comandos.map((c) => c.rotulo).join(', '),
      exemplo: rastro(inicio, comandos, solucao).texto,
    },
  };
}

function check(inicio: number, alvo: number, cmds: Comando[], max: number): { erros: string[]; sol: number[] | null } {
  const erros: string[] = [];
  if (inicio === alvo) erros.push('Início e alvo iguais.');
  if (max < 2 || max > 8) erros.push('Use de 2 a 8 passos.');
  const sol = menorPrograma(inicio, alvo, cmds, max);
  if (!sol) erros.push(`Não há programa de até ${max} passos.`);
  else if (sol.length < 2) erros.push('Programa trivial (um único comando resolve).');
  return { erros, sol };
}

const cache = new Map<string, ResolvedProgram[]>();

function enumerate(p: ProgramaParams): ResolvedProgram[] {
  const key = JSON.stringify(p);
  const hit = cache.get(key);
  if (hit) return hit;
  const cmds = p.comandos.map(parseComando);
  const out: ResolvedProgram[] = [];
  const inicios = p.tipo === 'fixo' ? [p.inicio] : range(p.inicio[0], p.inicio[1]);
  const alvos = p.tipo === 'fixo' ? [p.alvo] : range(p.alvo[0], p.alvo[1]);
  for (const i of inicios) {
    for (const a of alvos) {
      const { erros, sol } = check(i, a, cmds, p.maxPassos);
      if (erros.length === 0 && sol) out.push(build(i, a, cmds, p.maxPassos, sol));
    }
  }
  cache.set(key, out);
  return out;
}

function validate(p: ProgramaParams): string[] {
  try {
    const cmds = p.comandos.map(parseComando);
    if (p.tipo === 'fixo') return check(p.inicio, p.alvo, cmds, p.maxPassos).erros;
  } catch (e) {
    return [String((e as Error).message)];
  }
  return enumerate(p).length === 0 ? ['Modelo não gera nenhuma variação válida.'] : [];
}

function resolve(p: ProgramaParams, rng: Rng): ResolvedProgram {
  return structuredClone(rng.pick(enumerate(p)));
}

/** Resposta: índices dos comandos, em ordem. */
function evaluate(r: ResolvedProgram, answer: unknown): Evaluation {
  if (!Array.isArray(answer) || answer.some((i) => !Number.isInteger(i) || i < 0 || i >= r.comandos.length)) {
    return { status: 'invalid', message: 'Monte o programa com os comandos.' };
  }
  if (answer.length === 0) return { status: 'invalid', message: 'Monte o programa com os comandos.' };
  const prog = answer as number[];
  if (prog.length > r.maxPassos) return { status: 'incorrect', perSlot: [false], message: `O programa tem ${prog.length} comandos; o limite é ${r.maxPassos}.` };
  const t = rastro(r.inicio, r.comandos, prog);
  if (t.falhou) return { status: 'incorrect', perSlot: [false], message: `A máquina travou: ${t.falhou}. (${t.texto})` };
  if (t.final === r.alvo) return { status: 'correct', perSlot: [true], message: `Isso! ${t.texto}.` };
  return { status: 'incorrect', perSlot: [false], message: `O programa terminou em ${t.final}, mas o alvo é ${r.alvo}. (${t.texto})` };
}

export const program: FormatModule<ProgramaParams, ResolvedProgram> = {
  resolve,
  enumerate,
  validate,
  countVariants: (p) => enumerate(p).length,
  evaluate,
};
