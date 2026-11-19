import { expect, test } from '@playwright/test';
import { EVID, TILE, holdUntil, open, openPanel, startLevel, state, steps, teleport } from './helpers';

test.describe('física e movimento', () => {
  test('Leo anda com a seta e para ao soltar', async ({ page }) => {
    await open(page);
    await startLevel(page, 'f1');
    const x0 = (await state(page)).x;
    await page.keyboard.down('ArrowRight');
    await steps(page, 30);
    await page.keyboard.up('ArrowRight');
    await steps(page, 20);
    const s = await state(page);
    expect(s.x).toBeGreaterThan(x0 + 60);
    expect(Math.abs(s.vx)).toBeLessThan(1);
  });

  test('altura do salto é idêntica a 60 e 144 quadros/s (física em passo fixo)', async ({ browser }) => {
    const apexes: number[] = [];
    for (const fps of [60, 144]) {
      const page = await browser.newPage();
      await open(page, `&fps=${fps}`);
      await startLevel(page, 'f1');
      await steps(page, 20);
      await page.evaluate(() => window.__leo!.apexReset());
      const y0 = (await state(page)).y;
      await page.keyboard.down('Space');
      await steps(page, 70);
      await page.keyboard.up('Space');
      apexes.push(y0 - (await state(page)).minY);
      await page.close();
    }
    test.info().annotations.push({ type: 'apices', description: apexes.map((a) => a.toFixed(2)).join(' / ') });
    expect(apexes[0]).toBeGreaterThan(95);
    expect(Math.abs(apexes[0]! - apexes[1]!)).toBeLessThanOrEqual(1);
  });

  test('cair num buraco gasta uma vida e leva ao último ponto de controle', async ({ page }) => {
    await open(page);
    await startLevel(page, 'f1');
    const spawn = (await page.evaluate(() => window.__leo!.points())).spawn;
    await teleport(page, 21 * TILE + 16, 300);
    await page.waitForFunction(() => window.__leo!.state().respawns === 1);
    await steps(page, 20);
    expect(Math.abs((await state(page)).x - spawn.x)).toBeLessThan(4);
    expect((await state(page)).vidas).toBe(2);
  });

  test('ponto de controle ativado vira o lugar de reaparecimento', async ({ page }) => {
    await open(page);
    await startLevel(page, 'f1');
    await teleport(page, 24 * TILE, 14 * TILE);
    await holdUntil(page, 'ArrowRight', 's.checkpoint.x > 800');
    expect((await state(page)).checkpoint.x).toBe(26 * TILE + 16);
  });

  test('cristais são coletados e contados', async ({ page }) => {
    await open(page);
    await startLevel(page, 'f1');
    const c = (await page.evaluate(() => window.__leo!.points())).crystals.find((k) => Math.abs(k.y - 13 * TILE - 16) < 2)!;
    await teleport(page, c.x - 50, 14 * TILE);
    await holdUntil(page, 'ArrowRight', 's.cristais === 1');
    await expect(page.locator('.hud-crystals')).toHaveText('◆ 1/5');
  });

  test('modo assistido: blocos de apoio no buraco e nenhuma queda', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: /Configurações/ }).click();
    await page.getByLabel(/Modo assistido/).check();
    await page.getByRole('button', { name: /Voltar/ }).click();
    await startLevel(page, 'f1');
    expect((await state(page)).assist).toBe(true);
    await teleport(page, 21 * TILE + 16, 300);
    await steps(page, 60);
    const s = await state(page);
    expect(s.respawns).toBe(0);
    expect(s.onGround).toBe(true);
    await page.screenshot({ path: `${EVID}/c-07-modo-assistido.png` });
  });
});

