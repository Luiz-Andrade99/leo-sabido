# Voz do narrador: Faber (Piper) dentro do jogo — desenho

Data: 18/11/2026 · Pedido: "narração muito robotizada, queria uma narração mais profissional e parecendo humana"

## Intenção

O narrador soa robótico porque o jogo usa as vozes do navegador, e no Chrome do Windows e em muitos celulares só existem vozes antigas ("Maria", "Daniel"). O jogo será mostrado na faculdade, em aparelhos variados. O narrador precisa soar humano **em qualquer aparelho**, com **a mesma voz**, sem custo.

## Objetivos

- A voz **Faber**, escolhida pelo usuário depois de ouvir as amostras, narra tudo: a história, as placas, as instruções dos desafios, os acertos, os erros e as dicas.
- É grátis e sem conta. Nenhuma requisição sai para sites de terceiros: todos os arquivos ficam no próprio GitHub Pages do jogo.
- **Download automático** (decisão do usuário): começa sozinho, em segundo plano, quando o jogo abre. Um aviso discreto informa isso, e as Configurações permitem desligar.
- Depois do primeiro download, a voz fica no aparelho e funciona sem internet.
- O jogo nunca fica mudo: enquanto a Faber carrega, ou se ela falhar, o narrador usa a voz do navegador, como hoje.

## Fora do escopo

- Serviço de voz na nuvem. O usuário escolheu "só grátis".
- Mais de uma voz neural ou troca entre vozes neurais.
- Gravar arquivos de áudio prontos no repositório. A voz é gerada no aparelho, na hora.

## O que seria um fracasso, mesmo funcionando

- O jogo travar ou engasgar enquanto a voz é gerada. A geração precisa rodar fora da linha principal, num Web Worker.
- O jogo ficar mudo ou esperar vários segundos sem dar nenhum sinal.
- Quebrar a promessa "sem coleta de dados" carregando arquivos de CDN ou do Hugging Face.
- O repositório ficar pesado (o modelo tem 60 MB).

## Restrições

- **Site estático (GitHub Pages):** não dá para configurar cabeçalhos COOP/COEP. Por isso o onnxruntime roda com **uma única thread** em WASM.
- **Tamanho do primeiro download:** cerca de 79 MB.
  - modelo `pt_BR-faber-medium.onnx`: 60,3 MB;
  - dados de pronúncia do espeak-ng: 17,7 MB;
  - motor WASM do espeak-ng: 0,6 MB;
  - onnxruntime WASM: cerca de 11 MB.

  Depois disso, nada é baixado de novo, porque fica guardado no Cache Storage.
- **Licenças:**
  - Código do Piper, `@diffusionstudio/piper-wasm` e `onnxruntime-web`: MIT.
  - Dataset da Faber: CC0. O modelo da Faber foi ajustado a partir do hifi_tts_92 (Hi-Fi TTS, CC BY 4.0), então os créditos devem citá-lo.
  - O `piper_phonemize.wasm` inclui o espeak-ng, que é **GPL-3.0**. Ele é distribuído como arquivo separado, com aviso e link para o código-fonte nos créditos. O repositório já é público.
- **Origem do modelo:** repositório oficial `rhasspy/piper-voices`, fixado na revisão `04ca88f5685ca5253c701af3687e155b113bd512`. O SHA-256 é conferido em cada download:
  - `.onnx`: `75E913EB463DB0B6AC7DDF68D3E4C9AC19ACE36DC3B710A81039B448352B8FFC`;
  - `.onnx.json`: `6B6801319E5A70AA4D75C63343515F55D1CD671ECD1AC511586BC16216812261`.

## Abordagens consideradas

1. **Só melhorar a escolha da voz do navegador.** Barato, mas continua robótico na maioria dos aparelhos. Descartada.
2. **Gravar só as falas fixas com uma voz neural.** Os desafios mudam a cada partida e ficariam com outra voz, e duas vozes soam amador. Descartada.
3. **Faber (Piper) rodando no navegador** — **escolhida.** Uma só voz humana, grátis e offline. O custo é o download inicial e o tempo de geração em aparelhos fracos.
   - Entre as vozes neurais testadas (Faber, Dora, Alex e Santa), o usuário escolheu a **Faber**.
   - Pacote pronto (`@mintplex-labs/piper-tts-web`) contra implementação própria e enxuta: o pacote busca o modelo no Hugging Face e os WASM em CDNs, com endereço fixo no código. Por isso a escolha é uma **implementação própria** (cerca de 200 linhas) sobre `onnxruntime-web` e `@diffusionstudio/piper-wasm`, servindo tudo do próprio site.

