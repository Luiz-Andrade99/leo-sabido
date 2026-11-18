import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { open, openPanel, startLevel } from './helpers';

/**
 * Verificação automática (axe-core) das partes em HTML, com as regras WCAG 2.0/2.1/2.2 A e AA.
 * Não cobre o que acontece dentro do canvas — isso exige teste manual (ver roteiro de testes manuais).
 */
async function axe(page: Page, label: string): Promise<void> {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const summary = r.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  expect(summary, `${label}: violações de acessibilidade`).toEqual([]);
}

test('telas de menu sem violações WCAG A/AA detectáveis', async ({ page }) => {
  await open(page);
  await axe(page, 'abertura');
  await page.getByRole('button', { name: /Jogar/ }).click();
  await axe(page, 'história');
  await page.getByRole('button', { name: 'Pular história' }).click();
  await axe(page, 'escolha do ano');
  await page.getByRole('button', { name: /3º ano/ }).click();
  await axe(page, 'mapa');
  await page.getByRole('button', { name: /Configurações/ }).click();
  await axe(page, 'configurações');
  await page.getByRole('button', { name: /Voltar/ }).click();
  await page.getByRole('button', { name: /Início/ }).click();
  await page.getByRole('button', { name: /Sobre/ }).click();
  await axe(page, 'sobre');
});

test('janelas de desafio e pausa sem violações WCAG A/AA detectáveis', async ({ page }) => {
  await open(page);
  for (const [fase, painel, nome] of [
    ['f1', '1', 'numérico'],
    ['f1', '2', 'sequência'],
    ['f2', '1', 'distribuir'],
    ['f3', '1', 'arranjo'],
  ] as const) {
    await startLevel(page, fase);
    await openPanel(page, painel);
    await page.getByRole('dialog').getByRole('button', { name: 'Verificar' }).click();
    await axe(page, `desafio ${nome}`);
    await page.keyboard.press('Escape');
  }
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Jogo pausado' })).toBeVisible();
  await axe(page, 'pausa');
});
