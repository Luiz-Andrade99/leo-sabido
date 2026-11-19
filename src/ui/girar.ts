import { getState } from '../core/state';
import { el } from './dom';
import { touchWanted } from './touch';

/**
 * Celular em pé durante a fase: a fase é larga e ficaria uma faixa fina, então pedimos para girar.
 * Tablet em pé (≥ 600 px de largura) e computador não pedem. Menus e desafios funcionam em pé.
 */
export function precisaGirar(retrato: boolean, larguraCss: number, toque: boolean): boolean {
  return retrato && larguraCss < 600 && toque;
}

/** Monta a camada "Vire o celular" e avisa quando ela aparece ou some. Devolve a função de desmontar. */
export function montarGirar(onMudar: (precisa: boolean) => void): () => void {
  const camada = el(
    'div',
    { id: 'girar', className: 'girar', attrs: { role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'girar-titulo', 'aria-describedby': 'girar-texto' } },
    el('img', { src: 'assets/leo/leo-think.svg', alt: '', width: 96, height: 128, className: 'girar-leo' }),
    el('div', { className: 'girar-icone', attrs: { 'aria-hidden': 'true' }, textContent: '🔄' }),
    el('h2', { id: 'girar-titulo', textContent: 'Vire o celular para jogar' }),
    el('p', { id: 'girar-texto', textContent: 'O jogo continua quando a tela ficar deitada.' }),
  );
  camada.hidden = true;
  (document.getElementById('overlay') ?? document.body).append(camada);

  const retrato = window.matchMedia('(orientation: portrait)');
  let atual = false;
  const avaliar = (): void => {
    const precisa = precisaGirar(retrato.matches, window.innerWidth, touchWanted(getState().settings.controlesToque));
    if (precisa === atual) return;
    atual = precisa;
    camada.hidden = !precisa;
    onMudar(precisa);
  };
  retrato.addEventListener('change', avaliar);
  window.addEventListener('resize', avaliar);
  avaliar();
  return () => {
    retrato.removeEventListener('change', avaliar);
    window.removeEventListener('resize', avaliar);
    camada.remove();
  };
}
