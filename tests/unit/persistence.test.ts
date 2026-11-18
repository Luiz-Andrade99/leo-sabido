import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MundosSchema, type AnoInfo } from '../../src/content/schema';
import { addTime, chooseAno, completeFase, isFaseUnlocked, proximaFase } from '../../src/core/progress';
import { BACKUP_KEY, SAVE_KEY, SaveStore, defaultSave, exportSave, importSave, parseSave, type KeyValueStorage } from '../../src/core/save';
import { DEFAULT_BINDINGS, keyFromCode, remapKey } from '../../src/core/settings';

const mundos = MundosSchema.parse(JSON.parse(readFileSync('content/mundos.json', 'utf8')));
const ano3 = mundos.anos[2] as AnoInfo;

class MemoryStorage implements KeyValueStorage {
  data = new Map<string, string>();
  getItem(k: string): string | null {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    this.data.set(k, v);
  }
}

describe('salvamento', () => {
  it('sem dados → salvamento novo com configurações padrão', () => {
    const r = parseSave(null);
    expect(r.status).toBe('novo');
    expect(r.save.settings.apoio).toBe('padrao');
    expect(r.save.settings.teclas).toEqual(DEFAULT_BINDINGS);
  });

  it('ida e volta preserva tudo', () => {
    const s = { ...defaultSave(), ano: 3, introVista: true };
    expect(parseSave(JSON.stringify(s))).toEqual({ save: s, status: 'ok' });
  });

  it('JSON quebrado ou versão desconhecida → recupera sem lançar erro e guarda cópia', () => {
    const st = new MemoryStorage();
    st.setItem(SAVE_KEY, '{quebrado');
    const r = new SaveStore(st).load();
    expect(r.status).toBe('recuperado');
    expect(r.save).toEqual(defaultSave());
    expect(st.getItem(BACKUP_KEY)).toBe('{quebrado');
    expect(parseSave(JSON.stringify({ versao: 99 })).status).toBe('recuperado');
  });

  it('armazenamento que lança erro (modo privado) não trava o jogo', () => {
    const broken: KeyValueStorage = {
      getItem: () => {
        throw new Error('negado');
      },
      setItem: () => {
        throw new Error('negado');
      },
    };
    const store = new SaveStore(broken);
    expect(store.load().status).toBe('indisponivel');
    expect(store.write(defaultSave())).toBe(false);
    expect(new SaveStore(null).load().status).toBe('indisponivel');
  });

  it('exporta e importa o progresso como código de texto', () => {
    const s = { ...defaultSave(), ano: 3, conquistas: ['primeiro-desafio'], tempoSegundos: 120 };
    expect(importSave(exportSave(s))).toEqual(s);
    expect(importSave('não é um código')).toBeNull();
  });
});

