# Onde os cards ficam (regra de posição)

**Caminho escolhido no K1: detecção automática do rosto**, com zona fixa só como reserva.

Por que automático: o cliente grava em lugares e enquadramentos diferentes (rosto no topo, no meio, de lado).
Uma zona fixa serviria só para o vídeo do Maxwel no carro. A detecção roda local no Windows e no Mac, sem
Python: o ffmpeg tira os quadros em RGB e o modelo UltraFace (ONNX, 1,5 MB, MIT) roda no `onnxruntime-web`
(WebAssembly), tudo em Node. Custa cerca de 1 segundo de processamento por 3 quadros e não envia nada para fora.

## Regra (código em `scripts/lib/layout.mjs`)

1. **Amostragem:** 2 quadros por segundo; guarda a caixa do rosto principal (a maior) de cada quadro
   (`trabalho/rostos.json`).
2. **Cabeça por card:** para cada card, une as caixas dos quadros de `início - 0,5 s` até `fim + 0,5 s` e
   aumenta a caixa para cobrir cabelo, pescoço e lados (22% da altura para cima, 15% para baixo, 20% da
   largura para os lados). O resultado fica em `trabalho/layout.json`.
3. **Área livre:** a faixa acima da cabeça, com folga de 40 px, a partir de y = 150 (o topo da interface do
   Instagram cobre o que está acima). Se a faixa de cima tiver menos de 150 px, usa a faixa abaixo do queixo,
   também com 40 px de folga, até y = 1480 (acima da legenda e do rodapé do Instagram).
4. **Vários cards ao mesmo tempo** empilham na faixa (24 px entre eles). Se não cabe, o card mais antigo sai
   quando o novo entra (aparece como AVISO no terminal).
5. **Card maior que a faixa:** é reduzido (até 75%); abaixo disso é descartado com aviso. Nunca invade a
   folga do rosto.
6. **Sem rosto em nenhum quadro** (ou rosto de costas): zona fixa do topo, y 150 a 560, e um aviso.
7. O terminal imprime a folga real (px) entre cada card e a cabeça, e o `saida/<nome>-editado-grade-rosto.jpg`
   mostra a zona da cabeça (vermelho) e o card (verde) em cada quadro.

## Limites conhecidos

- Só posiciona na vertical (os cards são centrados, 880 px de largura). Rosto muito descentralizado ou mais de
  uma pessoa no quadro não tem tratamento próprio: com várias pessoas vale a maior caixa de cada quadro.
- A câmera do estilo (a) não faz zoom, para a cabeça não subir em direção aos cards.
- Mão levantada acima do rosto não é detectada.
