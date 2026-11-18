# Etapa B — Protótipo Técnico: Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o Marco M2: Leo jogável numa cena de teste (plataformas fixas e móveis, caixa, checkpoint) com a primeira mecânica educativa (completar sequência → ponte sobe), testado e publicado em URL de homologação.

**Architecture:** Phaser 4 renderiza o mundo; lógica pura (controle do personagem, motor de desafios, formatos, conteúdo) fica em módulos sem dependência do Phaser, testados com Vitest. A UI de desafio é HTML acessível sobreposto ao canvas. Fases são JSON no formato Tiled, geradas a partir de um mapa ASCII editável.

**Tech Stack:** Phaser 4.2.x, TypeScript, Vite 8, Zod, Vitest, Playwright (canal Edge local / Chromium no CI), tsx.

**Spec:** `docs/planejamento/00-planejamento-inicial.md`

## Global Constraints
- Física Arcade com passo fixo de 60 Hz (`fixedStep: true`, `fps: 60`).
- Nenhuma requisição a terceiros em tempo de execução; sem analytics; sem dados pessoais.
- Conteúdo com `revisao.status !== "aprovado"` nunca entra em build de produção; em homologação aparece com marca "conteúdo em revisão pedagógica".
- Códigos BNCC sempre com `status: "a_validar"` até validação humana.
- Sem "morte": queda devolve ao último checkpoint, sem perda de progresso.
- Desafio sem limite de tempo, operável só por teclado, feedback com texto + ícone (não só cor).
- Todo asset listado em `docs/inventario-assets.md`.
- Textos do jogo em pt-BR.

## Review Focus
1. Resposta com espaços, vazia ou não numérica no desafio → mensagem amigável, não conta como erro de conteúdo nem quebra.
2. Abrir o desafio duas vezes / apertar E com a ponte já erguida → nada acontece de novo.
3. Leo cai no vão antes de resolver → volta ao checkpoint, desafio continua resolvível.
4. Taxa de quadros 144 Hz vs 60 Hz → altura do salto igual (±1 px).
5. Teclas de jogo (setas, espaço, E) digitadas dentro do campo de resposta → não movem Leo.

---

### Task 1: Projeto base
**Files:** `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `src/core/config.ts`, `.github/workflows/ci.yml`, `README.md`, `.gitignore`
- [ ] Instalar dependências fixadas; `npm run typecheck`, `npm test`, `npm run build` passam com cena vazia.
- [ ] `vite.config.ts` com `base: './'` (funciona em subpasta).

### Task 2: Controlador do Leo (puro)
**Files:** `src/player/controller.ts`, `tests/unit/controller.test.ts`
**Produces:** `class PlayerController { constructor(p?: Partial<PlayerParams>); step(input: PlayerInput, sense: PlayerSense, dtMs: number): PlayerCommand }`; `PlayerInput {left,right,jump:boolean}`; `PlayerSense {onGround:boolean; vx:number; vy:number}`; `PlayerCommand {vx:number; vy?:number; state:'idle'|'run'|'jump'|'fall'}`.
- [ ] Testes: acelera até `runSpeed`; pulo no chão define `vy = -jumpVelocity`; pulo até `coyoteMs` (100) após sair do chão funciona e depois não; pulo apertado até `bufferMs` (120) antes de tocar o chão dispara ao pousar; soltar o pulo subindo multiplica `vy` por `jumpCutMultiplier` (0.45) uma vez; segurar o pulo não repete o salto.

### Task 3: Conteúdo, formatos e motor de desafios (puros)
**Files:** `src/content/schema.ts`, `src/content/repository.ts`, `src/challenges/formats/sequence.ts`, `src/challenges/engine/session.ts`, `src/core/rng.ts`, `content/anos/3/desafios/sequencias.json`, `scripts/validate-content.ts`, testes em `tests/unit/`.
**Produces:**
- `DesafioSchema` (Zod) com campos da seção 4.4 do spec.
- `sequence.resolve(params, rng) → { valores:(number|null)[], solucao:number[] }`; `sequence.check(solucao, resposta:number[]) → boolean`; `sequence.enumerate(modelo) → ResolvedSequence[]`; `validateSequence(r) → string[]` (erros).
- `class ChallengeSession { constructor(item, resolved, apoio:'acompanhado'|'padrao'|'desafio'); submit(raw:string[]): SubmitResult; nextHint(): string|null; attempts; hintsUsed; solved }`, `SubmitResult = {status:'correct'|'incorrect'|'invalid'; message:string; explanation?:string; autoHint?:string}`.
- `ContentRepository.pick(pool, rng, mode:'producao'|'homologacao') → Desafio | null`.
- [ ] Testes: modelo aritmético enumera só sequências com valores 0–1000, lacunas não nas duas primeiras posições, solução única; resposta `[" 12 ","18"]` é aceita; `["", "x"]` → `invalid` sem contar tentativa; após 1 erro no modo acompanhado vem `autoHint`; `nextHint` esgota após `maxHints` (3/3/2); repositório em `producao` não devolve item `em_revisao`; todos os JSON de `content/` passam no schema.

### Task 4: Fases em Tiled a partir de ASCII
**Files:** `levels/src/teste.txt`, `scripts/gen-levels.ts`, `src/levels/tiled.ts`, `public/levels/teste.tmj`, `tests/unit/levels.test.ts`
**Produces:** `asciiToTiled(ascii:string, opts) → TiledMap`; `getProp<T>(obj, name, fallback:T): T`; objetos do tipo `spawn | checkpoint | box | moving_platform | challenge | bridge_gap | goal`.
- [ ] Testes: `#` vira tile sólido, `S` vira objeto spawn em px, plataforma `M` recebe props `dx/dy/periodo`; desafio `?` recebe `pool` e `bridge`.

### Task 5: Cena de teste jogável
**Files:** `src/scenes/BootScene.ts`, `src/scenes/LevelScene.ts`, `src/player/Leo.ts`, `src/input/actions.ts`, `src/interactions/*.ts`, `src/challenges/mechanisms/Bridge.ts`, `src/challenges/ui/SequenceDialog.ts`, `src/ui/hud.ts`, `public/assets/**`
- [ ] Leo (SVG original) com animações parado/andar/pular/cair; câmera segue; queda → checkpoint.
- [ ] Caixa empurrável, plataforma móvel que carrega Leo, checkpoint com indicação visual + texto.
- [ ] Painel `?` + E abre diálogo HTML (role=dialog, foco preso, Esc fecha); acerto → ponte sobe e vira chão; erro → mensagem + dica.
- [ ] Gancho de teste `window.__leo` somente com `?teste=1`; `?fps=144` força taxa.

### Task 6: E2E, verificação visual, inventário e publicação
**Files:** `playwright.config.ts`, `tests/e2e/*.spec.ts`, `docs/inventario-assets.md`, `docs/relatorios/etapa-b.md`
- [ ] E2E: página sem erros no console; salto com altura igual em 60 e 144 fps (±1 px); fluxo teclado do desafio (resposta errada → dica; certa → ponte erguida); digitar no campo não move Leo; queda → respawn.
- [ ] Verificar no navegador embutido; publicar build de homologação; relatório da etapa.
