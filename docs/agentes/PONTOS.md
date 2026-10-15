# Pontos da obra do Editaê

Um ponto por vez, na ordem. Detalhe em `docs/PLANO.md`. **[OK do Maxwel]** = só começa depois que ele disser "pode".

| # | Ponto | Papel | Pronto quando (a prova que o Maestro confere) |
|---|---|---|---|
| K1 | Projeto modelo no `kit/` com o estilo (a): vídeo em tela cheia + cards de vidro flutuando | kit | Um vídeo de teste da pasta `entrada/` sai em `saida/` com o estilo (a), 1080x1920, 30 fps, -14 LUFS (saída do ffprobe e do ebur128 coladas); quadros conferidos sem card encostando no rosto |
| K2 | Corte automático (silêncio, erro, frase repetida) e legenda palavra por palavra | kit | Vídeo de teste com 2 pausas longas e 1 frase repetida: a saída fica sem elas (antes e depois com as durações) e a legenda bate com a fala |
| K3 | Estilos (b) tela inteira com texto atrás e (c) tela verde com fundo de tela gravada | kit | O mesmo vídeo de teste sai nos 3 estilos; quadros de cada um conferidos |
| K4 | Instruções para o Claude (`CLAUDE.md` + skill): pedido em português, escolha de estilo, ajustes, vários ganchos | kit | Numa sessão nova do Claude Code, só com a frase "edita o vídeo que está na entrada", sai o Reel; e o pedido "tira a parte do segundo 10 ao 14" é atendido |
| K5 | Instaladores Windows e Mac + "verificar ambiente" | kit | Num usuário/pasta limpa do Windows, do zero ao primeiro vídeo seguindo só o leia-me (anotar cada passo e o tempo) |
| K6 | Sons com licença livre (fonte e licença de cada arquivo) e amostras de cada estilo | kit | Lista de licenças; 3 vídeos de amostra |
| K7 | Medição de consumo: quanto da sessão do Claude Pro uma edição gasta | revisor | Número medido em 3 edições, com o método descrito (vira o argumento do anúncio, ou não) |
| R1 | Revisão do kit (licenças, nada de segredo nem dado pessoal, instruções funcionando) | revisor | Relatório sem achado alto aberto |
| S1 | Página de vendas (identidade própria do Editaê, estrutura do PLANO) em modo demonstração | site | Screenshots no celular e no computador (portal), sem cronômetro, com a parcela vinda de configuração |
| S2 | Checkout no Mercado Pago (preferência no servidor, Pix e até 12x) + webhook que consulta a API, idempotente | pagamento | Testes com o MP simulado: corpo forjado não libera; aprovado libera 1 vez; o mesmo aviso de novo não duplica; valor menor não libera |
| S3 | Entrega: e-mail com link mágico + área do cliente (download com link assinado de validade curta, aula, atualizações) | pagamento | Teste: depois do pagamento simulado chega o e-mail (provedor simulado) e o link abre a área; link de download expira; quem não comprou não baixa |
| S4 | Reembolso em 7 dias pela área do cliente | pagamento | Teste: pedido em até 7 dias aceito e fora disso recusado; acesso a atualizações cortado só quando o MP confirmar |
| R2 | Revisão de segurança do site (RLS, funções, webhook, segredo, download) | revisor | Relatório sem achado alto aberto |
| P1 | **[OK do Maxwel]** Supabase de produção, Vercel, domínio e credenciais | site | Site no ar; compra real de teste com valor mínimo aprovada e reembolsada |
| C1 | Roteiro da aula de instalação e dos 3 anúncios (base no cérebro), alinhados ao kit pronto | revisor | Roteiros entregues ao Maxwel, só com promessas que o K7 e o K5 provaram |

## Registro

| Data | Ponto | Branch | Prova |
|---|---|---|---|
| 15/10/2026 | K1 | `k1-estilo-a` | ffprobe: h264 1080x1920 yuv420p, 30/1, 1500 quadros, 50,0 s; ebur128: I -14,0 LUFS, LRA 2,4 LU, pico -1,7 dBFS. Grade de 12 quadros tirada pelo Maestro do vídeo final: 11 cards no topo, nenhum encosta no rosto (detecção UltraFace achou o rosto em 100/100 quadros). Vídeo de teste e gerados fora do git. Pendências: ordem dos passos empilhados (o 3 aparece acima do 2 em 21 s); `kit/docs/POSICAO-DOS-CARDS.md` cita o vídeo do Maxwel; HDR do iPhone sem teste com clipe real; GSAP via CDN no render |
