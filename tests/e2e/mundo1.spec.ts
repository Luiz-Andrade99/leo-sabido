import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { EVID, TILE, holdUntil, open, openPanel, solvePanel, startLevel, state, teleport, playFases4e5 } from './helpers';

test('Mundo 1 (1º ano): jogar as 5 fases da Floresta só tocando nas respostas e recuperar a Primeira Engrenagem', async ({ page }) => {
  test.setTimeout(420_000);
  const errors = await open(page);
  await page.getByRole('button', { name: /Jogar/ }).click();
  await page.getByRole('button', { name: 'Pular história' }).click();
  await page.getByRole('button', { name: /1º ano/ }).click();
  await expect(page.getByRole('heading', { name: 'Floresta dos Números' })).toBeVisible();
  await page.getByRole('button', { name: /fase 1,/ }).click();
  await page.waitForFunction(() => window.__leo!.levelActive());
  await page.waitForFunction(() => window.__leo!.state().onGround);
  await page.screenshot({ path: `${EVID}/i-01-floresta-fase1.png` });

  // Fase 1: ponte (contagem) e porta (figuras)
  await openPanel(page, '1');
  await expect(page.getByRole('dialog').locator('.opt')).toHaveCount(3);
  await page.screenshot({ path: `${EVID}/i-02-contagem.png` });
  await page.keyboard.press('Escape');
  await solvePanel(page, '1');
  await teleport(page, 22 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 30 * 32');
  await openPanel(page, '2');
  await page.screenshot({ path: `${EVID}/i-03-figuras.png` });
  await page.keyboard.press('Escape');
  await solvePanel(page, '2');
  await teleport(page, 42 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 46 * 32');
  let goal = (await page.evaluate(() => window.__leo!.points())).goal;
  await teleport(page, goal.x - 60, goal.y);
  await holdUntil(page, 'ArrowRight', 's.completed');
  await expect(page.getByRole('heading', { name: 'Fase 1 concluída!' })).toBeVisible();
  await expect(page.getByText(/Bolotas: \d+ de \d+/)).toBeVisible();
  await page.getByRole('button', { name: /Próxima fase/ }).click();
  await page.waitForFunction(() => window.__leo!.levelActive());
  await page.waitForFunction(() => window.__leo!.state().onGround);

  // Fase 2: elevador (comparar) e escada (juntar/tirar)
  await solvePanel(page, '1');
  await teleport(page, 21 * TILE, 13 * TILE + 16);
  await page.waitForFunction(() => window.__leo!.state().y < 262, undefined, { timeout: 15_000 });
  await holdUntil(page, 'ArrowRight', 's.x > 24 * 32 && s.onGround');
  expect((await state(page)).y).toBeLessThanOrEqual(8 * TILE + 6);
  await openPanel(page, '2');
  await page.screenshot({ path: `${EVID}/i-04-somar.png` });
  await page.keyboard.press('Escape');
  await solvePanel(page, '2');
  await teleport(page, 47 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 55 * 32 && s.y <= 9 * 32 + 6', 15_000, true);
  goal = (await page.evaluate(() => window.__leo!.points())).goal;
  await teleport(page, goal.x - 60, goal.y);
  await holdUntil(page, 'ArrowRight', 's.completed');
  await expect(page.getByRole('heading', { name: 'Fase 2 concluída!' })).toBeVisible();
  await page.getByRole('button', { name: /Próxima fase/ }).click();
  await page.waitForFunction(() => window.__leo!.levelActive());
  await page.waitForFunction(() => window.__leo!.state().onGround);

  // Fase 3: ponte (padrão), elevador (contagem) e porta (juntar/tirar)
  await openPanel(page, '1');
  await page.screenshot({ path: `${EVID}/i-05-padrao.png` });
  await page.keyboard.press('Escape');
  await solvePanel(page, '1');
  await teleport(page, 13 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 22 * 32');
  await solvePanel(page, '2');
  await teleport(page, 35 * TILE, 13 * TILE + 16);
  await page.waitForFunction(() => window.__leo!.state().y < 262, undefined, { timeout: 15_000 });
  await holdUntil(page, 'ArrowRight', 's.x > 38 * 32 && s.onGround');
  await solvePanel(page, '3');
  await teleport(page, 62 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 66 * 32');
  expect((await state(page)).respawns).toBe(0);
  goal = (await page.evaluate(() => window.__leo!.points())).goal;
  await teleport(page, goal.x - 60, goal.y);
  await holdUntil(page, 'ArrowRight', 's.completed');
  await expect(page.getByRole('heading', { name: 'Fase 3 concluída!' })).toBeVisible();
  await playFases4e5(page, 'amp-1');
  await page.getByRole('button', { name: /Mapa/ }).click();
  await expect(page.getByRole('heading', { name: 'Você recuperou a Primeira engrenagem!' })).toBeVisible();
  await page.screenshot({ path: `${EVID}/i-06-primeira-engrenagem.png` });

  const save = await page.evaluate(() => window.__leo!.save());
  expect(save.anos['1']!.pecaRecuperada).toBe(true);
  expect(save.conquistas).toContain('engrenagem-1');
  expect(errors).toEqual([]);
});

test('toque errado marca ✗ e permite tentar de novo sem digitar nada', async ({ page }) => {
  await open(page);
  await startLevel(page, 'f1', 1);
  const sol = (await page.evaluate(() => window.__leo!.solution('1')))!;
  if (sol.formato !== 'escolha') throw new Error('esperado escolha');
  await openPanel(page, '1');
  const dialog = page.getByRole('dialog');
  await dialog.locator('.opt').nth((sol.indice + 1) % 3).click();
  await expect(dialog.locator('.feedback')).toContainText('Ainda não');
  await expect(dialog.locator('.mark.err')).toHaveCount(1);
  await dialog.locator('.opt').nth(sol.indice).click();
  await expect(dialog.locator('.feedback')).toContainText('Muito bem');
  await expect(dialog.getByRole('textbox')).toHaveCount(0);
});

test('ordenar: ordem errada marca as posições e "Limpar" deixa tentar de novo', async ({ page }) => {
  await open(page);
  await startLevel(page, 'f4', 1);
  const sol = (await page.evaluate(() => window.__leo!.solution('2')))!;
  if (sol.formato !== 'ordenar') throw new Error('esperado ordenar');
  await openPanel(page, '2');
  const dialog = page.getByRole('dialog');
  await page.screenshot({ path: `${EVID}/amp-ordenar.png` });
  for (const i of [...sol.ordem].reverse()) await dialog.locator('.ord-card').nth(i).click();
  await expect(dialog.locator('.feedback')).toContainText('Ainda não');
  await expect(dialog.locator('.ord-slot.err').first()).toBeVisible();
  await dialog.getByRole('button', { name: 'Limpar' }).click();
  for (const i of sol.ordem) await dialog.locator('.ord-card').nth(i).click();
  await expect(dialog.locator('.feedback')).toContainText('Muito bem');
  await expect(dialog.getByRole('textbox')).toHaveCount(0);
});

test('janelas do 1º ano sem violações WCAG A/AA detectáveis', async ({ page }) => {
  await open(page);
  for (const [fase, painel] of [
    ['f1', '1'],
    ['f1', '2'],
    ['f2', '1'],
    ['f3', '1'],
    ['f4', '2'],
  ] as const) {
    await startLevel(page, fase, 1);
    await openPanel(page, painel);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), `${fase}/${painel}`).toEqual([]);
    await page.keyboard.press('Escape');
  }
});
