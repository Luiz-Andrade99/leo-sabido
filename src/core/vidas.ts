/**
 * Regra das vidas de uma fase (sem Phaser, para testar à parte).
 * - 3 vidas por fase; cair gasta uma. No modo assistido, sem limite.
 * - Bandeira "guarda" os coletáveis pegos até ali; ao cair, os pegos depois da última bandeira voltam para o lugar.
 * - Vidas zeradas: a fase recomeça (tudo o que foi coletado volta, inclusive o guardado) com as vidas cheias.
 * Errar um desafio nunca custa vida.
 */
export class ControleVidas {
  private restantes: number;
  private desdeBandeira = new Set<number>();
  private salvos = new Set<number>();

  constructor(
    private readonly ilimitado: boolean,
    private readonly maximo = 3,
  ) {
    this.restantes = maximo;
  }

  get vidas(): number {
    return this.ilimitado ? Infinity : this.restantes;
  }

  get guardados(): ReadonlySet<number> {
    return this.salvos;
  }

  coletou(id: number): void {
    this.desdeBandeira.add(id);
  }

  ativouBandeira(): void {
    for (const id of this.desdeBandeira) this.salvos.add(id);
    this.desdeBandeira.clear();
  }

  caiu(): { resultado: 'reaparecer' | 'acabou'; devolver: number[] } {
    const devolver = [...this.desdeBandeira];
    this.desdeBandeira.clear();
    if (this.ilimitado) return { resultado: 'reaparecer', devolver };
    this.restantes = Math.max(0, this.restantes - 1);
    return { resultado: this.restantes === 0 ? 'acabou' : 'reaparecer', devolver };
  }

  recomecar(): { devolver: number[] } {
    const devolver = [...this.salvos, ...this.desdeBandeira];
    this.salvos.clear();
    this.desdeBandeira.clear();
    this.restantes = this.maximo;
    return { devolver };
  }
}

/** Aviso de queda, com as vidas que restam e se algum coletável voltou para o lugar. */
export function textoQueda(vidas: number, voltaram: number, plural: string): string {
  if (!Number.isFinite(vidas)) return 'Opa! Vamos tentar de novo daqui.';
  const resto = vidas === 1 ? 'Resta 1 vida.' : `Restam ${vidas} vidas.`;
  const devolvidos = voltaram > 0 ? ` Os ${plural} desde a última bandeira voltaram para o lugar.` : '';
  return `Ops! Você caiu. ${resto}${devolvidos}`;
}
