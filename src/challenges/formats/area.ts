import type { Rng } from '../../core/rng';
import type { AreaParams } from '../../content/schema';
import { range, type Evaluation, type FormatModule, type TemplateVars } from './types';

/**
 * Formato "Área e perímetro": construir uma plataforma retangular com a área e o perímetro pedidos (EF05MA20).
 * Área e perímetro juntos definem o retângulo (a menos de girá-lo), então a resposta é única.
 */

export const MAX_LADO = 10;

export interface ResolvedArea {
  formato: 'area';
  largura: number;
  altura: number;
  area: number;
  perimetro: number;
  vars: TemplateVars;
}

function build(largura: number, altura: number): ResolvedArea {
  const area = largura * altura;
  const perimetro = 2 * (largura + altura);
  return { formato: 'area', largura, altura, area, perimetro, vars: { largura, altura, area, perimetro, semi: largura + altura } };
}

function validatePair(w: number, h: number): string[] {
  const errs: string[] = [];
  if (w < 1 || h < 1 || w > MAX_LADO || h > MAX_LADO) errs.push(`Lados de 1 a ${MAX_LADO}.`);
  if (w * h < 4) errs.push('Área muito pequena para o desafio.');
  return errs;
}

function enumerate(p: AreaParams): ResolvedArea[] {
  if (p.tipo === 'fixo') return [build(p.largura, p.altura)];
  const out: ResolvedArea[] = [];
  for (const w of range(p.largura[0], p.largura[1])) {
    for (const h of range(p.altura[0], p.altura[1])) if (h <= w && validatePair(w, h).length === 0) out.push(build(w, h));
  }
  return out;
}

function validate(p: AreaParams): string[] {
  if (p.tipo === 'fixo') return validatePair(p.largura, p.altura);
  return enumerate(p).length === 0 ? ['Modelo não gera nenhuma variação válida.'] : [];
}

function resolve(p: AreaParams, rng: Rng): ResolvedArea {
  return structuredClone(rng.pick(enumerate(p)));
}

/** Resposta: [comprimento, largura] da plataforma montada (em quadradinhos). */
function evaluate(r: ResolvedArea, answer: unknown): Evaluation {
  if (!Array.isArray(answer) || answer.length !== 2 || answer.some((n) => !Number.isInteger(n) || n < 1 || n > MAX_LADO)) {
    return { status: 'invalid', message: 'Ajuste os dois lados da plataforma.' };
  }
  const [w, h] = answer as [number, number];
  const a = w * h;
  const per = 2 * (w + h);
  if (a === r.area && per === r.perimetro) return { status: 'correct', perSlot: [true], message: `Isso! ${w} × ${h}: área ${a} e perímetro ${per}.` };
  const parts: string[] = [];
  parts.push(a === r.area ? `a área (${a}) está certa` : `a área é ${a}, e precisa ser ${r.area}`);
  parts.push(per === r.perimetro ? `o perímetro (${per}) está certo` : `o perímetro é ${per}, e precisa ser ${r.perimetro}`);
  return { status: 'incorrect', perSlot: [false], message: `Sua plataforma ${w} × ${h}: ${parts.join('; ')}.` };
}

export const areaFormat: FormatModule<AreaParams, ResolvedArea> = {
  resolve,
  enumerate,
  validate,
  countVariants: (p) => enumerate(p).length,
  evaluate,
};
