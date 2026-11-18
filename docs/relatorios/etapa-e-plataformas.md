# Relatório — Plataformas (Firefox, Safari, tablets, Android, iOS) e voz do narrador

Data: 18/11/2026 · Versão: 0.9.0-alpha.1

## O que mudou no jogo

**Voz do narrador mais natural**
- O jogo escolhe sozinho a voz mais natural do aparelho. Exemplos:
  - vozes "Natural" do Edge (Francisca, Thalita, Antonio);
  - "Google português do Brasil" no Chrome e no Android;
  - vozes "Aprimoradas/Premium" no iPhone, no iPad e no Mac.
- Antes, o jogo usava a primeira voz instalada. No Windows, essa é a "Maria", bem robótica.
- Nas Configurações, "Voz do narrador" permite escolher outra voz, com o botão "Testar voz".
- Vozes marcadas "online" são geradas pelo serviço de voz do navegador. Esse serviço recebe só o texto do jogo, nunca dados da criança.
- O narrador lê símbolos por extenso:

  | Escrito | Lido |
  |---|---|
  | 3/4 | 3 quartos |
  | 7 × 6 = 42 | 7 vezes 6 igual a 42 |
  | 25% | 25 por cento |
  | R$ 7 | 7 reais |
  | 08:30 | 8 horas e 30 minutos |

- Para pausas mais naturais, o texto é falado frase a frase.
- Vozes antigas tocam um pouco mais devagar.

**Celular e tablet**
- As placas trocam instruções de teclado pelos botões da tela. Por exemplo, "Use ← e → (ou A e D)" vira "Use ◀ e ▶", e "aperte E" vira "toque no botão E".
- A barra do topo não mostra dicas de teclado quando os botões de toque estão ativos.
- **Telas baixas (celular deitado):** a barra e a janela de desafio ficam compactas, e o botão "Verificar" deixou de ficar cortado.
- Na janela de ordenar, os cartões e as casas da resposta ficam menores.
- **Correção para Safari/iPhone:** o botão de toque não depende mais da "captura do ponteiro", que alguns navegadores recusam.

## Como foi testado

| Ambiente | Como | Resultado |
|---|---|---|
| **Edge** (Windows, Chromium) | Suíte completa: 44 testes de ponta a ponta | ✅ 44 de 44 |
| **Firefox 146** (instalado no computador) | Teste próprio via WebDriver BiDi, com cliques e teclas de verdade: menus, andar, pular, desafio, fase concluída, ordenar (1º ano), voz e console | ✅ 12 de 12 |
| **Safari** (motor WebKit 27.2 do Playwright) | Suíte completa: 44 testes | ✅ 44 de 44 (39 na primeira rodada; os 5 que estouraram o tempo pela lentidão passaram de novo depois do ajuste de espera) |
| **iPhone 14** em pé e deitado (WebKit emulado) | Teste de toque: menus cabem na tela sem rolagem lateral; botões ◀ ▶ ⤒ E com pelo menos 44 px; andar, pular e abrir o desafio pelo toque; axe-core; ordenar no 1º ano | ✅ 4 de 4 |
| **iPad** em pé e deitado (WebKit emulado) | Idem | ✅ 4 de 4 |
| **Android: Pixel 7** em pé e deitado (Chromium emulado) | Idem | ✅ 4 de 4 |
| **Android: Galaxy Tab S4** (Chromium emulado) | Idem | ✅ 2 de 2 |

As capturas estão em [`evidencias/`](evidencias/), nos arquivos `disp-*.png` e `ff-*.png`.

## Limites honestos

- **Emulação não é aparelho físico.** iPhone e iPad foram testados com o motor do Safari (WebKit) rodando no Windows, com tela, toque e tipo de aparelho emulados. O Android foi testado com o motor do Chrome emulado.
  - Ainda falta confirmar em aparelhos reais: som, voz, desempenho, entalhe da tela e gestos do sistema.
  - O roteiro para isso está em [roteiro-testes-manuais.md](../testes/roteiro-testes-manuais.md).
- **Firefox:**
  - O Firefox do Playwright foi bloqueado pelo Windows deste computador ("permissão negada").
  - A automação do Playwright exige o Firefox 159, e o instalado aqui é o 146.
  - Por isso, no Firefox rodou um teste de fumaça (12 verificações), não a suíte completa.
- **O WebKit no Windows roda devagar** (cerca de 11 quadros por segundo nos testes). Os testes passaram a esperar o efeito, por exemplo o Leo chegar ao lugar, em vez de um tempo fixo. Num iPhone ou iPad real, o motor roda com aceleração de vídeo.
- **Voz:** não dá para avaliar automaticamente se a voz soa natural. As vozes neurais só aparecem com o navegador aberto normalmente (no modo sem janela dos testes aparecem só "Maria" e "Daniel").
- **Link de acesso público:** https://luiz-andrade99.github.io/leo-sabido/ (GitHub Pages; abre em qualquer navegador, sem login).
  - Conferido no próprio link publicado: iPhone 14, iPad deitado e Pixel 7 emulados (6 de 6), Edge (16 de 16 testes do jogo) e Firefox 146 (12 de 12).
  - A página em claude.ai continua **privada** e só abre para outras pessoas se for compartilhada pelo menu "Compartilhar". O pacote [`entregas/leo-sabido-site-v0.9.zip`](../../entregas/leo-sabido-site-v0.9.zip) funciona em qualquer hospedagem de site estático (GitHub Pages, Netlify, Cloudflare Pages), por ter caminhos relativos.
