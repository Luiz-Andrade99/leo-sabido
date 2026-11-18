# Leo Sabido: Aventuras do Conhecimento — Planejamento Inicial (Etapa A)

> Versão 0.1 · 17/11/2026 · Status: **aguardando aprovação**
> Este documento responde aos 12 itens da seção 21 do Prompt Mestre. Nenhum código foi escrito ainda.
> Convenção: **[DECISÃO]** = recomendação técnica registrada, sujeita à aprovação. **[PENDENTE]** = depende de pessoa/instituição externa. **[A VALIDAR]** = depende de revisão humana qualificada.

---

## Sumário das decisões que precisam de aprovação

| # | Decisão proposta | Alternativa | Por que recomendo |
|---|---|---|---|
| D1 | MVP no **3º ano — Caverna dos Enigmas** | Outro ano escolhido pela instituição parceira | Sugestão do próprio prompt; multiplicação/divisão rendem mecânicas físicas ricas (agrupar, distribuir) |
| D2 | **Phaser 4.2.x** + TypeScript + Vite 8 | Phaser 3.90 (mais exemplos na comunidade) | Phaser 4 é a versão estável e suportada hoje (`latest` = 4.2.1 no npm, verificado em 17/11/2026) |
| D3 | Interface dos desafios em **HTML acessível sobreposto ao canvas** | Desafios desenhados dentro do canvas | Canvas não é lido por leitores de tela; HTML permite teclado, foco, ARIA e WCAG 2.2 AA de verdade |
| D4 | Fases desenhadas no **Tiled** (formato JSON, gratuito) | Fases codificadas à mão | Fase vira *conteúdo*, não código — exigência de escalabilidade da seção 20 |
| D5 | Conteúdo em **JSON validado por schema** no build; build de produção **recusa** itens não aprovados | Planilha/CMS | Garante tecnicamente a regra "nada sem revisão pedagógica" |
| D6 | Arte **original em vetor (SVG)** produzida no projeto; sons **CC0** (ex.: Kenney) ou originais | Encomendar ilustrador | Custo zero, licença limpa, estilo consistente; ilustrador pode substituir depois sem mudar código |
| D7 | Hospedagem estática gratuita (**GitHub Pages ou Cloudflare Pages**) sob conta do contratante | Servidor próprio | Sem backend no MVP; custo zero; deploy automático |
| D8 | Narração: **Web Speech API (pt-BR)** no MVP + áudio gravado para o 1º ano na versão completa | Só áudio gravado | Voz sintética varia por navegador; para alfabetização, gravação humana é mais confiável |

---

## 1. Entendimento do projeto

**O que é:** um jogo de plataforma 2D para navegador, gratuito e sem anúncios, em que Leo — um jovem inventor inspirado na curiosidade de Leonardo da Vinci — percorre seis mundos para recuperar as seis peças da *Grande Engrenagem do Saber*. Cada mundo corresponde a um ano do Ensino Fundamental (1º ao 6º), e os desafios de matemática e lógica **são parte do cenário**: resolver uma sequência ergue uma ponte, distribuir cristais igualmente liga um elevador.

**Para quem:** crianças de ~6 a 12 anos em escolas e projetos sociais, usando principalmente computadores de laboratório escolar, além de tablets e, quando viável, celulares. Usuários secundários: professores e responsáveis (manual, inventário de conteúdos).

**Por quê:** criar uma ferramenta educativa real, gratuita e reutilizável, que começa como projeto acadêmico PRAXIS (MVP validado com uma instituição parceira) e cresce até a versão 1.0 com 30 fases.

**Três pilares em equilíbrio:** diversão (é um jogo, não um questionário), aprendizagem (coerência com a BNCC e revisão humana) e qualidade de software (modular, testado, documentado, transferível).

**O que o projeto NÃO é:** não é uma plataforma de avaliação diagnóstica, não tem contas nem chat no MVP, não coleta dados pessoais, não reproduz elementos de outros jogos (Coelho Sabido, Transformice) e não usa a marca UNIASSELVI sem autorização.

---

## 2. Análise crítica de viabilidade

**Tecnicamente viável — com ressalvas honestas.**

