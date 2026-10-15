# Editaê

Grave falando, peça a edição, receba o Reel pronto. O Editaê transforma o Claude do cliente em editor de vídeo:
ele solta o vídeo cru numa pasta, pede em português ("edita o vídeo que está na entrada") e recebe o Reel com
cortes, legenda palavra por palavra, cards flutuando, texto atrás e som.

Produto low ticket da MX Digital: **R$ 97 à vista ou em até 12x no cartão** (checkout próprio no Mercado Pago),
garantia de 7 dias, sem cronômetro e sem urgência inventada.

## Pastas

- `kit/`: o produto que o cliente baixa (projeto modelo do HyperFrames, instruções para o Claude, scripts de
  transcrição e corte, instaladores, sons, amostras).
- `site/`: página de vendas, checkout no Mercado Pago, entrega por e-mail e área do cliente (Next.js).
- `docs/`: plano (`docs/PLANO.md`) e a obra do Maestri (`docs/agentes/`).

## Referências na máquina do Maxwel

- Plano e análise do concorrente: `C:\Users\MANOEL RONE\cerebri-claude\contexto\editor-reels-plano.md`.
- Projetos de edição já feitos com o mesmo motor (HyperFrames 0.8.137, Apache-2.0):
  `C:\Maxwel\videos-brutos\gatilho\edicao\` (cards de vidro flutuando sobre o vídeo em tela cheia) e
  `C:\Maxwel\videos-brutos\automacao-comentarios\edicao\` (tela inteira em motion, telas recriadas).
- Checkout e webhook do Mercado Pago em produção (Fisga): `C:\Maxwel\worktrees\fisga-next-seguro\lib\mercadopago.ts`,
  `lib\mp-assinatura.ts`, `app\api\mercadopago-webhook\route.ts`.
