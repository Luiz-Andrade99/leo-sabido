# Vidas por fase e enquadramento — plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa por tarefa. Os passos usam caixas de seleção (`- [ ]`).

**Objetivo:**
- 3 vidas por fase, com coletáveis "guardados" pelas bandeiras e recomeço que mantém os desafios.
- O jogo bem enquadrado em celular e tablet.

**Arquitetura:**
- A regra das vidas fica num módulo puro, testável sem Phaser: `src/core/vidas.ts`. A `LevelScene` só o consulta e aplica os efeitos: reaparecer, devolver coletáveis e recomeçar.
- O enquadramento troca a escala do Phaser para `EXPAND` e ajusta o zoom da câmera pela altura, para a fase mostrar sempre cerca de 540 px de altura do mundo.
- Uma camada HTML pede para girar o celular em pé.
- O CSS corrige a barra, os botões e os cartões dos desafios.

**Tecnologias:** Phaser 4.2.1, TypeScript, CSS, Vitest, Playwright (projetos `PW_DEVICES=1`).

**Especificação:** [docs/superpowers/specs/2026-11-19-vidas-e-enquadramento-design.md](../specs/2026-11-19-vidas-e-enquadramento-design.md)

## Restrições globais

- **3 vidas por fase.** Cair (`leo.y > worldBottom + 48`) gasta 1 vida.
- **Vidas sem limite quando `settings.modoAssistido`** estiver ligado no início da fase. A cena já lê `this.assist` em `create()`.
  - *Errata do desenho:* o seletor "Apoio" da barra (acompanhado, padrão ou desafio) é o apoio **dos desafios** e não mexe nas vidas. O modo assistido muda só ao recomeçar ou trocar de fase, como hoje.
- **Ao cair:** os coletáveis pegos depois da última bandeira ativada voltam para o lugar. O que foi pego antes de ativar uma bandeira fica salvo. Bandeira ativada continua ativada.
- **Vidas zeradas:** a fase recomeça na própria cena. Voltam ao estado inicial:
  - o Leo, no ponto de início;
  - o ponto de reaparecimento;
  - todos os coletáveis;
  - todas as bandeiras;
  - as caixas;
  - as 3 vidas.

  Mecanismos e desafios resolvidos **não** voltam ao estado inicial.
- **Errar desafio não custa vida.**
- **Textos:**
  - Queda: `Ops! Você caiu. Restam N vidas.` (ou `Resta 1 vida.`), mais ` Os cristais desde a última bandeira voltaram para o lugar.` quando algum voltou. Use o nome do coletável do tema, `this.theme.collectibleName[1]`.
  - Bandeira: `🚩 Bandeira! Seus {plural} estão guardados. Se cair, você volta para cá.`
  - Vidas zeradas, numa janela com `role="dialog"`:
    - título: `As vidas acabaram!`;
    - texto: `Vamos tentar de novo do começo da fase. Os desafios que você resolveu continuam abertos.`;
    - botão: `Recomeçar a fase`.
  - HUD: `❤️ 3`, com `aria-label` `3 vidas`; no modo assistido, `❤️ ∞`, com `aria-label` `vidas sem limite`.
  - Girar: `Vire o celular para jogar` e `O jogo continua quando a tela ficar deitada.`
- **Pedir para girar:** só durante uma fase, com `matchMedia('(orientation: portrait) and (max-width: 599px)')` **e** toque (`touchWanted`). Pausa a física e a entrada enquanto aparece.
- **Altura do mundo visível:** 540 px, igual a `GAME_HEIGHT`; os mapas têm 17 × 32 = 544 px. Largura visível mínima: 720 px do mundo. Com toque ativo no celular deitado, os botões não podem cobrir o Leo.

## Pontos de atenção na revisão