| Aspecto | Avaliação |
|---|---|
| Motor/stack | Viável. Phaser + TypeScript + Vite é uma combinação madura para platformers 2D web; física Arcade cobre gravidade, colisões, plataformas móveis. |
| MVP (3 fases, 30 desafios) | Viável dentro de um ciclo PRAXIS. O gargalo **não é código**: é arte original, revisão pedagógica e testes com crianças (que dependem de autorização). |
| Versão completa (30 fases, 720 itens) | Viável, mas é **4 a 5 vezes o MVP**. A meta de 720 itens só é realista com **exercícios parametrizados** (um modelo gera variações validadas) — 720 questões escritas uma a uma exigiriam revisão pedagógica enorme. |
| Acessibilidade WCAG 2.2 AA | Viável para menus e desafios (HTML). **Para a movimentação em canvas, conformidade integral não é alcançável por definição** — haverá alternativas (modo assistido, sem tempo, sem precisão), mas não declararemos conformidade total do jogo. |
| Narração para 1º ano | Viável. Voz sintética no MVP; para o 1º ano é recomendável gravação humana (custo de tempo de um voluntário/estudante com boa dicção). |
| Safari/iPad | Viável, mas exige teste em dispositivo Apple real (ver custos/dependências). |
| Validação BNCC | Viável, mas **os códigos precisam de conferência humana na fonte oficial do MEC**. Este documento traz códigos preliminares marcados [A VALIDAR]. |

**Pontos críticos do próprio prompt que recomendo ajustar ou registrar:**
1. *"Banco inicial de 30 desafios revisados"* — eu (ou a equipe) posso redigir os 30 desafios, mas a **revisão** só pode ser feita por um(a) educador(a). Até lá, os itens ficarão com status `rascunho`/`em_revisao` e o build de produção não os publicará. O MVP de homologação mostrará uma marca d'água "conteúdo em revisão".
2. *"60 FPS / metas de desempenho com base nos equipamentos da instituição"* — não conhecemos esses equipamentos. **[DECISÃO]** meta provisória: 60 FPS em notebook de 4 GB RAM com gráfico integrado; ≥30 FPS em Chromebook/tablet de entrada; carregamento inicial < 5 MB e < 8 s em 10 Mbps. Revisar após inventário do laboratório parceiro.
3. *"Testes com usuários"* — não serão simulados nem inventados. O plano será entregue; os resultados só existirão após as sessões reais autorizadas.

---

## 3. Riscos

Escala: Probabilidade (P) e Impacto (I) — Baixo/Médio/Alto.

### Técnicos
| Risco | P | I | Mitigação |
|---|---|---|---|
| Phaser 4 tem menos exemplos/plugins que o 3 | M | M | Usar só recursos centrais (Arcade, Tilemap, Scenes); camada de adaptação isola o motor; fallback documentado para 3.90 |
| Física instável em telas de 120/144 Hz | M | A | Passo fixo de física (`fixedStep`, 60 Hz) independente da taxa de quadros; teste automatizado de salto determinístico |
| Desempenho ruim em máquinas escolares antigas | A | A | Orçamento de assets, atlas de texturas, modo "gráficos leves" (sem parallax/partículas), teste em hardware modesto cedo |
| Controles de toque imprecisos em platformer | A | M | Botões virtuais grandes, *coyote time* e *jump buffer*, modo assistido que dispensa saltos de precisão |
| localStorage apagado pelo navegador/escola (perfis limpos ao desligar) | A | M | Exportar/importar progresso como código ou arquivo; jogo totalmente jogável sem progresso salvo |
| Internet escolar lenta/instável | A | M | Build leve; PWA com cache offline (versão completa, avaliada no MVP) |

### Pedagógicos
| Risco | P | I | Mitigação |
|---|---|---|---|
| Códigos BNCC atribuídos incorretamente | M | A | Matriz com campo de status; conferência obrigatória na fonte oficial por educador(a) antes de publicar |
| Itens parametrizados gerarem questão ambígua/sem solução | M | A | Validador enumera **todas** as combinações no build e falha se houver resposta duplicada, fora de faixa ou sem solução |
| Desafio "colado" no jogo (vira questionário) | M | A | Regra de design: todo desafio tem consequência física no cenário; revisão de GDD em cada fase |
| Texto difícil demais para a série | M | M | Limite de palavras por instrução por ano; narração; revisão com professor(a) |
| Falta de educador(a) disponível para revisar | A | A | Identificar revisor(a) na Etapa A; sem revisor, o conteúdo não sai de `em_revisao` |

### Operacionais / legais
| Risco | P | I | Mitigação |
|---|---|---|---|
| Conflito de marca "Leo Sabido" | M | A | Busca no INPI e em lojas/sites antes da publicação; nome tratado como provisório até lá |
| Atraso na autorização da instituição para testes com crianças | A | M | Iniciar tratativas já na Etapa A; preparar termos com antecedência |
| Rotatividade da equipe PRAXIS | M | M | Documentação contínua, código tipado, guias de manutenção, contas em nome do contratante |
| Recursos de terceiros com licença inadequada | M | A | Inventário de assets com licença e fonte desde o primeiro arquivo; CI verifica que todo asset está inventariado |
| Escopo completo subestimado | A | A | Estimativas separadas MVP × completa; versão completa entra em sprints próprias após aprovação do MVP |

