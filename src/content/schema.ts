import { z } from 'zod';

/**
 * Contrato do banco de desafios (seção 8 do Prompt Mestre).
 * Todo arquivo em content/anos/**\/desafios é validado com estes schemas no build, nos testes e ao carregar.
 */

const Faixa = z.tuple([z.number().int(), z.number().int()]).refine(([a, b]) => a <= b, 'Faixa invertida');
const Natural = z.number().int().min(0);

export const BnccSchema = z.object({
  codigo: z.string().regex(/^EF0[1-9][A-Z]{2}\d{2}$/, 'Código BNCC fora do padrão EF0xXX00'),
  status: z.enum(['a_validar', 'validado']),
  fonte: z.string().min(1),
});

export const RevisaoSchema = z
  .object({
    status: z.enum(['rascunho', 'em_revisao', 'aprovado', 'rejeitado']),
    revisor: z.string().min(1).optional(),
    data: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    notas: z.string().optional(),
  })
  .refine((r) => r.status !== 'aprovado' || (r.revisor !== undefined && r.data !== undefined), {
    message: 'Item aprovado precisa registrar revisor(a) e data da revisão',
  });

// ---------- Sequência (EF03MA10) ----------
export const SequenciaFixaSchema = z.object({
  tipo: z.literal('fixo'),
  /** null marca uma lacuna a ser preenchida. */
  valores: z.array(z.number().int().nullable()).min(4).max(10),
  /** Regra: quanto se soma (ou subtrai, se negativo) a cada termo. */
  passo: z.number().int(),
});
export const SequenciaModeloSchema = z.object({
  tipo: z.literal('modelo'),
  modelo: z.literal('progressao_aritmetica'),
  inicio: Faixa,
  passo: Faixa,
  tamanho: Faixa,
  lacunas: z.number().int().min(1).max(3),
  minValor: z.number().int(),
  maxValor: z.number().int(),
});
export const SequenciaParamsSchema = z.discriminatedUnion('tipo', [SequenciaFixaSchema, SequenciaModeloSchema]);

// ---------- Problema numérico de adição/subtração (EF03MA06) ----------
/**
 * soma: a+b · subtracao: a−b · completar: quanto falta de a até b · comparar: quanto a tem a mais que b
 * dobro: 2×a · metade: a÷2 (b não é usado) — EF02MA08
 */
/** porcentagem: a% de b (a ∈ 10, 25, 50, 75, 100) */
export const OperacaoSchema = z.enum(['soma', 'subtracao', 'completar', 'comparar', 'dobro', 'metade', 'multiplicacao', 'divisao', 'porcentagem']);
export const NumericoFixoSchema = z.object({ tipo: z.literal('fixo'), operacao: OperacaoSchema, a: Natural, b: Natural.default(0) });
export const NumericoModeloSchema = z.object({
  tipo: z.literal('modelo'),
  operacao: OperacaoSchema,
  a: Faixa,
  b: Faixa.default([0, 0]),
  /** Se definido, a e b são múltiplos deste número (ex.: 10 para dezenas exatas). */
  multiploDe: z.number().int().min(1).optional(),
  maxResultado: z.number().int().min(1),
});
export const NumericoParamsSchema = z.discriminatedUnion('tipo', [NumericoFixoSchema, NumericoModeloSchema]);

// ---------- Distribuir igualmente (EF03MA08) ----------
export const DistribuirFixoSchema = z.object({ tipo: z.literal('fixo'), total: Natural, grupos: z.number().int() });
export const DistribuirModeloSchema = z.object({
  tipo: z.literal('modelo'),
  total: Faixa,
  grupos: Faixa,
  /** true: só divisões com resto diferente de zero · false: só divisões exatas */
  comResto: z.boolean(),
});
export const DistribuirParamsSchema = z.discriminatedUnion('tipo', [DistribuirFixoSchema, DistribuirModeloSchema]);