1. **Cair duas vezes seguidas muito rápido** (enquanto a animação de reaparecer ainda roda): deve gastar só 1 vida por queda. A cena já usa `this.respawning`, então teste que não cai duas vezes no mesmo buraco.
2. **Vidas zeradas com uma janela de desafio aberta ou durante a animação de reaparecer:** a janela de recomeço não pode abrir em cima de outra, nem duas vezes.
3. **Concluir a fase depois de recomeçar:** o resultado conta os coletáveis do Leo no fim, sem somar os da tentativa anterior.
4. **Girar o celular no meio de um pulo ou de um botão de toque apertado:** o Leo não pode continuar andando sozinho quando volta. Ao pausar, solte as teclas virtuais.
5. **Telas muito largas, como 21:9, ou tablet em pé:** a câmera não pode mostrar área fora do mapa como buraco preto. A área extra é preenchida pela cor de fundo do tema e a fase fica centralizada na vertical.

---

### Task 1: Regra das vidas (módulo puro)

**Arquivos:**
- Criar: `src/core/vidas.ts` e `tests/unit/vidas.test.ts`.

**Interfaces:**
- Produz:
  - `export class ControleVidas`, com:
    - `constructor(ilimitado: boolean, maximo = 3)`;
    - `get vidas(): number` — `Infinity` se ilimitado;
    - `coletou(id: number): void`;
    - `ativouBandeira(): void` — guarda tudo o que foi coletado até agora;
    - `caiu(): { resultado: 'reaparecer' | 'acabou'; devolver: number[] }` — os `id`s dos coletáveis que voltam para o lugar;
    - `recomecar(): { devolver: number[] }` — todos os coletados, inclusive os guardados; zera os guardados e volta a `maximo` vidas;
    - `get guardados(): ReadonlySet<number>`.
  - `export function textoQueda(vidas: number, voltaram: number, plural: string): string`.

- [ ] **Passo 1: testes que vão falhar** (`tests/unit/vidas.test.ts`):
  - `new ControleVidas(false).vidas === 3`; `new ControleVidas(true).vidas === Infinity`.
  - `coletou(1)`, `coletou(2)`, `ativouBandeira()`, `coletou(3)`, `caiu()` → `{ resultado: 'reaparecer', devolver: [3] }`, e `vidas === 2`.
  - Três quedas seguidas sem limite desligado: as duas primeiras dão `'reaparecer'`, a terceira dá `'acabou'`.
  - No ilimitado, 10 quedas dão sempre `'reaparecer'`, e `vidas` continua `Infinity`.
  - `recomecar()` depois de `coletou(1)`, `ativouBandeira()` e `coletou(2)` → `devolver` contém 1 e 2, `vidas === 3` e `guardados.size === 0`.
  - Textos de `textoQueda`:
    - `textoQueda(2, 1, 'cristais')` → `'Ops! Você caiu. Restam 2 vidas. Os cristais desde a última bandeira voltaram para o lugar.'`
    - `textoQueda(1, 0, 'cristais')` → `'Ops! Você caiu. Resta 1 vida.'`
    - `textoQueda(Infinity, 0, 'cristais')` → `'Opa! Vamos tentar de novo daqui.'`
- [ ] **Passo 2:** `npx vitest run tests/unit/vidas.test.ts`. Esperado: FALHA, porque o módulo não existe.
- [ ] **Passo 3:** implemente `src/core/vidas.ts`.
- [ ] **Passo 4:** `npm test`. Esperado: tudo passa.
- [ ] **Passo 5:** commit com a mensagem "Vidas: regra pura com bandeiras guardando coletáveis".

---

### Task 2: Vidas na fase (HUD, quedas, bandeiras e recomeço)

**Arquivos:**
- Modificar:
  - `src/interactions/objects.ts`: `Crystal.devolver()` e `Checkpoint.desativar()`;
  - `src/ui/hud.ts`: `setVidas(n: number)`;
  - `src/scenes/LevelScene.ts`;
  - `src/scenes/testHooks.ts` e `src/main.ts`: `state().vidas` e o gancho `cair()`, que leva o Leo para baixo do mundo;
  - `src/ui/styles.css`;
  - `tests/e2e/jogo.spec.ts`: o teste "cair num buraco…" passa a esperar a perda de vida e a devolução.
- Criar: `src/ui/recomeco.ts` (a janela de vidas zeradas).

