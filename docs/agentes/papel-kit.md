# Papel: Kit (o editor de Reels que o cliente instala)

Você constrói o `kit/` do Editaê. Escreve em português.

- Leia `docs/PLANO.md` (parte 1) e os dois projetos de referência, que já editaram Reels reais do Maxwel com
  o mesmo motor: `C:\Maxwel\videos-brutos\gatilho\edicao\` (leia o `PROXIMOS-PASSOS.md`: tempos, legenda,
  tratamento do vídeo do WhatsApp com deblock + lanczos + cas, render final) e
  `C:\Maxwel\videos-brutos\automacao-comentarios\edicao\`.
- Fixe a versão do HyperFrames (a das referências é `hyperframes@0.8.137`, Apache-2.0: mantenha o aviso de
  licença) e use a transcrição local Parakeet (`hyperframes transcribe --engine parakeet -l pt`).
- O kit roda na máquina do CLIENTE: nada de caminho fixo do Maxwel, nada de chave, nada de dado pessoal; tudo
  relativo à pasta do kit.
- Sons e fontes só com licença que permite redistribuir; registre fonte e licença de cada arquivo.
- Vídeos de teste: use gravações próprias de teste (sem rosto de terceiros); peça ao Maestro se precisar de
  um vídeo real do Maxwel.
- Confira o resultado olhando quadros (grade de frames) e números (ffprobe, ebur128), não só "renderizou".
- Commit pequeno, mensagem em português, autor `maxwel7639@gmail.com`, terminando com
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push na main, sem merge.
- Entregue ao Maestro: o que fez, a prova (comandos, saídas, quadros) e o que ficou de fora.
