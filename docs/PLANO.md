# Editaê · plano

Decisões do Maxwel (14/10/2026): nome **Editaê**; **checkout próprio no Mercado Pago**; obra tocada pelo
**Maestri**. Análise do concorrente (Viral-Z, Castilho IA) e roteiro do anúncio:
`C:\Users\MANOEL RONE\cerebri-claude\contexto\editor-reels-plano.md`.

## A oferta

- R$ 97 à vista (Pix ou cartão) ou em até 12x no cartão, com os juros do parcelamento por conta do comprador
  (a página mostra a parcela que o Mercado Pago calcular; não inventar valor).
- Garantia de 7 dias: devolve o dinheiro; quem pede reembolso deixa de receber atualizações.
- **Sem cronômetro, sem "últimas vagas", sem bônus com valor inventado.**
- O que o cliente recebe: o kit para Windows e Mac; aula de instalação (até 5 min); amostras de cada estilo;
  biblioteca de sons com licença livre; atualizações com estilos novos.
- Requisitos ditos na página: Claude Pro do próprio cliente (Claude Code), Windows ou Mac, vídeo vertical
  falando para a câmera. Na v1 só prometemos **Claude** (Codex/ChatGPT só depois de testar).
- Promessas só com prova: "este vídeo foi editado assim" só se for verdade; "gastou X% da sessão" só com o
  número medido no ponto K7.

## Parte 1 · o kit (`kit/`)

1. **Projeto modelo** do HyperFrames (fixar a versão) com 3 estilos: (a) vídeo em tela cheia + cards de vidro
   flutuando longe do rosto; (b) tela inteira em motion com texto atrás; (c) tela verde com fundo de tela gravada.
   Base: os dois projetos de referência do README.
2. **Pipeline de entrada:** pasta `entrada/` → normaliza o vídeo (inclusive HDR do iPhone para SDR, e vídeo
   comprimido de WhatsApp com limpeza de bloco) → transcrição local com Parakeet (palavras e tempos) →
   **corte automático** de silêncio, erro e frase repetida (ffmpeg + transcrição) → legenda palavra por palavra →
   cards nos momentos certos → render em `saida/` (1080x1920, 30 fps, -14 LUFS).
3. **Instruções para o Claude** (`CLAUDE.md` do kit + skill): passos fixos e econômicos para "edita o vídeo
   que está na entrada", escolha de estilo, ajustes em português ("tira essa parte", "muda o estilo",
   "troca a legenda"), vários ganchos = vários vídeos, e o que NÃO fazer (nada de reescrever o projeto inteiro).
4. **Instaladores:** `instalar-windows` e `instalar-mac` que conferem/instalam Node, ffmpeg e o modelo de
   transcrição, e um "verificar ambiente" que diz em português o que falta.
5. **Sons e amostras:** biblioteca de efeitos com licença que permite redistribuir (documentar a fonte e a
   licença de cada arquivo) e um vídeo curto de amostra de cada estilo.
6. **Leia-me do cliente:** do zero ao primeiro vídeo, em linguagem simples.

## Parte 2 · venda e entrega (`site/`)

1. **Página de vendas** própria (Next.js 16 na Vercel): estrutura inspirada na do concorrente (promessa, antes e
   depois, problema, 3 passos, o que faz, o que vem, para quem é e não é, quem fez, oferta, garantia, perguntas),
   mas com texto, visual e provas **nossos**. Identidade própria do Editaê (definir na hora, sem copiar o
   verde-limão deles). Barra fixa no celular com o preço.
2. **Checkout no Mercado Pago** (Checkout Pro, preferência criada no servidor; o servidor decide o preço; Pix e
   cartão até 12x). Webhook que **nunca confia no corpo**: consulta o pagamento na API do MP; idempotente pelo id.
3. **Entrega:** pagamento aprovado → e-mail com link de acesso (link mágico) → área do cliente com o download
   do kit (arquivo em storage privado, link assinado e com validade curta), a aula e as atualizações.
4. **Reembolso:** pedido em até 7 dias pela área do cliente; reembolso feito no MP; o acesso às atualizações
   é cortado quando o MP confirmar.
5. **Banco:** projeto Supabase próprio (não o do CRM), RLS por dono, nenhuma função aberta ao anônimo.
6. Páginas de termos e privacidade; pixel/eventos de compra (decidir com o Maxwel).

## Parte 3 · conteúdo

1. Roteiro da aula de instalação (o Maxwel grava a tela).
2. Três anúncios (gancho "até pouco tempo…", prova "este vídeo foi editado assim", vídeo do zero), cada um
   editado com o próprio kit. Roteiro base no arquivo do cérebro.

## O que o MAXWEL precisa fazer / fornecer

1. Criar o repositório no GitHub e mandar o link (o Maestro sobe as branches; o merge é dele).
2. Conferir se o nome Editaê está livre no Instagram e escolher o domínio.
3. Projeto Supabase novo, projeto na Vercel, credenciais do Mercado Pago (de preferência uma aplicação só do
   Editaê) e a assinatura secreta do webhook, chave do Resend para o e-mail.
4. Gravar a aula de instalação e os anúncios quando o kit estiver pronto.
