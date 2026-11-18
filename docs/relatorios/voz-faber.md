# Relatório: voz Faber no navegador

Data: 18/11/2026 · Versão: 0.10.0-alpha.1 · Desenho: [voz-faber-design](../superpowers/specs/2026-11-18-voz-faber-design.md) · Plano: [voz-faber](../superpowers/plans/2026-11-18-voz-faber.md)

## O que mudou

O narrador passa a usar a voz neural **Faber** (Piper, pt-BR), escolhida depois de ouvir amostras. Ela é gerada no próprio aparelho, num Web Worker:
- o espeak-ng em WebAssembly transforma o texto em fonemas;
- o modelo ONNX, rodando no `onnxruntime-web`, transforma os fonemas em áudio.

Os arquivos vêm do próprio site e ficam guardados no aparelho (Cache Storage). Quando a Faber não está pronta, a voz do navegador assume.

## Tempos medidos (computador de desenvolvimento, Intel i7-1355U)

Frase do desafio: "Para abrir a porta, descubra: quanto é três quartos de oito?", com cerca de 3,9 s de áudio.

| Situação | Edge | Firefox 146 |
|---|---|---|
| Uma thread só (sem isolamento de origem) | 5,5 a 6,4 s ❌ | 4,0 s ❌ |
| Vários núcleos (service worker de isolamento) | **0,7 a 2,1 s** ✅ (até 3,6 s com o computador ocupado) | **1,3 s** ✅ |
| Conversão em fonemas | ~1 s por frase → **0,05 s**, reaproveitando uma única instância do espeak-ng | 0,03 s |

Meta do plano: ≤ 2,5 s. Foi atingida depois de duas mudanças: o isolamento de origem, que libera vários núcleos, e o reaproveitamento do espeak-ng.

**Até a voz ficar pronta** (o servidor local tira o peso da internet da conta):

| Momento | Tempo |
|---|---|
| Primeira visita | 15 a 28 s: arquivos de 6 a 16 s, montagem do modelo de 7 a 11 s, aquecimento de cerca de 2 s |
| Visitas seguintes, com os arquivos já no aparelho | 8 a 10 s, quase todo na montagem do modelo |

A montagem custa cerca de 7 s também com uma thread só e também no formato `.ort`, então foi mantida a configuração simples. Nesse intervalo, o narrador usa a voz do navegador.

**Dica para apresentar:** abra o jogo cerca de 30 s antes e confira em Configurações se aparece "Leo (natural) — recomendado".

## Como funciona

- **Primeira visita:** o service worker `coi-sw.js` é instalado e a página recarrega uma vez. Ele só acrescenta os cabeçalhos COOP/COEP/CORP às respostas do próprio site, o que o GitHub Pages não deixa configurar. Com eles, o WebAssembly pode usar até 4 núcleos.
- **Download:** começa sozinho quando o jogo termina de carregar, com o aviso "Baixando a voz do narrador (92 MB, só uma vez)…".
  - Os arquivos vão direto para o Cache Storage (`leo-voz-v1`).
  - Um download interrompido não deixa arquivo pela metade.
- **Fala:** o narrador gera frase por frase e toca a primeira enquanto gera as próximas.
  - Uma fala nova interrompe a anterior.
  - As 60 últimas frases ficam guardadas na memória.
  - Se a Faber falhar no meio, o resto da fala vai para a voz do navegador.
- **Gerar antes:** a história, as placas da fase e a instrução do desafio de que o Leo se aproxima (até 6 tiles) são preparadas quando a narração está ligada (1º ano ou "Ler instruções em voz alta").
- **Aparelhos sem suporte:** sem WebAssembly, sem Cache Storage ou com menos de 2 GB de memória informados, o estado fica "não disponível neste aparelho" e o jogo usa a voz do navegador, sem erro.

## Limites honestos

- **Celulares reais:** os tempos acima são de um computador. Num celular médio a geração deve ser 2 a 4 vezes mais lenta. O roteiro [A2](../testes/roteiro-testes-manuais.md) pede para medir num aparelho real.
- **Safari/iPhone:** não foi medido. O WebKit emulado no Windows não representa o desempenho de um iPhone, e o isolamento de origem por service worker depende de suporte do Safari (disponível nas versões atuais).
- **Tamanho:** a primeira visita baixa cerca de 92 MB. O motor ONNX ocupa 14 MB, mais que os ~11 MB estimados no desenho.
- **Licença:** o `piper_phonemize` contém o espeak-ng (GPL-3.0). Ele é distribuído como arquivo separado, e o código-fonte está indicado no [inventário de assets](../inventario-assets.md).
