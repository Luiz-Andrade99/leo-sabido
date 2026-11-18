/**
 * Prepara public/voz/ com tudo o que a voz Faber (Piper) precisa para rodar no navegador.
 *   npm run voz:baixar
 * - Modelo da Faber: baixado do repositório oficial rhasspy/piper-voices (revisão fixa) e conferido por SHA-256.
 * - Fonemizador (espeak-ng em WASM) e onnxruntime-web: copiados de node_modules.
 * Nada disso vai para o git (public/voz/ está no .gitignore).
 */
import { createHash } from 'node:crypto';
import { copyFileSync, createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const DEST = 'public/voz';
const REV = '04ca88f5685ca5253c701af3687e155b113bd512';
const HF = `https://huggingface.co/rhasspy/piper-voices/resolve/${REV}/pt/pt_BR/faber/medium`;
const MODELO = [
  ['faber.onnx', `${HF}/pt_BR-faber-medium.onnx`, '75E913EB463DB0B6AC7DDF68D3E4C9AC19ACE36DC3B710A81039B448352B8FFC'],
  ['faber.onnx.json', `${HF}/pt_BR-faber-medium.onnx.json`, '6B6801319E5A70AA4D75C63343515F55D1CD671ECD1AC511586BC16216812261'],
];
const COPIAS = [
  ['node_modules/@diffusionstudio/piper-wasm/build/piper_phonemize.js', 'piper_phonemize.js'],
  ['node_modules/@diffusionstudio/piper-wasm/build/piper_phonemize.wasm', 'piper_phonemize.wasm'],
  ['node_modules/@diffusionstudio/piper-wasm/build/piper_phonemize.data', 'piper_phonemize.data'],
  ['node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm', 'ort/ort-wasm-simd-threaded.wasm'],
  ['node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs', 'ort/ort-wasm-simd-threaded.mjs'],
];

const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase();
const mb = (file) => `${(statSync(file).size / 1024 / 1024).toFixed(1)} MB`;

mkdirSync(`${DEST}/ort`, { recursive: true });
let falhou = false;

for (const [nome, url, hash] of MODELO) {
  const alvo = `${DEST}/${nome}`;
  if (existsSync(alvo) && sha256(alvo) === hash) {
    console.log(`  ✔ ${nome} já conferido (${mb(alvo)})`);
    continue;
  }
  const parcial = `${alvo}.parcial`;
  console.log(`  ↓ ${nome}…`);
  const r = await fetch(url);
  if (!r.ok || !r.body) {
    console.error(`  ✖ ${nome}: HTTP ${r.status}`);
    falhou = true;
    continue;
  }
  await pipeline(Readable.fromWeb(r.body), createWriteStream(parcial));
  const obtido = sha256(parcial);
  if (obtido !== hash) {
    rmSync(parcial, { force: true });
    console.error(`  ✖ ${nome}: SHA-256 não confere (${obtido})`);
    falhou = true;
    continue;
  }
  renameSync(parcial, alvo);
  console.log(`  ✔ ${nome} baixado e conferido (${mb(alvo)})`);
}

for (const [de, para] of COPIAS) {
  copyFileSync(de, `${DEST}/${para}`);
  console.log(`  ✔ ${para} (${mb(`${DEST}/${para}`)})`);
}

if (falhou) process.exit(1);