**Interfaces:**
- Consome: `ControleVidas` e `textoQueda` da Task 1.
- Produz:
  - `Crystal.devolver(): void` — visível de novo, zona reativada e `collected = false`;
  - `Checkpoint.desativar(): void` — textura `bandeira-off` e `active = false`;
  - `setVidas(n: number): void`;
  - `abrirRecomeco(overlay: HTMLElement, aoRecomecar: () => void): { fechar(): void }`;
  - `LeoTestState.vidas: number` — `-1` quando ilimitado, porque `Infinity` não sobrevive ao JSON;
  - gancho de teste `cair(): void`.

- [ ] **Passo 1: testes E2E que vão falhar** (`tests/e2e/vidas.spec.ts`, novo):
  - `open(page)` e `startLevel('f1', 3)`: `state().vidas === 3`, e o HUD mostra `❤️ 3`.
  - **Bandeira guarda:**
    1. teleporte até o 1º coletável → `cristais === 1`;
    2. teleporte até a 1ª bandeira (`points().checkpoints[0]`, a expor se não existir) → a bandeira fica ativa;
    3. teleporte até o 2º coletável → `cristais === 2`;
    4. `cair()` → `vidas === 2`, `cristais === 1`, e o 2º coletável fica visível de novo (`points().crystals` com `coletado: false`).
  - **Vidas zeradas:** `cair()` três vezes, esperando `respawns` subir a cada uma.
    1. aparece um diálogo com `As vidas acabaram!`;
    2. clique em `Recomeçar a fase` → `vidas === 3`, `cristais === 0`, e o Leo perto de `points().spawn`;
    3. um painel resolvido antes (`solution` + verificação, como em `fluxo.spec.ts`) continua `activated`.
  - **Modo assistido:** com `modoAssistido` ligado, `state().vidas === -1`, o HUD mostra `❤️ ∞`, e 4 `cair()` não abrem o diálogo.
  - **Duas quedas no mesmo buraco:** chamar `cair()` duas vezes seguidas, sem esperar, gasta só 1 vida.
  - **Concluir depois de recomeçar:** recomeçar, pegar 1 coletável e ir até a saída. O `save()` da fase registra `cristais === 1`, mesmo que antes do recomeço houvesse 2.
- [ ] **Passo 2:** `npm run build && npx playwright test vidas --project=msedge`. Esperado: FALHA.
- [ ] **Passo 3: implemente.**
  - `create()` cria `this.vidas = new ControleVidas(this.assist)` e chama `setVidas`.
  - O overlap do coletável chama `coletou(indice)`; o da bandeira chama `ativouBandeira()` e anuncia o novo texto.
  - `respawn()`:
    - `const r = this.vidas.caiu()`;
    - para cada id de `r.devolver`, `crystals[id].devolver()`;
    - atualiza o HUD de coletáveis e de vidas;
    - anuncia `textoQueda`;
    - se `'acabou'`: desativa a entrada, abre `abrirRecomeco` e, ao recomeçar, chama `recomecarFase()`.
  - `recomecarFase()`:
    - devolve os coletáveis de `vidas.recomecar()`;
    - `desativar()` em todas as bandeiras e `resetHome()` em todas as caixas;
    - `respawnPoint = spawnPoint`, `leo.respawn(spawn)`, reativa a entrada e atualiza o HUD.
  - Guarda contra janela dupla: `this.recomecoAberto`.
- [ ] **Passo 4:** `npx playwright test vidas jogo fluxo --project=msedge`. Esperado: tudo passa; os testes de mundo seguem com 0 quedas.
- [ ] **Passo 5:** commit com a mensagem "Vidas na fase: HUD, bandeiras guardam coletáveis, recomeço mantém desafios".

---

### Task 3: Fase ocupando a tela (escala EXPAND e câmera)