describe('progresso', () => {
  it('só a primeira fase começa aberta', () => {
    const s = defaultSave();
    expect(isFaseUnlocked(s, ano3, 'f1')).toBe(true);
    expect(isFaseUnlocked(s, ano3, 'f2')).toBe(false);
    expect(proximaFase(ano3, 'f1')).toBe('f2');
    expect(proximaFase(ano3, 'f3')).toBe('f4');
    expect(proximaFase(ano3, 'f5')).toBeNull();
  });

  it('concluir a fase abre a próxima, guarda tentativas/dicas e concede conquistas uma só vez', () => {
    const r = completeFase(defaultSave(), ano3, 'f1', {
      cristais: 5,
      cristaisTotal: 5,
      desafios: [
        { id: 'A', tentativas: 1, dicas: 0, resolvido: true },
        { id: 'B', tentativas: 3, dicas: 1, resolvido: true },
      ],
    });
    expect(isFaseUnlocked(r.save, ano3, 'f2')).toBe(true);
    expect(r.save.anos['3']!.fases['f1']!.desafios['B']).toEqual({ tentativas: 3, dicas: 1, resolvido: true });
    expect(r.novasConquistas.map((c) => c.id).sort()).toEqual(['colecionador', 'pediu-ajuda', 'persistente', 'primeiro-desafio']);
    const again = completeFase(r.save, ano3, 'f1', { cristais: 2, cristaisTotal: 5, desafios: [{ id: 'A', tentativas: 2, dicas: 0, resolvido: true }] });
    expect(again.novasConquistas).toEqual([]);
    expect(again.save.anos['3']!.fases['f1']!.cristais).toBe(5); // guarda o melhor
    expect(again.save.anos['3']!.fases['f1']!.desafios['A']!.tentativas).toBe(3);
    expect(again.save.anos['3']!.fases['f1']!.vezes).toBe(2);
  });

  it('concluir todas as fases recupera a engrenagem uma única vez (e só na última)', () => {
    let s = defaultSave();
    let last = false;
    for (const f of ano3.fases.map((x) => x.id)) {
      expect(last).toBe(false);
      const r = completeFase(s, ano3, f, { cristais: 0, cristaisTotal: 3, desafios: [] });
      s = r.save;
      last = r.mundoConcluido;
    }
    expect(last).toBe(true);
    expect(s.anos['3']!.pecaRecuperada).toBe(true);
    expect(s.conquistas).toContain('engrenagem-3');
    expect(completeFase(s, ano3, 'f5', { cristais: 0, cristaisTotal: 3, desafios: [] }).mundoConcluido).toBe(false);
  });

  it('trocar de ano não apaga progresso', () => {
    const done = completeFase(defaultSave(), ano3, 'f1', { cristais: 0, cristaisTotal: 0, desafios: [] }).save;
    const back = chooseAno(chooseAno(done, 5), 3);
    expect(back.anos['3']!.fases['f1']!.concluida).toBe(true);
  });

  it('tempo de atividade ignora valores inválidos e limita saltos', () => {
    const s = defaultSave();
    expect(addTime(s, -5).tempoSegundos).toBe(0);
    expect(addTime(s, Number.NaN).tempoSegundos).toBe(0);
    expect(addTime(s, 99999).tempoSegundos).toBe(3600);
  });

  it('mundos.json: todos os seis anos disponíveis, cada um com 5 fases (versão 1.0)', () => {
    expect(mundos.anos.filter((a) => a.disponivel).map((a) => a.ano)).toEqual([1, 2, 3, 4, 5, 6]);
    for (const a of mundos.anos) expect(a.fases.map((f) => f.id)).toEqual(['f1', 'f2', 'f3', 'f4', 'f5']);
    expect(mundos.anos.flatMap((a) => a.fases).length).toBe(30);
  });
});

describe('teclas', () => {
  it('converte códigos do teclado e recusa Esc/Tab', () => {
    expect(keyFromCode('KeyJ')).toBe('J');
    expect(keyFromCode('ArrowUp')).toBe('UP');
    expect(keyFromCode('Digit3')).toBe('THREE');
    expect(keyFromCode('Escape')).toBeNull();
    expect(keyFromCode('Tab')).toBeNull();
  });

  it('remapear para tecla livre a coloca como principal', () => {
    const b = remapKey(DEFAULT_BINDINGS, 'jump', 'J');
    expect(b.jump[0]).toBe('J');
    expect(b.jump).toContain('SPACE');
  });

  it('remapear para tecla de outra ação tira a tecla da outra ação', () => {
    const b = remapKey(DEFAULT_BINDINGS, 'jump', 'E');
    expect(b.jump[0]).toBe('E');
    expect(b.interact).toEqual(['ENTER']);
  });

  it('nenhuma ação fica sem tecla: se precisar, as teclas são trocadas', () => {
    const only = { ...DEFAULT_BINDINGS, interact: ['E'] };
    const b = remapKey(only, 'jump', 'E');
    expect(b.jump[0]).toBe('E');
    expect(b.interact).toEqual(['SPACE']);
    expect(b.jump).not.toContain('SPACE');
    for (const keys of Object.values(b)) expect(keys.length).toBeGreaterThan(0);
  });
});
