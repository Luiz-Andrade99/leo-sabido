import { expect, test, type Page } from '@playwright/test';
import { open, solvePanel, startLevel, state, steps, teleport } from './helpers';

/** Leva o Leo até o coletável de índice i e espera ser coletado. */
async function pegar(page: Page, i: number): Promise<void> {
  const antes = (await state(page)).cristais;
  const c = (await page.evaluate(() => window.__leo!.points())).crystals[i]!;
  await teleport(page, c.x, c.y + 20);
  await page.waitForFunction((n) => window.__leo!.state().cristais > n, antes);
}

/** Faz o Leo cair e espera o reaparecimento terminar. */
async function cair(page: Page): Promise<void> {
  const antes = (await state(page)).respawns;
  await page.evaluate(() => window.__leo!.cair());
  await page.waitForFunction((n) => window.__leo!.state().respawns > n, antes);
  await steps(page, 30);
}

test.describe('vidas por fase', () => {
  test('a fase começa com 3 vidas no HUD', async ({ page }) => {
    await open(page);
    await startLevel(page, 'f1');
    expect((await state(page)).vidas).toBe(3);
    await expect(page.locator('.hud-vidas')).toHaveText('❤️ 3');
    await expect(page.locator('.hud-vidas')).toHaveAttribute('aria-label', '3 vidas');
  });

  test('ao cair, só os coletáveis pegos depois da última bandeira voltam', async ({ page }) => {
    await open(page);
    await startLevel(page, 'f1');
    await pegar(page, 0);
    const b = (await page.evaluate(() => window.__leo!.points())).checkpoints[0]!;
    await teleport(page, b.x, b.y);
    await page.waitForFunction(() => window.__leo!.points().checkpoints[0]!.ativa);
    await pegar(page, 2);
    expect((await state(page)).cristais).toBe(2);
    await cair(page);
    const s = await state(page);
    expect(s.vidas).toBe(2);
    expect(s.cristais).toBe(1);
    const pontos = await page.evaluate(() => window.__leo!.points());
    expect(pontos.crystals[0]!.coletado).toBe(true);
    expect(pontos.crystals[2]!.coletado).toBe(false);
    await expect(page.locator('.hud-vidas')).toHaveText('❤️ 2');
  });

  test('duas quedas seguidas no mesmo buraco gastam só uma vida', async ({ page }) => {
    await open(page);
    await startLevel(page, 'f1');
    await page.evaluate(() => {
      window.__leo!.cair();
      window.__leo!.cair();
    });
    await page.waitForFunction(() => window.__leo!.state().respawns >= 1);
    await steps(page, 60);
    expect((await state(page)).vidas).toBe(2);
  });

  test('vidas zeradas: a fase recomeça e os desafios resolvidos continuam abertos', async ({ page }) => {
    await open(page);
    await startLevel(page, 'f1');
    await solvePanel(page, '1');
    await pegar(page, 0);
    for (let i = 0; i < 3; i++) await cair(page);
    const dlg = page.getByRole('dialog');
    await expect(dlg).toContainText('As vidas acabaram!');
    await expect(dlg).toContainText('Os desafios que você resolveu continuam abertos.');
    await dlg.getByRole('button', { name: 'Recomeçar a fase' }).click();
    await expect(dlg).toBeHidden();
    const s = await state(page);
    const pontos = await page.evaluate(() => window.__leo!.points());
    expect(s.vidas).toBe(3);
    expect(s.cristais).toBe(0);
    expect(Math.abs(s.x - pontos.spawn.x)).toBeLessThan(8);
    expect(s.panels.find((p) => p.painel === '1')!.activated).toBe(true);
    expect(pontos.checkpoints.every((c) => !c.ativa)).toBe(true);
  });

  test('com a janela de vidas zeradas aberta, Esc não abre a pausa por cima', async ({ page }) => {
    await open(page);
    await startLevel(page, 'f1');
    for (let i = 0; i < 3; i++) await cair(page);
    await expect(page.getByRole('dialog')).toContainText('As vidas acabaram!');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.__leo!.screen())).toBeNull();
    await expect(page.getByRole('dialog')).toContainText('As vidas acabaram!');
  });

  test('concluir depois de recomeçar conta só os coletáveis da nova tentativa', async ({ page }) => {
    await open(page);
    await startLevel(page, 'f1');
    await pegar(page, 0);
    await pegar(page, 2);
    for (let i = 0; i < 3; i++) await cair(page);
    await page.getByRole('button', { name: 'Recomeçar a fase' }).click();
    await pegar(page, 0);
    for (const p of ['1', '2', '3']) {
      const existe = (await state(page)).panels.some((x) => x.painel === p && !x.activated);
      if (existe) await solvePanel(page, p);
    }
    const goal = (await page.evaluate(() => window.__leo!.points())).goal;
    await page.evaluate(([x, y]) => window.__leo!.teleport(x, y), [goal.x, goal.y] as const);
    await page.waitForFunction(() => (window.__leo!.save().anos['3']?.fases['f1']?.cristais ?? -1) >= 0);
    expect((await page.evaluate(() => window.__leo!.save())).anos['3']!.fases['f1']!.cristais).toBe(1);
  });

  test('modo assistido: vidas sem limite', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: /Configurações/ }).click();
    await page.getByLabel(/Modo assistido/).check();
    await page.getByRole('button', { name: /Voltar/ }).click();
    await startLevel(page, 'f1');
    expect((await state(page)).vidas).toBe(-1);
    await expect(page.locator('.hud-vidas')).toHaveText('❤️ ∞');
    await expect(page.locator('.hud-vidas')).toHaveAttribute('aria-label', 'vidas sem limite');
    for (let i = 0; i < 4; i++) await cair(page);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
