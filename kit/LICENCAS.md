# Licenças e avisos de terceiros

O kit do Editaê usa os componentes abaixo. Cada um mantém a licença original. Só os arquivos marcados
"incluído no kit" estão dentro desta pasta; os outros são baixados na instalação ou no uso.

| Componente | Versão | Licença | Como entra no kit | Fonte |
|---|---|---|---|---|
| HyperFrames (motor de vídeo em HTML) | 0.8.137 (fixada em `package.json`) | Apache-2.0 | instalado por `npm install` | https://github.com/heygen-com/hyperframes |
| onnxruntime-web (roda o detector de rosto) | 1.22.0 | MIT | instalado por `npm install` | https://github.com/microsoft/onnxruntime |
| UltraFace RFB-640 (`modelos/ultraface-rfb-640.onnx`, 1,5 MB) | commit `master` de 2019 | MIT, © 2019 linzai | incluído no kit | https://github.com/Linzaer/Ultra-Light-Fast-Generic-Face-Detector-1MB |
| Figtree 600, 700 e 800 (`assets/fonts/Figtree-*.ttf`) | Google Fonts | SIL Open Font License 1.1 (texto em `assets/fonts/OFL.txt`) | incluída no kit | https://github.com/erikdkennedy/figtree |
| Parakeet TDT 0.6B v3 (int8), transcrição local | v3 | CC-BY-4.0, © NVIDIA | baixado por `hyperframes models install parakeet`; não está no kit | https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3 |
| GSAP (animação dos cards) | 3.14.2 | GreenSock Standard License (uso gratuito, inclusive comercial) | carregado do jsDelivr no render; não está no kit | https://gsap.com/standard-license |
| ffmpeg (normalização e conferência) | do sistema | LGPL/GPL, conforme a build | instalado à parte (instaladores do kit); não está no kit | https://ffmpeg.org |

Os ícones dos cards (mensagem, link, check, estrela, raio) são formas simples desenhadas dentro do código
(`scripts/estilos/a.mjs`); não vêm de pacote de ícones.

## Aviso do HyperFrames (Apache-2.0)

O HyperFrames é software da HeyGen sob a licença Apache, versão 2.0. O kit não altera o código dele: usa a
versão publicada no npm. Texto completo da licença: https://www.apache.org/licenses/LICENSE-2.0

## Sons

Nenhum arquivo de som está neste kit ainda (a biblioteca de sons vem no ponto K6, com fonte e licença de cada
arquivo registradas aqui).
