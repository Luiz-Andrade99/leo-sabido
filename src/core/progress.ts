import type { AnoInfo } from '../content/schema';
import type { FaseProgress, Save } from './save';

/** Regras de progressão e recompensas (seção 12). Funções puras: recebem um Save e devolvem outro. */

export interface Conquista {
  id: string;
  nome: string;
  descricao: string;
}

/** Conquistas valorizam esforço e exploração, nunca velocidade ou comparação com outras crianças. */
export const CONQUISTAS: readonly Conquista[] = [
  { id: 'primeiro-desafio', nome: 'Primeira descoberta', descricao: 'Resolveu o primeiro desafio.' },
  { id: 'pediu-ajuda', nome: 'Boa pergunta!', descricao: 'Usou uma dica e resolveu o desafio.' },
  { id: 'persistente', nome: 'Persistência', descricao: 'Tentou de novo e resolveu depois de 3 tentativas ou mais.' },
  { id: 'colecionador', nome: 'Olhos de explorador', descricao: 'Encontrou todos os cristais de uma fase.' },
  { id: 'engrenagem-1', nome: 'Primeira engrenagem', descricao: 'Recuperou a peça da Floresta dos Números.' },
  { id: 'engrenagem-2', nome: 'Segunda engrenagem', descricao: 'Recuperou a peça da Vila das Descobertas.' },
  { id: 'engrenagem-3', nome: 'Terceira engrenagem', descricao: 'Recuperou a peça da Caverna dos Enigmas.' },
  { id: 'engrenagem-4', nome: 'Quarta engrenagem', descricao: 'Recuperou a peça do Castelo das Estratégias.' },
  { id: 'engrenagem-5', nome: 'Quinta engrenagem', descricao: 'Recuperou a peça da Cidade dos Inventores.' },
  { id: 'engrenagem-6', nome: 'Sexta engrenagem', descricao: 'Recuperou a peça do Laboratório do Saber.' },
];

export interface DesafioResultado {
  id: string;
  tentativas: number;
  dicas: number;
  resolvido: boolean;
}

export interface FaseResultado {
  cristais: number;
  cristaisTotal: number;
  desafios: DesafioResultado[];
}

function fase(save: Save, ano: number, faseId: string): FaseProgress | undefined {
  return save.anos[String(ano)]?.fases[faseId];
}

export function isFaseConcluida(save: Save, ano: number, faseId: string): boolean {
  return fase(save, ano, faseId)?.concluida === true;
}

/** A primeira fase está sempre aberta; as demais abrem quando a anterior é concluída. */
export function isFaseUnlocked(save: Save, info: AnoInfo, faseId: string): boolean {
  const idx = info.fases.findIndex((f) => f.id === faseId);
  if (idx < 0 || !info.disponivel) return false;
  if (idx === 0) return true;
  return isFaseConcluida(save, info.ano, info.fases[idx - 1]!.id);
}

export function proximaFase(info: AnoInfo, faseId: string): string | null {
  const idx = info.fases.findIndex((f) => f.id === faseId);
  return info.fases[idx + 1]?.id ?? null;
}

/** Registra a conclusão de uma fase. Devolve o novo Save, as conquistas novas e se o mundo foi concluído agora. */
export function completeFase(
  save: Save,
  info: AnoInfo,
  faseId: string,
  r: FaseResultado,
): { save: Save; novasConquistas: Conquista[]; mundoConcluido: boolean } {
  const next = structuredClone(save);
  const anoKey = String(info.ano);
  const ano = (next.anos[anoKey] ??= { fases: {}, pecaRecuperada: false });
  const prev = ano.fases[faseId];
  const desafios = { ...(prev?.desafios ?? {}) };
  for (const d of r.desafios) {
    const old = desafios[d.id];
    desafios[d.id] = {
      tentativas: (old?.tentativas ?? 0) + d.tentativas,
      dicas: (old?.dicas ?? 0) + d.dicas,
      resolvido: (old?.resolvido ?? false) || d.resolvido,
    };
  }
  ano.fases[faseId] = {
    concluida: true,
    vezes: (prev?.vezes ?? 0) + 1,
    cristais: Math.max(prev?.cristais ?? 0, r.cristais),
    cristaisTotal: r.cristaisTotal,
    desafios,
  };

  const earned = new Set<string>();
  const solved = r.desafios.filter((d) => d.resolvido);
  if (solved.length > 0) earned.add('primeiro-desafio');
  if (solved.some((d) => d.dicas > 0)) earned.add('pediu-ajuda');
  if (solved.some((d) => d.tentativas >= 3)) earned.add('persistente');
  if (r.cristaisTotal > 0 && r.cristais >= r.cristaisTotal) earned.add('colecionador');

  const allDone = info.fases.every((f) => ano.fases[f.id]?.concluida);
  const mundoConcluido = allDone && !ano.pecaRecuperada;
  if (allDone) {
    ano.pecaRecuperada = true;
    earned.add(`engrenagem-${info.ano}`);
  }

  const novas = CONQUISTAS.filter((c) => earned.has(c.id) && !next.conquistas.includes(c.id));
  next.conquistas.push(...novas.map((c) => c.id));
  return { save: next, novasConquistas: novas, mundoConcluido };
}

export function addTime(save: Save, seconds: number): Save {
  if (!(seconds > 0)) return save;
  return { ...save, tempoSegundos: save.tempoSegundos + Math.min(seconds, 3600) };
}

/** Escolher o ano nunca apaga o progresso de outro ano. */
export function chooseAno(save: Save, ano: number): Save {
  return { ...save, ano };
}