---

## 4. Arquitetura recomendada

### 4.1 Stack (versões conferidas no npm em 17/11/2026)

| Camada | Escolha | Justificativa |
|---|---|---|
| Linguagem | **TypeScript** (versão estável compatível com Vite; o npm indica 7.0.2 — se houver incompatibilidade de ferramentas, fixar a última 5.x/6.x) | Tipagem consistente, manutenção por terceiros |
| Motor 2D | **Phaser 4.2.x** (fixado) | Estável, gratuito (MIT), cenas, tilemaps, física Arcade, áudio, toque, gamepad |
| Build | **Vite 8** | Rápido, padrão do ecossistema, gera site estático |
| Fases | **Tiled** (editor gratuito) → JSON | Level design sem programar |
| Validação de dados | **Zod** (schemas TS) | Um único schema valida conteúdo no build, nos testes e em tempo de execução |
| Testes unitários | **Vitest** | Integra ao Vite |
| Testes E2E / navegadores | **Playwright** (Chromium, Firefox, WebKit≈Safari) | Fluxos completos, teclado, viewport móvel |
| Acessibilidade automatizada | **axe-core** via Playwright | Verifica as telas HTML (não substitui teste manual) |
| Qualidade | ESLint + Prettier + `tsc --noEmit` | Padronização |
| CI/CD | **GitHub Actions** → GitHub Pages ou Cloudflare Pages | Gratuito, reprodutível |
| Licenças de dependências | `license-checker` no CI | Item 18.8 / 19 |
| Armazenamento | `localStorage` com schema versionado | Sem conta, sem backend |

**Sem backend, banco de dados ou autenticação no MVP** (seção 11).

### 4.2 Princípio central: separar *mecanismo*, *formato* e *conteúdo*

Este é o coração da escalabilidade:

```
  FASE (Tiled JSON)                      CONTEÚDO (JSON)                 CÓDIGO (TypeScript)
  ┌───────────────────────┐   aponta    ┌──────────────────────┐   usa  ┌────────────────────────┐
  │ objeto "ponte_01"     │───────────▶ │ pool "3ano.sequencia"│──────▶ │ Formato: CompletarSeq. │
  │  mecanismo: ponte     │             │  itens / modelos     │        │ (UI HTML acessível)    │
  │  pool: 3ano.sequencia │             │  dicas, explicação   │        └──────────┬─────────────┘
  └──────────┬────────────┘             └──────────────────────┘                   │ resultado
             │                                                                     ▼
             └─────────────────────────────────────────────────────▶ Mecanismo: Ponte (sobe pedras)
```

- **Mecanismo de cenário** (ponte, elevador, porta, plataforma, portal): o que acontece no mundo. Não sabe de matemática.
- **Formato de interação** (escolher opção, teclado numérico, distribuir, ordenar sequência, montar arranjo, ajustar relógio, identificar forma): a interface do desafio. Não sabe de fase.
- **Conteúdo** (itens e modelos parametrizados): a pergunta, a resposta, dicas, BNCC. Não é código.

Adicionar o 4º ano = novos arquivos de conteúdo + novas fases no Tiled + (talvez) 1–2 formatos novos. Nada nos mundos anteriores muda.

### 4.3 Os 14 sistemas exigidos → módulos

| # | Sistema (seção 11) | Módulo |
|---|---|---|
| 1 | Núcleo de jogo | `src/core/` (boot, config, event bus tipado, serviços) |
| 2 | Gerenciamento de cenas | `src/scenes/` (Boot, Preload, Title, GradeSelect, WorldMap, Level, Complete, Settings) |
| 3 | Controlador do personagem | `src/player/` (máquina de estados: parado, andando, pulando, caindo, interagindo, empurrando) |
| 4 | Física e colisões | `src/physics/` (config Arcade de passo fixo, camadas de colisão, checkpoints) |
| 5 | Gerenciador de fases | `src/levels/` (carrega Tiled, instancia objetos por tipo) |
| 6 | Sistema de interações | `src/interactions/` (zonas, interruptores, caixas, mecanismos) |
| 7 | Motor de desafios | `src/challenges/engine/` (seleção de item, verificação, dicas progressivas, feedback) — **independente de fase** |
| 8 | Conteúdo escolar | `src/content/` + `content/` (carregamento, schemas, geradores parametrizados) |
| 9 | Progressão | `src/progress/` (desbloqueios, engrenagens, conquistas) |
| 10 | Salvamento | `src/save/` (localStorage versionado, migração, exportar/importar, recuperação de estado inválido) |
| 11 | Áudio | `src/audio/` (canais música/efeitos/voz, volumes independentes, narração) |
| 12 | Interface | `src/ui/` (HTML/CSS acessível sobreposto + HUD no canvas) |
| 13 | Configurações e acessibilidade | `src/settings/` (remapeamento, reduzir animações, nível de apoio, fonte, contraste, modo assistido) |
| 14 | Testes e diagnóstico | `tests/` + `src/debug/` (painel de debug só em desenvolvimento, captura de erros sem envio externo) |

