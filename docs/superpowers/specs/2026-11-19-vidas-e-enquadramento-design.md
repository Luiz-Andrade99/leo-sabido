# Vidas por fase e enquadramento em celular/tablet: desenho

Data: 19/11/2026. Pedido do usuário:

> "precisamos colocar o mecanismo de 3 vidas por fase, e se morrer coletando o recurso perde, so salva se a bandeira foi pega depois de coletar o recurso / tb precisamos arrumar o 'enquadramento' em outras plataformas que não é o pc fica ruim"

## Intenção

- **Vidas:** dar consequência aos pulos (um jogo de plataforma "de verdade") sem punir a matemática. As bandeiras viram o momento de "guardar" o que já foi coletado.
- **Enquadramento:** o jogo deve ficar bom de jogar e de mostrar em celular e tablet, e não só no computador.

## Decisões do usuário

1. **3 vidas por fase.** Cair num buraco, hoje o único jeito de "morrer", gasta uma vida.
2. **Cristais e bandeiras:** ao cair, os coletáveis pegos depois da última bandeira ativada voltam para o lugar. O que foi pego antes de passar por uma bandeira fica salvo.
3. **Quando as vidas acabam,** a fase recomeça do início. Voltam ao estado inicial:
   - todos os coletáveis;
   - as bandeiras;
   - as caixas;
   - as 3 vidas.

   Os desafios já resolvidos e seus mecanismos (pontes, portas, escadas, elevadores) continuam ativados.
4. **Modo assistido:** vidas sem limite, como hoje. As vidas valem no modo padrão e no modo desafio, em todos os anos, inclusive no 1º.
5. **Celular em pé durante a fase:** o jogo pede para girar. Menus e desafios continuam funcionando em pé.

## Fora do escopo

- Vidas entre fases, "game over" geral, vidas extras para comprar ou ganhar, pontuação.
- Errar um desafio continua sem custo de vida: o pilar "zero punição por errar" vale para a matemática.

## Como funciona: vidas

- **HUD:** ao lado dos coletáveis, mostra "❤️ 3". No modo assistido mostra "❤️ ∞", com o texto acessível "vidas sem limite".
- **Queda:** perde 1 vida e o Leo volta à última bandeira, como hoje. Os coletáveis pegos desde aquela bandeira reaparecem. Um aviso é falado/anunciado, por exemplo "Ops! Você caiu. Restam 2 vidas. Os cristais desde a última bandeira voltaram para o lugar."
- **Bandeira:** ao tocá-la, os coletáveis pegos até ali ficam salvos. O aviso da bandeira passa a dizer isso: "🚩 Bandeira! Seus cristais estão guardados."
- **Vidas zeradas:**
  1. Uma janela gentil, sem palavras como "perdeu" ou "game over": "As vidas acabaram! Vamos tentar de novo do começo da fase. Os desafios que você resolveu continuam abertos."
  2. Botão "Recomeçar a fase".
  3. A fase recomeça na própria cena, sem recarregar: o Leo volta ao início, os coletáveis, bandeiras e caixas voltam ao estado inicial, as vidas voltam a 3, e os mecanismos ativados ficam como estão.
- **Trocar de modo:**
  - Trocar para "assistido" no meio da fase deixa as vidas sem limite.
  - Voltar para "padrão" ou "desafio" recomeça a contagem com 3 vidas.
- **Ao concluir a fase,** o resultado salvo conta os coletáveis que o Leo tem no fim, como hoje.
- **Documentação:** atualizar o GDD, que dizia "não há vidas", com a nova regra e o motivo.

## Como funciona: enquadramento

1. **Fase ocupando a tela.** A escala do Phaser passa de `FIT` para `EXPAND`: a área do jogo cresce até preencher a tela, sem faixas pretas, mostrando um pouco mais da fase nas laterais em telas mais largas. A altura de jogo vista fica a mesma, para não mudar a dificuldade dos pulos.
2. **Celular em pé durante a fase:** uma tela sobreposta "Vire o celular para jogar 🔄" com uma ilustração do Leo. O jogo fica pausado enquanto ela aparece e continua sozinho quando o aparelho fica deitado. Vale para telas estreitas e com toque, ou seja, em pé com largura menor que 600 px. **Tablet em pé** não pede para girar.
3. **Botões de toque:**
   - semitransparentes, um pouco menores no celular deitado;
   - presos aos cantos inferiores, respeitando as áreas seguras;
   - a câmera ganha uma margem embaixo para o chão do Leo não ficar escondido atrás dos botões.
4. **Barra do topo no celular:**
   - o seletor "Apoio" fica legível (texto claro sobre fundo escuro);
   - em telas baixas, "Pausar (Esc)" vira só "⏸";
   - o título da fase é abreviado.
5. **Janela de desafio:** o conteúdo nunca vaza dos cartões.
   - Os cartões de "escolha por imagem" quebram a linha das figuras dentro do cartão e diminuem as estrelas quando necessário.
   - A grade de opções vira uma coluna em telas estreitas.
   - A janela inteira rola dentro da tela, com "Verificar" e "Continuar" sempre alcançáveis.
6. **Verificação:** o teste de dispositivos (iPhone e Pixel em pé e deitados, iPad e Galaxy Tab) passa a conferir:
   - que nenhum elemento da janela de desafio ultrapassa o próprio cartão;
   - que a tela "Vire o celular" aparece só no celular em pé;
   - que o canvas ocupa a tela toda quando o aparelho está deitado.

   As capturas novas vão para o relatório.

## Abordagens consideradas

- **Vidas zeradas:** recomeçar do zero, que é mais difícil, contra recomeçar mantendo os desafios, mais justo com quem acertou a matemática. **Escolhida a segunda, pelo usuário.**
- **Celular em pé:** adaptar a câmera ao formato vertical, em que a criança enxerga pouco do caminho, contra pedir para girar, o padrão dos jogos de plataforma. **Escolhida pedir para girar, pelo usuário.**
- **Preencher a tela:** `ENVELOP` corta bordas da fase e pode esconder plataformas; `RESIZE` muda tudo e exige refazer a câmera; `EXPAND` preenche a tela e mostra mais fase nas laterais. **Escolhido `EXPAND`.**

## O que fica a critério de quem implementar

- O texto exato dos avisos e o desenho da tela "Vire o celular", no tom do jogo.
- A margem exata da câmera e a opacidade dos botões.
- A organização interna do recomeço da fase na cena.
