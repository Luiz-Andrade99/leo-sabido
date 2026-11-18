# Relatório — Etapa E, Mundo 2 (2º ano: Vila das Descobertas)

Data: 17/11/2026 · Versão: 0.3.0-alpha.1

Primeiro mundo da expansão curricular, feito enquanto a validação do MVP (Etapa D) aguarda autorização. Ordem seguida: a sugerida no planejamento (2º, 4º, 1º, 5º, 6º).

## O que foi desenvolvido

- **3 fases** com tema próprio (céu, casinhas, moinhos, terra e grama, parafusos dourados, música mais viva): Praça dos Inventores, Mercado das Engrenagens e Torre do Relógio. Usam a mesma cena de fase do Mundo 3 — só o conteúdo, os mapas e o tema mudam, como previsto na arquitetura.
- **3 formatos novos**, todos aceitando mais de uma resposta correta quando a matemática permite:
  - **Dinheiro** (EF02MA20): juntar o valor exato com moeda de R$ 1 e cédulas ilustradas; qualquer combinação que dê o valor vale.
  - **Valor posicional** (EF02MA04): montar o número com centenas, dezenas e unidades; composições não usuais (ex.: 12 dezenas) também valem.
  - **Relógio digital** (EF02MA19): marcar o horário de término a partir do início e da duração.
- **Dobro e metade** (EF02MA08) no formato de problemas.
- **Banco do 2º ano:** 34 itens, 5.833 variações verificadas, todos em revisão pedagógica. Matriz: [matriz-2ano.md](../pedagogico/matriz-2ano.md).
- **Adaptação à idade:** enunciados do 2º ano limitados a 130 caracteres (o validador recusa os maiores) e texto maior na janela de desafio.
- **Progresso por ano:** cada ano tem seu próprio mapa, fases e engrenagem; trocar de ano não mistura nada.

## O que foi testado

| Teste | Resultado |
|---|---|
| 95 testes unitários (16 novos: dinheiro, valor posicional, relógio, dobro/metade, limite de enunciado) | ✅ |
| Validação do banco (65 itens dos dois anos, 18.185 variações) e das 6 fases | ✅ |
| E2E: escolher o 2º ano → 3 fases da Vila resolvendo cada painel pela interface e atravessando porta, ponte, elevadores e escada → Segunda Engrenagem; progresso do 2º ano separado do 3º | ✅ |
| E2E: dinheiro diz quanto falta; valor posicional aceita composição alternativa; relógio diz quanto falta | ✅ |
| E2E: axe-core (WCAG A/AA) nas janelas de dinheiro, valor posicional e relógio | ✅ (após correção abaixo) |
| Todos os 22 testes anteriores do Mundo 3 continuam passando | ✅ |

Total: **95 unitários e 27 de ponta a ponta, todos passando** (Edge). Evidências: [`evidencias/`](evidencias/) (arquivos `e-*.png`).

## Problemas encontrados e corrigidos

- Botões do relógio com texto visível ("+1 h") diferente do nome lido pelo leitor de tela ("Uma hora a mais") — WCAG 2.5.3. Agora o texto é o mesmo: "Mais 1 hora", "Menos 30 min" etc.

## Pendências e riscos

| Item | Situação |
|---|---|
| Revisão pedagógica dos 34 itens do 2º ano e conferência de 9 códigos BNCC | **[PENDENTE]** educador(a) |
| Decidir se a narração automática deve vir ligada por padrão no 2º ano | **[PENDENTE]** educador(a) / testes com crianças |
| Firefox, Safari, tablets e computadores da escola | Pendente (igual ao Mundo 3) |
| Fontes para alfabetização (Andika) | Pendente de autorização para baixar os arquivos |
| Versão completa pede 5 fases por mundo e 120 itens por ano | Mundos 2 e 3 têm 3 fases; 34 e 31 itens (com milhares de variações). Ampliação planejada para a Etapa E |

## Próxima entrega sugerida

Mundo 4 (4º ano: Castelo das Estratégias), com frações e leitura de pequenos gráficos — formatos novos que reaproveitam a mesma cena e os mesmos mecanismos.
