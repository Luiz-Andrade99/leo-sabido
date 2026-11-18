# Relatório — Ampliação para a estrutura da versão 1.0 (fases e itens)

Data: 18/11/2026 · Versão: 0.8.0-alpha.1

## O que foi pedido e como foi interpretado

Pedido: "Ampliar fases e itens". Usei como referência a seção 15 do Prompt Mestre (versão 1.0):

| Critério da versão 1.0 | Antes | Agora |
|---|---|---|
| 6 mundos com 5 fases cada (30) | 18 fases | **30 fases** |
| Pelo menos 4 tipos de desafio interativos por ano | 1º ano tinha 3 | **4 a 5 por ano** |
| Pelo menos 120 "desafios ou variações validadas" por ano | já atingido (564 a 12.747) | **715 a 32.074 por ano** |

A meta de 120 itens por ano é lida como **variações validadas**, o que o próprio texto permite ("desafios ou variações"). Escrever 540 itens novos de uma vez, sem um(a) educador(a) revisando, aumentaria o volume sem aumentar a qualidade. Por isso entraram **30 itens novos (5 por ano)**, escolhidos para cobrir lacunas das matrizes.

## O que foi desenvolvido

- **12 fases novas** (fases 4 e 5 de cada mundo), com nome, tema, placas e pools próprios:

  | Mundo | Fase 4 | Fase 5 (engrenagem) |
  |---|---|---|
  | Floresta | Ponte das Folhas | Ninho das Corujas |
  | Vila | Feira da Vila | Moinho Encantado |
  | Caverna | Lago Subterrâneo | Coração da Caverna |
  | Castelo | Biblioteca Secreta | Sala do Trono |
  | Cidade | Estação de Trens | Torre de Controle |
  | Laboratório | Observatório | Núcleo do Saber |

- **Engrenagens:** cada engrenagem saiu da fase 3, que agora termina num portal, e foi para a fase 5. Placas e objetivos que falavam da engrenagem foram reescritos.
- **1º ano sem plataformas móveis nem caixas** também nas fases novas. Na fase 4, o buraco é curto e tem blocos de apoio no modo assistido.
- **Novo tipo de desafio do 1º ano: ordenar números por toque** (EF01MA05, a validar).
  - A criança toca os cartões na ordem, do menor para o maior ou do maior para o menor.
  - Cada posição recebe ✓ ou ✗, e os botões "Apagar último" e "Limpar" deixam refazer.
  - Os cartões nunca aparecem já em ordem.
- **Outros recursos novos:**
  - sequência numérica por toque no 1º ano (EF01MA10);
  - porcentagem em problemas com dinheiro no 5º ano (EF05MA06).
- **30 itens novos, 5 por ano**, todos em revisão pedagógica e com BNCC "a validar":

  | Ano | Itens novos |
  |---|---|
  | 1º | ordenar (3), sequência numérica (2) |
  | 2º | troco, sequência decrescente, centenas, subtração, metade |
  | 3º | multiplicação, subtração com três algarismos, divisão em partes iguais, sequência decrescente, arranjos de 4 e 5 linhas |
  | 4º | divisão, adição de quatro ordens, frações 1/4 e 1/8, igualdade com adição, comparação em gráfico |
  | 5º | desconto de 25% e de 10% em reais, decimal 4,08, área 9 × 2, divisão de quatro algarismos |
  | 6º | expressão com parênteses, divisores de 18, primos, programa com ÷ e +, 3/4 de 16 |

  A lista completa está nas matrizes ([1º](../pedagogico/matriz-1ano.md) … [6º](../pedagogico/matriz-6ano.md)) e no [inventário](../pedagogico/inventario-exercicios.md).
- **Validador da versão 1.0:** `npm run validate:content`, que também roda em todo build, agora recusa qualquer ano disponível com menos de 5 fases, 4 tipos de desafio ou 120 variações. O inventário ganhou um resumo por ano.

## O que foi testado

| Teste | Resultado |
|---|---|
| 182 testes unitários. São 9 novos: ordenar, sequência numérica, porcentagem e progresso com 5 fases. | ✅ |
| Validação do banco (216 itens, 67.834 variações) e das 30 fases, com os critérios da versão 1.0 | ✅ |
| E2E nos seis mundos: as 5 fases de cada um, da abertura à engrenagem. | ✅ |
| E2E das fases 4 e 5: cada porta, ponte, escada e elevador é atravessado sem cair, lendo a posição do próprio jogo. | ✅ |
| E2E: ordem errada marca as posições, e "Limpar" deixa tentar de novo. axe-core sem violações na janela de ordenar. | ✅ |

Total: **182 unitários e 44 de ponta a ponta** (Edge). As evidências estão em [`evidencias/`](evidencias/), nos arquivos `amp-*.png`.

## Limites e pendências (sem mudança)

- **Revisão pedagógica:** 0 de 216 itens aprovados. O build de produção continua bloqueado de propósito.
- **BNCC:** todos os códigos continuam "a validar".
- **Plataformas móveis das fases 4 e 5:** a plataforma que anda e a plataforma vertical opcional repetem a geometria de fases já testadas. O teste automático das fases novas atravessa os mecanismos, mas não pula sobre essas plataformas.
- **Ainda não testado:**
  - Firefox, Safari, tablets e PCs de escola;
  - testes com crianças e educadores (Etapa D);
  - narração gravada.
- **Pendências de infraestrutura:** repositório Git, CI e licenças.
