import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { EVID, TILE, holdUntil, open, openPanel, solvePanel, startLevel, state, teleport, playFases4e5 } from './helpers';

test('Mundo 5 (5º ano): jogar as 5 fases da Cidade e recuperar a Quinta Engrenagem', async ({ page }) => {
  test.setTimeout(420_000);
  const errors = await open(page);
  await page.getByRole('button', { name: /Jogar/ }).click();
  await page.getByRole('button', { name: 'Pular história' }).click();
  await page.getByRole('button', { name: /5º ano/ }).click();
  await expect(page.getByRole('heading', { name: 'Cidade dos Inventores' })).toBeVisible();
  await page.getByRole('button', { name: /fase 1,/ }).click();
  await page.waitForFunction(() => window.__leo!.levelActive());
  await page.waitForFunction(() => window.__leo!.state().onGround);
  await page.screenshot({ path: `${EVID}/g-01-cidade-fase1.png` });

  // Fase 1: porta (decimal) e ponte (porcentagem)
  await openPanel(page, '1');
  await page.screenshot({ path: `${EVID}/g-02-decimal.png` });
  await page.keyboard.press('Escape');
  await solvePanel(page, '1');
  await teleport(page, 26 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 30 * 32');
  await openPanel(page, '2');
  await page.screenshot({ path: `${EVID}/g-03-porcentagem.png` });
  await page.keyboard.press('Escape');
  await solvePanel(page, '2');
  await teleport(page, 55 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 64 * 32');
  let goal = (await page.evaluate(() => window.__leo!.points())).goal;
  await teleport(page, goal.x - 60, goal.y);
  await holdUntil(page, 'ArrowRight', 's.completed');
  await expect(page.getByRole('heading', { name: 'Fase 1 concluída!' })).toBeVisible();
  await expect(page.getByText(/Lâmpadas: \d+ de \d+/)).toBeVisible();
  await page.getByRole('button', { name: /Próxima fase/ }).click();
  await page.waitForFunction(() => window.__leo!.levelActive());
  await page.waitForFunction(() => window.__leo!.state().onGround);

  // Fase 2: elevador (gráfico) e plataforma (área e perímetro)
  await solvePanel(page, '1');
  await teleport(page, 25 * TILE, 13 * TILE + 16);
  await page.waitForFunction(() => window.__leo!.state().y < 262, undefined, { timeout: 15_000 });
  await holdUntil(page, 'ArrowRight', 's.x > 28 * 32 && s.onGround');
  expect((await state(page)).y).toBeLessThanOrEqual(8 * TILE + 6);
  await openPanel(page, '2');
  await page.screenshot({ path: `${EVID}/g-04-area.png` });
  await page.keyboard.press('Escape');
  await solvePanel(page, '2');
  await teleport(page, 55 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 63 * 32 && s.y <= 9 * 32 + 6', 15_000, true);
  goal = (await page.evaluate(() => window.__leo!.points())).goal;
  await teleport(page, goal.x - 60, goal.y);
  await holdUntil(page, 'ArrowRight', 's.completed');
  await expect(page.getByRole('heading', { name: 'Fase 2 concluída!' })).toBeVisible();
  await page.getByRole('button', { name: /Próxima fase/ }).click();
  await page.waitForFunction(() => window.__leo!.levelActive());
  await page.waitForFunction(() => window.__leo!.state().onGround);

  // Fase 3: elevador (porcentagem), porta (problema) e ponte (decimal)
  await solvePanel(page, '1');
  await teleport(page, 19 * TILE, 13 * TILE + 16);
  await page.waitForFunction(() => window.__leo!.state().y < 262, undefined, { timeout: 15_000 });
  await holdUntil(page, 'ArrowRight', 's.x > 22 * 32 && s.onGround');
  await solvePanel(page, '2');
  await teleport(page, 48 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 52 * 32');
  await solvePanel(page, '3');
  await teleport(page, 61 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 71 * 32');
  expect((await state(page)).respawns).toBe(0);
  goal = (await page.evaluate(() => window.__leo!.points())).goal;
  await teleport(page, goal.x - 60, goal.y);
  await holdUntil(page, 'ArrowRight', 's.completed');
  await expect(page.getByRole('heading', { name: 'Fase 3 concluída!' })).toBeVisible();
  await playFases4e5(page, 'amp-5');
  await page.getByRole('button', { name: /Mapa/ }).click();
  await expect(page.getByRole('heading', { name: 'Você recuperou a Quinta engrenagem!' })).toBeVisible();
  await page.screenshot({ path: `${EVID}/g-05-quinta-engrenagem.png` });

  const save = await page.evaluate(() => window.__leo!.save());
  expect(save.anos['5']!.pecaRecuperada).toBe(true);
  expect(save.conquistas).toContain('engrenagem-5');
  expect(errors).toEqual([]);
});

test('área e perímetro: mesma área com outro perímetro é recusada com explicação', async ({ page }) => {
  await open(page);
  await startLevel(page, 'f2', 5);
  await openPanel(page, '2');
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Mais comprimento' }).click();
  await dialog.getByRole('button', { name: 'Verificar' }).click();
  await expect(dialog.locator('.feedback')).toContainText(/a área é 2|Isso!/);
});

test('porcentagem: carga baixa diz quanto falta', async ({ page }) => {
  await open(page);
  await startLevel(page, 'f1', 5);
  await openPanel(page, '2');
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Mais 1', exact: true }).click();
  await dialog.getByRole('button', { name: 'Verificar' }).click();
  await expect(dialog.locator('.feedback')).toContainText(/faltam|Isso!/);
});

test('janelas de porcentagem, decimal e área sem violações WCAG A/AA detectáveis', async ({ page }) => {
  await open(page);
  for (const [fase, painel] of [
    ['f1', '1'],
    ['f1', '2'],
    ['f2', '2'],
  ] as const) {
    await startLevel(page, fase, 5);
    await openPanel(page, painel);
    await page.getByRole('dialog').getByRole('button', { name: 'Verificar' }).click();
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), `${fase}/${painel}`).toEqual([]);
    await page.keyboard.press('Escape');
  }
});
