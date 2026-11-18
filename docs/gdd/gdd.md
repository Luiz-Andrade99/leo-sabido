# Game Design Document — Leo Sabido (MVP: Mundo 3)

Versão 0.2 · 17/11/2026

## 1. Visão
Platformer 2D educativo. Leo, um jovem inventor, recupera as seis peças da Grande Engrenagem do Saber, uma em cada mundo (1º ao 6º ano). Os desafios de matemática **são** os mecanismos do cenário: resolver ergue pontes, abre portas, liga elevadores e monta escadas.

**Pilares:** diversão de plataforma · aprendizagem com consequência visível · zero punição por errar.

## 2. Fluxo do jogador
Abertura → História (3 quadros, pode pular, narração opcional) → Escolha do ano (os seis anos ativos) → Mapa do mundo (fases bloqueiam/desbloqueiam em ordem) → Fase → Tela de conclusão ("O que você descobriu", cristais, dicas, conquistas) → Próxima fase → Conclusão do mundo (engrenagem recuperada).

Pausa (Esc ou botão): continuar, reiniciar fase, configurações, sair para o mapa.

## 3. Controles
| Ação | Teclado (remapeável) | Toque |
|---|---|---|
| Andar | ← → / A D | ◀ ▶ |
| Pular (segurar = mais alto) | Espaço / ↑ / W | ⤒ |
| Examinar painel | E / Enter | E |
| Pausar | Esc | botão ⏸ |

Física: passo fixo de 60 Hz; *coyote time* 100 ms; *buffer* de pulo 120 ms; salto ≈ 100 px (≈3 tiles); alcance horizontal ≈ 5 tiles.

## 4. Elementos de fase
| Elemento | Comportamento |
|---|---|
| Ponto de controle (bandeira) | Ao tocar, vira o lugar de reaparecimento |
| Buraco | Cair devolve ao último ponto de controle (sem perder nada) |
| Caixa | Empurrável; serve de degrau; volta ao lugar se cair |
| Plataforma móvel | Vai e volta; carrega o Leo |
| Cristal | Coletável opcional; contado no HUD e na conclusão |
| Placa | Mostra e anuncia uma dica de jogo (tutorial) |
| Bloco de apoio | Só existe no **modo assistido**; cobre buracos e degraus difíceis |
| Painel `?` | Abre o desafio; ligado a um mecanismo |
| Porta / Ponte / Blocos / Elevador | Mecanismos ativados pelo acerto |
| Portal / Engrenagem | Saída da fase |

## 5. Fases do Mundo 3
| Fase | Ensina (jogo) | Desafios | Cristais |
|---|---|---|---|
| 1 · Entrada da Caverna | andar, pular, pontos de controle, cristais, painéis, caixas (6 placas) | Porta (problema numérico) · Ponte (sequência) | 5 |
| 2 · Galeria dos Cristais | plataforma móvel, elevador | Elevador (distribuir) · Ponte (distribuir com resto) | 5 |
| 3 · Salão das Engrenagens | escada de blocos, plataforma vertical | Escada (arranjo) · Porta (problema) · Elevador (arranjo) | 5 |

## 5a. Fases do Mundo 1 — Floresta dos Números (1º ano)
| Fase | Ensina (jogo) | Desafios | Coletáveis |
|---|---|---|---|
| 1 · Clareira das Estrelas | andar, pular, painel | Ponte (contagem) · Porta (figuras) | 5 bolotas |
| 2 · Rio dos Cogumelos | elevador, escada | Elevador (comparar) · Escada (juntar/tirar) | 4 bolotas |
| 3 · Árvore Antiga | ponte, elevador, porta | Ponte (padrão) · Elevador (contagem) · Porta (juntar/tirar) | 4 bolotas |

Sem plataformas móveis nem caixas. Respostas por toque em imagens; narração automática de tudo.

## 5b. Fases do Mundo 2 — Vila das Descobertas (2º ano)
| Fase | Ensina (jogo) | Desafios | Coletáveis |
|---|---|---|---|
| 1 · Praça dos Inventores | plataforma móvel, caixa | Porta (problema) · Ponte (sequência) | 5 parafusos |
| 2 · Mercado das Engrenagens | elevador, escada | Elevador (dinheiro) · Escada (valor posicional) | 4 parafusos |
| 3 · Torre do Relógio | plataforma vertical | Elevador (relógio) · Porta (dobro/metade) · Ponte (sequência) | 4 parafusos |

Tema: céu claro, casinhas de telhado terracota, moinhos, terra e grama; música mais rápida e aguda. A mesma cena de fase serve aos dois mundos; só o tema muda (`src/scenes/themes.ts`).