### 4.4 Modelo de dados do desafio (atende à seção 8)

```ts
// Esboço — o schema Zod definitivo será o contrato.
type Desafio = {
  id: string;                    // "3A-DIV-REP-007"
  ano: 1|2|3|4|5|6;
  area: "matematica" | "logica";
  tema: string;                  // "Divisão — repartição equitativa"
  bncc: { codigo: string; status: "a_validar" | "validado"; fonte: string };
  objetivo: string;
  formato: "escolha" | "numerico" | "distribuir" | "sequencia" | "arranjo" | "relogio" | "forma";
  enunciado: { texto: string; narracao?: string };   // texto curto por ano
  parametros: Record<string, unknown> | { modelo: string; faixas: Record<string, [number, number]>; restricoes: string[] };
  solucao: unknown;
  explicacao: string;
  dicas: [string, string, string];   // da mais leve à mais explícita
  dificuldade: 1|2|3;                // dentro do mesmo ano
  revisao: { status: "rascunho" | "em_revisao" | "aprovado" | "rejeitado"; revisor?: string; data?: string; notas?: string };
  publicacao: "oculto" | "homologacao" | "producao";
};
```

**Parametrização segura:** um modelo como "distribuir *N* cristais em *k* mecanismos" declara faixas (N 6–30, k 2–5) e restrições (N divisível por k na dificuldade 1). No build, um script **enumera todas as combinações**, verifica solução única, distratores distintos, faixa numérica do ano e gera o inventário de variações. Cada variação aprovada conta para a meta de 120 itens/ano.

**Regra de publicação:** `npm run build` (produção) falha se qualquer item referenciado por uma fase não estiver `aprovado`. Builds de homologação aceitam `em_revisao` com marca d'água visível.

### 4.5 Física e controles
- Física Arcade com **passo fixo de 60 Hz** (estável em qualquer taxa de atualização).
- Salto amigável: *coyote time* (~100 ms), *jump buffer* (~120 ms), altura variável pelo tempo de tecla.
- Sem "morte": cair em um buraco devolve Leo ao último checkpoint com animação leve, sem perder progresso.
- Controles: setas/WASD, Espaço/W para pular, E/Enter para interagir; toque com botões grandes; gamepad opcional; todos remapeáveis.

### 4.6 Acessibilidade (abordagem realista)
- Telas e desafios em HTML: foco visível, ordem lógica, ARIA, contraste AA, alvo de toque ≥ 44 px, sem limite de tempo.
- **Modo assistido de plataforma:** ativa plataformas de apoio/pontes extras e remove trechos de precisão; o desafio educativo continua igual.
- Reduzir animações (respeita `prefers-reduced-motion`), volumes separados, legendas para toda fala, ícone + forma + texto em todo feedback (nunca só cor).
- Narração das instruções (botão "ouvir" sempre disponível; automática no 1º–2º ano).
- Documento de conformidade descreverá **o que atende, o que não atende e as alternativas** — sem declarar conformidade integral.

### 4.7 Privacidade (seção 13)
Nenhum dado pessoal, nenhuma requisição a terceiros em tempo de execução (fontes e assets servidos pelo próprio site), nenhum analytics. O "perfil" é apenas um apelido opcional + avatar, guardado no próprio navegador. Isso mantém o MVP fora de tratamento de dados pessoais relevante; contas para escolas (versão futura) exigirão avaliação de privacidade/LGPD própria.

---

## 5. Definição detalhada do MVP

**Mundo:** 3 — Caverna dos Enigmas (3º ano) **[DECISÃO D1, sujeita à instituição parceira]**
**Peça da Engrenagem:** a terceira.

### 5.1 Escopo incluído
- Abertura → apresentação de Leo → escolha do ano (apenas o 3º ano ativo; demais mostrados como "em construção", sem permitir troca automática) → mapa do mundo → tutorial interativo → 3 fases → tela de conclusão com a engrenagem.
- Leo completo: andar, pular, interagir, empurrar caixa, usar plataforma móvel, atravessar portal; animações de parado, andar, pular, cair, comemorar, pensar.
- **4 mecânicas educativas distintas** (o prompt pede ≥3):