**Arquivos:**
- Modificar:
  - `src/main.ts`: `scale: { mode: Phaser.Scale.EXPAND, autoCenter: Phaser.Scale.CENTER_BOTH }`;
  - `src/scenes/LevelScene.ts`: `ajustarCamera()` no `create` e em `this.scale.on('resize')`;
  - `src/scenes/MenuScene.ts`: o fundo cobre `this.scale.gameSize`;
  - `src/core/config.ts`: `ALTURA_VISIVEL = 540` e `LARGURA_MINIMA_VISIVEL = 720`.
- Teste: `tests/e2e/dispositivos.spec.ts`.

**Interfaces:**
- Produz:
  - `export function zoomCamera(largura: number, altura: number, reservaInferior: number): number` em `src/scenes/camera.ts`, com teste unitário. A fórmula é `min((altura - reservaInferior) / ALTURA_VISIVEL, largura / LARGURA_MINIMA_VISIVEL)`, nunca menor que 0,5.
  - Ganchos de teste:
    - `leoNaTela(): { x: number; y: number; w: number; h: number }`, o retângulo do Leo em pixels CSS da página;
    - `canvasRect()`.

- [ ] **Passo 1: testes que vão falhar.**
  - Unitários de `zoomCamera`:
    - `(2532/3, 1170/3, 0)` (iPhone deitado, CSS 844×390) → `390/540`;
    - `(1024, 768, 0)` → `min(768/540, 1024/720)`;
    - `(768, 1024, 0)` → `768/720`;
    - `(844, 390, 100)` → `290/540`.
  - Em `dispositivos.spec.ts`, para os projetos **deitados**: `canvasRect()` cobre a janela inteira (largura e altura ±2 px do `viewport`).
  - Em todos os projetos: o retângulo do Leo não cruza o retângulo de nenhum `.touch-btn`.
- [ ] **Passo 2:** `PW_DEVICES=1 npx playwright test dispositivos`. Esperado: FALHA (o canvas hoje fica com faixas).
- [ ] **Passo 3: implemente.**
  - Nas fases, `ajustarCamera()` calcula a reserva inferior: com toque ativo, a altura dos botões mais as margens, lida do DOM `#touch` em pixels de jogo.
  - Aplica `cameras.main.setZoom(z)` e ajusta o *follow offset* para manter a fase acima da reserva.
  - Quando o mundo visível é mais alto que o mapa, centraliza a fase na vertical, com a cor de fundo do tema.
  - Recalcula em `resize`.
- [ ] **Passo 4:** rode os testes do passo 2 e os unitários. Esperado: PASSA. Rode também `npx playwright test --project=msedge`: tudo passa, com o desktop 1280×720 sem mudança de jogabilidade.
- [ ] **Passo 5:** commit com a mensagem "Enquadramento: fase ocupa a tela e os botões não cobrem o Leo".

---

### Task 4: "Vire o celular" e barra do topo compacta

**Arquivos:**
- Criar: `src/ui/girar.ts` e `tests/unit/girar.test.ts`.
- Modificar:
  - `src/scenes/LevelScene.ts`: pausar e retomar;
  - `src/ui/hud.ts`: o botão de pausa ganha `<span class="hud-pause-texto">Pausar (Esc)</span>`, que some em telas baixas;
  - `src/ui/styles.css`: `#apoio` legível e a camada de girar;
  - `tests/e2e/dispositivos.spec.ts`.

**Interfaces:**
- Produz:
  - `export function precisaGirar(retrato: boolean, larguraCss: number, toque: boolean): boolean`, verdadeiro só quando `retrato && larguraCss < 600 && toque`;
  - `export function montarGirar(onMudar: (precisa: boolean) => void): () => void`, que cria a camada `#girar`, ouve `matchMedia` e `resize`, e devolve a função de desmontar.

- [ ] **Passo 1: testes que vão falhar.**
  - Unitários de `precisaGirar`:
    - `(true, 390, true)` → `true`;
    - `(true, 820, true)` → `false` (tablet em pé);
    - `(false, 844, true)` → `false`;
    - `(true, 390, false)` → `false`.
  - E2E em `dispositivos.spec.ts`:
    - nos projetos `*-retrato` de celular, depois de entrar na fase, `#girar` fica visível com "Vire o celular para jogar", e `state().x` não muda ao segurar ▶ por 500 ms;
    - nos projetos deitados e no `ipad-retrato`, `#girar` fica oculto;
    - em todos, a cor do texto do `#apoio` tem contraste ≥ 4,5 com o fundo (o axe já cobre; confirme que não há violação de `color-contrast` na barra).
