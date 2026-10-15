# Kit do Editaê

Aqui vai o kit que o cliente baixa (ver `docs/PLANO.md`, parte 1). Estado: **ponto K1** (estilo a).

## Como usar (K1)

Dentro da pasta `kit/`:

```
npm install                 # uma vez: instala o HyperFrames 0.8.137 e o detector de rosto
npm run editar -- --preparar   # normaliza, transcreve e acha o rosto (cria trabalho/transcricao.json)
# preencha o cards.json (modelo: cards.exemplo.json) usando os tempos da transcrição
npm run editar              # monta, confere e renderiza em saida/
```

Precisa de Node 22 ou mais novo, `ffmpeg` e `ffprobe` no PATH (com os filtros `zscale`, `deblock` e `cas`) e do
modelo de transcrição (`npx hyperframes models install parakeet`). Os instaladores vêm no ponto K5.

Opções: `--rascunho` (render rápido em qualidade baixa), `--exemplo` (usa o `cards.exemplo.json`),
`--forcar` (refaz a normalização), `--entrada nome.mp4` (quando há mais de um vídeo em `entrada/`).

## O que o comando faz

1. **Normaliza** o vídeo: 1080x1920, 30 fps, yuv420p; HDR do iPhone vira SDR (tonemap, detectado pela cor do
   vídeo); vídeo comprimido de WhatsApp recebe limpeza de bloco + lanczos + nitidez leve; fora de 9:16, corte
   centrado. Voz: passa-alta 70 Hz + loudnorm em duas passadas para -14 LUFS, pico com folga, 48 kHz.
2. **Transcreve** local com o Parakeet (palavras e tempos).
3. **Acha o rosto** em quadros amostrados (2 por segundo), local, sem Python.
4. **Monta o estilo (a)**: o vídeo em tela cheia e os cards de vidro do `cards.json`, na área livre.
5. **Renderiza** em `saida/` e confere (ffprobe, ebur128 e uma grade de quadros com os cards).

## cards.json

```json
{ "cor": "#7FA6FF",
  "cards": [
    { "inicio": 2.0, "duracao": 2.6, "tipo": "texto",  "icone": "mensagem", "titulo": "Nova mensagem", "texto": "Aqui está o link" },
    { "inicio": 6.0, "duracao": 4.0, "tipo": "numero", "valor": "700", "rotulo": "comentários em um dia" },
    { "inicio": 12.0, "duracao": 3.2, "tipo": "passo", "numero": 1, "titulo": "Escolha o post", "texto": "opcional" }
  ] }
```

Tempos em segundos. Tipos: `texto` (ícone: mensagem, link, check, estrela, raio), `numero` (o contador sobe até
o valor) e `passo`. Limites: título 30 letras, texto 70, rótulo 40. Como os cards escapam do rosto:
`docs/POSICAO-DOS-CARDS.md`.

## Pastas

- `entrada/` o vídeo bruto (fora do git). `saida/` o resultado e as grades de conferência (fora do git).
- `trabalho/` arquivos gerados (vídeo normalizado, voz, transcrição, rostos, cards.html). Pode apagar.
- `scripts/` o pipeline. `scripts/estilos/a.mjs` é o estilo (a). `modelos/` o detector de rosto.
- `LICENCAS.md` fontes e licenças de tudo que não é nosso.
