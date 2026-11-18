import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { EVID, answerCorrectly, open, state, steps, teleport } from './helpers';

/**
 * Celulares e tablets (emulados): tela, botões de toque e um desafio resolvido só com toques.
 * Roda nos projetos de dispositivo (PW_DEVICES=1); nos navegadores de mesa é pulado.
 */

/** Segura o botão com um ponteiro de verdade (eventos de entrada do navegador, não eventos sintéticos). */
async function holdUntil(page: Page, b: Locator, condition: string, arg: number): Promise<void> {
  const box = (await b.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  try {
    // Espera o efeito (e não um tempo fixo): navegadores emulados podem rodar bem abaixo de 60 quadros por segundo.
    await page.waitForFunction(new Function('v', `const s = window.__leo.state(); return ${condition};`) as (v: number) => boolean, arg, { timeout: 20_000 });
  } finally {
    await page.mouse.up();
  }
}

async function semRolagemLateral(page: Page): Promise<void> {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  expect(sw, 'a página não deve rolar para o lado').toBeLessThanOrEqual(iw + 1);
}

test('jogo em celular/tablet: menus cabem na tela, botões de toque andam, pulam e abrem o desafio', async ({ page }, info) => {
  test.skip(!info.project.use.hasTouch, 'só em dispositivos de toque');
  test.setTimeout(120_000);
  const nome = info.project.name;
  const errors = await open(page);
  await semRolagemLateral(page);
  await page.screenshot({ path: `${EVID}/disp-${nome}-abertura.png` });

  await page.getByRole('button', { name: /Jogar/ }).tap();
  await page.getByRole('button', { name: 'Pular história' }).tap();
  await semRolagemLateral(page);
  await page.getByRole('button', { name: /3º ano/ }).tap();
  await expect(page.getByRole('heading', { name: 'Caverna dos Enigmas' })).toBeVisible();
  await semRolagemLateral(page);
  await page.getByRole('button', { name: /fase 1,/ }).tap();
  await page.waitForFunction(() => window.__leo!.levelActive());
  await page.waitForFunction(() => window.__leo!.state().onGround);

  // Botões de toque visíveis, grandes e dentro da tela
  const vp = page.viewportSize()!;
  for (const nomeBtn of ['Andar para a esquerda', 'Andar para a direita', 'Pular', 'Examinar']) {
    const b = page.getByRole('button', { name: nomeBtn, exact: true });
    await expect(b).toBeVisible();
    const box = (await b.boundingBox())!;
    expect(box.width, nomeBtn).toBeGreaterThanOrEqual(44);
    expect(box.height, nomeBtn).toBeGreaterThanOrEqual(44);
    expect(box.x + box.width, nomeBtn).toBeLessThanOrEqual(vp.width + 1);
    expect(box.y + box.height, nomeBtn).toBeLessThanOrEqual(vp.height + 1);
  }
  await page.screenshot({ path: `${EVID}/disp-${nome}-fase.png` });

  // Andar e pular só com os botões
  const x0 = (await state(page)).x;
  await holdUntil(page, page.getByRole('button', { name: 'Andar para a direita', exact: true }), 's.x > v', x0 + 40);
  await page.waitForFunction(() => window.__leo!.state().onGround);
  await steps(page, 4);
  const y0 = (await state(page)).y;
  await holdUntil(page, page.getByRole('button', { name: 'Pular', exact: true }), 's.minY < v', y0 - 40);

  // Examinar o painel com o botão de toque e resolver tocando
  const p = (await page.evaluate(() => window.__leo!.points())).panels.find((x) => x.painel === '1')!;
  await teleport(page, p.x - 30, p.y);
  await page.waitForFunction(() => window.__leo!.state().onGround);
  await page.getByRole('button', { name: 'Examinar', exact: true }).tap();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Verificar' })).toBeInViewport();
  await semRolagemLateral(page);
  await page.screenshot({ path: `${EVID}/disp-${nome}-desafio.png` });
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  await answerCorrectly(page, '1');
  await dialog.getByRole('button', { name: /Continuar/ }).tap();
  await expect(dialog).toBeHidden();
  await page.waitForFunction(() => window.__leo!.state().panels.find((x) => x.painel === '1')?.activated);
  expect(errors).toEqual([]);
});

test('1º ano em celular/tablet: desafio de ordenar só com toques', async ({ page }, info) => {
  test.skip(!info.project.use.hasTouch, 'só em dispositivos de toque');
  await open(page);
  await page.evaluate(() => window.__leo!.startLevel('f4', 1));
  await page.waitForFunction(() => window.__leo!.levelActive());
  await page.waitForFunction(() => window.__leo!.state().onGround);
  const sol = (await page.evaluate(() => window.__leo!.solution('2')))!;
  if (sol.formato !== 'ordenar') throw new Error('esperado ordenar');
  const p = (await page.evaluate(() => window.__leo!.points())).panels.find((x) => x.painel === '2')!;
  await teleport(page, p.x - 30, p.y);
  await page.waitForFunction(() => window.__leo!.state().onGround);
  await page.getByRole('button', { name: 'Examinar', exact: true }).tap();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.ord-card').first()).toBeFocused();
  for (const i of sol.ordem) await dialog.locator('.ord-card').nth(i).tap();
  await expect(dialog.locator('.feedback')).toContainText('Muito bem');
  await semRolagemLateral(page);
  await page.screenshot({ path: `${EVID}/disp-${info.project.name}-ordenar.png` });
});
