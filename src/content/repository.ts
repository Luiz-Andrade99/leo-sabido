import type { Rng } from '../core/rng';
import type { Desafio, PublishMode } from './schema';

/** Regra de publicação: produção só com revisão aprovada; homologação aceita itens em revisão. */
export function isPublishable(d: Desafio, mode: PublishMode): boolean {
  if (mode === 'producao') return d.revisao.status === 'aprovado' && d.publicacao === 'producao';
  return (d.revisao.status === 'aprovado' || d.revisao.status === 'em_revisao') && d.publicacao !== 'oculto';
}

export class ContentRepository {
  constructor(private readonly items: readonly Desafio[]) {}

  available(pool: string, mode: PublishMode): Desafio[] {
    return this.items.filter((d) => d.pool === pool && isPublishable(d, mode));
  }

  pick(pool: string, rng: Rng, mode: PublishMode, dificuldade?: 1 | 2 | 3): Desafio | null {
    const all = this.available(pool, mode);
    const byLevel = dificuldade === undefined ? all : all.filter((d) => d.dificuldade === dificuldade);
    const list = byLevel.length > 0 ? byLevel : all;
    return list.length > 0 ? rng.pick(list) : null;
  }
}