| Fase | Nome | Mecânica principal | Consequência no cenário | BNCC preliminar [A VALIDAR] |
|---|---|---|---|---|
| 1 (tutorial + fase) | Entrada da Caverna | **Completar sequência** (regularidade com somas/subtrações sucessivas) + **porta de cálculo** (adição/subtração em problema) | Pedras numeradas sobem e formam a ponte; porta de engrenagens gira | EF03MA10; EF03MA06 |
| 2 | Galeria dos Cristais | **Distribuir igualmente** (arrastar cristais para *k* mecanismos; variante com resto → "cesto de sobras") | Cada mecanismo carregado acende; todos iguais → elevador sobe | EF03MA08 |
| 3 | Salão das Engrenagens | **Montar arranjo retangular** (organizar blocos em linhas × colunas para formar plataforma com o total pedido) + revisão das anteriores | Plataforma se materializa; portal final abre e libera a Engrenagem 3 | EF03MA07; EF03MA03 |

Esboço da Fase 2 (ponto de vista lateral):

```
  [Portal]                                    ┌──Elevador──┐
     ▒                                        │   (parado) │
 ════════════        ◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆ (15)      │            │
              Leo→  ☺   [⚙A] [⚙B] [⚙C]        └────────────┘
 ═══════════════════════════════════════════════════════════
   "Distribua os 15 cristais igualmente entre os 3 mecanismos."
```

- **Banco inicial: 30 desafios** (10 por fase/mecânica, dificuldades 1–3), redigidos pela equipe e entregues como `em_revisao` até aprovação de educador(a).
- Dicas progressivas (3 níveis), explicação após erro e nova tentativa ilimitada; níveis de apoio **Acompanhado / Padrão / Desafio** alteráveis a qualquer momento.
- Reinício de fase, checkpoints, seleção de fase, progresso local (fases, desafios, tentativas, dicas usadas, tempo aproximado, conquistas), exportar/importar progresso.
- Configurações: volume (música/efeitos/voz), reduzir animações, remapear teclas, modo assistido, tamanho de texto, narração.
- Áudio: música de fundo da caverna, efeitos de pulo/passo/interação/acerto/erro/conclusão.
- Publicação de homologação em URL pública.
- Testes automatizados (unitários + E2E) e roteiro de testes manuais; plano e instrumentos de teste de usabilidade (execução na Etapa D).

### 5.2 Fora do escopo do MVP
Os outros 5 mundos; fases 4–5 do mundo 3; narração gravada por humano; PWA offline (será avaliado); contas de professor; painel de relatórios; idiomas além do pt-BR.

### 5.3 Como o MVP será apresentado
Sempre como **"MVP — Mundo 3 (3º ano)"**, nunca como versão completa.

---

## 6. Estimativa de esforço

Estimativas em **horas-pessoa de uma equipe humana PRAXIS**, faixa mínima–máxima, sem contar o tempo dos(as) revisores(as) pedagógicos(as) e das crianças/escolas nos testes.

### 6.1 MVP
| Frente | Horas |
|---|---|
| Etapa A — planejamento, GDD, matriz, documentação inicial | 60–80 |
| Protótipo técnico (projeto, Leo, física, cena de teste, 1ª mecânica) | 80–110 |
| Motor de desafios + schemas + validador de parametrização | 90–120 |
| Level design e mecanismos das 3 fases | 100–140 |
| Arte original (Leo, tileset da caverna, objetos, UI, telas) | 100–160 |
| Áudio (seleção CC0/criação, mixagem, inventário) | 15–25 |
| UI, menus, configurações, acessibilidade | 70–100 |
| Conteúdo: redação dos 30 desafios, dicas e explicações | 40–60 |
| Testes automatizados, manuais e preparação da usabilidade | 60–90 |
| CI/CD, publicação, documentação de implantação | 15–25 |
| **Total MVP** | **≈ 630–910 h** |
| + Revisão pedagógica (educador/a) | ≈ 8–15 h |
| + Etapa D (sessões com crianças, relatório, ajustes) | ≈ 60–100 h |

### 6.2 Versão completa (além do MVP)
| Frente | Horas |
|---|---|
| 5 mundos novos × (arte 120–180 + 5 fases 120–170 + mecânicas novas 60–100 + 120 itens 80–120 + testes 40–60) | 2.100–3.150 |
| Mundo 3: fases 4–5 + ampliação para 120 itens | 150–220 |
| Narração gravada (1º–2º ano), acessibilidade ampliada, PWA | 120–200 |
| Etapa F — regressão, compatibilidade, desempenho, auditoria, manuais, release | 250–400 |
| **Total versão completa (adicional)** | **≈ 2.600–4.000 h** |
| + Revisão pedagógica de ~720 itens (≈ 6–10 min/item) | ≈ 70–120 h de educador(a) |

**Nota sobre desenvolvimento assistido por IA:** se eu (Claude) produzir a maior parte do código, dos schemas, dos testes e da arte vetorial, as frentes de programação encolhem bastante. **Não encolhem**: revisão pedagógica, decisões da instituição, sessões com crianças, testes em dispositivos reais e aprovações. O cronograma abaixo é guiado por essas dependências humanas.

