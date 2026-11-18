import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { EVID, TILE, holdUntil, open, openPanel, solvePanel, startLevel, state, teleport, playFases4e5 } from './helpers';

test('Mundo 2 (2º ano): escolher o ano, jogar as 5 fases da Vila e recuperar a Segunda Engrenagem', async ({ page }) => {
  test.setTimeout(420_000);
  const errors = await open(page);
  await page.getByRole('button', { name: /Jogar/ }).click();
  await page.getByRole('button', { name: 'Pular história' }).click();
  await page.getByRole('button', { name: /2º ano/ }).click();
  await expect(page.getByRole('heading', { name: 'Vila das Descobertas' })).toBeVisible();
  await page.screenshot({ path: `${EVID}/e-01-mapa-vila.png` });
  await page.getByRole('button', { name: /fase 1,/ }).click();
  await page.waitForFunction(() => window.__leo!.levelActive());
  await page.waitForFunction(() => window.__leo!.state().onGround);
  await page.screenshot({ path: `${EVID}/e-02-vila-fase1.png` });

  // Fase 1: porta (problema) e ponte (sequência)
  await solvePanel(page, '1');
  await teleport(page, 32 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 36 * 32');
  await solvePanel(page, '2');
  await teleport(page, 59 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 68 * 32');
  let goal = (await page.evaluate(() => window.__leo!.points())).goal;
  await teleport(page, goal.x - 60, goal.y);
  await holdUntil(page, 'ArrowRight', 's.completed');
  await expect(page.getByRole('heading', { name: 'Fase 1 concluída!' })).toBeVisible();
  await expect(page.getByText(/Parafusos dourados: \d+ de \d+/)).toBeVisible();
  await page.getByRole('button', { name: /Próxima fase/ }).click();
  await page.waitForFunction(() => window.__leo!.levelActive());
  await page.waitForFunction(() => window.__leo!.state().onGround);

  // Fase 2: elevador (dinheiro) e escada (valor posicional)
  await openPanel(page, '1');
  await page.screenshot({ path: `${EVID}/e-03-dinheiro.png` });
  await page.keyboard.press('Escape');
  await solvePanel(page, '1');
  await teleport(page, 25 * TILE, 13 * TILE + 16);
  await page.waitForFunction(() => window.__leo!.state().y < 262, undefined, { timeout: 15_000 });
  await holdUntil(page, 'ArrowRight', 's.x > 28 * 32 && s.onGround');
  expect((await state(page)).y).toBeLessThanOrEqual(8 * TILE + 6);
  await openPanel(page, '2');
  await page.screenshot({ path: `${EVID}/e-04-posicional.png` });
  await page.keyboard.press('Escape');
  await solvePanel(page, '2');
  await teleport(page, 57 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 65 * 32 && s.y <= 9 * 32 + 6', 15_000, true);
  goal = (await page.evaluate(() => window.__leo!.points())).goal;
  await teleport(page, goal.x - 60, goal.y);
  await holdUntil(page, 'ArrowRight', 's.completed');
  await expect(page.getByRole('heading', { name: 'Fase 2 concluída!' })).toBeVisible();
  await page.getByRole('button', { name: /Próxima fase/ }).click();
  await page.waitForFunction(() => window.__leo!.levelActive());
  await page.waitForFunction(() => window.__leo!.state().onGround);

  // Fase 3: elevador (relógio), porta (dobro/metade) e ponte (sequência)
  await openPanel(page, '1');
  await page.screenshot({ path: `${EVID}/e-05-relogio.png` });
  await page.keyboard.press('Escape');
  await solvePanel(page, '1');
  await teleport(page, 21 * TILE, 13 * TILE + 16);
  await page.waitForFunction(() => window.__leo!.state().y < 262, undefined, { timeout: 15_000 });
  await holdUntil(page, 'ArrowRight', 's.x > 24 * 32 && s.onGround');
  await solvePanel(page, '2');
  await teleport(page, 48 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 52 * 32');
  await solvePanel(page, '3');
  await teleport(page, 71 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 81 * 32');
  expect((await state(page)).respawns).toBe(0);
  goal = (await page.evaluate(() => window.__leo!.points())).goal;
  await teleport(page, goal.x - 60, goal.y);
  await holdUntil(page, 'ArrowRight', 's.completed');
  await expect(page.getByRole('heading', { name: 'Fase 3 concluída!' })).toBeVisible();
  await playFases4e5(page, 'amp-2');
  await page.getByRole('button', { name: /Mapa/ }).click();
  await expect(page.getByRole('heading', { name: 'Você recuperou a Segunda engrenagem!' })).toBeVisible();
  await page.screenshot({ path: `${EVID}/e-06-segunda-engrenagem.png` });

  const save = await page.evaluate(() => window.__leo!.save());
  expect(save.anos['2']!.pecaRecuperada).toBe(true);
  expect(save.conquistas).toContain('engrenagem-2');
  expect(save.anos['3']).toBeUndefined(); // progresso de cada ano é separado
  expect(errors).toEqual([]);
});

test('dinheiro: valor errado diz quanto falta', async ({ page }) => {
  await open(page);
  await startLevel(page, 'f2', 2);
  await openPanel(page, '1');
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: /^Pôr uma moeda de R\$ 1/ }).click();
  await dialog.getByRole('button', { name: 'Verificar' }).click();
  await expect(dialog.locator('.feedback')).toContainText(/faltam R\$/);
});

test('valor posicional: outra composição correta também é aceita', async ({ page }) => {
  await open(page);
  await startLevel(page, 'f2', 2);
  const sol = (await page.evaluate(() => window.__leo!.solution('2')))!;
  if (sol.formato !== 'posicional') throw new Error('esperado posicional');
  await openPanel(page, '2');
  const dialog = page.getByRole('dialog');
  // Troca uma dezena por 10 unidades quando possível (ex.: 34 = 2 dezenas + 14 unidades).
  const [d, u] = sol.d > 0 && sol.u <= 9 ? [sol.d - 1, sol.u + 10] : [sol.d, sol.u];
  for (const [n, nome] of [[sol.c, 'centena'], [d, 'dezena'], [u, 'unidade']] as const) {
    for (let k = 0; k < n; k++) await dialog.getByRole('button', { name: new RegExp(`^Uma ${nome} a mais`) }).click();
  }
  await dialog.getByRole('button', { name: 'Verificar' }).click();
  await expect(dialog.locator('.feedback')).toContainText(/Isso!/);
});

test('relógio: marcar antes do fim diz quanto ainda falta', async ({ page }) => {
  await open(page);
  await startLevel(page, 'f3', 2);
  await openPanel(page, '1');
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Mais 30 min' }).click();
  await dialog.getByRole('button', { name: 'Verificar' }).click();
  await expect(dialog.locator('.feedback')).toContainText(/ainda faltam|Isso!/);
});

test('janelas dos novos formatos sem violações WCAG A/AA detectáveis', async ({ page }) => {
  await open(page);
  for (const [fase, painel] of [
    ['f2', '1'],
    ['f2', '2'],
    ['f3', '1'],
  ] as const) {
    await startLevel(page, fase, 2);
    await openPanel(page, painel);
    await page.getByRole('dialog').getByRole('button', { name: 'Verificar' }).click();
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), `${fase}/${painel}`).toEqual([]);
    await page.keyboard.press('Escape');
  }
});
