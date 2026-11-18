import { DesafioListSchema, MundosSchema, type Desafio, type Mundos } from './schema';
import mundosJson from '../../content/mundos.json';

/** Todo o conteúdo de content/ é empacotado no build e validado novamente ao carregar. */
const modules = import.meta.glob<unknown>('../../content/anos/**/desafios/*.json', { eager: true, import: 'default' });

export function loadAllContent(): Desafio[] {
  return Object.entries(modules).flatMap(([path, data]) => {
    const parsed = DesafioListSchema.safeParse(data);
    if (!parsed.success) throw new Error(`Conteúdo inválido em ${path}: ${parsed.error.message}`);
    return parsed.data;
  });
}

export function loadMundos(): Mundos {
  return MundosSchema.parse(mundosJson);
}