---

## 7. Cronograma por etapas e marcos

Sprints de 2 semanas. Datas relativas (semana 1 = início após aprovação deste plano); o calendário real seguirá as regras do polo/PRAXIS **[PENDENTE]**.

| Etapa | Sprints | Semanas | Marco verificável |
|---|---|---|---|
| A — Descoberta e planejamento | S0 | 1–2 | M1: plano aprovado, GDD, matriz preliminar, backlog |
| B — Protótipo técnico | S1 | 3–4 | M2: URL com Leo andando/pulando na cena de teste + 1 mecânica (sequência → ponte) |
| C — MVP funcional | S2–S5 | 5–12 | M3 (sem. 8): fases 1–2 jogáveis · M4 (sem. 12): MVP completo publicado em homologação |
| D — Validação com a comunidade | S6–S7 | 13–16 | M5: sessões realizadas, relatório de ajustes, MVP revisado (depende de autorização) |
| E — Expansão curricular | S8–S19 | 17–40 | M6..M10: um mundo novo a cada ~2 sprints (ordem sugerida: 2º, 4º, 1º, 5º, 6º) |
| F — Qualidade e lançamento | S20–S21 | 41–44 | M11: versão 1.0 publicada, manuais, relatório de testes |

Ao fim de cada etapa: relatório com *o que foi feito, testado, funcionando, problemas, riscos, pendências e próxima entrega* (seção 21).

---

## 8. Backlog inicial priorizado (MVP)

Prioridade MoSCoW: **M** = obrigatório no MVP · **S** = deveria · **C** = poderia.

| ID | Item | Prior. | Etapa |
|---|---|---|---|
| E0-01 | Repositório, CI (lint, tipos, testes, build), deploy de homologação | M | B |
| E0-02 | Inventário de assets/licenças + verificação no CI | M | B |
| E1-01 | Leo: andar, pular (coyote/buffer), cair, colisões com tiles | M | B |
| E1-02 | Física de passo fixo + teste de salto determinístico | M | B |
| E1-03 | Checkpoints e respawn sem punição | M | B |
| E1-04 | Interagir, empurrar caixa, plataforma móvel, portal | M | B/C |
| E2-01 | Schemas Zod de desafio, fase e save | M | B |
| E2-02 | Motor de desafios (seleção, verificação, dicas, feedback, explicação) | M | B |
| E2-03 | Formato **Sequência** + mecanismo **Ponte** | M | B |
| E2-04 | Formato **Distribuir** + mecanismo **Elevador** | M | C |
| E2-05 | Formato **Arranjo retangular** + mecanismo **Plataforma** | M | C |
| E2-06 | Formato **Numérico/Escolha** + mecanismo **Porta** | M | C |
| E2-07 | Validador de parametrização (enumera combinações) | M | C |
| E2-08 | Regra de publicação (produção só com `aprovado`) | M | C |
| E3-01 | Fases 1, 2, 3 no Tiled com começo, desenvolvimento e conclusão | M | C |
| E3-02 | Tutorial interativo integrado à Fase 1 | M | C |
| E4-01 | Telas: abertura, Leo, escolha do ano, mapa, seleção de fase, conclusão | M | C |
| E4-02 | HUD (engrenagens, dica, pausa) + UI de desafio em HTML acessível | M | C |
| E5-01 | Progresso e salvamento local versionado + recuperação de dados inválidos | M | C |
| E5-02 | Exportar/importar progresso | S | C |
| E5-03 | Conquistas visuais | S | C |
| E6-01 | Configurações: volumes, reduzir animações, nível de apoio, modo assistido | M | C |
| E6-02 | Remapeamento de teclas | M | C |
| E6-03 | Controles de toque | M | C |
| E6-04 | Narração das instruções (Web Speech pt-BR) | S | C |
| E6-05 | Tamanho de texto / fonte alternativa | S | C |
| E7-01 | Arte: Leo (sprites), tileset caverna, objetos, fundos em camadas | M | B/C |
| E7-02 | Áudio: música, efeitos, feedbacks | M | C |
| E8-01 | Redação dos 30 desafios + dicas + explicações | M | C |
| E8-02 | Matriz pedagógica do 3º ano preenchida | M | C |
| E9-01 | Testes unitários (motor, validador, save, progressão) | M | C |
| E9-02 | Testes E2E (fluxo completo, teclado, viewport móvel, 3 motores) | M | C |
| E9-03 | Roteiro de testes manuais + relatório | M | C |
| E9-04 | Plano e instrumentos de teste com usuários | M | C/D |
| E10-01 | Modo "gráficos leves" | S | C |
| E10-02 | PWA offline | C | E |