// ---------- Arranjo retangular (EF03MA07) ----------
export const ArranjoFixoSchema = z.object({ tipo: z.literal('fixo'), linhas: z.number().int(), colunas: z.number().int() });
export const ArranjoModeloSchema = z.object({ tipo: z.literal('modelo'), linhas: Faixa, colunas: Faixa });
export const ArranjoParamsSchema = z.discriminatedUnion('tipo', [ArranjoFixoSchema, ArranjoModeloSchema]);

// ---------- Composição por valor posicional (EF02MA04) ----------
export const PosicionalFixoSchema = z.object({ tipo: z.literal('fixo'), numero: z.number().int() });
export const PosicionalModeloSchema = z.object({ tipo: z.literal('modelo'), numero: Faixa });
export const PosicionalParamsSchema = z.discriminatedUnion('tipo', [PosicionalFixoSchema, PosicionalModeloSchema]);

// ---------- Dinheiro: juntar um valor exato (EF02MA20) ----------
/** Valores em reais inteiros. 1 = moeda de R$ 1; os demais são cédulas. */
export const ValorDinheiroSchema = z.union([z.literal(1), z.literal(2), z.literal(5), z.literal(10), z.literal(20), z.literal(50)]);
const NotasSchema = z.array(ValorDinheiroSchema).min(1).default([1, 2, 5, 10, 20]);
export const DinheiroFixoSchema = z.object({ tipo: z.literal('fixo'), valor: z.number().int(), notas: NotasSchema });
export const DinheiroModeloSchema = z.object({ tipo: z.literal('modelo'), valor: Faixa, notas: NotasSchema });
export const DinheiroParamsSchema = z.discriminatedUnion('tipo', [DinheiroFixoSchema, DinheiroModeloSchema]);

// ---------- Relógio digital: horário de término (EF02MA19) ----------
const Hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário no formato HH:MM');
export const RelogioFixoSchema = z.object({ tipo: z.literal('fixo'), inicio: Hora, duracaoMin: z.number().int() });
export const RelogioModeloSchema = z.object({
  tipo: z.literal('modelo'),
  /** Horas cheias possíveis para o início (ex.: [7, 16]). */
  horaInicio: Faixa,
  /** Se true, o início também pode ser em "e meia". */
  meiaHora: z.boolean(),
  duracoesMin: z.array(z.number().int()).min(1),
});
export const RelogioParamsSchema = z.discriminatedUnion('tipo', [RelogioFixoSchema, RelogioModeloSchema]);

// ---------- Fração de um todo dividido em partes iguais (EF04MA09) ----------
export const FracaoFixoSchema = z.object({ tipo: z.literal('fixo'), partes: z.number().int(), numerador: z.number().int(), denominador: z.number().int() });
export const FracaoModeloSchema = z.object({
  tipo: z.literal('modelo'),
  /** Frações possíveis, como [numerador, denominador]. */
  fracoes: z.array(z.tuple([z.number().int(), z.number().int()])).min(1),
  /** Quantas partes iguais a ponte pode ter. */
  partes: z.array(z.number().int()).min(1),
});
export const FracaoParamsSchema = z.discriminatedUnion('tipo', [FracaoFixoSchema, FracaoModeloSchema]);

// ---------- Leitura de gráfico de colunas (EF04MA27) ----------
export const PerguntaGraficoSchema = z.enum(['valor', 'diferenca', 'total']);
export const GraficoFixoSchema = z.object({
  tipo: z.literal('fixo'),
  titulo: z.string().min(1),
  unidade: z.string().min(1),
  dados: z.array(z.object({ rotulo: z.string().min(1), valor: z.number().int() })).min(2).max(6),
  /** Escala do gráfico: valor entre duas linhas de grade. */
  passo: z.number().int().min(1).default(1),
  pergunta: PerguntaGraficoSchema,
  /** Índices das colunas usadas na pergunta (valor: [i]; diferença: [maior, menor]; total: ignorado). */
  alvo: z.array(z.number().int()).max(2).default([]),
});
export const GraficoModeloSchema = z.object({
  tipo: z.literal('modelo'),
  titulo: z.string().min(1),
  unidade: z.string().min(1),
  rotulos: z.array(z.string().min(1)).min(2).max(5),
  valor: Faixa,
  /** Todos os valores são múltiplos deste passo (escala do gráfico). */
  passo: z.number().int().min(1),
  pergunta: PerguntaGraficoSchema,
});
export const GraficoParamsSchema = z.discriminatedUnion('tipo', [GraficoFixoSchema, GraficoModeloSchema]);

