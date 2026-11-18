# Relatório da Etapa B — Protótipo Técnico (Marco M2)

Data: 17/11/2026 · Versão: 0.1.0-alpha.1 · Responsável: equipe de desenvolvimento

## O que foi desenvolvido

- **Projeto base:** Vite 8 + TypeScript 7 + Phaser 4.2.1, dependências com versões fixadas, workflow de CI (GitHub Actions) com validação de conteúdo, tipos, testes unitários, E2E em 3 motores de navegador e publicação no GitHub Pages.
- **Leo:** arte vetorial original (7 quadros), controle independente do Phaser com aceleração, *coyote time* (100 ms), *buffer* de pulo (120 ms) e altura variável do salto. Toques rápidos de tecla não se perdem.
- **Física em passo fixo de 60 Hz:** a lógica de movimento roda nos passos da física, não nos quadros de tela.
- **Cena de teste** gerada a partir de um mapa em texto e convertida para o formato do Tiled (`public/levels/teste.tmj`), com degraus, plataforma de pedra, caixa empurrável, plataforma móvel horizontal, plataforma móvel vertical, 2 pontos de controle, painel de desafio, vão da ponte e engrenagem de chegada.
- **Queda sem punição:** cair num vão devolve o Leo ao último ponto de controle; a caixa volta ao lugar se cair.
- **Motor de desafios** independente de fase: sessão com tentativas, dicas progressivas, dica automática no apoio *Acompanhado*, explicação após 3 erros, níveis de apoio *Acompanhado / Padrão / Desafio*.
- **Primeira mecânica educativa:** *Completar sequência → Ponte*. Acertar ergue as pedras do vão, que viram chão de verdade.
- **Banco inicial:** 8 itens de sequência para o 3º ano (6 fixos + 2 modelos parametrizados = **6.969 variações**, todas verificadas automaticamente). Status: **em revisão pedagógica**.
- **Regra de publicação:** o build de produção falha enquanto a fase usar desafios sem aprovação registrada (revisor + data).
- **Janela de desafio em HTML acessível:** `role="dialog"`, foco preso, Esc fecha, Enter verifica, feedback por texto + ícone ✓/✗ (não só cor), botão "Ouvir" com voz pt-BR do aparelho, sem limite de tempo, faixa "Conteúdo em revisão pedagógica".
- Inventário de assets, README e este relatório.

## O que foi testado (e resultado)

| Teste | Ferramenta | Resultado |
|---|---|---|
| 34 testes unitários: controle do Leo (10), formato sequência, sessão, repositório, schema, todos os arquivos de conteúdo, conversor de fases | Vitest | ✅ 34/34 |
| Validação do banco (schema + 6.969 variações) | `npm run validate:content` | ✅ |
| Build de produção recusa conteúdo não aprovado | `npm run build:producao` | ✅ falha como esperado |
| Cena carrega sem erros no console | Playwright + Edge | ✅ |
| Leo anda com a seta | Playwright + Edge | ✅ |
| Altura do salto a 60 e a 144 quadros/s | Playwright + Edge | ✅ **99,92 px nos dois casos** (diferença 0) |
| Desafio só por teclado: erro → feedback "Quase! 1 de 2" + dica automática; acerto → ponte sobe → Leo atravessa sem cair | Playwright + Edge | ✅ |
| Teclas digitadas no campo de resposta não movem o Leo; resposta não numérica gera aviso sem contar tentativa | Playwright + Edge | ✅ |
| Esc fecha; ao reabrir, a mesma sequência continua | Playwright + Edge | ✅ |
| Queda no vão → volta ao ponto de controle sem perder nada | Playwright + Edge | ✅ |
| Ponto de controle ativado vira o local de reaparecimento | Playwright + Edge | ✅ |

Evidências (capturas automáticas): [`evidencias/`](evidencias/).

## O que NÃO foi testado nesta etapa

- **Firefox e Safari/WebKit:** a configuração existe (`PW_ALL_ENGINES=1` no CI), mas não rodou localmente porque os navegadores do Playwright não foram baixados. Rodará no primeiro push para o GitHub.
- **Toque (tablets/celulares):** controles de toque são da Etapa C.
- **Leitor de tela real (NVDA/VoiceOver)** e verificação automática com axe-core: Etapa C.
- **Hardware escolar modesto:** sem inventário da instituição ainda.
- **Testes com crianças:** dependem de autorização (Etapa D).

## Problemas encontrados e corrigidos

1. Apertar e soltar uma tecla no mesmo quadro (comum em toques rápidos ou máquinas lentas) perdia o comando de examinar/pular → comandos agora ficam registrados até serem lidos.
2. Um "E" apertado longe do painel ficava guardado e abria o desafio ao chegar perto → descartado quando não há painel ao alcance.
3. O tecla Esc/Tab da janela era capturada antes do campo de texto, quebrando o Enter → tratamento movido para a própria janela.
4. Os pés do Leo flutuavam 5 px acima do chão → corpo de colisão alinhado à sola da bota.
5. Ícones ✓/✗ quase invisíveis → selos coloridos com contorno.
6. Falta de favicon gerava erro 404 no console → ícone adicionado.

## Riscos e pendências

| Item | Tipo | Situação |
|---|---|---|
| Revisão pedagógica dos 8 itens e conferência dos códigos BNCC (EF03MA10, EF03MA01) | Pedagógico | **[PENDENTE]** educador(a) |
| Licença da arte e do código | Legal | **[PENDENTE]** contratante |
| Conta GitHub do contratante para CI e publicação definitiva | Operacional | **[PENDENTE]** |
| `npm audit`: 5 alertas "high" em `picomatch` (dependência só de ferramentas de build/teste, não vai para o jogo) | Técnico | Monitorar; corrigir quando Vite/Vitest atualizarem |
| Pacote JS de 1,49 MB (394 KB comprimido), quase todo Phaser | Desempenho | Dentro da meta (< 5 MB); avaliar divisão de código na Etapa C |
| O jogo fica muito lento quando o painel do navegador está oculto (limitação do navegador, não do jogo) | Observação | Sem ação |

## Próxima entrega planejada — Etapa C (MVP, marcos M3 e M4)

Fases 1–3 da Caverna dos Enigmas, formatos **Distribuir → Elevador**, **Arranjo retangular → Plataforma** e **Numérico → Porta**, banco de 30 desafios, telas de abertura/escolha de ano/mapa/conclusão, salvamento local, configurações (volumes, remapeamento, modo assistido), controles de toque, áudio CC0, fontes OFL e axe-core nos testes.
