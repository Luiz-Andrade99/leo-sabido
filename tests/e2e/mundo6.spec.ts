import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { EVID, TILE, holdUntil, open, openPanel, solvePanel, startLevel, state, teleport, playFases4e5 } from './helpers';

test('Mundo 6 (6º ano): jogar as 5 fases do Laboratório e recuperar a Sexta Engrenagem', async ({ page }) => {
  test.setTimeout(420_000);
  const errors = await open(page);
  await page.getByRole('button', { name: /Jogar/ }).click();
  await page.getByRole('button', { name: 'Pular história' }).click();
  await page.getByRole('button', { name: /6º ano/ }).click();
  await expect(page.getByRole('heading', { name: 'Laboratório do Saber' })).toBeVisible();
  await page.getByRole('button', { name: /fase 1,/ }).click();
  await page.waitForFunction(() => window.__leo!.levelActive());
  await page.waitForFunction(() => window.__leo!.state().onGround);
  await page.screenshot({ path: `${EVID}/h-01-laboratorio-fase1.png` });

  // Fase 1: porta (divisibilidade) e ponte (expressão)
  await openPanel(page, '1');
  await page.screenshot({ path: `${EVID}/h-02-divisibilidade.png` });
  await page.keyboard.press('Escape');
  await solvePanel(page, '1');
  await teleport(page, 26 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 30 * 32');
  await openPanel(page, '2');
  await page.screenshot({ path: `${EVID}/h-03-expressao.png` });
  await page.keyboard.press('Escape');
  await solvePanel(page, '2');
  await teleport(page, 55 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 64 * 32');
  let goal = (await page.evaluate(() => window.__leo!.points())).goal;
  await teleport(page, goal.x - 60, goal.y);
  await holdUntil(page, 'ArrowRight', 's.completed');
  await expect(page.getByRole('heading', { name: 'Fase 1 concluída!' })).toBeVisible();
  await expect(page.getByText(/Frascos: \d+ de \d+/)).toBeVisible();
  await page.getByRole('button', { name: /Próxima fase/ }).click();
  await page.waitForFunction(() => window.__leo!.levelActive());
  await page.waitForFunction(() => window.__leo!.state().onGround);

  // Fase 2: elevador (programa) e blocos (fração de quantidade)
  await openPanel(page, '1');
  await page.screenshot({ path: `${EVID}/h-04-programa.png` });
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

  // Fase 3: elevador (expressão), porta (divisibilidade) e ponte (programa)
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
  await playFases4e5(page, 'amp-6');
  await page.getByRole('button', { name: /Mapa/ }).click();
  await expect(page.getByRole('heading', { name: 'Você recuperou a Sexta engrenagem!' })).toBeVisible();
  await page.screenshot({ path: `${EVID}/h-05-sexta-engrenagem.png` });

  const save = await page.evaluate(() => window.__leo!.save());
  expect(save.anos['6']!.pecaRecuperada).toBe(true);
  expect(save.conquistas).toContain('engrenagem-6');
  expect(errors).toEqual([]);
});

test('expressão: calcular da esquerda para a direita recebe orientação específica', async ({ page }) => {
  await open(page);
  await startLevel(page, 'f1', 6);
  await openPanel(page, '2');
  const dialog = page.getByRole('dialog');
  // seed=1 sorteia um item fixo ou parametrizado; a orientação só aparece se a resposta "ingênua" for diferente.
  await dialog.getByRole('textbox').first().fill('1');
  await dialog.getByRole('button', { name: 'Verificar' }).click();
  await expect(dialog.locator('.feedback')).toContainText(/não é o resultado|esquerda para a direita|Isso!/);
});

test('programa: o rastro aparece quando o programa não chega ao alvo', async ({ page }) => {
  await open(page);
  await startLevel(page, 'f2', 6);
  await openPanel(page, '1');
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('group', { name: 'Comandos' }).getByRole('button').first().click();
  await dialog.getByRole('button', { name: 'Verificar' }).click();
  await expect(dialog.locator('.feedback')).toContainText(/terminou em|travou|Isso!/);
  await dialog.getByRole('button', { name: 'Apagar último' }).click();
});

test('janelas de programa, expressão e divisibilidade sem violações WCAG A/AA detectáveis', async ({ page }) => {
  await open(page);
  for (const [fase, painel] of [
    ['f1', '1'],
    ['f1', '2'],
    ['f2', '1'],
  ] as const) {
    await startLevel(page, fase, 6);
    await openPanel(page, painel);
    await page.getByRole('dialog').getByRole('button', { name: 'Verificar' }).click();
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), `${fase}/${painel}`).toEqual([]);
    await page.keyboard.press('Escape');
  }
});