// ---------- Igualdade com número desconhecido (EF04MA15) ----------
export const OpIgualdadeSchema = z.enum(['+', '-', 'x', '/']);
export const IgualdadeFixoSchema = z.object({ tipo: z.literal('fixo'), op: OpIgualdadeSchema, a: Natural, b: Natural, lacuna: z.enum(['a', 'b']) });
export const IgualdadeModeloSchema = z.object({ tipo: z.literal('modelo'), op: OpIgualdadeSchema, a: Faixa, b: Faixa, lacuna: z.enum(['a', 'b']), maxResultado: z.number().int() });
export const IgualdadeParamsSchema = z.discriminatedUnion('tipo', [IgualdadeFixoSchema, IgualdadeModeloSchema]);

// ---------- Porcentagem: medidor de energia (EF05MA06) ----------
export const PorcentagemFixoSchema = z.object({ tipo: z.literal('fixo'), total: z.number().int(), porcentagem: z.number().int() });
export const PorcentagemModeloSchema = z.object({
  tipo: z.literal('modelo'),
  total: Faixa,
  porcentagens: z.array(z.number().int()).min(1),
  multiploDe: z.number().int().min(1).optional(),
});
export const PorcentagemParamsSchema = z.discriminatedUnion('tipo', [PorcentagemFixoSchema, PorcentagemModeloSchema]);

// ---------- Número decimal: montar uma medida (EF05MA02) — valores em centésimos ----------
export const DecimalFixoSchema = z.object({ tipo: z.literal('fixo'), centesimos: z.number().int() });
export const DecimalModeloSchema = z.object({ tipo: z.literal('modelo'), centesimos: Faixa, casas: z.union([z.literal(1), z.literal(2)]) });
export const DecimalParamsSchema = z.discriminatedUnion('tipo', [DecimalFixoSchema, DecimalModeloSchema]);

// ---------- Área e perímetro de retângulos (EF05MA20) ----------
export const AreaFixoSchema = z.object({ tipo: z.literal('fixo'), largura: z.number().int(), altura: z.number().int() });
export const AreaModeloSchema = z.object({ tipo: z.literal('modelo'), largura: Faixa, altura: Faixa });
export const AreaParamsSchema = z.discriminatedUnion('tipo', [AreaFixoSchema, AreaModeloSchema]);

// ---------- Programa: sequência de comandos (EF06MA04) ----------
const ComandoStr = z.string().regex(/^[+\-x/]\d{1,3}$/, 'Comando como "+3", "-1", "x2" ou "/2"');
export const ProgramaFixoSchema = z.object({ tipo: z.literal('fixo'), inicio: Natural, alvo: Natural, comandos: z.array(ComandoStr).min(2).max(4), maxPassos: z.number().int() });
export const ProgramaModeloSchema = z.object({ tipo: z.literal('modelo'), inicio: Faixa, alvo: Faixa, comandos: z.array(ComandoStr).min(2).max(4), maxPassos: z.number().int() });
export const ProgramaParamsSchema = z.discriminatedUnion('tipo', [ProgramaFixoSchema, ProgramaModeloSchema]);

