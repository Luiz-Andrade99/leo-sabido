# Relatório: vidas por fase e enquadramento em celular/tablet

Data: 19/11/2026 · Versão: 0.11.0-alpha.1 · Desenho: [vidas-e-enquadramento-design](../superpowers/specs/2026-11-19-vidas-e-enquadramento-design.md) · Plano: [vidas-e-enquadramento](../superpowers/plans/2026-11-19-vidas-e-enquadramento.md)

## Vidas

| Situação | O que acontece |
|---|---|
| Início da fase | ❤️ 3 no topo; no modo assistido, ❤️ ∞ (sem limite) |
| Pegar um coletável | Conta, mas só fica "guardado" ao tocar numa bandeira |
| Tocar numa bandeira | "🚩 Bandeira! Seus cristais estão guardados. Se cair, você volta para cá." |
| Cair num buraco | −1 vida e volta à última bandeira. Os coletáveis pegos depois dela voltam para o lugar, com o aviso "Ops! Você caiu. Restam 2 vidas…" |
| Vidas zeradas | Janela "As vidas acabaram! Vamos tentar de novo do começo da fase. Os desafios que você resolveu continuam abertos." → **Recomeçar a fase** |
| Recomeço | Leo no início. Coletáveis, bandeiras e caixas voltam ao estado inicial e as vidas voltam a 3. **Pontes, portas, escadas e elevadores já ativados continuam abertos** |
| Errar um desafio | Nunca custa vida |

A regra fica em [`src/core/vidas.ts`](../../src/core/vidas.ts), separada do Phaser e com testes unitários. Os testes de ponta a ponta estão em [`tests/e2e/vidas.spec.ts`](../../tests/e2e/vidas.spec.ts):
- a bandeira guarda os coletáveis;
- duas quedas seguidas gastam só 1 vida;
- o recomeço mantém os desafios;
- o resultado da fase conta só a nova tentativa;
- o modo assistido não tem limite;
- o Esc não abre a pausa por cima da janela.

## Enquadramento

| Problema (antes) | Correção |
|---|---|
| Celular deitado: faixas pretas nas laterais; botões de toque por cima do Leo e do chão | A escala do Phaser passou de `FIT` para `EXPAND`, e a fase ocupa a tela toda. O zoom da câmera mostra sempre ~540 px de altura do mundo e reserva embaixo a faixa dos botões, que ficam abaixo do chão ([`camera.ts`](../../src/scenes/camera.ts)) |
| Celular em pé: a fase virava uma faixa fina no meio | Aparece "Vire o celular para jogar 🔄" com a fase pausada; ela continua sozinha ao girar ([`girar.ts`](../../src/ui/girar.ts)). As janelas de desafio aparecem por cima e funcionam em pé |
| Tablet em pé: fase pequena com faixas | A fase ocupa a largura toda e fica logo acima dos botões; o espaço livre fica em cima, como céu |
| Desafio "Toque no grupo com 6 estrelas": estrelas vazando dos cartões (foto do usuário, iPhone em pé) | Os grupos mantêm 5 figuras por linha, mas as figuras encolhem para caber no cartão |
| Seletor "Apoio" ilegível no Safari/iPhone (texto escuro sobre controle escuro) | Seletor com aparência própria: fundo claro, texto escuro e seta desenhada |
| Barra do topo apertada no celular deitado | "Pausar (Esc)" vira só o ícone ⏸ em telas baixas |

Verificação automática em 7 aparelhos emulados ([`dispositivos.spec.ts`](../../tests/e2e/dispositivos.spec.ts)): iPhone 14 em pé e deitado, iPad em pé e deitado, Pixel 7 em pé e deitado, Galaxy Tab S4. Ela confere:
- **deitado:** o jogo ocupa a largura e a altura da tela;
- **em todos:** nenhum botão de toque cobre o Leo;
- **só no celular em pé:** aparece o pedido para girar, e o Leo não se move enquanto isso;
- **1º ano:** nenhuma figura sai do cartão nas janelas de escolha por imagem;
- **axe-core:** sem violações de acessibilidade.

Capturas em [`evidencias/`](evidencias/): `disp-*-fase.png`, `disp-*-girar.png`, `disp-*-escolha-*.png` e `disp-*-ordenar.png`.

## Resultados

| Suíte | Resultado |
|---|---|
| Unitários | 220 de 220 |
| Edge, suíte completa | 56 passaram, 3 ignorados (os de toque) |
| Celulares e tablets emulados | 21 de 21, nos 7 aparelhos × 3 testes |
| Safari (WebKit): vidas e voz | 13 de 13, depois da correção do Esc |

Na revisão final apareceu um problema, que já está corrigido: o Esc (ou o botão de pausa) abria a pausa por cima da janela "As vidas acabaram!". Ao voltar das configurações, os controles também eram religados com essa janela aberta. O teste "Esc não abre a pausa por cima" falhou antes da correção e passa agora.

## Limites honestos

- **Emulação não é aparelho físico.** O entalhe, a barra de gestos e a rotação de verdade (com a barra de endereço do Safari aparecendo e sumindo) precisam ser conferidos pelo roteiro [A3](../testes/roteiro-testes-manuais.md).
- **Tablet em pé** mostra uma faixa escura acima da fase (fora do mapa). Nas fases claras (Vila, Cidade), essa faixa contrasta com o céu.
- **O modo assistido** vale a partir do início da fase: ligá-lo no meio dela só vale ao recomeçar ou trocar de fase.
