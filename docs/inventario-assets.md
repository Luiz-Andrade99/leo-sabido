# Inventário de Assets e Licenças

Atualizado em 17/11/2026 (Etapa C). Todo arquivo de arte, som ou fonte usado no jogo precisa constar aqui antes de ser publicado.

## Arte (original do projeto)

Toda a arte foi **criada para o Leo Sabido** e é gerada por código em [`scripts/gen-art.ts`](../scripts/gen-art.ts) (SVG; `npm run gen:art`). Não deriva de nenhum jogo, personagem ou banco de imagens de terceiros.

| Arquivo(s) | Descrição | Autoria | Licença |
|---|---|---|---|
| `public/assets/leo/leo-{idle,run1,run2,run3,jump,fall,think}.svg` | Leo: parado, corrida (3 quadros), pulo, queda, pensando | Equipe do projeto | **[PENDENTE]** definir com o contratante |
| `public/assets/tiles/caverna.svg` | Tileset da caverna (topo, preenchimento, plataforma) | Equipe do projeto | idem |
| `public/assets/objects/{caixa,plataforma,bandeira-off,bandeira-on,painel,painel-ok,pedra-ponte,cristal,engrenagem}.svg` | Objetos da Etapa B | Equipe do projeto | idem |
| `public/assets/objects/{porta,portal,placa,bloco,apoio}.svg` | Porta de engrenagens, portal de saída, placa de tutorial, bloco de arranjo, bloco de apoio (modo assistido) | Equipe do projeto | idem |
| `public/assets/tiles/vila.svg`, `public/assets/objects/parafuso.svg` | Mundo 2: tileset de terra e grama, parafuso dourado coletável | Equipe do projeto | idem |
| Fundo da vila (nuvens, colinas, casas, moinhos) | Desenhado em tempo de execução (`src/scenes/background.ts`) | Equipe do projeto | idem |
| `public/assets/tiles/castelo.svg`, `public/assets/objects/chave.svg` | Mundo 4: tileset de pedras e viga de madeira, chave dourada coletável | Equipe do projeto | idem |
| Fundo do castelo (estrelas, montanhas, muralhas, torres) e gráficos de colunas | Desenhados em tempo de execução (`src/scenes/background.ts`, `src/challenges/ui/views.ts`) | Equipe do projeto | idem |
| `public/assets/tiles/cidade.svg`, `public/assets/objects/lampada.svg` | Mundo 5: tileset de placas e tijolos de cobre, viga de metal, lâmpada coletável | Equipe do projeto | idem |
| Fundo da cidade e medidor de energia | Desenhados em tempo de execução (`src/scenes/background.ts`) e em CSS | Equipe do projeto | idem |
| `public/assets/tiles/laboratorio.svg`, `public/assets/objects/frasco.svg` | Mundo 6: tileset de metal com circuitos, painel de vidro, frasco coletável | Equipe do projeto | idem |
| Fundo do laboratório (estantes, telas, circuitos) | Desenhado em tempo de execução (`src/scenes/background.ts`) | Equipe do projeto | idem |
| `public/assets/tiles/floresta.svg`, `public/assets/objects/bolota.svg` | Mundo 1: tileset de grama e terra com raízes, tronco, bolota coletável | Equipe do projeto | idem |
| Fundo da floresta; ícones (estrela, maçã, cogumelo, folha) e figuras dos desafios do 1º ano | Desenhados em código (`src/scenes/background.ts`, `src/challenges/ui/views.ts`) | Equipe do projeto | idem |
| Cédulas e moeda dos desafios de dinheiro | Ilustrações em CSS com o valor escrito; **não reproduzem as cédulas reais** | Equipe do projeto | idem |
| `public/favicon.svg` | Ícone (engrenagem) | Equipe do projeto | idem |
| Fundo da caverna | Desenhado em tempo de execução (`src/scenes/background.ts`) | Equipe do projeto | idem |

## Áudio (original, sintetizado)

Não há arquivos de som. Todos os efeitos (pulo, cristal, bandeira, painel, acerto, erro suave, dica, mecanismo, conclusão, reaparecimento) e as músicas de fundo (menu e caverna, pentatônicas e generativas) são **sintetizados em tempo real** pelo próprio código em [`src/audio/audio.ts`](../src/audio/audio.ts), com Web Audio. Autoria: equipe do projeto. Licença: a mesma do código.

Narração: voz sintética do próprio aparelho (Web Speech API, pt-BR). Nenhum áudio é baixado.

## Fontes

Nenhuma fonte embarcada: o jogo usa as fontes do sistema (Segoe UI / system-ui). Planejado: Andika, Atkinson Hyperlegible e Baloo 2 (SIL OFL 1.1), **servidas pelo próprio site** — depende de autorização para baixar os arquivos das fontes.

## Dependências incluídas no pacote do jogo

| Pacote | Versão | Licença |
|---|---|---|
| phaser | 4.2.1 | MIT |
| zod | 4.6.7 | MIT |

Ferramentas de desenvolvimento (não vão para o jogo): Vite 8.3.8, TypeScript 7.0.2, Vitest 5.1.0, Playwright 1.65.1, @axe-core/playwright 4.14.0 (MPL-2.0, só nos testes), tsx 4.23.15.
