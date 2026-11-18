import { expect, test } from '@playwright/test';
import { EVID, TILE, holdUntil, open, solvePanel, startLevel, state, steps, teleport, playFases4e5 } from './helpers';

test.describe.configure({ mode: 'serial' });

test('fluxo completo: abertura → história → ano → mapa → 5 fases → engrenagem, com progresso salvo', async ({ page }) => {
  test.setTimeout(420_000);
  const errors = await open(page);

  // Abertura e apresentação do Leo
  await expect(page.getByRole('heading', { name: /Leo Sabido/ })).toBeVisible();
  await page.screenshot({ path: `${EVID}/c-01-abertura.png` });
  await page.getByRole('button', { name: /Jogar/ }).click();
  await expect(page.getByRole('heading', { name: 'A Grande Engrenagem do Saber' })).toBeVisible();
  await page.getByRole('button', { name: /Próximo/ }).click();
  await page.getByRole('button', { name: /Próximo/ }).click();
  await page.getByRole('button', { name: /Começar/ }).click();

  // Escolha do ano: os seis anos estão disponíveis
  await expect(page.getByRole('heading', { name: 'Em que ano você está?' })).toBeVisible();
  for (const ano of [1, 2, 3, 4, 5, 6]) await expect(page.getByRole('button', { name: new RegExp(`${ano}º ano`) })).toBeEnabled();
  await expect(page.getByRole('button', { name: /2º ano/ })).toBeEnabled();
  await page.screenshot({ path: `${EVID}/c-02-escolha-ano.png` });
  await page.getByRole('button', { name: /3º ano/ }).click();

  // Mapa: só a fase 1 aberta
  await expect(page.getByRole('heading', { name: 'Caverna dos Enigmas' })).toBeVisible();
  await expect(page.getByRole('button', { name: /fase 2,/ })).toBeDisabled();
  await page.getByRole('button', { name: /fase 1,/ }).click();
  await page.waitForFunction(() => window.__leo!.levelActive());
  await page.waitForFunction(() => window.__leo!.state().onGround);
  await page.screenshot({ path: `${EVID}/c-03-fase1-tutorial.png` });

  // ---- Fase 1: porta (problema numérico) e ponte (sequência)
  await solvePanel(page, '1');
  await teleport(page, 42 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 46 * 32');
  await solvePanel(page, '2');
  await teleport(page, 57 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 66 * 32');
  expect((await state(page)).respawns).toBe(0);
  let goal = (await page.evaluate(() => window.__leo!.points())).goal;
  await teleport(page, goal.x - 60, goal.y);
  await holdUntil(page, 'ArrowRight', 's.completed');
  await expect(page.getByRole('heading', { name: 'Fase 1 concluída!' })).toBeVisible();
  await expect(page.getByText('O que você descobriu')).toBeVisible();
  await page.screenshot({ path: `${EVID}/c-04-fase1-concluida.png` });

  // Progresso sobrevive a recarregar a página
  await page.reload();
  await page.waitForFunction(() => window.__leo?.ready === true);
  await page.getByRole('button', { name: /Jogar/ }).click();
  await expect(page.getByRole('heading', { name: 'Caverna dos Enigmas' })).toBeVisible();
  await expect(page.getByText('✓ Concluída')).toBeVisible();
  await expect(page.getByRole('button', { name: /fase 2,/ })).toBeEnabled();
  await page.getByRole('button', { name: /fase 2,/ }).click();
  await page.waitForFunction(() => window.__leo!.levelActive());
  await page.waitForFunction(() => window.__leo!.state().onGround);

  // ---- Fase 2: elevador (distribuir) e ponte (distribuir com resto)
  await solvePanel(page, '1');
  await teleport(page, 35 * TILE, 13 * TILE + 16);
  await page.waitForFunction(() => window.__leo!.state().y < 262, undefined, { timeout: 15_000 });
  await holdUntil(page, 'ArrowRight', 's.x > 38 * 32 && s.onGround');
  expect((await state(page)).y).toBeLessThanOrEqual(8 * TILE + 6); // está em cima do paredão
  await solvePanel(page, '2');
  await teleport(page, 73 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 83 * 32');
  goal = (await page.evaluate(() => window.__leo!.points())).goal;
  await teleport(page, goal.x - 60, goal.y);
  await holdUntil(page, 'ArrowRight', 's.completed');
  await expect(page.getByRole('heading', { name: 'Fase 2 concluída!' })).toBeVisible();
  await page.getByRole('button', { name: /Próxima fase/ }).click();
  await page.waitForFunction(() => window.__leo!.levelActive());
  await page.waitForFunction(() => window.__leo!.state().onGround);

  // ---- Fase 3: escada de blocos (arranjo), porta (problema) e elevador (arranjo)
  await solvePanel(page, '1');
  await page.screenshot({ path: `${EVID}/c-05-fase3-escada.png` });
  await teleport(page, 15 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 23 * 32 && s.y <= 9 * 32 + 6', 15_000, true);
  await solvePanel(page, '2');
  await teleport(page, 53 * TILE, 14 * TILE);
  await holdUntil(page, 'ArrowRight', 's.x > 57 * 32');
  await solvePanel(page, '3');
  await teleport(page, 85 * TILE, 13 * TILE + 16);
  await page.waitForFunction(() => window.__leo!.state().y < 262, undefined, { timeout: 15_000 });
  await holdUntil(page, 'ArrowRight', 's.completed', 15_000);
  await expect(page.getByRole('heading', { name: 'Fase 3 concluída!' })).toBeVisible();
  await playFases4e5(page, 'amp-3');
  await expect(page.getByText(/Conquista nova/)).toBeVisible();
  await page.getByRole('button', { name: /Mapa/ }).click();
  await expect(page.getByRole('heading', { name: 'Você recuperou a Terceira engrenagem!' })).toBeVisible();
  await page.screenshot({ path: `${EVID}/c-06-mundo-concluido.png` });
  await page.getByRole('button', { name: /Voltar ao mapa/ }).click();
  await expect(page.getByText('⚙ Terceira engrenagem: recuperada!')).toBeVisible();

  const save = await page.evaluate(() => window.__leo!.save());
  expect(Object.values(save.anos['3']!.fases).every((f) => f.concluida)).toBe(true);
  expect(save.conquistas).toContain('engrenagem-3');
  expect(save.tempoSegundos).toBeGreaterThan(0);
  // Nada de dados pessoais no salvamento
  expect(JSON.stringify(save)).not.toMatch(/nome|email|cpf|telefone/i);
  expect(errors).toEqual([]);
});

test('trocar de ano não apaga o progresso de cada ano', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: /Jogar/ }).click();
  await page.getByRole('button', { name: 'Pular história' }).click();
  await page.getByRole('button', { name: /3º ano/ }).click();
  await startLevel(page, 'f1');
  const goal = (await page.evaluate(() => window.__leo!.points())).goal;
  await teleport(page, goal.x - 60, goal.y);
  await holdUntil(page, 'ArrowRight', 's.completed');
  await page.getByRole('button', { name: /^🗺 Mapa/ }).click();
  await page.getByRole('button', { name: 'Trocar ano' }).click();
  await page.getByRole('button', { name: /1º ano/ }).click();
  await expect(page.getByRole('heading', { name: 'Floresta dos Números' })).toBeVisible();
  await expect(page.getByText('✓ Concluída')).toHaveCount(0); // progresso do 1º ano é separado
  await page.getByRole('button', { name: 'Trocar ano' }).click();
  await page.getByRole('button', { name: /3º ano/ }).click();
  await expect(page.getByText('✓ Concluída')).toBeVisible();
  expect((await page.evaluate(() => window.__leo!.save())).ano).toBe(3);
});

test('pausa: reiniciar a fase devolve os painéis ao estado inicial', async ({ page }) => {
  await open(page);
  await startLevel(page, 'f1');
  await solvePanel(page, '1');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Jogo pausado' })).toBeVisible();
  const before = (await state(page)).physicsSteps;
  await page.waitForTimeout(300);
  expect((await state(page)).physicsSteps).toBe(before); // física parada na pausa
  await page.getByRole('button', { name: /Reiniciar a fase/ }).click();
  await page.waitForFunction(() => window.__leo!.levelActive());
  await steps(page, 10);
  expect((await state(page)).panels.every((p) => !p.activated)).toBe(true);
});

test('Esc na pausa volta ao jogo', async ({ page }) => {
  await open(page);
  await startLevel(page, 'f1');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Jogo pausado' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Jogo pausado' })).toBeHidden();
  await steps(page, 5);
});