// ---------- Expressão numérica (EF06MA03) ----------
export const FormaExpressaoSchema = z.enum(['a+bxc', '(a+b)xc', 'a-bxc', 'a+b/c', 'axb+cxd', '(a-b)/c']);
export const ExpressaoFixoSchema = z.object({ tipo: z.literal('fixo'), forma: FormaExpressaoSchema, termos: z.array(z.number().int()).min(3).max(4) });
export const ExpressaoModeloSchema = z.object({ tipo: z.literal('modelo'), forma: FormaExpressaoSchema, termo: Faixa, maxResultado: z.number().int() });
export const ExpressaoParamsSchema = z.discriminatedUnion('tipo', [ExpressaoFixoSchema, ExpressaoModeloSchema]);

// ---------- Divisibilidade: múltiplos, divisores e primos (EF06MA05, EF06MA06) ----------
export const RegraDivisibilidadeSchema = z.enum(['multiplo', 'divisor', 'primo']);
export const DivisibilidadeFixoSchema = z.object({ tipo: z.literal('fixo'), regra: RegraDivisibilidadeSchema, k: z.number().int().default(0), numeros: z.array(z.number().int()).min(4).max(10) });
export const DivisibilidadeModeloSchema = z.object({
  tipo: z.literal('modelo'),
  regra: RegraDivisibilidadeSchema,
  k: Faixa.default([0, 0]),
  /** Faixa dos números das lâmpadas (ignorada para divisores, que vão de 1 a k). */
  numeros: Faixa,
  quantidade: z.number().int().min(4).max(10),
});
export const DivisibilidadeParamsSchema = z.discriminatedUnion('tipo', [DivisibilidadeFixoSchema, DivisibilidadeModeloSchema]);

// ---------- 1º ano: escolha por imagem ----------
export const IconeSchema = z.enum(['estrela', 'maca', 'cogumelo', 'folha']);
/** quantos: contar o grupo · qual: achar o grupo com o número · soma: juntar · retira: tirar · compara: qual grupo tem mais */
/** sequencia: números que crescem de b em b — qual vem depois? */
export const ModoContagemSchema = z.enum(['quantos', 'qual', 'soma', 'retira', 'compara', 'sequencia']);
export const ContagemFixoSchema = z.object({ tipo: z.literal('fixo'), modo: ModoContagemSchema, a: z.number().int(), b: z.number().int().default(0), icone: IconeSchema });
export const ContagemModeloSchema = z.object({ tipo: z.literal('modelo'), modo: ModoContagemSchema, a: Faixa, b: Faixa.default([0, 0]), icone: IconeSchema });
export const ContagemParamsSchema = z.discriminatedUnion('tipo', [ContagemFixoSchema, ContagemModeloSchema]);

export const FormaPlanaSchema = z.enum(['circulo', 'quadrado', 'retangulo', 'triangulo']);
export const FormasFixoSchema = z.object({ tipo: z.literal('fixo'), alvo: FormaPlanaSchema, opcoes: z.array(FormaPlanaSchema).min(3).max(4) });
export const FormasModeloSchema = z.object({ tipo: z.literal('modelo'), alvos: z.array(FormaPlanaSchema).min(1), quantidade: z.union([z.literal(3), z.literal(4)]) });
export const FormasParamsSchema = z.discriminatedUnion('tipo', [FormasFixoSchema, FormasModeloSchema]);

export const SimboloPadraoSchema = z.enum(['circulo', 'quadrado', 'triangulo', 'estrela']);
export const RegraPadraoSchema = z.enum(['AB', 'ABC', 'AAB', 'ABB']);
export const PadraoFixoSchema = z.object({ tipo: z.literal('fixo'), regra: RegraPadraoSchema, simbolos: z.array(SimboloPadraoSchema).min(2).max(3), tamanho: z.number().int() });
export const PadraoModeloSchema = z.object({ tipo: z.literal('modelo'), regra: RegraPadraoSchema, tamanho: z.number().int() });
export const PadraoParamsSchema = z.discriminatedUnion('tipo', [PadraoFixoSchema, PadraoModeloSchema]);

