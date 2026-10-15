// Passo c2): acha o rosto em quadros amostrados do vídeo, 100% local, sem Python.
// Modelo: UltraFace RFB-640 (ONNX, ~1,5 MB, licença MIT) rodando no onnxruntime-web (WebAssembly, funciona
// igual no Windows e no Mac). Os quadros vêm do ffmpeg em RGB cru, então não precisa de biblioteca de imagem.
import fs from "node:fs";
import * as ort from "onnxruntime-web";
import { ffmpeg, caminho, PASTA_TRABALHO, log, arredondar } from "./util.mjs";
import path from "node:path";

const W = 640; // entrada do modelo
const H = 480;
const LARG_RETRATO = 270; // o vídeo 9:16 encaixa na altura 480 com 270 de largura, centrado numa tela 640x480
const DESLOC_X = (W - LARG_RETRATO) / 2;
const CONFIANCA_MIN = 0.7;
const IOU_NMS = 0.3;

const iou = (a, b) => {
  const x1 = Math.max(a.x1, b.x1), y1 = Math.max(a.y1, b.y1), x2 = Math.min(a.x2, b.x2), y2 = Math.min(a.y2, b.y2);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  return inter / ((a.x2 - a.x1) * (a.y2 - a.y1) + (b.x2 - b.x1) * (b.y2 - b.y1) - inter || 1);
};

function candidatos(scores, boxes) {
  const lista = [];
  const n = scores.dims[1];
  for (let i = 0; i < n; i++) {
    const conf = scores.data[i * 2 + 1];
    if (conf < CONFIANCA_MIN) continue;
    lista.push({ conf, x1: boxes.data[i * 4], y1: boxes.data[i * 4 + 1], x2: boxes.data[i * 4 + 2], y2: boxes.data[i * 4 + 3] });
  }
  lista.sort((a, b) => b.conf - a.conf);
  const fica = [];
  for (const c of lista) if (fica.every((f) => iou(f, c) < IOU_NMS)) fica.push(c);
  return fica;
}

// Devolve [{ t, caixas: [{x1,y1,x2,y2,conf}] }] com coordenadas em pixels do quadro 1080x1920.
export async function detectarRostos(video, { amostrasPorSegundo = 2, largura = 1080, altura = 1920 } = {}) {
  const bruto = path.join(PASTA_TRABALHO, "_quadros.rgb");
  await ffmpeg([
    "-y", "-i", video,
    "-vf", `fps=${amostrasPorSegundo},scale=${LARG_RETRATO}:${H},pad=${W}:${H}:${DESLOC_X}:0:black`,
    "-f", "rawvideo", "-pix_fmt", "rgb24", bruto,
  ]);
  ort.env.wasm.numThreads = 1;
  ort.env.logLevel = "fatal";
  const sessao = await ort.InferenceSession.create(fs.readFileSync(caminho("modelos", "ultraface-rfb-640.onnx")), {
    executionProviders: ["wasm"],
    logSeverityLevel: 4,
  });
  const tamQuadro = W * H * 3;
  const total = Math.floor(fs.statSync(bruto).size / tamQuadro);
  const fd = fs.openSync(bruto, "r");
  const quadro = Buffer.alloc(tamQuadro);
  const entrada = new Float32Array(3 * H * W);
  const saida = [];
  try {
    for (let k = 0; k < total; k++) {
      fs.readSync(fd, quadro, 0, tamQuadro, k * tamQuadro);
      for (let i = 0; i < W * H; i++) {
        entrada[i] = (quadro[i * 3] - 127) / 128;
        entrada[W * H + i] = (quadro[i * 3 + 1] - 127) / 128;
        entrada[2 * W * H + i] = (quadro[i * 3 + 2] - 127) / 128;
      }
      const r = await sessao.run({ [sessao.inputNames[0]]: new ort.Tensor("float32", entrada, [1, 3, H, W]) });
      const caixas = candidatos(r[sessao.outputNames[0]], r[sessao.outputNames[1]])
        .map((c) => ({
          // volta do quadro 640x480 (com tarjas) para pixels do vídeo 1080x1920
          x1: Math.round(((c.x1 * W - DESLOC_X) / LARG_RETRATO) * largura),
          x2: Math.round(((c.x2 * W - DESLOC_X) / LARG_RETRATO) * largura),
          y1: Math.round(c.y1 * altura),
          y2: Math.round(c.y2 * altura),
          conf: arredondar(c.conf, 3),
        }))
        .filter((c) => c.x2 > 0 && c.x1 < largura); // descarta o que caiu nas tarjas
      saida.push({ t: arredondar(k / amostrasPorSegundo), caixas });
    }
  } finally {
    fs.closeSync(fd);
    fs.rmSync(bruto, { force: true });
  }
  const comRosto = saida.filter((s) => s.caixas.length).length;
  log(`   rosto achado em ${comRosto} de ${saida.length} quadros amostrados`);
  return saida;
}
