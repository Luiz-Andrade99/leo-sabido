# Relatório da Etapa C — MVP Funcional (Marcos M3 e M4)

Data: 17/11/2026 · Versão: 0.2.0-alpha.1

## O que foi desenvolvido

**Fluxo do jogo (seção 9):** abertura → história do Leo (3 quadros, com "Ouvir" e "Pular") → escolha do ano (só o 3º ativo; 1º, 2º, 4º, 5º e 6º "Em construção", sem como escolher) → mapa da Caverna dos Enigmas com desbloqueio em ordem → fase → tela "Fase concluída" com o que foi descoberto, cristais, dicas e conquistas → próxima fase → "Você recuperou a Terceira engrenagem!". Pausa com continuar, reiniciar, configurações e sair.

**Três fases** (mapas gerados de texto para o formato Tiled):

| Fase | Mecânicas educativas | Elementos de jogo |
|---|---|---|
| 1 · Entrada da Caverna | Porta (problema numérico) · Ponte (sequência) | 6 placas de tutorial, buraco, pontos de controle, caixa, 5 cristais |
| 2 · Galeria dos Cristais | Elevador (distribuir) · Ponte (distribuir com resto) | plataforma móvel, paredão de 6 blocos, 5 cristais |
| 3 · Salão das Engrenagens | Escada de blocos (arranjo) · Porta (problema) · Elevador (arranjo) | plataforma vertical, engrenagem final, 5 cristais |

**4 formatos de desafio** com o mesmo contrato (sortear, enumerar, validar, avaliar): sequência, problema numérico (juntar/acrescentar, retirar, completar, comparar), distribuir igualmente (com e sem resto) e arranjo retangular. Cada um tem interface HTML própria, operável só por teclado, com ✓/✗ por parte da resposta e mensagens específicas (ex.: "3 linhas de 3 = 9 blocos — faltam 3"; "as máquinas estão iguais, mas ainda sobram 6 cristais").

**4 mecanismos de cenário:** porta, ponte, escada de blocos e elevador.

**Banco:** 31 itens (meta do MVP: 30), 12.352 variações verificadas automaticamente, **todos em revisão pedagógica**. Inventário gerado do próprio banco: [inventario-exercicios.md](../pedagogico/inventario-exercicios.md). Matriz: [matriz-3ano.md](../pedagogico/matriz-3ano.md).

**Salvamento local** (sem dados pessoais): ano escolhido, fases concluídas, tentativas e dicas por desafio, melhores cristais, conquistas e tempo aproximado. Esquema versionado, recuperação de dados corrompidos (com cópia de segurança), aviso quando o navegador não deixa salvar, e código de progresso para levar a outro computador.

**Configurações:** volumes de música, efeitos e voz; nível de apoio (Acompanhado/Padrão/Desafio); modo assistido (blocos de apoio e plataformas mais lentas); narração automática; reduzir animações; texto maior; controles de toque (automático/sempre/nunca); remapeamento de teclas com tratamento de conflitos.

**Áudio original sintetizado** (efeitos e duas músicas generativas), sem arquivos de terceiros. **Controles de toque** com botões grandes. **Conquistas** que valorizam esforço (pedir ajuda, persistir, explorar), nunca velocidade ou comparação.

**Documentos:** [GDD](../gdd/gdd.md), [matriz pedagógica](../pedagogico/matriz-3ano.md), [inventário de exercícios](../pedagogico/inventario-exercicios.md), [roteiro de testes manuais](../testes/roteiro-testes-manuais.md), [plano e instrumentos de teste com usuários](../testes/plano-testes-usuarios.md), [inventário de assets](../inventario-assets.md), [CHANGELOG](../../CHANGELOG.md), README.

## O que foi testado (e resultado)

| Teste | Ferramenta | Resultado |
|---|---|---|
| 77 testes unitários: controle do Leo, 4 formatos, sessão/dicas/apoio, validação de textos, repositório, salvamento/recuperação/exportação, progressão/conquistas, teclas, conversor de fases | Vitest | ✅ 77/77 |
| Validação do banco, mundos e fases | `npm run validate:content` | ✅ |
| Build de produção recusa conteúdo não aprovado | `npm run build:producao` | ✅ falha como esperado |
| **Fluxo completo**: abertura → história → ano → mapa → fases 1, 2 e 3 → engrenagem, resolvendo cada painel pela interface e atravessando cada mecanismo (porta, ponte, elevador, escada) | Playwright + Edge | ✅ |
| Progresso mantido após recarregar a página | Playwright + Edge | ✅ |
| Trocar de ano não apaga progresso; anos em construção não podem ser escolhidos | Playwright + Edge | ✅ |
| Pausa congela a física; reiniciar devolve os painéis ao estado inicial; Esc volta ao jogo | Playwright + Edge | ✅ |
| Física: salto com mesma altura a 60 e 144 quadros/s; parar ao soltar a tecla; queda → ponto de controle; cristais contados | Playwright + Edge | ✅ |
| Modo assistido: bloco de apoio segura o Leo no buraco | Playwright + Edge | ✅ |
| Desafios: erro com ✗ e dica automática; "menor/maior" no numérico; texto inválido não conta tentativa; teclas digitadas não movem o Leo; distribuir com resto recusa sobra grande; arranjo mostra "faltam"; Esc e reabrir mantém o desafio | Playwright + Edge | ✅ |
| Remapear o pulo para J e pular com J | Playwright + Edge | ✅ |
| Configurações persistem após recarregar | Playwright + Edge | ✅ |
| Salvamento corrompido: aviso, cópia de segurança, sem erro no console | Playwright + Edge | ✅ |
| Código de progresso: inválido recusado, válido carregado | Playwright + Edge | ✅ |
| Toque em tela de celular (844×390): botão move o Leo e soltar faz parar | Playwright + Edge (emulação) | ✅ |
| **Acessibilidade automática** (axe-core, regras WCAG 2.0/2.1/2.2 A e AA): abertura, história, escolha do ano, mapa, configurações, sobre, pausa e as 4 janelas de desafio | Playwright + axe-core | ✅ sem violações (após correções abaixo) |
| Nenhum erro de console no fluxo completo; nenhum dado pessoal no salvamento | Playwright + Edge | ✅ |