/** Ordenar números por toque (1º ano). */
export const OrdemSchema = z.enum(['crescente', 'decrescente']);
export const OrdenarFixoSchema = z.object({ tipo: z.literal('fixo'), numeros: z.array(z.number().int()).min(3).max(5), ordem: OrdemSchema });
export const OrdenarModeloSchema = z.object({ tipo: z.literal('modelo'), inicio: Faixa, passo: Faixa, quantidade: z.number().int().min(3).max(5), ordem: OrdemSchema });
export const OrdenarParamsSchema = z.discriminatedUnion('tipo', [OrdenarFixoSchema, OrdenarModeloSchema]);

const Comum = {
  id: z.string().regex(/^[1-6]A-[A-Z]{2,4}-[A-Z]{2,4}-\d{3}$/, 'ID no padrão 3A-SEQ-ARI-001'),
  ano: z.number().int().min(1).max(6),
  area: z.enum(['matematica', 'logica']),
  tema: z.string().min(1),
  bncc: z.array(BnccSchema).min(1),
  objetivo: z.string().min(1),
  /** Grupo de desafios que uma fase pode pedir (ex.: "3ano.sequencias"). */
  pool: z.string().regex(/^[1-6]ano\.[a-z_]+$/),
  /** Pode conter {variaveis} preenchidas com os valores sorteados. */
  enunciado: z.object({ texto: z.string().min(1).max(220), narracao: z.string().optional() }),
  explicacao: z.string().min(1),
  dicas: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1)]),
  dificuldade: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  revisao: RevisaoSchema,
  publicacao: z.enum(['oculto', 'homologacao', 'producao']),
};

export const DesafioSchema = z.discriminatedUnion('formato', [
  z.object({ ...Comum, formato: z.literal('sequencia'), parametros: SequenciaParamsSchema }),
  z.object({ ...Comum, formato: z.literal('numerico'), parametros: NumericoParamsSchema }),
  z.object({ ...Comum, formato: z.literal('distribuir'), parametros: DistribuirParamsSchema }),
  z.object({ ...Comum, formato: z.literal('arranjo'), parametros: ArranjoParamsSchema }),
  z.object({ ...Comum, formato: z.literal('posicional'), parametros: PosicionalParamsSchema }),
  z.object({ ...Comum, formato: z.literal('dinheiro'), parametros: DinheiroParamsSchema }),
  z.object({ ...Comum, formato: z.literal('relogio'), parametros: RelogioParamsSchema }),
  z.object({ ...Comum, formato: z.literal('fracao'), parametros: FracaoParamsSchema }),
  z.object({ ...Comum, formato: z.literal('grafico'), parametros: GraficoParamsSchema }),
  z.object({ ...Comum, formato: z.literal('igualdade'), parametros: IgualdadeParamsSchema }),
  z.object({ ...Comum, formato: z.literal('porcentagem'), parametros: PorcentagemParamsSchema }),
  z.object({ ...Comum, formato: z.literal('decimal'), parametros: DecimalParamsSchema }),
  z.object({ ...Comum, formato: z.literal('area'), parametros: AreaParamsSchema }),
  z.object({ ...Comum, formato: z.literal('programa'), parametros: ProgramaParamsSchema }),
  z.object({ ...Comum, formato: z.literal('expressao'), parametros: ExpressaoParamsSchema }),
  z.object({ ...Comum, formato: z.literal('divisibilidade'), parametros: DivisibilidadeParamsSchema }),
  z.object({ ...Comum, formato: z.literal('contagem'), parametros: ContagemParamsSchema }),
  z.object({ ...Comum, formato: z.literal('formas'), parametros: FormasParamsSchema }),
  z.object({ ...Comum, formato: z.literal('padrao'), parametros: PadraoParamsSchema }),
  z.object({ ...Comum, formato: z.literal('ordenar'), parametros: OrdenarParamsSchema }),
]);

