# Relatório — Etapa E, Mundo 5 (5º ano: Cidade dos Inventores)

Data: 18/11/2026 · Versão: 0.5.0-alpha.1

## O que foi desenvolvido

- **3 fases** com tema de cidade de inventores (prédios de cobre com janelas acesas, hélices, chão de placas verde-água, lâmpadas coletáveis, música mais rápida): Praça das Invenções, Fábrica de Engrenagens e Usina de Energia.
- **3 formatos novos:**
  - **Porcentagem** (EF05MA06): o medidor de energia do exemplo do Prompt Mestre — carregar 10%, 25%, 50%, 75% ou 100% da bateria com botões de 1 e de 10. A explicação associa cada porcentagem à fração (25% = a quarta parte).
  - **Número decimal** (EF05MA02): montar uma medida com inteiros, décimos e centésimos. Valores guardados em centésimos, sem erros de arredondamento; qualquer composição correta vale.
  - **Área e perímetro** (EF05MA20): construir o retângulo com a área e o perímetro pedidos. O erro diz o que está certo e o que não está ("a área (12) está certa; o perímetro é 14, e precisa ser 16") — exatamente a ideia da habilidade: mesma área, perímetros diferentes.
- **Reaproveitados:** gráfico de colunas (EF05MA24) e problemas (EF05MA07, EF05MA08), agora com respostas de até 7 algarismos.
- **Banco do 5º ano:** 30 itens, 6.461 variações verificadas, todos em revisão pedagógica. Matriz: [matriz-5ano.md](../pedagogico/matriz-5ano.md).

## O que foi testado

| Teste | Resultado |
|---|---|
| 128 testes unitários (15 novos: porcentagem, decimal, área e perímetro) | ✅ |
| Validação do banco (126 itens de quatro anos, 37.393 variações) e das 12 fases | ✅ |
| E2E: escolher o 5º ano → 3 fases da Cidade resolvendo cada painel pela interface e atravessando porta, ponte, elevadores e escada → Quinta Engrenagem | ✅ |
| E2E: área com perímetro errado é explicada; carga baixa diz quanto falta | ✅ |
| E2E: axe-core (WCAG A/AA) nas janelas de porcentagem, decimal e área | ✅ |
| Todos os testes anteriores (Mundos 2, 3 e 4) | ✅ |

Total: **128 unitários e 34 de ponta a ponta, todos passando** (Edge). Evidências: [`evidencias/`](evidencias/) (arquivos `g-*.png`).

## Problemas encontrados e corrigidos

- Tela de conclusão dizia "Chaves douradas encontrados" (concordância). Agora o resumo é neutro: "⚷ Chaves douradas: 3 de 5" — vale para qualquer coletável.
- Respostas com mais de 5 algarismos eram recusadas como inválidas; o limite passou a 7 algarismos.
- Gráficos com dados fixos usavam sempre escala 1 (grade densa com valores grandes); agora cada gráfico define sua escala.
- Teste antigo usava o 5º ano como exemplo de "ano em construção"; passou a usar o 6º.
- Botões de comprimento e largura desalinhados → rótulo com largura fixa.

## Pendências e riscos

| Item | Situação |
|---|---|
| Revisão pedagógica dos 30 itens e de 8 códigos BNCC | **[PENDENTE]** educador(a) |
| Porcentagem em contexto de energia × educação financeira (BNCC) | **[PENDENTE]** educador(a) |
| Reta numérica para decimais (citada na BNCC) ainda não existe como formato | Proposta para versão futura |
| Firefox, Safari, tablets e computadores da escola | Pendente |
| Versão completa: 5 fases por mundo e 120 itens por ano | Mundos 2–5 têm 3 fases e 30–34 itens (com milhares de variações) |

## Situação geral

Quatro de seis mundos jogáveis (2º ao 5º ano). Faltam o 6º ano e o 1º ano (este depende de narração gravada e fontes para alfabetização).
