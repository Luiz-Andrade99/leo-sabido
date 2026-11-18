import { audio } from '../audio/audio';
import { getState } from '../core/state';

/**
 * Narração por voz sintética do navegador (pt-BR).
 * Escolhe automaticamente a voz mais natural do aparelho (vozes "Natural"/neurais do Edge,
 * "Google português do Brasil" do Chrome, vozes "Aprimoradas/Premium" do iPhone e do Mac, etc.).
 * Algumas dessas vozes são geradas pelo serviço de voz do navegador: ele recebe apenas o texto do jogo,
 * nunca dados da criança. Nas configurações dá para escolher outra voz, inclusive uma só do aparelho.
 */
export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

/** Pontuação de "naturalidade" de uma voz (maior = mais humana). Exportada para testes. */
export function voiceScore(v: Pick<SpeechSynthesisVoice, 'name' | 'lang' | 'localService'>): number {
  const lang = v.lang.toLowerCase().replace('_', '-');
  if (!lang.startsWith('pt')) return -1;
  const n = v.name.toLowerCase();
  let s = lang === 'pt-br' ? 30 : 0;
  if (/natural|neural/.test(n)) s += 100;
  if (/premium|enhanced|aprimorad|melhorad|superior/.test(n)) s += 80;
  if (/google/.test(n)) s += 60;
  if (/online/.test(n)) s += 20;
  if (/francisca|thalita|antonio|luciana|felipe|fernanda/.test(n)) s += 10;
  if (/compact|espeak/.test(n)) s -= 40;
  return s;
}

/** Vozes em português, da mais natural para a menos natural. */
export function rankedVoices(): SpeechSynthesisVoice[] {
  if (!canSpeak()) return [];
  return window.speechSynthesis
    .getVoices()
    .filter((v) => voiceScore(v) >= 0)
    .sort((a, b) => voiceScore(b) - voiceScore(a) || a.name.localeCompare(b.name));
}

/** Avisa quando a lista de vozes do aparelho fica pronta (ela carrega depois da página em alguns navegadores). */
export function onVoicesChanged(fn: () => void): void {
  if (canSpeak()) window.speechSynthesis.addEventListener?.('voiceschanged', fn);
}

const DENOM: Record<number, [string, string]> = {
  2: ['meio', 'meios'],
  3: ['terço', 'terços'],
  4: ['quarto', 'quartos'],
  5: ['quinto', 'quintos'],
  6: ['sexto', 'sextos'],
  7: ['sétimo', 'sétimos'],
  8: ['oitavo', 'oitavos'],
  9: ['nono', 'nonos'],
  10: ['décimo', 'décimos'],
};

/** Reescreve símbolos de matemática, dinheiro e horas para serem lidos como uma pessoa leria. */
export function textoParaFala(t: string): string {
  return t
    .replace(/◀ e ▶/g, 'as setas da tela')
    .replace(/⤒/g, 'o botão de pular')
    .replace(/[💡✓✗✎↻▶◀⚙🔊📜]/gu, '')
    .replace(/R\$\s*(\d+),(\d{2})/g, (_, r: string, c: string) => `${r} ${r === '1' ? 'real' : 'reais'}${c === '00' ? '' : ` e ${Number(c)} centavos`}`)
    .replace(/R\$\s*(\d+)/g, (_, r: string) => `${r} ${r === '1' ? 'real' : 'reais'}`)
    .replace(/\b(\d{1,2}):(\d{2})\b/g, (_, h: string, m: string) => {
      const hh = Number(h);
      const horas = `${hh} ${hh === 1 ? 'hora' : 'horas'}`;
      return m === '00' ? horas : `${horas} e ${Number(m)} minutos`;
    })
    .replace(/\b(\d+)\/(\d+)\b/g, (whole, a: string, b: string) => {
      const d = DENOM[Number(b)];
      return d ? `${a} ${Number(a) === 1 ? d[0] : d[1]}` : `${a} sobre ${b}`;
    })
    .replace(/(^|[\s(,])[x×](\d)/g, '$1vezes $2')
    .replace(/(^|[\s(,])[/÷](\d)/g, '$1dividido por $2')
    .replace(/(\d)\s*[×x]\s*(?=\d)/g, '$1 vezes ')
    .replace(/(\d)\s*÷\s*(?=\d)/g, '$1 dividido por ')
    .replace(/(\d)\s*[−-]\s*(?=\d)/g, '$1 menos ')
    .replace(/(\d)\s*\+\s*(?=\d)/g, '$1 mais ')
    .replace(/\s*=\s*/g, ' igual a ')
    .replace(/(\d)\s*%/g, '$1 por cento')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function chosenVoice(): SpeechSynthesisVoice | undefined {
  const ranked = rankedVoices();
  let pref = '';
  try {
    pref = getState().settings.voz;
  } catch {
    pref = '';
  }
  return (pref && ranked.find((v) => v.name === pref)) || ranked[0];
}

/** Quem fala de fato: o narrador (Faber com plano B) se estiver ligado; senão, a voz do navegador. */
let impl: { falar(t: string): void; parar(): void } | null = null;
export function definirNarrador(n: { falar(t: string): void; parar(): void }): void {
  impl = n;
}

export function speak(text: string): void {
  if (impl) impl.falar(text);
  else falarNavegador(text);
}

export function stopSpeaking(): void {
  if (impl) impl.parar();
  else pararNavegador();
}

/** Narração pela voz sintética do navegador. */
export function falarNavegador(text: string): void {
  if (!canSpeak() || audio.voiceVolume <= 0) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const voice = chosenVoice();
  const natural = voice ? voiceScore(voice) >= 80 : false;
  // Frases curtas em fila: pausas mais naturais e evita o corte de falas longas em alguns navegadores.
  const frases = textoParaFala(text).match(/[^.!?…]+[.!?…]*/g) ?? [];
  for (const f of frases.map((x) => x.trim()).filter(Boolean)) {
    const u = new SpeechSynthesisUtterance(f);
    u.lang = voice?.lang ?? 'pt-BR';
    if (voice) u.voice = voice;
    // Vozes neurais já soam naturais na velocidade normal; as antigas ficam melhores um pouco mais lentas e agudas.
    u.rate = natural ? 0.97 : 0.9;
    u.pitch = natural ? 1 : 1.08;
    u.volume = audio.voiceVolume;
    synth.speak(u);
  }
}

export function pararNavegador(): void {
  if (canSpeak()) window.speechSynthesis.cancel();
}