Total E2E: **22 testes, todos passando**. Evidências: [`evidencias/`](evidencias/) (arquivos `c-*.png`).

## O que NÃO foi testado

- **Firefox e Safari/WebKit:** configurados no CI, mas não executados aqui (os navegadores do Playwright não foram baixados).
- **Dispositivos reais** (iPad, Android, computadores do laboratório parceiro) e **desempenho em hardware escolar**.
- **Leitores de tela reais** (NVDA, VoiceOver) e zoom de 200%: estão no roteiro manual.
- **Concluir uma fase inteira só por toque** (o teste cobre o movimento; os desafios usam botões HTML comuns).
- **Testes com crianças e educadores** (Etapa D; dependem de autorização).

## Problemas encontrados e corrigidos

1. **Distribuir:** um erro de precedência no filtro "com resto / sem resto" fazia o modelo não gerar nenhuma variação — pego pelos testes unitários.
2. **Acessibilidade (WCAG 2.5.3):** os botões de escolha do ano e o botão de pausa tinham nome para leitor de tela diferente do texto visível → nomes alinhados.
3. **Acessibilidade (contraste):** rótulos das fases bloqueadas ficavam abaixo de 4,5:1 por causa de transparência → cores sólidas e tom de latão mais escuro.
4. Telas de menu em janelas baixas cortavam o topo e não rolavam → centralização refeita.
5. Balão das placas cobria o Leo → posicionado acima.
6. Modelo de arranjo podia sortear "2 linhas de 2" (trivial) → mínimo de 3 blocos por linha nesse item.

## Critérios de aceite da Etapa C (do planejamento)

| Critério | Situação |
|---|---|
| 3 fases concluíveis por teclado, toque e modo assistido | ✅ teclado (E2E) · ⚠ toque e modo assistido verificados em parte |
| ≥ 4 formatos educativos com consequência visível | ✅ 4 formatos, 4 mecanismos |
| 30 desafios no schema, validador sem erros, dica e explicação em todos | ✅ 31 |
| Progresso salvo e restaurado; dados corrompidos não travam | ✅ |
| Unitários e E2E passando em Chromium, Firefox e WebKit | ⚠ Chromium/Edge ✅ · Firefox/WebKit pendentes |
| axe-core sem violações sérias; sem erros no console | ✅ |
| Inventário de assets e licenças de dependências | ✅ |
| Conteúdo aprovado com registro de revisor(a) | ❌ **pendente de educador(a)** — MVP rotulado "em revisão pedagógica" |

## Riscos e pendências

| Item | Tipo | Situação |
|---|---|---|
| Revisão pedagógica dos 31 itens e da matriz BNCC | Pedagógico | **[PENDENTE]** educador(a) |
| Testes em Firefox, Safari, tablets e PCs do laboratório | Técnico | **[PENDENTE]** — requer CI no GitHub ou acesso aos aparelhos |
| Autorização da instituição e termos para a Etapa D | Operacional/legal | **[PENDENTE]** |
| Fontes OFL (Andika/Atkinson) não embarcadas | Acessibilidade | Usa fontes do sistema; precisa autorização para baixar os arquivos |
| Repositório Git e conta do contratante | Operacional | Projeto ainda sem repositório Git |
| Licença da arte e do código | Legal | **[PENDENTE]** contratante |
| `npm audit`: alertas em `picomatch` (só ferramentas de desenvolvimento) | Técnico | Monitorar |
| Pacote JS de 1,57 MB (413 KB comprimido) | Desempenho | Dentro da meta de 5 MB |

## Próxima entrega planejada — Etapa D (validação com a comunidade)

Depende de autorização: sessões com 6–10 crianças do 3º ano e um(a) educador(a), usando o [plano e os instrumentos](../testes/plano-testes-usuarios.md), seguidas de relatório de ajustes e versão revisada do MVP. Em paralelo, sem depender de terceiros: repositório Git + CI (Firefox/Safari), revisão de código e preparação da Etapa E (próximo mundo).
