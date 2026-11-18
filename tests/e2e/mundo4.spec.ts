import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { EVID, TILE, holdUntil, open, openPanel, solvePanel, startLevel, state, teleport, playFases4e5 } from './helpers';

test('Mundo 4 (4º ano): jogar as 5 fases do Castelo e recuperar a Quarta Engrenagem', async ({ page }) => {
  test.setTimeout(420_000);
  const errors = await open(page);
  await page.getByRole('button', { name: /Jogar/ }).click();
  await page.getByRole('button', { name: 'Pular história' }).click();
  await page.getByRole('button', { name: /4º ano/ }).click();
  await expect(page.getByRole('heading', { name: 'Castelo das Estratégias' })).toBeVisible();
  await page.getByRole('button', { name: /fase 1,/ }).click();
  await page.waitForFunction(() => window.__leo!.levelActive());
  await page.waitForFunction(() => window.__leo!.state().onGround);
  await page.screenshot({ path: `${EVID}/f-01-castelo-fase1.png` });

  // Fase 1: porta (igualdade) e ponte (múltiplos)
  await openPanel(page, '1');
  await page.screenshot({ path: `${EVID}/f-02-igualdade.png` });
  await page.keyboard.press('Escape');
  await solvePanel(page, '1');
  await teleport(page, 26 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 30 * 32');
  await solvePanel(page, '2');
  await teleport(page, 55 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 64 * 32');
  let goal = (await page.evaluate(() => window.__leo!.points())).goal;
  await teleport(page, goal.x - 60, goal.y);
  await holdUntil(page, 'ArrowRight', 's.completed');
  await expect(page.getByRole('heading', { name: 'Fase 1 concluída!' })).toBeVisible();
  await expect(page.getByText(/Chaves douradas: \d+ de \d+/)).toBeVisible();
  await page.getByRole('button', { name: /Próxima fase/ }).click();
  await page.waitForFunction(() => window.__leo!.levelActive());
  await page.waitForFunction(() => window.__leo!.state().onGround);

  // Fase 2: elevador (gráfico) e escada (multiplicação/divisão)
  await openPanel(page, '1');
  await page.screenshot({ path: `${EVID}/f-03-grafico.png` });
  await page.keyboard.press('Escape');
  await solvePanel(page, '1');
  await teleport(page, 25 * TILE, 13 * TILE + 16);
  await page.waitForFunction(() => window.__leo!.state().y < 262, undefined, { timeout: 15_000 });
  await holdUntil(page, 'ArrowRight', 's.x > 28 * 32 && s.onGround');
  expect((await state(page)).y).toBeLessThanOrEqual(8 * TILE + 6);
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

  // Fase 3: ponte (fração), elevador (fração) e porta (igualdade)
  await openPanel(page, '1');
  await page.screenshot({ path: `${EVID}/f-04-fracao.png` });
  await page.keyboard.press('Escape');
  await solvePanel(page, '1');
  await teleport(page, 15 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 25 * 32');
  await solvePanel(page, '2');
  await teleport(page, 37 * TILE, 13 * TILE + 16);
  await page.waitForFunction(() => window.__leo!.state().y < 262, undefined, { timeout: 15_000 });
  await holdUntil(page, 'ArrowRight', 's.x > 40 * 32 && s.onGround');
  await solvePanel(page, '3');
  await teleport(page, 66 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 70 * 32');
  expect((await state(page)).respawns).toBe(0);
  goal = (await page.evaluate(() => window.__leo!.points())).goal;
  await teleport(page, goal.x - 60, goal.y);
  await holdUntil(page, 'ArrowRight', 's.completed');
  await expect(page.getByRole('heading', { name: 'Fase 3 concluída!' })).toBeVisible();
  await playFases4e5(page, 'amp-4');
  await page.getByRole('button', { name: /Mapa/ }).click();
  await expect(page.getByRole('heading', { name: 'Você recuperou a Quarta engrenagem!' })).toBeVisible();
  await page.screenshot({ path: `${EVID}/f-05-quarta-engrenagem.png` });

  const save = await page.evaluate(() => window.__leo!.save());
  expect(save.anos['4']!.pecaRecuperada).toBe(true);
  expect(save.conquistas).toContain('engrenagem-4');
  expect(errors).toEqual([]);
});

test('fração: marcar partes demais pede para marcar menos', async ({ page }) => {
  await open(page);
  await startLevel(page, 'f3', 4);
  const sol = (await page.evaluate(() => window.__leo!.solution('1')))!;
  if (sol.formato !== 'fracao') throw new Error('esperado fração');
  await openPanel(page, '1');
  const dialog = page.getByRole('dialog');
  for (let k = 1; k <= sol.partes + 1; k++) await dialog.getByRole('button', { name: `Parte ${k}`, exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Parte 1', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await dialog.getByRole('button', { name: 'Verificar' }).click();
  await expect(dialog.locator('.feedback')).toContainText('Marque menos');
});

test('gráfico: leitores de tela recebem os valores numa tabela', async ({ page }) => {
  await open(page);
  await startLevel(page, 'f2', 4);
  await openPanel(page, '1');
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('img', { name: /Gráfico de colunas/ })).toBeVisible();
  await expect(dialog.getByRole('table')).toHaveCount(1);
  expect(await dialog.getByRole('row').count()).toBeGreaterThan(2);
});

test('igualdade: resposta errada mostra o resultado que daria', async ({ page }) => {
  await open(page);
  await startLevel(page, 'f1', 4);
  await openPanel(page, '1');
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Número que falta' }).fill('1');
  await dialog.getByRole('button', { name: 'Verificar' }).click();
  await expect(dialog.locator('.feedback')).toContainText(/Com 1 no lugar do □|Isso!/);
});

test('janelas de fração, gráfico e igualdade sem violações WCAG A/AA detectáveis', async ({ page }) => {
  await open(page);
  for (const [fase, painel] of [
    ['f1', '1'],
    ['f2', '1'],
    ['f3', '1'],
  ] as const) {
    await startLevel(page, fase, 4);
    await openPanel(page, painel);
    await page.getByRole('dialog').getByRole('button', { name: 'Verificar' }).click();
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), `${fase}/${painel}`).toEqual([]);
    await page.keyboard.press('Escape');
  }
});
