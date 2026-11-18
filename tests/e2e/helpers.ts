import { expect, type Page } from '@playwright/test';
import type { LeoTestState } from '../../src/scenes/testHooks';

export const TILE = 32;
export const EVID = 'docs/relatorios/evidencias';

export const state = (page: Page): Promise<LeoTestState> => page.evaluate(() => window.__leo!.state());

/** Abre o jogo com ganchos de teste. Devolve a lista de erros do console/página. */
export async function open(page: Page, query = '', clearStorage = true): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  // Cada teste começa num navegador limpo; só é preciso apagar o salvamento se a página já abriu o jogo antes.
  if (clearStorage && page.url().startsWith('http')) await page.evaluate(() => localStorage.clear());
  // Caminho relativo: funciona também quando o jogo está numa subpasta (ex.: GitHub Pages /leo-sabido/).
  await page.goto(`./?teste=1&seed=1&animacoes=reduzidas${query}`);
  await page.waitForFunction(() => window.__leo?.ready === true);
  return errors;
}

/** Entra direto numa fase (sem passar pelos menus). */
export async function startLevel(page: Page, faseId: string, ano = 3): Promise<void> {
  await page.evaluate(([f, a]) => window.__leo!.startLevel(f as string, a as number), [faseId, ano] as const);
  await page.waitForFunction(() => window.__leo!.levelActive());
  await page.waitForFunction(() => window.__leo!.state().onGround);
}

/** Espera n passos de física (60 por segundo). */
export async function steps(page: Page, n: number): Promise<void> {
  const start = (await state(page)).physicsSteps;
  await page.waitForFunction((target) => window.__leo!.state().physicsSteps >= target, start + n);
}

export async function teleport(page: Page, x: number, y: number): Promise<void> {
  await page.evaluate(([a, b]) => window.__leo!.teleport(a!, b!), [x, y]);
  await steps(page, 8);
}

/** Leva o Leo até o painel e abre o desafio com a tecla E. */
export async function openPanel(page: Page, painel: string): Promise<void> {
  const p = (await page.evaluate(() => window.__leo!.points())).panels.find((x) => x.painel === painel)!;
  await teleport(page, p.x - 30, p.y);
  await page.waitForFunction(() => window.__leo!.state().onGround);
  await page.keyboard.press('e');
  await expect(page.getByRole('dialog')).toBeVisible();
}

/** Resolve o desafio aberto usando a interface, como uma criança faria. */
export async function answerCorrectly(page: Page, painel: string): Promise<void> {
  const sol = (await page.evaluate((p) => window.__leo!.solution(p), painel))!;
  const dialog = page.getByRole('dialog');
  switch (sol.formato) {
    case 'sequencia': {
      const inputs = dialog.getByRole('textbox');
      for (let i = 0; i < sol.valores.length; i++) await inputs.nth(i).fill(String(sol.valores[i]));
      break;
    }
    case 'numerico':
      await dialog.getByRole('textbox', { name: 'Sua resposta:' }).fill(String(sol.valor));
      break;
    case 'distribuir':
      for (let m = 1; m <= sol.grupos; m++) {
        for (let k = 0; k < sol.cada; k++) await dialog.getByRole('button', { name: new RegExp(`^Colocar um cristal na máquina ${m} `) }).click();
      }
      break;
    case 'arranjo':
      for (let k = 1; k < sol.colunas; k++) await dialog.getByRole('button', { name: 'Um bloco a mais por linha' }).click();
      break;
    case 'posicional':
      for (const [n, nome] of [[sol.c, 'centena'], [sol.d, 'dezena'], [sol.u, 'unidade']] as const) {
        for (let k = 0; k < n; k++) await dialog.getByRole('button', { name: new RegExp(`^Uma ${nome} a mais`) }).click();
      }
      break;
    case 'dinheiro': {
      const plus = dialog.getByRole('button', { name: /^Pôr uma/ });
      for (let i = 0; i < sol.counts.length; i++) for (let k = 0; k < sol.counts[i]!; k++) await plus.nth(i).click();
      break;
    }
    case 'fracao':
      for (let k = 1; k <= sol.partes; k++) await dialog.getByRole('button', { name: `Parte ${k}`, exact: true }).click();
      break;
    case 'grafico':
    case 'igualdade':
      await dialog.getByRole('textbox').first().fill(String(sol.valor));
      break;
    case 'porcentagem':
      for (let k = 0; k < Math.floor(sol.valor / 10); k++) await dialog.getByRole('button', { name: 'Mais 10', exact: true }).click();
      for (let k = 0; k < sol.valor % 10; k++) await dialog.getByRole('button', { name: 'Mais 1', exact: true }).click();
      break;
    case 'decimal':
      for (const [n, nome] of [[sol.u, 'inteiro'], [sol.d, 'décimo'], [sol.c, 'centésimo']] as const) {
        for (let k = 0; k < n; k++) await dialog.getByRole('button', { name: new RegExp(`^Um ${nome} a mais`) }).click();
      }
      break;
    case 'area':
      for (let k = 1; k < sol.largura; k++) await dialog.getByRole('button', { name: 'Mais comprimento' }).click();
      for (let k = 1; k < sol.altura; k++) await dialog.getByRole('button', { name: 'Mais largura' }).click();
      break;
    case 'programa':
      for (const c of sol.comandos) await dialog.getByRole('group', { name: 'Comandos' }).getByRole('button', { name: c, exact: true }).click();
      break;
    case 'expressao':
      await dialog.getByRole('textbox').first().fill(String(sol.valor));
      break;
    case 'divisibilidade':
      for (const n of sol.numeros) await dialog.getByRole('button', { name: String(n), exact: true }).click();
      break;
    case 'ordenar':
      for (const i of sol.ordem) await dialog.locator('.ord-card').nth(i).click();
      await expect(dialog.locator('.feedback')).toContainText(/Muito bem/);
      return;
    case 'escolha':
      await dialog.locator('.opt').nth(sol.indice).click();
      await expect(dialog.locator('.feedback')).toContainText(/Muito bem|Isso/);
      return;
    case 'relogio':
      for (let k = 0; k < sol.horas; k++) await dialog.getByRole('button', { name: 'Mais 1 hora' }).click();
      for (let k = 0; k < sol.meias; k++) await dialog.getByRole('button', { name: 'Mais 30 min' }).click();
      break;
  }
  await dialog.getByRole('button', { name: 'Verificar' }).click();
  await expect(dialog.locator('.feedback')).toContainText(/Muito bem|Isso|Perfeito/);
}

