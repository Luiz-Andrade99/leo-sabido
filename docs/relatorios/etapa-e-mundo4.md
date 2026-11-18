# Relatório — Etapa E, Mundo 4 (4º ano: Castelo das Estratégias)

Data: 18/11/2026 · Versão: 0.4.0-alpha.1

## O que foi desenvolvido

- **3 fases** com tema de castelo ao entardecer (estrelas, montanhas, muralhas, torres com bandeiras, chaves douradas, música própria): Portão do Castelo, Pátio das Bandeiras e Torre das Frações. Mesma cena de fase dos outros mundos.
- **3 formatos novos:**
  - **Fração** (EF04MA09): a ponte aparece dividida em partes iguais e a criança marca a fração pedida. Qualquer conjunto de partes com a quantidade certa vale. Cada parte é um botão com estado "marcado" anunciado ao leitor de tela.
  - **Gráfico de colunas** (EF04MA27): gráfico em SVG com eixo e linhas de grade; perguntas de valor, diferença e total. Os mesmos dados estão numa tabela para leitores de tela.
  - **Igualdade** (EF04MA15, EF04MA13): achar o número que falta em □ × 6 = 42, 35 + □ = 80 etc. O erro mostra o resultado que a resposta daria ("Com 6 no lugar do □, o resultado seria 36").
- **Multiplicação e divisão** nos problemas (EF04MA06, EF04MA07), inclusive divisor de dois algarismos; adição e subtração com milhares (EF04MA03).
- **Banco do 4º ano:** 31 itens, 12.747 variações verificadas, todos em revisão pedagógica. Matriz: [matriz-4ano.md](../pedagogico/matriz-4ano.md).
- **Gráficos parametrizados:** cada modelo gera um conjunto fixo e reprodutível de 120 amostras, todas validadas (valores sobre as linhas, diferença positiva, resposta maior que zero).

## O que foi testado

| Teste | Resultado |
|---|---|
| 113 testes unitários (18 novos: fração, gráfico, igualdade, multiplicação/divisão) | ✅ |
| Validação do banco (96 itens dos três anos, 30.932 variações) e das 9 fases | ✅ |
| E2E: escolher o 4º ano → 3 fases do Castelo resolvendo cada painel pela interface e atravessando porta, ponte, elevadores e escada → Quarta Engrenagem | ✅ |
| E2E: fração com partes demais pede "marque menos"; gráfico expõe imagem com nome + tabela; igualdade mostra o resultado da resposta errada | ✅ |
| E2E: axe-core (WCAG A/AA) nas janelas de fração, gráfico e igualdade | ✅ |
| Todos os testes anteriores (Mundos 2 e 3) | ✅ |

Total: **113 unitários e 32 de ponta a ponta, todos passando** (Edge). Evidências: [`evidencias/`](evidencias/) (arquivos `f-*.png`).

## Problemas encontrados e corrigidos

- Mensagem de coletável com concordância errada ("Achou um chave dourada") → mensagens neutras ("⚷ Chave dourada! 3 de 5", "Coleção completa").
- No gráfico, a linha do topo do eixo podia ficar sem número → o eixo agora termina sempre numa linha numerada.
- Erro de conta num teste unitário novo (expectativa de 9 combinações; o correto eram 8) — o código estava certo.

## Pendências e riscos

| Item | Situação |
|---|---|
| Revisão pedagógica dos 31 itens e de 8 códigos BNCC | **[PENDENTE]** educador(a) |
| Frações não unitárias (item 4A-FRA-NAO-007): 4º ou 5º ano? | **[PENDENTE]** educador(a) |
| Firefox, Safari, tablets e computadores da escola | Pendente |
| Botões de fração em celular estreito: as partes quebram em duas linhas quando há muitas (mantém alvos ≥ 28 px) | Aceito; avaliar com usuários |
| Versão completa: 5 fases por mundo e 120 itens por ano | Mundos 2–4 têm 3 fases e ~31–34 itens (com milhares de variações) |

## Situação geral

Três de seis mundos jogáveis (2º, 3º e 4º anos). Faltam o 1º ano (alfabetização: exige narração gravada e fontes próprias), o 5º e o 6º.