- [ ] **Passo 2:** rode e confirme que falha.
- [ ] **Passo 3: implemente.**
  - A camada fica em `#overlay` e tem a ilustração `assets/leo/leo-think.svg`.
  - Enquanto aparece, `this.physics.pause()`, `this.input_.setEnabled(false)` e as teclas virtuais são soltas. Ao sumir, tudo é retomado.
  - Monte em `create()` e desmonte no `SHUTDOWN`.
  - Para o `#apoio`: `color: var(--paper)` e `background: var(--cave-2)` no `select` e nas `option`s.
- [ ] **Passo 4:** `PW_DEVICES=1 npx playwright test dispositivos` e `npm test`. Esperado: PASSA.
- [ ] **Passo 5:** commit com a mensagem "Celular em pé pede para girar; barra do topo legível e compacta".

---

### Task 5: Janela de desafio sem vazamento

**Arquivos:**
- Modificar: `src/ui/styles.css` (`.opts`, `.opt`, as figuras de "escolha por imagem" e `.dlg`), e talvez `src/challenges/formats/*`, se as figuras tiverem largura fixa.
- Teste: `tests/e2e/dispositivos.spec.ts`.

**Interfaces:**
- Produz o gancho de teste `vazamentosDialogo(): string[]`. Para cada `.opt` e `.ord-card` dentro de `[role=dialog]`, lista os descendentes cujo `getBoundingClientRect()` passa da borda interna do cartão em mais de 1 px. Também lista o próprio `.dlg`, se ultrapassar a janela na horizontal.

- [ ] **Passo 1: teste que vai falhar.** Em `dispositivos.spec.ts`, para os 7 projetos, abra um desafio de "escolha por imagem" do 1º ano com 6 ou mais figuras: na fase `f1` do 1º ano, um painel cujo `solution` tem `formato: 'escolha'`. O teste espera `vazamentosDialogo()` vazio.
- [ ] **Passo 2:** rode e confirme que FALHA nos celulares em pé, reproduzindo a foto do usuário.
- [ ] **Passo 3: implemente.**
  - As figuras dentro do cartão quebram linha (`flex-wrap: wrap`), com largura em `em` relativa ao cartão e `max-width: 100%`.
  - Abaixo de 420 px de largura, `.opts` vira uma coluna.
  - `.dlg` ganha `max-height: 100dvh`, rola por dentro, e os botões de ação ficam `position: sticky` embaixo.
- [ ] **Passo 4:** `PW_DEVICES=1 npx playwright test dispositivos` e `npx playwright test --project=msedge`. Esperado: PASSA; as capturas `disp-*` são atualizadas.
- [ ] **Passo 5:** commit com a mensagem "Desafios: figuras nunca vazam dos cartões em telas pequenas".

---

### Task 6: Documentação e verificação final

**Arquivos:**
- Modificar:
  - `docs/gdd/gdd.md` — linha 115, "Não há: … vidas", e o pilar da linha 8: as vidas valem para quedas, "zero punição" vale para a matemática;
  - `CHANGELOG.md` (0.11.0-alpha.1) e `package.json` (versão);
  - `docs/testes/roteiro-testes-manuais.md` — itens de vidas e de girar.
- Criar: `docs/relatorios/vidas-e-enquadramento.md`, com as capturas antes e depois, de `docs/relatorios/evidencias/disp-*`.

- [ ] **Passo 1:** escreva a documentação.
- [ ] **Passo 2:** `npm test`, `npx playwright test --project=msedge`, `PW_DEVICES=1 npx playwright test dispositivos` e `PW_ALL_ENGINES=1 npx playwright test vidas voz-faber --project=webkit`. Esperado: tudo passa.
- [ ] **Passo 3:** commit com a mensagem "Docs: vidas e enquadramento".
