import type { Rng } from '../../core/rng';
import type { ContagemParams, FormaPlana, FormasParams, Icone, PadraoParams, SimboloPadrao } from '../../content/schema';
import { range, type Evaluation, type FormatModule, type TemplateVars } from './types';

/**
 * Formatos de escolha por imagem do 1º ano — não exigem leitura nem digitação:
 *  - contagem (EF01MA01/02/03/04/06/08): quantos há, qual grupo tem o número, juntar, tirar, comparar;
 *  - formas (EF01MA14): encontrar o círculo, o quadrado, o retângulo ou o triângulo;
 *  - padrão (EF01MA10): descobrir a próxima figura de uma sequência repetitiva.
 * Opções e distratores são determinísticos (sem sorteio), para que todas as variações possam ser validadas.
 */

export const MAX_CONTAGEM = 20;

export const ICONES: Record<Icone, [string, string]> = {
  estrela: ['estrela', 'estrelas'],
  maca: ['maçã', 'maçãs'],
  cogumelo: ['cogumelo', 'cogumelos'],
  folha: ['folha', 'folhas'],
};

export const NOME_FORMA: Record<FormaPlana | SimboloPadrao, string> = {
  circulo: 'círculo',
  quadrado: 'quadrado',
  retangulo: 'retângulo',
  triangulo: 'triângulo',
  estrela: 'estrela',
};

export type Estimulo =
  | { tipo: 'nenhum' }
  | { tipo: 'grupo'; n: number; icone: Icone }
  | { tipo: 'numero'; n: number; icone: Icone }
  | { tipo: 'soma'; a: number; b: number; icone: Icone }
  | { tipo: 'retira'; a: number; b: number; icone: Icone }
  | { tipo: 'padrao'; itens: SimboloPadrao[] }
  | { tipo: 'numeros'; itens: number[] };

export type Opcao =
  | { tipo: 'numero'; n: number }
  | { tipo: 'grupo'; n: number; icone: Icone }
  | { tipo: 'forma'; forma: FormaPlana | SimboloPadrao; giro: number };

export interface ResolvedChoice {
  formato: 'contagem' | 'formas' | 'padrao';
  estimulo: Estimulo;
  opcoes: Opcao[];
  correta: number;
  vars: TemplateVars;
}

/** Gira a lista de opções por k posições (a posição da resposta certa varia de item para item). */
function rotate<T>(arr: T[], k: number): T[] {
  const n = arr.length;
  return arr.map((_, i) => arr[(i + k) % n]!);
}

/** Dois distratores próximos do número certo, dentro de 1..20. */
function distratores(t: number): number[] {
  return [t + 1, t - 1, t + 2, t - 2, t + 3, t + 4].filter((x) => x >= 1 && x <= MAX_CONTAGEM).slice(0, 2);
}

function choiceEvaluate(certo: string, errado: string) {
  return (r: ResolvedChoice, answer: unknown): Evaluation => {
    if (typeof answer !== 'number' || !Number.isInteger(answer) || answer < 0 || answer >= r.opcoes.length) {
      return { status: 'invalid', message: 'Toque em uma das respostas.' };
    }
    const perSlot = r.opcoes.map((_, i) => (i === answer ? i === r.correta : true));
    return answer === r.correta ? { status: 'correct', perSlot, message: certo } : { status: 'incorrect', perSlot, message: errado };
  };
}

// ---------- Contagem ----------
function buildContagem(modo: ContagemParams['modo'], a: number, b: number, icone: Icone): ResolvedChoice | null {
  const [sing, plural] = ICONES[icone];
  const k = (a * 7 + b * 3) % 3;
  const vars: TemplateVars = { a, b, nome: plural, nomeSing: sing };
  const numeros = (t: number): { opcoes: Opcao[]; correta: number } => {
    const base = [t, ...distratores(t)];
    const rot = rotate(base, k);
    return { opcoes: rot.map((n) => ({ tipo: 'numero', n })), correta: rot.indexOf(t) };
  };
  switch (modo) {
    case 'quantos': {
      const o = numeros(a);
      return { formato: 'contagem', estimulo: { tipo: 'grupo', n: a, icone }, ...o, vars: { ...vars, resposta: a } };
    }
    case 'qual': {
      const rot = rotate([a, ...distratores(a)], k);
      return { formato: 'contagem', estimulo: { tipo: 'numero', n: a, icone }, opcoes: rot.map((n) => ({ tipo: 'grupo', n, icone })), correta: rot.indexOf(a), vars: { ...vars, resposta: a } };
    }
    case 'soma': {
      const o = numeros(a + b);
      return { formato: 'contagem', estimulo: { tipo: 'soma', a, b, icone }, ...o, vars: { ...vars, resposta: a + b } };
    }
    case 'retira': {
      const o = numeros(a - b);
      return { formato: 'contagem', estimulo: { tipo: 'retira', a, b, icone }, ...o, vars: { ...vars, resposta: a - b } };
    }
    case 'sequencia': {
      const itens = [0, 1, 2, 3].map((i) => a + i * b);
      const o = numeros(a + 4 * b);
      return { formato: 'contagem', estimulo: { tipo: 'numeros', itens }, ...o, vars: { ...vars, resposta: a + 4 * b, passo: b } };
    }
    case 'compara':
      return {
        formato: 'contagem',
        estimulo: { tipo: 'nenhum' },
        opcoes: [
          { tipo: 'grupo', n: a, icone },
          { tipo: 'grupo', n: b, icone },
        ],
        correta: a > b ? 0 : 1,
        vars: { ...vars, resposta: Math.max(a, b), menor: Math.min(a, b), diferenca: Math.abs(a - b) },
      };
  }
}