---

## 9. Proposta de identidade visual

### 9.1 Direção de arte
**"Caderno de inventor ganhando vida"** — ilustração vetorial plana com contornos suaves e arredondados, texturas leves de papel e anotações à mão no estilo de cadernos de estudo renascentistas (setas, engrenagens, medidas). Original, sem referências diretas a jogos existentes. Animações discretas e funcionais.

### 9.2 Leo
- Criança inventora (idade indefinida, ~10 anos), pele morena, cabelo castanho volumoso.
- **Silhueta-assinatura:** óculos de proteção de latão sobre a testa + **mochila com uma grande engrenagem** nas costas + cachecol curto laranja (lê-se bem mesmo em miniatura).
- Colete de aventureiro com bolsos, lápis atrás da orelha, botas de cano curto.
- Expressões: curiosidade (sobrancelha levantada), alegria, concentração (língua de lado), surpresa. Nunca medo ou dor.
- Gestos de "pensar" (mão no queixo) quando um desafio está aberto e "eureca" (dedo para cima) no acerto.

### 9.3 Paletas por mundo (unidade + identidade)
Base comum: tinta sépia `#3B2F2A` para contornos, papel `#F6EEDC`, latão `#C9973A`.

| Mundo | Ambiente | Cor dominante | Acento |
|---|---|---|---|
| 1 Floresta dos Números | Árvores redondas, cogumelos-contadores | Verde folha `#5FA34A` | Amarelo `#F2C14E` |
| 2 Vila das Descobertas | Casinhas de madeira, moinhos | Terracota `#D2734A` | Azul céu `#6BB6E0` |
| 3 Caverna dos Enigmas | Cristais, rochas, lanternas | Azul-violeta `#4B4A8C` | Ciano cristal `#5ED3E0` |
| 4 Castelo das Estratégias | Torres, engrenagens grandes | Pedra `#8A8F9C` | Vinho `#A3405A` |
| 5 Cidade dos Inventores | Telhados com hélices, painéis | Cobre `#B8693C` | Verde-água `#3FB59A` |
| 6 Laboratório do Saber | Circuitos, bancadas, quadros | Grafite `#2F3A46` | Lilás elétrico `#9B7BF0` |

Todas as combinações de texto serão conferidas para contraste AA.

### 9.4 Tipografia (licença SIL OFL, servidas localmente)
- **Andika** (SIL) para 1º–3º ano — criada para alfabetização ("a" e "g" de uma só forma).
- **Atkinson Hyperlegible** para 4º–6º ano e textos de interface.
- Títulos: **Baloo 2** (OFL).

### 9.5 Interface adaptada à faixa etária
- **1º–2º:** botões grandes com ícone, instruções de 1 frase, narração automática, ilustrações no lugar de texto.
- **3º–4º:** ícone + texto curto, narração sob demanda.
- **5º–6º:** visual "painel de inventor" mais sóbrio, textos maiores, menos ornamento.

### 9.6 Áudio
Trilhas originais ou CC0 por mundo (loops curtos e calmos), efeitos CC0 (ex.: pacotes Kenney) e sons de acerto/erro **não punitivos** (erro = "hmm" suave, nunca buzina). Tudo listado no inventário com fonte e licença.

---

## 10. Estrutura inicial do repositório

```
leo-sabido/
├── README.md                  # visão geral, como rodar, como contribuir
├── CHANGELOG.md               # histórico de versões (semver)
├── LICENSE                    # [PENDENTE] licença do código (sugestão: MIT) e da arte (sugestão: CC BY-NC-SA ou proprietária do contratante)
├── package.json · tsconfig.json · vite.config.ts · playwright.config.ts
├── .github/workflows/         # ci.yml (lint, tipos, testes, validação de conteúdo, build) · deploy.yml
├── docs/
│   ├── planejamento/          # este documento, visão do produto, requisitos, riscos
│   ├── gdd/                   # Game Design Document
│   ├── arquitetura/           # documento de arquitetura + decisões (ADRs)
│   ├── pedagogico/            # matriz BNCC, inventário de exercícios, guia de conteúdo
│   ├── acessibilidade/        # relatório de conformidade e alternativas
│   ├── testes/                # planos, roteiros, relatórios
│   ├── manuais/               # professores/responsáveis, técnico, implantação, manutenção
│   └── inventario-assets.md   # imagens, sons, fontes e licenças
├── content/                   # CONTEÚDO (não é código)
│   ├── anos/3/desafios/*.json
│   ├── anos/3/modelos/*.json  # modelos parametrizados
│   └── mundos.json            # mundos, fases, ordem de desbloqueio
├── levels/                    # fases do Tiled (.tmj) e tilesets (.tsj)
├── assets/                    # arte (svg/png/atlas), audio, fonts
├── scripts/                   # validate-content.ts, enumerate-variants.ts, check-assets.ts
├── src/
│   ├── main.ts
│   ├── core/ scenes/ player/ physics/ levels/ interactions/
│   ├── challenges/ (engine/, formats/, mechanisms/)
│   ├── content/ progress/ save/ audio/ ui/ settings/ debug/
│   └── types/
└── tests/
    ├── unit/                  # Vitest
    └── e2e/                   # Playwright
```

