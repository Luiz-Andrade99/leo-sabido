import type { Rng } from '../../core/rng';
import type { Desafio } from '../../content/schema';
import { areaFormat, type ResolvedArea } from './area';
import { arrayFormat, type ResolvedArray } from './array';
import { decimal, type ResolvedDecimal } from './decimal';
import { divisibility, type ResolvedDivisibility } from './divisibility';
import { expression, type ResolvedExpression } from './expression';
import { program, type ResolvedProgram } from './program';
import { percent, type ResolvedPercent } from './percent';
import { chart, type ResolvedChart } from './chart';
import { equality, type ResolvedEquality } from './equality';
import { fraction, type ResolvedFraction } from './fraction';
import { counting, pattern, shapes, type ResolvedChoice } from './choice';
import { order, type ResolvedOrder } from './order';
import { clock, type ResolvedClock } from './clock';
import { distribute, type ResolvedDistribute } from './distribute';
import { money, type ResolvedMoney } from './money';
import { numeric, type ResolvedNumeric } from './numeric';
import { place, type ResolvedPlace } from './place';
import { sequence, type ResolvedSequence } from './sequence';
import type { Evaluation } from './types';

/** Desafio sorteado, de qualquer formato. */
export type Resolved = ResolvedSequence | ResolvedNumeric | ResolvedDistribute | ResolvedArray | ResolvedPlace | ResolvedMoney | ResolvedClock | ResolvedFraction | ResolvedChart | ResolvedEquality | ResolvedPercent | ResolvedDecimal | ResolvedArea | ResolvedProgram | ResolvedExpression | ResolvedDivisibility | ResolvedChoice | ResolvedOrder;

/** Substitui {nome} pelos valores sorteados. Variáveis desconhecidas ficam visíveis para serem pegas na validação. */
export function fillTemplate(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
}

export function itemVariants(d: Desafio): Resolved[] {
  switch (d.formato) {
    case 'sequencia':
      return sequence.enumerate(d.parametros);
    case 'numerico':
      return numeric.enumerate(d.parametros);
    case 'distribuir':
      return distribute.enumerate(d.parametros);
    case 'arranjo':
      return arrayFormat.enumerate(d.parametros);
    case 'posicional':
      return place.enumerate(d.parametros);
    case 'dinheiro':
      return money.enumerate(d.parametros);
    case 'relogio':
      return clock.enumerate(d.parametros);
    case 'fracao':
      return fraction.enumerate(d.parametros);
    case 'grafico':
      return chart.enumerate(d.parametros);
    case 'igualdade':
      return equality.enumerate(d.parametros);
    case 'porcentagem':
      return percent.enumerate(d.parametros);
    case 'decimal':
      return decimal.enumerate(d.parametros);
    case 'area':
      return areaFormat.enumerate(d.parametros);
    case 'programa':
      return program.enumerate(d.parametros);
    case 'expressao':
      return expression.enumerate(d.parametros);
    case 'divisibilidade':
      return divisibility.enumerate(d.parametros);
    case 'contagem':
      return counting.enumerate(d.parametros);
    case 'formas':
      return shapes.enumerate(d.parametros);
    case 'padrao':
      return pattern.enumerate(d.parametros);
    case 'ordenar':
      return order.enumerate(d.parametros);
  }
}

export function resolveItem(d: Desafio, rng: Rng): Resolved {
  switch (d.formato) {
    case 'sequencia':
      return sequence.resolve(d.parametros, rng);
    case 'numerico':
      return numeric.resolve(d.parametros, rng);
    case 'distribuir':
      return distribute.resolve(d.parametros, rng);
    case 'arranjo':
      return arrayFormat.resolve(d.parametros, rng);
    case 'posicional':
      return place.resolve(d.parametros, rng);
    case 'dinheiro':
      return money.resolve(d.parametros, rng);
    case 'relogio':
      return clock.resolve(d.parametros, rng);
    case 'fracao':
      return fraction.resolve(d.parametros, rng);
    case 'grafico':
      return chart.resolve(d.parametros, rng);
    case 'igualdade':
      return equality.resolve(d.parametros, rng);
    case 'porcentagem':
      return percent.resolve(d.parametros, rng);
    case 'decimal':
      return decimal.resolve(d.parametros, rng);
    case 'area':
      return areaFormat.resolve(d.parametros, rng);
    case 'programa':
      return program.resolve(d.parametros, rng);
    case 'expressao':
      return expression.resolve(d.parametros, rng);
    case 'divisibilidade':
      return divisibility.resolve(d.parametros, rng);
    case 'contagem':
      return counting.resolve(d.parametros, rng);
    case 'formas':
      return shapes.resolve(d.parametros, rng);
    case 'padrao':
      return pattern.resolve(d.parametros, rng);
    case 'ordenar':
      return order.resolve(d.parametros, rng);
  }
}