## O que foi decidido

- **Voz:** Faber, `pt_BR-faber-medium`, com os parâmetros das amostras aprovadas: `length_scale` 1,05, `noise_scale` 0,667 e `noise_w` 0,8.
- **Download:** automático, em segundo plano, quando o jogo abre. O usuário pode desligar em Configurações.
- **Plano B:** a voz do navegador, como hoje, enquanto a Faber carrega ou se ela falhar.

## Como funciona

1. **Arquivos da voz** em `public/voz/`, servidos pelo próprio site:
   - `faber.onnx` e `faber.onnx.json`;
   - `piper_phonemize.{js,wasm,data}`;
   - os `.wasm` do onnxruntime.

   O modelo **não entra no git**. Um script `scripts/baixar-voz.mjs` baixa o modelo da revisão fixada, confere o SHA-256 e copia os WASM dos pacotes npm. Ele roda:
   - no `npm run build` local, quando os arquivos faltam;
   - no workflow do GitHub Pages, com cache do Actions.
2. **Worker `src/voz/faber.worker.ts`:** carrega o espeak-ng, que transforma texto em fonemas, e o modelo ONNX. Recebe `{texto}` e devolve áudio PCM de 22.050 Hz. Os arquivos ficam no Cache Storage, chave `leo-voz-v1`.
3. **`src/voz/narrador.ts`** decide quem fala:
   - Se a Faber está pronta e ligada, divide o texto em frases (com `textoParaFala`, como hoje). Gera a primeira frase e já começa a tocar, enquanto gera as próximas. Toca pelo `AudioContext` do jogo, respeitando o volume da voz.
   - Se a Faber não está pronta, usa `speechSynthesis`, que é o `speak()` atual.
   - Uma nova fala cancela a anterior, como hoje.
   - O cache em memória das últimas cerca de 50 falas faz o botão "Ouvir" repetir na hora.
4. **Geração antecipada:** ao entrar numa fase, o jogo gera em segundo plano as falas das placas e a primeira frase de cada desafio da fase. Na tela da história, gera as 3 falas.
5. **Configurações (grupo Som), opção "Voz do narrador":**
   - "Leo (Faber, natural) — recomendado". Mostra o estado: "baixando 42%", "pronta" ou "não disponível neste aparelho".
   - As vozes do navegador, como hoje.
   - "Testar voz" usa a voz selecionada.
   - O ajuste `vozNeural: boolean`, padrão `true`, liga ou desliga o download e o uso da Faber.
6. **Aviso:** na primeira abertura aparece um aviso pequeno e não bloqueante: "Baixando a voz do narrador (79 MB, só uma vez)…". Enquanto houver texto sendo gerado, aparece um indicador discreto "🔊…".
7. **Falhas:** a Faber é desativada para aquela sessão, sem erro na tela, e a voz do navegador é usada nestes casos:
   - sem WebAssembly ou sem Cache Storage;
   - erro no download;
   - aparelho com memória baixa (`navigator.deviceMemory` < 2).

## Riscos e verificação

- **Velocidade no WASM com uma única thread:**
  - No Python, uma frase de desafio levou cerca de 1,6 s.
  - No navegador, sem threads, deve levar de 2 a 4 vezes mais.
  - A **primeira tarefa do plano é um teste de viabilidade no navegador** (Edge e Firefox deste computador), com uma meta de decisão: a primeira frase de um desafio deve começar a tocar em até **2,5 s** num computador comum.
  - Se não atingir a meta, paro e trago números ao usuário antes de continuar.
- **Celulares reais:** a emulação deste computador não mede a CPU de um celular. O roteiro de testes manuais ganha um item para medir o tempo da primeira fala num celular real.
- **"Requer Piper 1.5+":** isso aparece no cartão do modelo. O teste de viabilidade confirma que o espeak-ng do `piper-wasm` gera os mesmos fonemas e que o modelo roda no `onnxruntime-web`, comparando com a amostra gerada em Python.
- **Testes automatizados:**
  - Unitários:
    - divisão em frases;
    - escolha entre Faber e navegador;
    - fila e cancelamento;
    - o estado "baixando/pronta/indisponível".
  - E2E:
    - com `?teste=1`, a Faber fica desligada, salvo com `&voz=faber`, e a suíte atual não muda nem baixa 79 MB a cada teste;
    - um teste novo, com `&voz=faber`, confirma que a Faber gera áudio de verdade no Edge.

## O que fica a critério de quem implementar

- O formato exato das mensagens entre o worker e o narrador.
- O tamanho do cache em memória.
- O texto final do aviso e do indicador, dentro do tom do jogo.