export async function solvePanel(page: Page, painel: string): Promise<void> {
  await openPanel(page, painel);
  await answerCorrectly(page, painel);
  await page.getByRole('dialog').getByRole('button', { name: /Continuar/ }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.waitForFunction((p) => window.__leo!.state().panels.find((x) => x.painel === p)?.activated, painel);
}

/** Segura uma tecla até a condição ser verdadeira (ou estourar o tempo). */
export async function holdUntil(page: Page, key: string, condition: string, timeout = 30_000, jump = false): Promise<void> {
  await page.keyboard.down(key);
  const deadline = Date.now() + timeout;
  try {
    while (Date.now() < deadline) {
      // Ao concluir a fase, a cena é encerrada e o estado deixa de existir: isso também conta como 's.completed'.
      const ok = await page.evaluate(`(() => { if (!window.__leo.levelActive()) return ${condition.includes('s.completed')}; const s = window.__leo.state(); return ${condition}; })()`);
      if (ok) return;
      if (jump) {
        await page.keyboard.down('Space');
        await page.waitForTimeout(250);
        await page.keyboard.up('Space');
      } else await page.waitForTimeout(30);
    }
    throw new Error(`Condição não atingida: ${condition}`);
  } finally {
    await page.keyboard.up(key);
  }
}

/**
 * Atravessa o mecanismo de um painel já ativado, lendo a geometria do próprio jogo.
 * Falha se o Leo cair num buraco (renascer) ou não conseguir passar.
 */
export async function traverse(page: Page, painel: string): Promise<void> {
  const p = (await page.evaluate(() => window.__leo!.points())).panels.find((x) => x.painel === painel)!;
  const b = p.bounds;
  const right = b.x + b.w;
  const before = (await state(page)).respawns;
  switch (p.mecanismo) {
    case 'porta':
      await teleport(page, b.x - 48, b.y + b.h);
      await holdUntil(page, 'ArrowRight', `s.x > ${right + 40}`);
      break;
    case 'ponte':
      await teleport(page, b.x - 40, b.y);
      await holdUntil(page, 'ArrowRight', `s.x > ${right + 24} && s.onGround`);
      break;
    case 'blocos':
      await teleport(page, b.x - 64, b.y + b.h);
      await holdUntil(page, 'ArrowRight', `s.x > ${right + 16} && s.onGround && s.y < ${b.y}`, 15_000, true);
      break;
    case 'elevador': {
      const top = b.y + b.h - 16;
      await teleport(page, b.x + b.w / 2, top);
      await page.waitForFunction((y) => window.__leo!.state().y < y, top + p.dy + 22, { timeout: 15_000 });
      await holdUntil(page, 'ArrowRight', `s.x > ${right + 40} && s.onGround`);
      expect((await state(page)).y).toBeLessThan(b.y);
      break;
    }
  }
  expect((await state(page)).respawns).toBe(before);
}

/** Joga a fase aberta: resolve os painéis da esquerda para a direita, atravessa cada mecanismo e chega à saída. */
export async function playLevel(page: Page, n: number): Promise<void> {
  await page.waitForFunction(() => window.__leo!.levelActive());
  await page.waitForFunction(() => window.__leo!.state().onGround);
  const panels = (await page.evaluate(() => window.__leo!.points())).panels.sort((a, b) => a.x - b.x);
  for (const p of panels) {
    await solvePanel(page, p.painel);
    await traverse(page, p.painel);
  }
  const goal = (await page.evaluate(() => window.__leo!.points())).goal;
  await teleport(page, goal.x - 60, goal.y);
  // Espera a tela de conclusão (ao concluir, a fase é encerrada e o gancho de estado deixa de responder).
  await page.keyboard.down('ArrowRight');
  try {
    await expect(page.getByRole('heading', { name: `Fase ${n} concluída!` })).toBeVisible({ timeout: 10_000 });
  } finally {
    await page.keyboard.up('ArrowRight');
  }
}

/** Depois da fase 3: segue para as fases 4 e 5 (a 5 guarda a engrenagem do mundo). */
export async function playFases4e5(page: Page, prefixo: string): Promise<void> {
  for (const n of [4, 5]) {
    await page.getByRole('button', { name: /Próxima fase/ }).click();
    await page.waitForFunction(() => window.__leo!.levelActive());
    await page.waitForFunction(() => window.__leo!.state().onGround);
    await page.screenshot({ path: `${EVID}/${prefixo}-fase${n}.png` });
    await playLevel(page, n);
  }
}
