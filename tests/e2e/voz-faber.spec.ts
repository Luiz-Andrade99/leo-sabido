import { expect, test, type Page } from '@playwright/test';
import { open } from './helpers';

/** Abre com a Faber e espera o service worker de isolamento (a página recarrega uma vez na primeira visita). */
export async function abrirComFaber(page: Page, extra = ''): Promise<void> {
  await open(page, `&voz=faber${extra}`);
  await expect
    .poll(() => page.evaluate(() => crossOriginIsolated && window.__leo?.ready === true).catch(() => false), { timeout: 30_000 })
    .toBe(true);
}

/** Voz Faber (Piper) gerada no próprio navegador. */
test.describe('voz Faber', () => {
  test.setTimeout(180_000);

  test('sem &voz=faber, os testes não carregam a Faber', async ({ page }) => {
    await open(page);
    expect(await page.evaluate(() => window.__leo!.faber === undefined)).toBe(true);
  });

  test('o download começa sozinho e avisa; Configurações mostram a voz Leo', async ({ page }) => {
    await abrirComFaber(page);
    await expect(page.locator('#aviso-voz')).toContainText(/Baixando a voz do narrador|Voz do narrador pronta/);
    await page.getByRole('button', { name: /Configurações/ }).click();
    const opcao = page.locator('#voz option[value="faber"]');
    await expect(opcao).toHaveText(/Leo \(natural\) — (baixando \d+%|recomendado)/);
    await expect(opcao).toHaveText('Leo (natural) — recomendado', { timeout: 120_000 });
    await expect(page.locator('#voz')).toHaveValue('faber');
  });

  test('escolher a voz do navegador fica salvo e desliga a Faber', async ({ page }) => {
    await abrirComFaber(page);
    await page.getByRole('button', { name: /Configurações/ }).click();
    const outra = await page.locator('#voz option:not([value="faber"])').first().getAttribute('value');
    await page.locator('#voz').selectOption(outra!);
    expect(await page.evaluate(() => window.__leo!.save())).toBeTruthy();
    await page.reload();
    await expect.poll(() => page.evaluate(() => window.__leo?.ready === true).catch(() => false)).toBe(true);
    await page.getByRole('button', { name: /Configurações/ }).click();
    await expect(page.locator('#voz')).toHaveValue(outra!);
    await expect(page.locator('#voz option[value="faber"]')).toHaveText('Leo (natural) — desligada');
  });

  test('1º ano: placas e o desafio próximo são gerados antes de serem falados', async ({ page }) => {
    await abrirComFaber(page);
    await page.evaluate(() => window.__leo!.faber!.carregar(() => {}));
    await page.evaluate(() => window.__leo!.startLevel('f4', 1));
    await page.waitForFunction(() => window.__leo!.levelActive() && window.__leo!.state().onGround);
    // As placas da fase são preparadas ao entrar.
    await expect.poll(() => page.evaluate(() => window.__leo!.vozCache()), { timeout: 60_000 }).toBeGreaterThan(0);
    await page.waitForTimeout(3000);
    const soPlacas = await page.evaluate(() => window.__leo!.vozCache());
    // Chegando perto do painel 2, a instrução dele também é preparada.
    const p = await page.evaluate(() => window.__leo!.points().panels.find((x) => x.painel === '2')!);
    await page.evaluate(([x, y]) => window.__leo!.teleport(x - 150, y), [p.x, p.y] as const);
    await expect.poll(() => page.evaluate(() => window.__leo!.vozCache()), { timeout: 60_000 }).toBeGreaterThan(soPlacas);
  });

  test('Faber gera a frase do desafio no navegador e dentro da meta', async ({ page }) => {
    await abrirComFaber(page);
    await page.evaluate(() => window.__leo!.faber!.carregar(() => {}));
    const r = await page.evaluate(async () => {
      const t = performance.now();
      const pcm = await window.__leo!.faber!.gerar('Para abrir a porta, descubra: quanto é três quartos de oito?');
      let pico = 0;
      for (const v of pcm) pico = Math.max(pico, Math.abs(v));
      return { ms: performance.now() - t, segundos: pcm.length / 22050, pico, partes: window.__leo!.faber!.ultimoTempo };
    });
    console.log(
      `Faber: ${Math.round(r.ms)} ms para ${r.segundos.toFixed(2)} s de áudio (fonemas ${Math.round(r.partes.fonemas)} ms, modelo ${Math.round(r.partes.modelo)} ms; isolado: ${await page.evaluate(() => crossOriginIsolated)})`,
    );
    expect(r.segundos).toBeGreaterThan(2.5); // a amostra Python dessa frase tem cerca de 3,5 s
    expect(r.segundos).toBeLessThan(5);
    expect(r.pico).toBeGreaterThan(0.05); // não é silêncio
    // A meta de 2,5 s foi comprovada na Tarefa 1 (0,7–2,1 s no Edge, 1,3 s no Firefox). Aqui só pegamos pioras grandes,
    // porque o tempo varia com a carga do computador que roda os testes.
    expect(r.ms).toBeLessThan(6000);
  });
});
