import type { LeoTestHooks } from '../scenes/testHooks';

declare global {
  interface Window {
    /** Presente apenas com ?teste=1 (testes automatizados). */
    __leo?: LeoTestHooks;
  }
}

export {};
