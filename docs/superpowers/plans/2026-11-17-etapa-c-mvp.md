# Etapa C — MVP Funcional: Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MVP jogável do Mundo 3 (3º ano): abertura → apresentação do Leo → escolha do ano → mapa → 3 fases com 4 mecânicas educativas → feedback → desbloqueio → conclusão do mundo, com salvamento local, configurações, toque e áudio.

**Architecture:** Continua a separação mecanismo × formato × conteúdo da Etapa B. Formatos viram módulos com o mesmo contrato (`resolve/enumerate/validate/evaluate`). Telas e menus em HTML acessível sobre uma cena Phaser de fundo. Progresso e configurações em módulos puros com schema Zod, persistidos em `localStorage` com recuperação de dados inválidos.

**Tech Stack:** igual à Etapa B + `@axe-core/playwright` (testes). Áudio sintetizado via Web Audio (original, sem arquivos de terceiros).

**Spec:** `docs/planejamento/00-planejamento-inicial.md` (seções 5, 8 e 11)

## Global Constraints
- Tudo da Etapa B continua valendo (passo fixo 60 Hz, sem rede em tempo de execução, conteúdo só aprovado em produção, BNCC `a_validar`).
- Só o 3º ano jogável; outros anos aparecem como "Em construção" e **não** podem ser escolhidos. Trocar de ano nunca apaga o progresso de outro ano.
- Nenhum dado pessoal: o salvamento guarda só progresso, tentativas, dicas, tempo aproximado e configurações.
- Sem limite de tempo, sem punição por erro, sem notas ou rankings.
- Fontes: do sistema nesta etapa (baixar fontes OFL depende de autorização de download).

## Review Focus
1. `localStorage` indisponível ou com dados corrompidos → jogo abre normalmente e avisa que o progresso foi reiniciado (cópia do dado antigo preservada).
2. Distribuir com resto: deixar cristais "sobrando" que ainda dariam mais um por máquina → resposta incorreta com explicação, não correta.
3. Remapear uma tecla já usada por outra ação → a outra ação perde aquela tecla, nenhuma ação fica sem tecla.
4. Reiniciar a fase depois de resolver um painel → painel volta ao estado inicial; progresso salvo de fases anteriores não muda.
5. Toque em tela: segurar ◀ e soltar fora do botão → Leo para.

## Tasks
1. **Formatos:** `numerico` (problemas de adição/subtração → Porta), `distribuir` (divisão com e sem resto → Elevador/Ponte), `arranjo` (multiplicação em disposição retangular → Blocos/Elevador); registro de formatos; validação de templates (nenhuma `{variavel}` sem valor em nenhuma variação); banco ≥ 30 itens. Testes unitários por formato.
2. **Persistência:** `save` (schema v1, migração, recuperação, exportar/importar), `progress` (desbloqueio, conclusão, conquistas, tempo), `settings` (volumes, animações, apoio, modo assistido, narração, texto grande, teclas). Testes unitários.
3. **Fases:** nova legenda ASCII (painéis `1–9` ligados a mecanismos `a–i`, placas `!`, apoio `+`, coletáveis `*`), 3 mapas, mecanismos Porta/Ponte-Blocos/Elevador, coletáveis, placas de tutorial, saída, modo assistido. Testes do conversor.
4. **Telas e jogo:** abertura, apresentação, escolha do ano, mapa, pausa, configurações, conclusão de fase e de mundo; HUD; controles de toque; áudio sintetizado; narração automática opcional.
5. **Qualidade:** E2E do fluxo completo, das 3 fases, salvamento entre recargas, troca de ano, remapeamento, toque, reinício e recuperação de save; axe-core nas telas HTML; roteiro de testes manuais; matriz pedagógica do 3º ano; plano e instrumentos de teste com usuários; relatório e publicação.