function validateContagem(modo: ContagemParams['modo'], a: number, b: number): string[] {
  const errs: string[] = [];
  const inRange = (x: number): boolean => x >= 1 && x <= MAX_CONTAGEM;
  if (!inRange(a)) errs.push(`a de 1 a ${MAX_CONTAGEM}.`);
  if (modo === 'soma' && (!inRange(b) || a + b > MAX_CONTAGEM)) errs.push(`Na soma, b ≥ 1 e total até ${MAX_CONTAGEM}.`);
  if (modo === 'retira' && (b < 1 || b >= a)) errs.push('Em "tirar", retire de 1 até a − 1.');
  if (modo === 'compara' && (!inRange(b) || a === b)) errs.push('Para comparar, os grupos precisam ser diferentes.');
  if (modo === 'sequencia' && (b < 1 || b > 2 || a + 4 * b > MAX_CONTAGEM)) errs.push(`Na sequência, passo 1 ou 2 e último número até ${MAX_CONTAGEM}.`);
  return errs;
}

function enumerateContagem(p: ContagemParams): ResolvedChoice[] {
  const as = p.tipo === 'fixo' ? [p.a] : range(p.a[0], p.a[1]);
  const bs = p.tipo === 'fixo' ? [p.b] : range(p.b[0], p.b[1]);
  const out: ResolvedChoice[] = [];
  for (const a of as) {
    for (const b of bs) {
      if (validateContagem(p.modo, a, b).length > 0) continue;
      const r = buildContagem(p.modo, a, b, p.icone);
      if (r && new Set(r.opcoes.map((o) => JSON.stringify(o))).size === r.opcoes.length) out.push(r);
    }
  }
  return out;
}

export const counting: FormatModule<ContagemParams, ResolvedChoice> = {
  resolve: (p, rng: Rng) => structuredClone(rng.pick(enumerateContagem(p))),
  enumerate: enumerateContagem,
  validate: (p) => {
    if (p.tipo === 'fixo') return validateContagem(p.modo, p.a, p.b);
    return enumerateContagem(p).length === 0 ? ['Modelo não gera nenhuma variação válida.'] : [];
  },
  countVariants: (p) => enumerateContagem(p).length,
  evaluate: choiceEvaluate('Muito bem! Você contou certinho.', 'Ainda não. Conte de novo, apontando cada um com o dedo.'),
};

// ---------- Figuras planas ----------
const FORMAS_PLANAS: FormaPlana[] = ['circulo', 'quadrado', 'retangulo', 'triangulo'];
const GIROS = [0, 12, -10, 20];

function buildFormas(alvo: FormaPlana, opcoes: FormaPlana[]): ResolvedChoice {
  return {
    formato: 'formas',
    estimulo: { tipo: 'nenhum' },
    opcoes: opcoes.map((forma, i) => ({ tipo: 'forma', forma, giro: GIROS[i % GIROS.length]! })),
    correta: opcoes.indexOf(alvo),
    vars: { forma: NOME_FORMA[alvo], descricao: DESCRICAO[alvo] },
  };
}

const DESCRICAO: Record<FormaPlana, string> = {
  circulo: 'é redondo e não tem pontas',
  quadrado: 'tem 4 lados do mesmo tamanho',
  retangulo: 'tem 4 lados: 2 compridos e 2 curtos',
  triangulo: 'tem 3 lados e 3 pontas',
};