test.describe('desafios', () => {
  test('sequência no apoio acompanhado: erro mostra marcação e dica automática', async ({ page }) => {
    await open(page, '&apoio=acompanhado');
    await startLevel(page, 'f1');
    await openPanel(page, '2');
    const dialog = page.getByRole('dialog', { name: 'Ponte de Pedras' });
    await expect(dialog.getByText('Conteúdo em revisão pedagógica')).toBeVisible();
    const inputs = dialog.getByRole('textbox');
    for (let i = 0; i < (await inputs.count()); i++) await inputs.nth(i).fill('0');
    await inputs.first().press('Enter');
    await expect(dialog.locator('.feedback')).toContainText(/Quase|Ainda não/);
    await expect(dialog.locator('.hint p').first()).toBeVisible();
    await expect(dialog.locator('.mark.err').first()).toHaveText('✗');
    await page.screenshot({ path: `${EVID}/c-08-sequencia-erro-dica.png` });
  });

  test('problema numérico: diz se a resposta é menor ou maior; texto inválido não conta tentativa', async ({ page }) => {
    await open(page);
    await startLevel(page, 'f1');
    await openPanel(page, '1');
    const sol = (await page.evaluate(() => window.__leo!.solution('1')))!;
    if (sol.formato !== 'numerico') throw new Error('esperado numérico');
    const box = page.getByRole('dialog').getByRole('textbox', { name: 'Sua resposta:' });
    const x0 = (await state(page)).x;
    await box.focus();
    await page.keyboard.type(' wde ');
    await page.keyboard.press('ArrowLeft');
    await steps(page, 15);
    expect((await state(page)).x).toBeCloseTo(x0, 0); // teclas digitadas no campo não movem o Leo
    await box.press('Enter');
    await expect(page.locator('.feedback')).toContainText('Digite um número');
    await box.fill(String(sol.valor - 1));
    await box.press('Enter');
    await expect(page.locator('.feedback')).toContainText('menor');
    await page.screenshot({ path: `${EVID}/c-09-numerico-erro.png` });
  });

  test('distribuir com resto: máquinas iguais mas com cristais sobrando para mais uma rodada não é aceito', async ({ page }) => {
    await open(page);
    await startLevel(page, 'f2');
    await openPanel(page, '2');
    const sol = (await page.evaluate(() => window.__leo!.solution('2')))!;
    if (sol.formato !== 'distribuir') throw new Error('esperado distribuir');
    const dialog = page.getByRole('dialog');
    for (let m = 1; m <= sol.grupos; m++) {
      for (let k = 0; k < sol.cada - 1; k++) await dialog.getByRole('button', { name: new RegExp(`^Colocar um cristal na máquina ${m} `) }).click();
    }
    await dialog.getByRole('button', { name: 'Verificar' }).click();
    await expect(dialog.locator('.feedback')).toContainText('sobram');
    await page.screenshot({ path: `${EVID}/c-10-distribuir-resto.png` });
  });

  test('arranjo: resposta menor mostra a multiplicação e quanto falta', async ({ page }) => {
    await open(page);
    await startLevel(page, 'f3');
    await openPanel(page, '1');
    const sol = (await page.evaluate(() => window.__leo!.solution('1')))!;
    if (sol.formato !== 'arranjo') throw new Error('esperado arranjo');
    const dialog = page.getByRole('dialog');
    for (let k = 1; k < sol.colunas - 1; k++) await dialog.getByRole('button', { name: 'Um bloco a mais por linha' }).click();
    await dialog.getByRole('button', { name: 'Verificar' }).click();
    await expect(dialog.locator('.feedback')).toContainText('faltam');
    await page.screenshot({ path: `${EVID}/c-11-arranjo-erro.png` });
  });

  test('Esc fecha o desafio e, ao reabrir, o mesmo desafio continua', async ({ page }) => {
    await open(page);
    await startLevel(page, 'f1');
    await openPanel(page, '2');
    const before = await page.getByRole('dialog').locator('.seq').innerText();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await steps(page, 10);
    await page.keyboard.press('e');
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await page.getByRole('dialog').locator('.seq').innerText()).toBe(before);
  });
});

test.describe('configurações, salvamento e toque', () => {
  test('remapear o pulo para J funciona na fase', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: /Configurações/ }).click();
    await page.getByRole('button', { name: 'Mudar tecla de Pular' }).click();
    await page.keyboard.press('j');
    await expect(page.locator('.keys')).toContainText('J · Espaço');
    await page.getByRole('button', { name: /Voltar/ }).click();
    await startLevel(page, 'f1');
    await steps(page, 10);
    await page.evaluate(() => window.__leo!.apexReset());
    const y0 = (await state(page)).y;
    await page.keyboard.down('j');
    await steps(page, 30);
    await page.keyboard.up('j');
    expect(y0 - (await state(page)).minY).toBeGreaterThan(60);
  });

  test('configurações ficam salvas após recarregar (texto maior, animações reduzidas)', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: /Configurações/ }).click();
    await page.getByLabel(/Texto maior/).check();
    await page.getByLabel(/Reduzir animações/).check();
    await expect(page.locator('html')).toHaveClass(/texto-grande/);
    await page.reload();
    await page.waitForFunction(() => window.__leo?.ready === true);
    await expect(page.locator('html')).toHaveClass(/texto-grande/);
    await page.getByRole('button', { name: /Configurações/ }).click();
    await expect(page.getByLabel(/Reduzir animações/)).toBeChecked();
  });

  test('salvamento corrompido não trava o jogo: avisa e recomeça', async ({ page }) => {
    // Grava o salvamento corrompido antes dos scripts do jogo, sem abrir o jogo duas vezes.
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('corrompido')) {
        localStorage.setItem('leo-sabido:save', '{isto não é json');
        sessionStorage.setItem('corrompido', '1');
      }
    });
    const errors = await open(page, '', false);
    await expect(page.getByText(/Não foi possível ler o progresso salvo/)).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('leo-sabido:save:backup'))).toBe('{isto não é json');
    expect(errors).toEqual([]);
  });

  test('código de progresso: gerar e carregar', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: /Configurações/ }).click();
    await page.getByRole('button', { name: 'Gerar código do progresso' }).click();
    const code = await page.locator('#codigo-exportado').inputValue();
    expect(code.length).toBeGreaterThan(20);
    await page.locator('#codigo-importar').fill('código inválido');
    await page.getByRole('button', { name: 'Carregar' }).click();
    await expect(page.getByText('Código inválido')).toBeVisible();
    await page.locator('#codigo-importar').fill(code);
    await page.getByRole('button', { name: 'Carregar' }).click();
    await expect(page.getByText('Progresso carregado!')).toBeVisible();
  });
});

test.describe('tela de toque', () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });

  test('botões de toque movem o Leo e soltar faz parar', async ({ page }) => {
    await open(page);
    await startLevel(page, 'f1');
    const right = page.getByRole('button', { name: 'Andar para a direita' });
    await expect(right).toBeVisible();
    const x0 = (await state(page)).x;
    await right.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch', isPrimary: true });
    await steps(page, 30);
    await right.dispatchEvent('pointerup', { pointerId: 1, pointerType: 'touch', isPrimary: true });
    await steps(page, 25);
    const s = await state(page);
    expect(s.x).toBeGreaterThan(x0 + 50);
    expect(Math.abs(s.vx)).toBeLessThan(1);
    await page.screenshot({ path: `${EVID}/c-12-celular-toque.png` });
  });
});