function paramErrors(d: Desafio): string[] {
  switch (d.formato) {
    case 'sequencia':
      return sequence.validate(d.parametros);
    case 'numerico':
      return numeric.validate(d.parametros);
    case 'distribuir':
      return distribute.validate(d.parametros);
    case 'arranjo':
      return arrayFormat.validate(d.parametros);
    case 'posicional':
      return place.validate(d.parametros);
    case 'dinheiro':
      return money.validate(d.parametros);
    case 'relogio':
      return clock.validate(d.parametros);
    case 'fracao':
      return fraction.validate(d.parametros);
    case 'grafico':
      return chart.validate(d.parametros);
    case 'igualdade':
      return equality.validate(d.parametros);
    case 'porcentagem':
      return percent.validate(d.parametros);
    case 'decimal':
      return decimal.validate(d.parametros);
    case 'area':
      return areaFormat.validate(d.parametros);
    case 'programa':
      return program.validate(d.parametros);
    case 'expressao':
      return expression.validate(d.parametros);
    case 'divisibilidade':
      return divisibility.validate(d.parametros);
    case 'contagem':
      return counting.validate(d.parametros);
    case 'formas':
      return shapes.validate(d.parametros);
    case 'padrao':
      return pattern.validate(d.parametros);
    case 'ordenar':
      return order.validate(d.parametros);
  }
}

/** Limite de tamanho do enunciado por ano: textos mais curtos para quem está se alfabetizando. */
export const MAX_ENUNCIADO: Record<number, number> = { 1: 90, 2: 130, 3: 220, 4: 220, 5: 220, 6: 220 };

/** Valida parâmetros e garante que, em TODAS as variações, os textos não ficam com {variáveis} sem valor. */
export function validateItem(d: Desafio): string[] {
  const errs = paramErrors(d);
  if (errs.length > 0) return errs;
  const texts = [d.enunciado.texto, d.enunciado.narracao ?? '', d.explicacao, ...d.dicas];
  const max = MAX_ENUNCIADO[d.ano] ?? 220;
  for (const r of itemVariants(d)) {
    for (const t of texts) {
      const left = fillTemplate(t, r.vars).match(/\{\w+\}/);
      if (left) return [`Variável ${left[0]} sem valor em: "${t}"`];
    }
    const filled = fillTemplate(d.enunciado.texto, r.vars);
    if (filled.length > max) return [`Enunciado com ${filled.length} caracteres; o limite para o ${d.ano}º ano é ${max}.`];
  }
  return [];
}

export function countItemVariants(d: Desafio): number {
  return itemVariants(d).length;
}

/** Avalia a resposta com o módulo do formato do desafio. */
export function evaluateResolved(r: Resolved, answer: unknown): Evaluation {
  switch (r.formato) {
    case 'numerico':
      return numeric.evaluate(r, answer);
    case 'distribuir':
      return distribute.evaluate(r, answer);
    case 'arranjo':
      return arrayFormat.evaluate(r, answer);
    case 'posicional':
      return place.evaluate(r, answer);
    case 'dinheiro':
      return money.evaluate(r, answer);
    case 'relogio':
      return clock.evaluate(r, answer);
    case 'porcentagem':
      return percent.evaluate(r, answer);
    case 'decimal':
      return decimal.evaluate(r, answer);
    case 'area':
      return areaFormat.evaluate(r, answer);
    case 'programa':
      return program.evaluate(r, answer);
    case 'expressao':
      return expression.evaluate(r, answer);
    case 'divisibilidade':
      return divisibility.evaluate(r, answer);
    case 'contagem':
      return counting.evaluate(r, answer);
    case 'formas':
      return shapes.evaluate(r, answer);
    case 'padrao':
      return pattern.evaluate(r, answer);
    case 'ordenar':
      return order.evaluate(r, answer);
    case 'fracao':
      return fraction.evaluate(r, answer);
    case 'grafico':
      return chart.evaluate(r, answer);
    case 'igualdade':
      return equality.evaluate(r, answer);
    default:
      return sequence.evaluate(r, answer);
  }
}
