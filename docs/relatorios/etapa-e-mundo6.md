# Relatório — Etapa E, Mundo 6 (6º ano: Laboratório do Saber)

Data: 18/11/2026 · Versão: 0.6.0-alpha.1

## O que foi desenvolvido

- **3 fases** com tema de laboratório (estantes com frascos coloridos, telas com gráficos, trilhas de circuito, grafite e lilás, frascos coletáveis, música própria): Sala dos Circuitos, Oficina dos Robôs e Portal do Saber.
- **3 formatos novos:**
  - **Programa** (EF06MA04 — algoritmos): o "programar sequências de ações" do Prompt Mestre. A criança monta uma lista de comandos (+3, ×2, ÷2, −1…) que leva a máquina do número inicial ao alvo, dentro de um limite de passos. Qualquer programa que funcione vale. Uma busca em largura garante, em todas as 277 variações, que existe solução e que nenhuma se resolve com um único comando. O erro mostra o rastro da execução.
  - **Expressão numérica** (EF06MA03): seis formas com parênteses, multiplicação e divisão. Se a criança calcula da esquerda para a direita, o jogo identifica esse engano e relembra a ordem das operações.
  - **Circuito de divisibilidade** (EF06MA05, EF06MA06): acender as lâmpadas dos múltiplos de k, dos divisores de k ou dos números primos; cada lâmpada recebe ✓ ou ✗.
- **Fração de quantidade** (EF06MA09) reaproveitada; o texto da janela de fração ficou genérico ("Marque 2/3 das 12 partes").
- **Banco do 6º ano:** 30 itens, 7.529 variações verificadas, todos em revisão pedagógica. Matriz: [matriz-6ano.md](../pedagogico/matriz-6ano.md).

## O que foi testado

| Teste | Resultado |
|---|---|
| 146 testes unitários (18 novos: programa, expressão, divisibilidade, valores padrão do schema) | ✅ |
| Validação do banco (156 itens de cinco anos, 44.922 variações) e das 15 fases | ✅ |
| E2E: escolher o 6º ano → 3 fases do Laboratório resolvendo cada painel pela interface (inclusive montando programas) e atravessando porta, ponte, elevadores e escada → Sexta Engrenagem | ✅ |
| E2E: orientação de expressão; rastro do programa | ✅ |
| E2E: axe-core (WCAG A/AA) nas janelas de programa, expressão e divisibilidade | ✅ |
| Todos os testes anteriores (Mundos 2 a 5) | ✅ |

Total: **146 unitários e 40 de ponta a ponta, todos passando** (Edge). Evidências: [`evidencias/`](evidencias/) (arquivos `h-*.png`).

## Problemas encontrados e corrigidos

- A janela de fração dizia "da ponte" mesmo fora de pontes → texto genérico.
- Placa com "Bem-vindo" (supõe o gênero de quem joga) → "Boas-vindas".
- Testes que usavam o 6º ano como exemplo de ano em construção passaram a usar o 1º.

## Pendências e riscos

| Item | Situação |
|---|---|
| Revisão pedagógica dos 30 itens e de 6 códigos BNCC | **[PENDENTE]** educador(a) |
| "Ordem das operações" referenciada a EF06MA03 — confirmar | **[PENDENTE]** educador(a) |
| EF06MA04 cita fluxogramas; o jogo usa lista de comandos | Formato de fluxograma pode ser criado depois |
| 1º ano (Floresta dos Números) | Não iniciado: depende de narração gravada e fontes para alfabetização |
| Firefox, Safari, tablets e computadores da escola | Pendente |
| Versão completa: 5 fases por mundo e 120 itens por ano | Mundos 2–6 têm 3 fases e 30–34 itens (com milhares de variações) |

## Situação geral

Cinco de seis mundos jogáveis (2º ao 6º ano), com 15 fases, 156 itens, **16 formatos** de desafio (sequência, numérico, distribuir, arranjo, valor posicional, dinheiro, relógio, fração, gráfico, igualdade, porcentagem, decimal, área e perímetro, programa, expressão, divisibilidade) e **4 mecanismos** de cenário (porta, ponte, blocos, elevador).
