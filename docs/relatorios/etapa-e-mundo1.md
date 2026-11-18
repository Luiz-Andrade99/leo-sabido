# Relatório — Etapa E, Mundo 1 (1º ano: Floresta dos Números) e situação geral

Data: 18/11/2026 · Versão: 0.7.0-alpha.1

## O que foi desenvolvido

- **3 fases** com tema de floresta (copas redondas, flores, terra e grama, bolotas coletáveis, música calma): Clareira das Estrelas, Rio dos Cogumelos e Árvore Antiga. **Mais simples de jogar**: sem plataformas móveis nem caixas — no 1º ano o desafio é a matemática, não os reflexos (seção 7 do Prompt Mestre).
- **3 formatos de escolha por imagem**, sem leitura fluente nem digitação:
  - **Contagem** (EF01MA01–04, 06, 08): contar um grupo, achar o grupo com o número, juntar dois grupos, ver quantos sobram (os retirados aparecem riscados), comparar qual grupo tem mais. Ícones em fileiras de 5 para facilitar a contagem.
  - **Figuras planas** (EF01MA14): encontrar círculo, quadrado, retângulo ou triângulo, levemente girados; as cores variam por posição, não pela figura.
  - **Padrões** (EF01MA10): sequências AB, ABB, ABC, AAB; a resposta muda em forma *e* cor.
- **Tocar já verifica** a resposta; tocar errado marca ✗ e permite tentar de novo.
- **Narração automática no 1º ano:** enunciado ao abrir, placas, dicas e a resposta do jogo após cada toque, com a voz pt-BR do aparelho.
- **Banco do 1º ano:** 30 itens, 564 variações, todos em revisão pedagógica. Matriz: [matriz-1ano.md](../pedagogico/matriz-1ano.md).
- **Final da história:** ao recuperar as seis peças, a tela de mundo concluído anuncia que a Grande Engrenagem do Saber voltou a girar.

## O que foi testado

| Teste | Resultado |
|---|---|
| 160 testes unitários (14 novos: contagem, figuras e padrões) | ✅ |
| Validação do banco (186 itens dos seis anos, 45.486 variações) e das 18 fases | ✅ |
| E2E: escolher o 1º ano → 3 fases da Floresta só tocando nas respostas → Primeira Engrenagem | ✅ |
| E2E: toque errado marca ✗, toque certo resolve, nenhum campo de texto | ✅ |
| E2E: axe-core (WCAG A/AA) nas janelas de contagem, figuras, comparação e padrão | ✅ |
| Todos os testes anteriores (Mundos 2 a 6), atualizados para seis anos disponíveis | ✅ |

Total: **160 unitários e 43 de ponta a ponta, todos passando** (Edge). Evidências: [`evidencias/`](evidencias/) (arquivos `i-*.png`).

## Problemas encontrados e corrigidos

- Concordância de gênero: "Quantas cogumelos" → itens com "Quantas…" e "As… riscadas" usam só ícones femininos; cogumelos ficam em frases neutras.
- Tela de mundo concluído dizia "Os outros mundos ainda estão em construção" e usava "A Castelo…" → texto sem artigo e sem a frase desatualizada.
- Abertura e "Sobre" ainda diziam "Protótipo do Mundo 3" → atualizadas.

## Situação geral do produto

| Item | Situação |
|---|---|
| Mundos jogáveis | **6 de 6** (1º ao 6º ano), 3 fases cada = **18 fases** |
| Desafios | **186 itens**, 45.486 variações verificadas, **19 formatos**, 4 mecanismos de cenário |
| Testes automatizados | 160 unitários + 43 de ponta a ponta (Edge), axe-core em todas as janelas |
| Revisão pedagógica | **0 de 186 itens aprovados** — depende de educador(a) |
| Versão completa (seção 15) | Pede **5 fases por mundo (30)** e **120 itens por ano (720)**: hoje são 18 fases e 30–34 itens por ano (com milhares de variações cada) |
| Navegadores | Só Edge testado; Firefox, Safari, tablets e PCs da escola pendentes |
| Etapa D (crianças e educadores) | Plano pronto; depende de autorização |
| Narração gravada e fontes para alfabetização | Pendentes (voz sintética e fontes do sistema em uso) |
| Repositório Git, CI no GitHub, licenças | Pendentes |