export const DesafioListSchema = z.array(DesafioSchema).superRefine((list, ctx) => {
  const seen = new Set<string>();
  for (const d of list) {
    if (seen.has(d.id)) ctx.addIssue({ code: 'custom', message: `ID duplicado: ${d.id}` });
    seen.add(d.id);
  }
});

export type Desafio = z.infer<typeof DesafioSchema>;
export type Formato = Desafio['formato'];
export type SequenciaParams = z.infer<typeof SequenciaParamsSchema>;
export type SequenciaFixa = z.infer<typeof SequenciaFixaSchema>;
export type SequenciaModelo = z.infer<typeof SequenciaModeloSchema>;
export type NumericoParams = z.infer<typeof NumericoParamsSchema>;
export type NumericoFixo = z.infer<typeof NumericoFixoSchema>;
export type Operacao = z.infer<typeof OperacaoSchema>;
export type DistribuirParams = z.infer<typeof DistribuirParamsSchema>;
export type ArranjoParams = z.infer<typeof ArranjoParamsSchema>;
export type PosicionalParams = z.infer<typeof PosicionalParamsSchema>;
export type DinheiroParams = z.infer<typeof DinheiroParamsSchema>;
export type ValorDinheiro = z.infer<typeof ValorDinheiroSchema>;
export type RelogioParams = z.infer<typeof RelogioParamsSchema>;
export type FracaoParams = z.infer<typeof FracaoParamsSchema>;
export type GraficoParams = z.infer<typeof GraficoParamsSchema>;
export type IgualdadeParams = z.infer<typeof IgualdadeParamsSchema>;
export type OpIgualdade = z.infer<typeof OpIgualdadeSchema>;
export type PorcentagemParams = z.infer<typeof PorcentagemParamsSchema>;
export type DecimalParams = z.infer<typeof DecimalParamsSchema>;
export type AreaParams = z.infer<typeof AreaParamsSchema>;
export type ProgramaParams = z.infer<typeof ProgramaParamsSchema>;
export type ExpressaoParams = z.infer<typeof ExpressaoParamsSchema>;
export type FormaExpressao = z.infer<typeof FormaExpressaoSchema>;
export type DivisibilidadeParams = z.infer<typeof DivisibilidadeParamsSchema>;
export type RegraDivisibilidade = z.infer<typeof RegraDivisibilidadeSchema>;
export type Icone = z.infer<typeof IconeSchema>;
export type ContagemParams = z.infer<typeof ContagemParamsSchema>;
export type FormaPlana = z.infer<typeof FormaPlanaSchema>;
export type FormasParams = z.infer<typeof FormasParamsSchema>;
export type SimboloPadrao = z.infer<typeof SimboloPadraoSchema>;
export type PadraoParams = z.infer<typeof PadraoParamsSchema>;
export type OrdenarParams = z.infer<typeof OrdenarParamsSchema>;
export type PublishMode = 'producao' | 'homologacao';

// ---------- Mundos e fases ----------
export const FaseSchema = z.object({
  id: z.string().regex(/^f\d$/),
  nome: z.string().min(1),
  /** Nome do arquivo em public/levels (sem extensão). */
  mapa: z.string().regex(/^[a-z0-9-]+$/),
  objetivo: z.string().min(1).max(140),
});

export const AnoSchema = z.object({
  ano: z.number().int().min(1).max(6),
  mundo: z.string().min(1),
  peca: z.string().min(1),
  disponivel: z.boolean(),
  fases: z.array(FaseSchema),
});

export const MundosSchema = z
  .object({ anos: z.array(AnoSchema).length(6) })
  .refine((m) => m.anos.every((a, i) => a.ano === i + 1), 'Anos devem estar em ordem de 1 a 6')
  .refine((m) => m.anos.every((a) => !a.disponivel || a.fases.length > 0), 'Ano disponível precisa de fases');

export type Mundos = z.infer<typeof MundosSchema>;
export type AnoInfo = z.infer<typeof AnoSchema>;
export type FaseInfo = z.infer<typeof FaseSchema>;
