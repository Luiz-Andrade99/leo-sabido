# Histórico de versões

Formato: [versionamento semântico](https://semver.org/lang/pt-BR/). Versões `alpha` são protótipos de homologação, com conteúdo em revisão pedagógica.

## 0.11.0-alpha.1 — 19/11/2026 · Vidas e enquadramento em celular/tablet
- **3 vidas por fase.**
  - O topo da tela mostra "❤️ 3" ("❤️ ∞" no modo assistido, que não tem limite).
  - Cair num buraco gasta 1 vida e volta à última bandeira.
  - Os coletáveis pegos depois da última bandeira voltam para o lugar. A bandeira os guarda: "Seus cristais estão guardados".
- **Vidas zeradas:** uma janela gentil, "As vidas acabaram! Vamos tentar de novo do começo da fase", e a fase recomeça. Os desafios resolvidos e os mecanismos continuam abertos.
- Errar um desafio continua sem custo.
- **A fase ocupa a tela inteira** em celular e tablet (escala `EXPAND` do Phaser, com zoom de câmera):
  - os botões de toque ficam numa faixa abaixo do chão e nunca cobrem o Leo;
  - no tablet em pé, a fase fica logo acima dos botões.
- **Celular em pé durante a fase:** "Vire o celular para jogar", com a fase pausada até girar. Menus e janelas de desafio continuam funcionando em pé.
- **Desafios de escolha por imagem:** as figuras não vazam mais dos cartões em telas estreitas. Os grupos mantêm 5 por linha, com figuras que encolhem.
- **Barra do topo:**
  - o seletor "Apoio" ficou legível no Safari/iPhone;
  - no celular deitado, a pausa vira só o ícone.
- **Testes:**
  - 220 unitários;
  - vidas (`tests/e2e/vidas.spec.ts`);
  - dispositivos: tela cheia, botões fora do Leo, pedido para girar e figuras dentro dos cartões, em 7 aparelhos emulados.

## 0.10.0-alpha.1 — 18/11/2026 · Voz humana do narrador (Faber)
- **Narrador com voz neural Faber** (Piper, pt-BR), gerada no próprio aparelho: mesma voz humana em computador, tablet e celular, inclusive nos desafios sorteados. É grátis, sem conta, e nada é enviado para fora.
- **Download automático** na primeira visita (cerca de 92 MB, só uma vez, com aviso discreto). Depois fica guardada no aparelho e funciona sem internet. Enquanto carrega, ou se o aparelho não aguentar, o narrador usa a voz do navegador.
- **Rapidez:**
  - fala frase por frase, começando a tocar enquanto gera as próximas;
  - prepara antes a história, as placas e o desafio de que o Leo se aproxima;
  - usa vários núcleos do processador, graças a um service worker de isolamento (`coi-sw.js`).
- **Configurações:** "Voz do narrador" ganhou a opção "Leo (natural)", com o estado (baixando, recomendado ou não disponível). Dá para voltar à voz do navegador.
- **Publicação:** o modelo não fica no repositório. `npm run voz:baixar` (chamado pelo `npm run build`) baixa a revisão fixada e confere o SHA-256. O GitHub Actions guarda o modelo em cache.
- **Testes:** 203 unitários, E2E da voz (`tests/e2e/voz-faber.spec.ts`) e verificação da Faber no Firefox (`--faber`).

## 0.9.0-alpha.1 — 18/11/2026 · Plataformas e voz
- **Voz do narrador mais natural:** escolhe sozinho a voz mais humana do aparelho (vozes "Natural" do Edge, Google no Chrome/Android, "Aprimoradas" no iPhone/iPad/Mac); opção "Voz do narrador" com "Testar voz" nas Configurações; símbolos lidos por extenso (3/4 → "3 quartos", × → "vezes", R$ 7 → "7 reais", 08:30 → "8 horas e 30 minutos"); fala frase a frase.
- **Celular e tablet:** placas com instruções de toque em vez de teclas; barra sem dicas de teclado; barra e janela de desafio compactas em telas baixas (o "Verificar" não fica mais cortado); botão de toque mais robusto no Safari.
- **Testes em outras plataformas:** Firefox 146 instalado (12 verificações via WebDriver BiDi, `scripts/firefox-bidi-smoke.mjs`), Safari/WebKit (suíte completa), iPhone 14, iPad, Pixel 7 e Galaxy Tab S4 emulados (`PW_DEVICES=1`, `tests/e2e/dispositivos.spec.ts`).
- Pacote do site para hospedagem estática: `entregas/leo-sabido-site-v0.9.zip`.
- Testes: 185 unitários; 44 de ponta a ponta no Edge e no Safari/WebKit; 14 em celulares e tablets emulados; 12 verificações no Firefox.

## 0.8.0-alpha.1 — 18/11/2026 · Ampliação para a estrutura da versão 1.0
- **30 fases:** cada mundo ganhou as fases 4 e 5; a engrenagem passou da fase 3 para a fase 5. Fase 3 de cada mundo agora termina num portal (placas e objetivos atualizados).
- **Novo formato do 1º ano — ordenar números por toque** (EF01MA05, a validar): a criança toca os cartões do menor para o maior (ou do maior para o menor); cada posição recebe ✓ ou ✗; "Apagar último" e "Limpar" para refazer. O 1º ano passa a ter 4 tipos de desafio.
- Sequência numérica por toque no 1º ano (EF01MA10) e porcentagem em problemas com dinheiro no 5º ano (EF05MA06).
- **30 itens novos** (5 por ano), todos em revisão pedagógica: troco, metade, centenas, subtração com três algarismos, divisão, frações, igualdades, gráfico, decimais com zero nos décimos, área, divisores, primos, programas com divisão, expressões com parênteses.
- **Validador da versão 1.0:** `npm run validate:content` recusa qualquer ano disponível com menos de 5 fases, 4 tipos de desafio ou 120 variações validadas. Inventário com resumo por ano.
- **Teste genérico de fases:** os ganchos de teste expõem a geometria de cada mecanismo; o E2E de cada mundo joga as 5 fases e atravessa cada porta, ponte, escada e elevador sem cair.
- Testes: 182 unitários e 44 de ponta a ponta.

## 0.7.0-alpha.1 — 18/11/2026 · Etapa E (Mundo 1, 1º ano) — seis mundos jogáveis
- Mundo 1 — Floresta dos Números: 3 fases (Clareira das Estrelas, Rio dos Cogumelos, Árvore Antiga), tema de floresta, bolotas como coletáveis, música própria; fases sem plataformas móveis nem caixas.
- 3 formatos de escolha por imagem, sem digitação: contagem (quantos, qual grupo, juntar, tirar, comparar), figuras planas e padrões. Tocar numa opção já verifica.
- 1º ano com narração automática de enunciados, placas, dicas e respostas (voz sintética pt-BR).
- Banco do 1º ano com 30 itens (564 variações).
- Tela de mundo concluído: textos corrigidos (artigo e "mundos em construção") e final especial ao recuperar as seis peças. Abertura e "Sobre" atualizadas.
- Testes: 160 unitários e 43 de ponta a ponta.

## 0.6.0-alpha.1 — 18/11/2026 · Etapa E (Mundo 6, 6º ano)
- Mundo 6 — Laboratório do Saber: 3 fases (Sala dos Circuitos, Oficina dos Robôs, Portal do Saber), tema de laboratório em grafite e lilás, frascos como coletáveis e música própria.
- 3 formatos novos: programa (sequência de comandos — pensamento computacional), expressão numérica (ordem das operações, com aviso do engano "da esquerda para a direita") e circuito de divisibilidade (múltiplos, divisores e primos).
- Fração de quantidade reaproveitada para o 6º ano; texto da janela de fração deixou de citar "ponte".
- Banco do 6º ano com 30 itens (7.529 variações). Placas com boas-vindas neutras.
- Testes: 146 unitários e 40 de ponta a ponta.

## 0.5.0-alpha.1 — 18/11/2026 · Etapa E (Mundo 5, 5º ano)
- Mundo 5 — Cidade dos Inventores: 3 fases (Praça das Invenções, Fábrica de Engrenagens, Usina de Energia), tema de cidade de cobre e verde-água, lâmpadas como coletáveis e música própria.
- 3 formatos novos: porcentagem (medidor de energia), número decimal (inteiros, décimos e centésimos) e área e perímetro (retângulo sob medida).
- Banco do 5º ano com 30 itens (6.461 variações). Respostas numéricas de até 7 algarismos; gráficos de dados fixos com escala própria.
- Correção: resumo de coletáveis na tela de conclusão com concordância neutra ("Chaves douradas: 3 de 5").
- Testes: 128 unitários e 34 de ponta a ponta.

## 0.4.0-alpha.1 — 18/11/2026 · Etapa E (Mundo 4, 4º ano)
- Mundo 4 — Castelo das Estratégias: 3 fases (Portão do Castelo, Pátio das Bandeiras, Torre das Frações), tema de castelo ao entardecer, chaves douradas e música própria.
- 3 formatos novos: fração (marcar partes de uma ponte), gráfico de colunas (SVG com tabela para leitores de tela) e igualdade com número desconhecido; multiplicação e divisão nos problemas.
- Banco do 4º ano com 31 itens (12.747 variações).
- Mensagens de coletáveis com concordância neutra; eixo do gráfico sempre termina numa linha com número.
- Testes: 113 unitários e 32 de ponta a ponta.

## 0.3.0-alpha.1 — 17/11/2026 · Etapa E (Mundo 2, 2º ano)
- Mundo 2 — Vila das Descobertas: 3 fases (Praça dos Inventores, Mercado das Engrenagens, Torre do Relógio), tema visual próprio (céu, casinhas, moinhos), parafusos dourados como coletáveis e música própria.
- 3 formatos novos: dinheiro (juntar valor exato), valor posicional (montar números) e relógio digital (horário de término); dobro e metade nos problemas.
- Banco do 2º ano com 34 itens (5.833 variações); limite de 130 caracteres nos enunciados do 2º ano; texto maior nos desafios dos anos iniciais.
- Progresso separado por ano; conquistas das seis engrenagens.
- Testes: 95 unitários e 27 de ponta a ponta (Mundo 2 completo e axe-core nos novos formatos).

## 0.2.0-alpha.1 — 17/11/2026 · Etapa C (MVP, Mundo 3)
- Fluxo completo: abertura, história do Leo, escolha do ano (só 3º disponível), mapa com desbloqueio, pausa, conclusão de fase e de mundo.
- 3 fases da Caverna dos Enigmas com tutorial por placas, cristais coletáveis e saída.
- 4 formatos de desafio: sequência, problema numérico, distribuir (com e sem resto) e arranjo retangular.
- 4 mecanismos: porta, ponte, escada de blocos e elevador.
- Banco com 31 itens (12.352 variações verificadas), todos em revisão pedagógica.
- Salvamento local versionado com recuperação de dados corrompidos e código de progresso (exportar/importar).
- Configurações: volumes, nível de apoio, modo assistido, narração automática, reduzir animações, texto maior, controles de toque, remapeamento de teclas.
- Áudio original sintetizado; controles de toque; conquistas de esforço.
- Testes: 77 unitários, 22 de ponta a ponta (incluindo axe-core WCAG A/AA nas telas HTML).

## 0.1.0-alpha.1 — 17/11/2026 · Etapa B (protótipo técnico)
- Leo com física de passo fixo, cena de teste, primeira mecânica (sequência → ponte), motor de desafios e banco inicial.