## 5c. Fases do Mundo 4 — Castelo das Estratégias (4º ano)
| Fase | Ensina (jogo) | Desafios | Coletáveis |
|---|---|---|---|
| 1 · Portão do Castelo | plataforma móvel, caixa | Porta (igualdade) · Ponte (múltiplos) | 5 chaves |
| 2 · Pátio das Bandeiras | elevador, escada, plataforma vertical | Elevador (gráfico de colunas) · Escada (multiplicação/divisão) | 4 chaves |
| 3 · Torre das Frações | ponte, elevador, porta | Ponte (fração) · Elevador (fração) · Porta (igualdade) | 4 chaves |

Tema: castelo ao entardecer, muralhas e torres com bandeiras, pedras cinzentas; interface mais sóbria (sem texto ampliado).

## 5d. Fases do Mundo 5 — Cidade dos Inventores (5º ano)
| Fase | Ensina (jogo) | Desafios | Coletáveis |
|---|---|---|---|
| 1 · Praça das Invenções | plataforma móvel rápida, caixa | Porta (decimal) · Ponte (porcentagem) | 5 lâmpadas |
| 2 · Fábrica de Engrenagens | elevador, escada, plataforma vertical | Elevador (gráfico) · Plataforma (área e perímetro) | 4 lâmpadas |
| 3 · Usina de Energia | elevador, porta, ponte | Elevador (porcentagem) · Porta (problema) · Ponte (decimal) | 4 lâmpadas |

Tema: prédios de cobre com janelas acesas, hélices e canos, chão de placas verde-água; música mais rápida.

## 5e. Fases do Mundo 6 — Laboratório do Saber (6º ano)
| Fase | Ensina (jogo) | Desafios | Coletáveis |
|---|---|---|---|
| 1 · Sala dos Circuitos | plataforma móvel veloz, caixa | Porta (divisibilidade) · Ponte (expressão) | 5 frascos |
| 2 · Oficina dos Robôs | elevador, escada, plataforma vertical | Elevador (programa) · Blocos (fração de quantidade) | 4 frascos |
| 3 · Portal do Saber | elevador, porta, ponte | Elevador (expressão) · Porta (divisibilidade) · Ponte (programa) | 4 frascos |

Tema: estantes com frascos coloridos, telas com gráficos, trilhas de circuito; grafite e lilás elétrico.

## 5f. Fases 4 e 5 de todos os mundos (ampliação para a versão 1.0)

Cada mundo tem **5 fases**. A fase 3 termina num portal; a **engrenagem fica na fase 5**. As fases novas seguem dois desenhos comuns, com tema, pools e textos próprios de cada mundo:

| Fase | Percurso | Mecanismos (painéis 1 → 3) |
|---|---|---|
| 4 | plataforma que anda sobre um buraco (1º ano: buraco curto, com blocos de apoio no modo assistido) → porta → escada até um paredão → ponte → ressalto com coletável → portal | porta, escada de blocos, ponte |
| 5 | elevador até um paredão → porta → plataforma vertical opcional com coletável (não há no 1º ano) → escada até o paredão final → engrenagem no alto | elevador, porta, escada de blocos |

| Mundo | Fase 4 | Fase 5 |
|---|---|---|
| Floresta dos Números (1º ano) | Ponte das Folhas | Ninho das Corujas |
| Vila das Descobertas (2º ano) | Feira da Vila | Moinho Encantado |
| Caverna dos Enigmas (3º ano) | Lago Subterrâneo | Coração da Caverna |
| Castelo das Estratégias (4º ano) | Biblioteca Secreta | Sala do Trono |
| Cidade dos Inventores (5º ano) | Estação de Trens | Torre de Controle |
| Laboratório do Saber (6º ano) | Observatório | Núcleo do Saber |

O 1º ano continua sem plataformas móveis nem caixas. Novo formato do 1º ano na fase 4: **ordenar números por toque** (do menor para o maior ou do maior para o menor; "Apagar último" e "Limpar" para refazer; cada posição recebe ✓ ou ✗).

## 6. Feedback e recompensas
- Acerto: som curto ascendente, ✓ por espaço, explicação, mecanismo se move.
- Erro: som suave, ✗ por espaço/máquina, mensagem específica (ex.: "3 linhas de 3 = 9 blocos — faltam 3"), dica conforme o apoio; explicação após 3 erros.
- Conquistas valorizam esforço: primeira descoberta, pediu ajuda, persistência, explorador (todos os cristais), engrenagem.
- **Não há:** pontuação, ranking, tempo-limite, vidas, compras ou anúncios.

## 7. Acessibilidade
Desafios e menus em HTML acessível; foco visível; Esc/Enter/Tab; ✓/✗ além de cor; narração pt-BR; volumes separados; reduzir animações; texto maior; modo assistido; controles de toque; remapeamento de teclas. Ver relatório de testes para os limites conhecidos (o canvas não é lido por leitores de tela).

## 8. Escalabilidade
Novo mundo = `content/anos/N/desafios/*.json` + mapas em `levels/src/*.txt` + entrada em `content/mundos.json`. Novos formatos entram como módulos em `src/challenges/formats/` e uma visão em `src/challenges/ui/views.ts`.
