# Roteiro de Testes Manuais — MVP (Etapa C)

Use em cada navegador/dispositivo. Marque ✅ (ok), ❌ (falhou — registre em "Problemas") ou — (não se aplica). Anote navegador, versão, sistema e equipamento.

## A. Navegadores e dispositivos (preencher uma coluna por ambiente)

| Ambiente | Chrome (PC) | Edge (PC) | Firefox (PC) | Safari (Mac) | Safari (iPad) | Chrome (Android) | PC do laboratório parceiro |
|---|---|---|---|---|---|---|---|
| Data / testador | | | | | | | |
| Executado? | | ✅ automático (17/11/2026) | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |

## A2. Voz do narrador (Faber) em aparelho real

| Verificação | Meta | Resultado por aparelho |
|---|---|---|
| Na primeira visita aparece "Baixando a voz do narrador…"; anotar quanto tempo leva até "Leo (natural) — recomendado" em Configurações | Anotar (depende da internet) | |
| Na segunda visita (recarregar), tempo até "recomendado" | ≤ 15 s | |
| 1º ano, abrir um desafio: tempo do clique até a primeira palavra | ≤ 3 s num aparelho médio | |
| A voz soa natural, sem cortes entre as frases | Sim | |
| O som da voz respeita o volume "Voz (narração)" e some com o volume em zero | Sim | |
| Sem internet (modo avião), depois de baixada: a voz continua funcionando | Sim | |

## A3. Vidas e enquadramento em aparelho real

| Verificação | Esperado | Resultado por aparelho |
|---|---|---|
| Celular **em pé** ao entrar numa fase | "Vire o celular para jogar"; o Leo não se move | |
| Girar para **deitado** | A fase continua sozinha e ocupa a tela toda, sem faixas pretas | |
| Botões ◀ ▶ E ⤒ | Ficam abaixo do chão, sem cobrir o Leo; respeitam a borda arredondada e o entalhe | |
| Pegar um cristal, cair num buraco | Perde 1 vida (❤️ 2); o cristal volta para o lugar | |
| Pegar um cristal, tocar na bandeira, cair | O cristal continua contado | |
| Cair 3 vezes | Janela "As vidas acabaram!"; "Recomeçar a fase" volta ao início com pontes e portas já abertas | |
| Desafio de escolha (1º ano) com o celular em pé | Todas as figuras dentro dos cartões | |
| Seletor "Apoio" | Texto legível | |

## B. Fluxo
1. [ ] Abertura mostra título, Leo e 4 botões.
2. [ ] "Jogar" na primeira vez mostra a história; "Pular história" funciona; "Ouvir" lê em voz alta.
3. [ ] Escolha do ano: só o 3º ano habilitado; demais dizem "Em construção" e não respondem.
4. [ ] Mapa: fase 1 aberta, 2 e 3 bloqueadas com explicação.
5. [ ] Concluir fase 1 abre a fase 2; recarregar a página mantém o progresso.
6. [ ] Concluir as 3 fases mostra "Você recuperou a Terceira engrenagem!" e o mapa indica a peça recuperada.
7. [ ] Pausa (Esc e botão): continuar, reiniciar, configurações, sair.

## C. Jogabilidade
1. [ ] Andar, pular (curto e longo), cair num buraco e reaparecer na bandeira.
2. [ ] Empurrar a caixa e subir nela (fase 1).
3. [ ] Subir na plataforma móvel e ser carregado (fase 2).
4. [ ] Porta, ponte, escada e elevadores funcionam e permitem seguir.
5. [ ] Coletar todos os cristais de uma fase e ver a conquista.
6. [ ] Modo assistido: blocos de apoio aparecem e plataformas ficam mais lentas.
7. [ ] Jogo não fica lento (sem travadas perceptíveis) no equipamento do laboratório. Anotar FPS aproximado (Ctrl+Shift+I → Rendering → FPS meter).

## D. Desafios (para cada formato)
1. [ ] Erro mostra mensagem específica, ✗ nas partes erradas e, no apoio Acompanhado, dica automática.
2. [ ] "Pedir dica" mostra dicas em ordem e conta as restantes.
3. [ ] Após 3 erros aparece a explicação.
4. [ ] Acerto mostra ✓, explicação e "Continuar"; o mecanismo se move.
5. [ ] Esc fecha; reabrir mantém o mesmo desafio.
6. [ ] Tudo funciona só com teclado (Tab, Enter, Esc, espaço nos botões).

## E. Acessibilidade (manual — o automático não cobre)
1. [ ] **NVDA (Windows) / VoiceOver (Mac, iPad):** menus, configurações e janelas de desafio são lidos com nomes corretos; mensagens de acerto/erro e avisos do jogo são anunciados.
2. [ ] Zoom do navegador 200%: menus e desafios continuam utilizáveis.
3. [ ] "Texto maior" e "Reduzir animações" têm efeito visível.
4. [ ] Volumes de música, efeitos e voz funcionam separadamente; zerar desliga.
5. [ ] Remapear uma tecla e jogar com a nova tecla.
6. [ ] Toque (tablet/celular): botões aparecem, movem o Leo, soltar faz parar; desafios utilizáveis com o teclado virtual numérico.

## F. Salvamento e privacidade
1. [ ] Gerar código de progresso, abrir em outro navegador, carregar e conferir.
2. [ ] Em janela anônima/privada: o jogo avisa se não puder salvar e continua jogável.
3. [ ] Ferramentas do navegador → Rede: nenhuma requisição para outros sites durante o jogo.

## Problemas encontrados
| # | Ambiente | Passo | O que aconteceu | Gravidade (crítica/alta/média/baixa) | Situação |
|---|---|---|---|---|---|
| | | | | | |