---

## 11. Critérios de aceite por etapa

**Etapa A:** este documento aprovado; GDD v1; matriz BNCC preliminar do 3º ano com status por código; revisor(a) pedagógico(a) identificado(a) ou registrado como pendência; decisões D1–D8 registradas.

**Etapa B:**
- `npm install && npm run dev` funciona em máquina limpa seguindo o README.
- Leo anda, pula e colide de forma idêntica a 60 Hz e 144 Hz (teste automatizado).
- Cena de teste com plataforma fixa, móvel, caixa e checkpoint.
- Desafio de sequência: acerto ergue a ponte; erro mostra dica; tudo operável por teclado.
- CI verde; URL de homologação acessível.

**Etapa C (MVP):**
- As 3 fases são concluíveis do início ao fim por teclado, por toque e no modo assistido.
- ≥ 4 formatos educativos funcionando, cada um com consequência visível no cenário.
- 30 desafios no schema; validador sem erros; nenhum item sem dica/explicação.
- Progresso salvo e restaurado após recarregar; dados corrompidos não travam o jogo.
- Testes unitários dos sistemas críticos e E2E do fluxo principal passando em Chromium, Firefox e WebKit.
- axe-core sem violações sérias nas telas HTML; zero erros no console no fluxo principal.
- Inventário de assets 100% preenchido; dependências com licenças compatíveis.
- Conteúdo marcado `aprovado` **somente** com registro do(a) revisor(a) — caso contrário, MVP fica rotulado como "em revisão pedagógica".

**Etapa D:** termo de autorização da instituição; plano e instrumentos de observação aprovados; sessões registradas sem dados identificáveis desnecessários; relatório de problemas e ajustes; MVP revisado publicado. Nenhuma afirmação de ganho de aprendizagem.

**Etapa E (por mundo):** 5 fases concluíveis; ≥ 4 tipos de desafio do ano; 120 itens/variações validados; matriz BNCC do ano validada; testes de regressão dos mundos anteriores passando.

**Etapa F:** os 16 critérios da seção 18.

---

## 12. Dependências, custos e aprovações externas

### 12.1 Custos
| Item | Custo | Obrigatório? |
|---|---|---|
| Phaser, Vite, TypeScript, Tiled, Vitest, Playwright, fontes OFL, sons CC0 | R$ 0 | — |
| Repositório GitHub + Actions + Pages (ou Cloudflare Pages) | R$ 0 (planos gratuitos) | Sim |
| Domínio próprio `.com.br` | ≈ R$ 40/ano | Não (opcional) |
| Teste em Safari/iPad | R$ 0 se houver dispositivo Apple emprestado; senão serviço de testes em nuvem (pago) | Para Safari real, sim |
| Ilustrador(a)/compositor(a) profissional | Variável | Não (arte original própria é suficiente) |
| Registro de marca no INPI | Taxas do INPI (busca prévia é gratuita) | Recomendado antes de divulgação ampla |

**Nenhum custo recorrente obrigatório.** Qualquer custo será informado para aprovação antes.

### 12.2 Aprovações e dependências humanas [PENDENTE]
1. **Aprovação deste planejamento** (você).
2. **Instituição parceira:** escolha/confirmação do ano do MVP, inventário dos equipamentos, autorização para sessões com estudantes.
3. **Educador(a) revisor(a):** revisão dos 30 desafios e da matriz BNCC.
4. **Termos para testes com crianças:** autorização dos responsáveis e assentimento das crianças, conforme exigências do polo/PRAXIS e da instituição.
5. **Busca de marca** "Leo Sabido" (INPI e web).
6. **Contas em nome do contratante:** GitHub (organização), hospedagem e, se houver, domínio.
7. **UNIASSELVI:** confirmar que o jogo não usará marca institucional (ou obter autorização expressa).
8. **Licença do projeto:** definir licença do código e da arte.

---

## Próxima entrega após aprovação
**Etapa B — Protótipo técnico (Marco M2):** repositório configurado com CI, Leo movimentável com física de passo fixo, cena de teste com plataformas/caixa/checkpoint, motor de desafios mínimo e a primeira mecânica (sequência → ponte), publicado em URL de homologação.
