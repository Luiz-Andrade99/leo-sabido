import { beforeEach, describe, expect, it } from 'vitest';
import { dividirFrases, Narrador, type Motor, type Saida } from '../../src/voz/narrador';

/** Motor falso: cada gerar() fica pendente até o teste mandar terminar. */
class MotorFalso implements Motor {
  taxa = 22050;
  pedidos: { frase: string; ok: (pcm: Float32Array) => void; erro: (e: Error) => void }[] = [];
  gerar(frase: string): Promise<Float32Array> {
    return new Promise((ok, erro) => this.pedidos.push({ frase, ok, erro }));
  }
  /** Termina o pedido mais antigo ainda pendente com um "áudio" que identifica a frase. */
  async terminar(): Promise<string> {
    const p = this.pedidos.shift()!;
    p.ok(Float32Array.from([p.frase.length]));
    await tick();
    return p.frase;
  }
}

class SaidaFalsa implements Saida {
  tocadas: number[] = [];
  paradas = 0;
  private fins: (() => void)[] = [];
  tocar(pcm: Float32Array): { fim: Promise<void>; parar(): void } {
    this.tocadas.push(pcm[0]!);
    let acabar!: () => void;
    const fim = new Promise<void>((r) => (acabar = r));
    this.fins.push(acabar);
    return { fim, parar: () => { this.paradas++; acabar(); } };
  }
  async acabarAtual(): Promise<void> {
    this.fins.shift()?.();
    await tick();
  }
}

const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

describe('dividirFrases', () => {
  it('reescreve símbolos e separa as frases', () => {
    expect(dividirFrases('Muito bem! 3/4 de 8 = 6.')).toEqual(['Muito bem!', '3 quartos de 8 igual a 6.']);
  });
  it('texto só com símbolos não vira fala', () => {
    expect(dividirFrases('✓ ')).toEqual([]);
  });
});

describe('Narrador', () => {
  let motor: MotorFalso;
  let saida: SaidaFalsa;
  let navegador: string[];
  let volume: number;
  let disponivel: boolean;
  let n: Narrador;

  beforeEach(() => {
    motor = new MotorFalso();
    saida = new SaidaFalsa();
    navegador = [];
    volume = 1;
    disponivel = true;
    n = new Narrador({
      motor: () => (disponivel ? motor : null),
      saida,
      navegador: (t) => navegador.push(t),
      pararNavegador: () => {},
      volume: () => volume,
    });
  });

  it('gera frase por frase e começa a tocar a primeira antes de a segunda ficar pronta', async () => {
    n.falar('Abc. Defgh.');
    await tick();
    expect(motor.pedidos.map((p) => p.frase)).toEqual(['Abc.']);
    await motor.terminar();
    expect(saida.tocadas).toEqual([4]); // "Abc." tocando
    expect(motor.pedidos.map((p) => p.frase)).toEqual(['Defgh.']); // a segunda está sendo gerada
    await motor.terminar();
    await saida.acabarAtual();
    expect(saida.tocadas).toEqual([4, 6]);
  });

  it('sem a Faber, usa a voz do navegador', async () => {
    disponivel = false;
    n.falar('Olá, Leo.');
    await tick();
    expect(navegador).toEqual(['Olá, Leo.']);
    expect(saida.tocadas).toEqual([]);
  });

  it('uma fala nova interrompe a anterior e as frases pendentes dela nunca tocam', async () => {
    n.falar('Abc. Defgh.');
    await tick();
    await motor.terminar(); // "Abc." tocando
    n.falar('Xy.');
    await tick();
    expect(saida.paradas).toBe(1);
    // "Defgh." já estava em geração: termina (fica no cache), mas nunca toca; depois vem "Xy."
    expect(motor.pedidos.map((p) => p.frase)).toEqual(['Defgh.']);
    await motor.terminar();
    expect(motor.pedidos.map((p) => p.frase)).toEqual(['Xy.']);
    await motor.terminar();
    expect(saida.tocadas).toEqual([4, 3]);
  });

  it('com volume zero, não gera nem fala', async () => {
    volume = 0;
    n.falar('Abc.');
    await tick();
    expect(motor.pedidos).toEqual([]);
    expect(navegador).toEqual([]);
  });

  it('frase preparada antes toca sem gerar de novo', async () => {
    n.preparar('Abc.');
    await tick();
    await motor.terminar();
    n.falar('Abc.');
    await tick();
    expect(motor.pedidos).toEqual([]);
    expect(saida.tocadas).toEqual([4]);
  });

  it('falar uma frase que já está sendo preparada usa esse mesmo resultado, sem gerar de novo', async () => {
    n.preparar('Abc.');
    await tick();
    expect(motor.pedidos.map((p) => p.frase)).toEqual(['Abc.']); // em geração
    n.falar('Abc.');
    await tick();
    expect(motor.pedidos.map((p) => p.frase)).toEqual(['Abc.']); // nada novo na fila
    await motor.terminar();
    expect(motor.pedidos).toEqual([]);
    expect(saida.tocadas).toEqual([4]);
  });

  it('a fala tem prioridade sobre o que está sendo preparado', async () => {
    n.preparar('Um. Dois. Três.');
    await tick();
    n.falar('Já.');
    await tick();
    await motor.terminar(); // "Um." (já estava em geração)
    expect(motor.pedidos.map((p) => p.frase)).toEqual(['Já.']);
  });

  it('se a Faber falhar, o resto da fala vai para a voz do navegador', async () => {
    n.falar('Abc. Defgh.');
    await tick();
    motor.pedidos.shift()!.erro(new Error('falhou'));
    await tick();
    expect(navegador).toEqual(['Abc. Defgh.']);
  });

  it('fica ocupado enquanto gera a fala', async () => {
    n.falar('Abc.');
    await tick();
    expect(n.ocupado).toBe(true);
    await motor.terminar();
    expect(n.ocupado).toBe(false);
  });
});
