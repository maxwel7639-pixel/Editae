// Conferência do vídeo final: números (ffprobe, ebur128) e grade de quadros dos momentos de cada card.
import fs from "node:fs";
import path from "node:path";
import { rodar, ffmpeg, FFMPEG, FFPROBE, log, arredondar } from "./util.mjs";

export async function medirSaida(arquivo) {
  const probe = await rodar(FFPROBE, [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=codec_name,width,height,pix_fmt,r_frame_rate,avg_frame_rate",
    "-show_entries", "format=duration", "-of", "default=nw=1", arquivo,
  ]);
  const eb = await rodar(FFMPEG, ["-hide_banner", "-nostats", "-i", arquivo, "-filter_complex", "ebur128=peak=true", "-f", "null", "-"]);
  const resumo = eb.erro.slice(eb.erro.lastIndexOf("Summary:"));
  const pega = (re) => Number((resumo.match(re) || [])[1]);
  return {
    ffprobe: probe.saida.trim(),
    resumoEbur128: resumo.trim(),
    lufs: pega(/I:\s+(-?[\d.]+) LUFS/),
    truePeak: pega(/Peak:\s+(-?[\d.]+) dBFS/),
  };
}

// Um quadro do vídeo final no meio de cada card; a versão "-rosto" desenha a zona da cabeça (vermelho) e o card (verde).
export async function gradeDeQuadros(video, cards, destinoBase) {
  const pasta = fs.mkdtempSync(path.join(path.dirname(destinoBase), ".quadros-"));
  const lista = cards.filter((c) => !c.descartado);
  try {
    for (const variante of ["limpa", "rosto"]) {
      for (let i = 0; i < lista.length; i++) {
        const c = lista[i];
        const t = Math.min(c.fim - 0.6, c.inicio + 2.2); // já assentado (contador pronto), antes da saída
        const filtros = ["scale=360:640"];
        if (variante === "rosto") {
          const e = 360 / 1080;
          const caixa = (r, cor) => `drawbox=x=${Math.round(r.x * e)}:y=${Math.round(r.y * e)}:w=${Math.round(r.w * e)}:h=${Math.round(r.h * e)}:color=${cor}:t=2`;
          filtros.length = 0;
          filtros.push("scale=360:640");
          if (c.cabeca) filtros.push(caixa({ x: c.cabeca.x1, y: c.cabeca.y1, w: c.cabeca.x2 - c.cabeca.x1, h: c.cabeca.y2 - c.cabeca.y1 }, "red@0.9"));
          filtros.push(caixa({ x: c.x, y: c.y, w: 880, h: c.altura }, "lime@0.9"));
        }
        await ffmpeg(["-y", "-ss", String(arredondar(t, 3)), "-i", video, "-frames:v", "1", "-vf", filtros.join(","), "-q:v", "3", path.join(pasta, `${variante}-${String(i).padStart(2, "0")}.jpg`)]);
      }
      const colunas = Math.min(4, lista.length);
      const linhas = Math.ceil(lista.length / colunas);
      const arquivoGrade = `${destinoBase}-${variante === "limpa" ? "grade" : "grade-rosto"}.jpg`;
      await ffmpeg(["-y", "-framerate", "1", "-i", path.join(pasta, `${variante}-%02d.jpg`), "-vf", `tile=${colunas}x${linhas}:padding=6:color=0x222222`, "-frames:v", "1", "-q:v", "3", arquivoGrade]);
      log(`   grade (${variante}): ${arquivoGrade}`);
    }
  } finally {
    fs.rmSync(pasta, { recursive: true, force: true });
  }
}
