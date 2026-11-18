# Leo Sabido: Aventuras do Conhecimento

Jogo educativo de plataforma 2D para navegador, do 1º ao 6º ano do Ensino Fundamental. Gratuito, sem anúncios, sem contas e sem coleta de dados pessoais.

**▶ Jogar agora (computador, tablet e celular): https://luiz-andrade99.github.io/leo-sabido/**

O link é atualizado sozinho a cada envio para a branch `main` (workflow "Publicar no GitHub Pages").

> **Estado atual: v0.9.0-alpha.1 (funciona em computador, tablet e celular) — os seis anos jogáveis com 5 fases cada (30 fases)** (Floresta dos Números, Vila das Descobertas, Caverna dos Enigmas, Castelo das Estratégias, Cidade dos Inventores e Laboratório do Saber), 216 desafios com 67.834 variações verificadas e de 4 a 5 tipos de desafio por ano. A estrutura pedida para a versão 1.0 está completa e é conferida pelo `npm run validate:content`. **Todos os desafios estão em revisão pedagógica** — por isso o build de produção ainda é bloqueado de propósito.

## Requisitos

- Node.js 24 ou superior (testado com 24.14) e npm 11
- Testes E2E no Windows: Microsoft Edge instalado (padrão). Em outros sistemas: `npx playwright install chromium` e `PW_CHANNEL=chromium`.
- Outros navegadores: `npx playwright install firefox webkit` e `PW_ALL_ENGINES=1 npx playwright test --project=webkit` (Safari) ou `--project=firefox`. Celulares e tablets emulados (iPhone, iPad, Android): `PW_DEVICES=1 npx playwright test dispositivos`. Firefox instalado no computador: `node scripts/firefox-bidi-smoke.mjs` com o `npm run preview` rodando.
- Publicar como site: o conteúdo de `dist/` (ou `entregas/leo-sabido-site-v0.9.zip`) funciona em qualquer hospedagem estática (GitHub Pages, Netlify, Cloudflare Pages), pois usa caminhos relativos.

## Comandos

| Comando | O que faz |
|---|---|
| `npm install` | Instala as dependências (versões fixadas) |
| `npm run dev` | Servidor de desenvolvimento em http://localhost:5173 |
| `npm test` | Testes unitários (Vitest) |
| `npm run test:e2e` | Testes de ponta a ponta no navegador (Playwright + axe-core); gera o build e salva capturas em `docs/relatorios/evidencias/` |
| `npm run typecheck` | Verificação de tipos |
| `npm run validate:content` | Valida desafios, mundos e fases (todas as variações parametrizadas) |
| `npm run gen:levels` | Gera `public/levels/*.tmj` (formato Tiled) a partir de `levels/src/*.txt` |
| `npm run gen:art` | Regenera a arte vetorial original em `public/assets/` |
| `npm run docs:inventario` | Atualiza `docs/pedagogico/inventario-exercicios.md` a partir de `content/` |
| `npm run build` | Build de **homologação** em `dist/` (aceita conteúdo em revisão, com aviso visível) |
| `npm run build:producao` | Build de **produção** — falha se alguma fase usar desafios sem aprovação pedagógica |
| `npm run preview` | Serve o `dist/` em http://localhost:4173 |

## Parâmetros de URL (homologação e testes)

| Parâmetro | Efeito |
|---|---|
| `?apoio=acompanhado\|padrao\|desafio` | Define o nível de apoio |
| `?animacoes=reduzidas` | Desliga animações não essenciais (também respeita a preferência do sistema e a configuração do jogo) |
| `?seed=123` | Fixa o sorteio dos desafios |
| `?teste=1` | Expõe `window.__leo` para testes automatizados |
| `?fps=144` | Força a taxa do laço de jogo (teste de estabilidade da física) |
| `?debug=1` | Mostra os corpos de colisão |

## Como adicionar conteúdo

- **Desafio:** acrescente um item em `content/anos/<ano>/desafios/*.json` (formatos `sequencia`, `numerico`, `distribuir`, `arranjo`, `posicional`, `dinheiro`, `relogio`, `fracao`, `grafico`, `igualdade`, `porcentagem`, `decimal`, `area`, `programa`, `expressao`, `divisibilidade`, `contagem`, `formas`, `padrao`). Rode `npm run validate:content`. Itens novos entram como `em_revisao`; só um(a) educador(a) muda para `aprovado`, registrando `revisor` e `data`.
- **Fase:** crie `levels/src/<nome>.txt` (legenda no topo de [`src/levels/ascii.ts`](src/levels/ascii.ts)), rode `npm run gen:levels` e registre a fase em `content/mundos.json`.
- **Mundo/ano:** marque `"disponivel": true` em `content/mundos.json` e adicione fases e desafios. Nenhum código dos mundos existentes precisa mudar.

## Estrutura

```
content/        mundos.json + anos/<n>/desafios/*.json (validados por schema) — não é código
levels/src/     fases em texto (fonte) → public/levels/*.tmj (Tiled)
public/assets/  arte original (SVG) — ver docs/inventario-assets.md
src/
  core/         configuração, estado, salvamento, progresso, configurações, fluxo de telas
  audio/        sons e músicas sintetizados (Web Audio)
  player/       controle do Leo (puro, testado) e sprite
  input/        teclado (remapeável) e toque
  levels/       tipos Tiled e conversor texto → Tiled
  interactions/ plataforma móvel, caixa, ponto de controle, cristal
  challenges/   engine/ (sessão, dicas) · formats/ (4 formatos) · mechanisms/ (porta, ponte, blocos, elevador) · ui/ (janela acessível)
  content/      schema, repositório e regra de publicação
  scenes/       Boot, Menu (fundo) e cena de fase genérica
  ui/           telas HTML, HUD, toque, narração, estilos
tests/unit/     Vitest · tests/e2e/ Playwright + axe-core
docs/           planejamento, GDD, matriz pedagógica, inventários, testes, relatórios
```

## Documentação

- [Planejamento inicial (Etapa A)](docs/planejamento/00-planejamento-inicial.md) · [GDD](docs/gdd/gdd.md)
- [Matriz pedagógica do 1º ano](docs/pedagogico/matriz-1ano.md) · [do 2º ano](docs/pedagogico/matriz-2ano.md) · [do 3º ano](docs/pedagogico/matriz-3ano.md) · [do 4º ano](docs/pedagogico/matriz-4ano.md) · [do 5º ano](docs/pedagogico/matriz-5ano.md) · [do 6º ano](docs/pedagogico/matriz-6ano.md) · [Inventário de exercícios](docs/pedagogico/inventario-exercicios.md)
- [Roteiro de testes manuais](docs/testes/roteiro-testes-manuais.md) · [Plano de testes com usuários](docs/testes/plano-testes-usuarios.md)
- [Relatório da Etapa B](docs/relatorios/etapa-b.md) · [Relatório da Etapa C](docs/relatorios/etapa-c.md) · [Relatório do Mundo 2](docs/relatorios/etapa-e-mundo2.md) · [Relatório do Mundo 4](docs/relatorios/etapa-e-mundo4.md) · [Relatório do Mundo 5](docs/relatorios/etapa-e-mundo5.md) · [Relatório do Mundo 6](docs/relatorios/etapa-e-mundo6.md) · [Relatório do Mundo 1](docs/relatorios/etapa-e-mundo1.md)
- [Inventário de assets e licenças](docs/inventario-assets.md) · [Histórico de versões](CHANGELOG.md)
