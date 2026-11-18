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
    expect(r.ms).toBeLessThan(2500); // condição para seguir (Tarefa 1)
  });
});