function enumerateFormas(p: FormasParams): ResolvedChoice[] {
  if (p.tipo === 'fixo') return [buildFormas(p.alvo, p.opcoes)];
  const out: ResolvedChoice[] = [];
  for (const alvo of p.alvos) {
    const outros = FORMAS_PLANAS.filter((f) => f !== alvo);
    for (let k = 0; k < p.quantidade; k++) {
      const ops = rotate([alvo, ...outros.slice(0, p.quantidade - 1)], k);
      out.push(buildFormas(alvo, ops));
    }
  }
  return out;
}

export const shapes: FormatModule<FormasParams, ResolvedChoice> = {
  resolve: (p, rng: Rng) => structuredClone(rng.pick(enumerateFormas(p))),
  enumerate: enumerateFormas,
  validate: (p) => {
    if (p.tipo === 'modelo') return enumerateFormas(p).length === 0 ? ['Modelo sem variações.'] : [];
    const errs: string[] = [];
    if (p.opcoes.filter((f) => f === p.alvo).length !== 1) errs.push('A figura-alvo deve aparecer exatamente uma vez.');
    if (new Set(p.opcoes).size !== p.opcoes.length) errs.push('Opções repetidas.');
    if (p.opcoes.length < 3 || p.opcoes.length > 4) errs.push('Use 3 ou 4 opções.');
    return errs;
  },
  countVariants: (p) => enumerateFormas(p).length,
  evaluate: choiceEvaluate('Isso! Você encontrou a figura.', 'Ainda não. Olhe os lados e as pontas de cada figura.'),
};

// ---------- Padrões ----------
const UNIDADE: Record<PadraoParams['regra'], number[]> = {
  AB: [0, 1],
  ABC: [0, 1, 2],
  AAB: [0, 0, 1],
  ABB: [0, 1, 1],
};
const SIMBOLOS: SimboloPadrao[] = ['circulo', 'quadrado', 'triangulo', 'estrela'];

function buildPadrao(regra: PadraoParams['regra'], simbolos: SimboloPadrao[], tamanho: number): ResolvedChoice {
  const u = UNIDADE[regra];
  const seq = Array.from({ length: tamanho + 1 }, (_, i) => simbolos[u[i % u.length]!]!);
  const proximo = seq[tamanho]!;
  const extra = SIMBOLOS.find((s) => !simbolos.includes(s));
  const base = [...new Set(simbolos)];
  if (base.length < 3 && extra) base.push(extra);
  const ops = rotate(base, tamanho % base.length);
  return {
    formato: 'padrao',
    estimulo: { tipo: 'padrao', itens: seq.slice(0, tamanho) },
    opcoes: ops.map((forma) => ({ tipo: 'forma', forma, giro: 0 })),
    correta: ops.indexOf(proximo),
    vars: { proximo: NOME_FORMA[proximo], sequencia: seq.slice(0, u.length).map((s) => NOME_FORMA[s]).join(', ') },
  };
}

function letras(regra: PadraoParams['regra']): number {
  return new Set(UNIDADE[regra]).size;
}

function perms(pool: SimboloPadrao[], k: number): SimboloPadrao[][] {
  if (k === 0) return [[]];
  return pool.flatMap((s) => perms(pool.filter((x) => x !== s), k - 1).map((rest) => [s, ...rest]));
}

function enumeratePadrao(p: PadraoParams): ResolvedChoice[] {
  if (p.tipo === 'fixo') return [buildPadrao(p.regra, p.simbolos, p.tamanho)];
  return perms(SIMBOLOS, letras(p.regra)).map((s) => buildPadrao(p.regra, s, p.tamanho));
}

export const pattern: FormatModule<PadraoParams, ResolvedChoice> = {
  resolve: (p, rng: Rng) => structuredClone(rng.pick(enumeratePadrao(p))),
  enumerate: enumeratePadrao,
  validate: (p) => {
    const errs: string[] = [];
    const u = UNIDADE[p.regra].length;
    if (p.tamanho < u * 2 || p.tamanho > 9) errs.push(`Mostre pelo menos duas repetições (${u * 2} figuras) e no máximo 9.`);
    if (p.tipo === 'fixo') {
      if (p.simbolos.length !== letras(p.regra)) errs.push(`A regra ${p.regra} usa ${letras(p.regra)} figuras diferentes.`);
      if (new Set(p.simbolos).size !== p.simbolos.length) errs.push('Figuras repetidas na regra.');
    }
    return errs;
  },
  countVariants: (p) => enumeratePadrao(p).length,
  evaluate: choiceEvaluate('Muito bem! Você descobriu o padrão.', 'Ainda não. Repita a sequência em voz alta e veja o que vem depois.'),
};
