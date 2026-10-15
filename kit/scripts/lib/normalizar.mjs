// Passo a): deixa o vídeo no formato do kit (1080x1920, 30 fps, yuv420p, SDR) e prepara a voz (-14 LUFS).
import { ffmpeg, ffprobeJson, temFiltro, falhar, log, rodar, arredondar, FFMPEG } from "./util.mjs";

const LARGURA = 1080;
const ALTURA = 1920;
const FPS = 30;

// Cadeia de tonemap de HDR (PQ ou HLG do iPhone) para SDR bt709.
const TONEMAP =
  "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p";

export async function analisar(arquivo) {
  const info = await ffprobeJson(["-show_streams", "-show_format", arquivo]);
  const v = info.streams.find((s) => s.codec_type === "video");
  const a = info.streams.find((s) => s.codec_type === "audio");
  if (!v) falhar("Esse arquivo não tem vídeo. Coloque um vídeo (mp4 ou mov) na pasta entrada/.");
  if (!a) falhar("Esse vídeo não tem áudio. O kit precisa da sua voz para transcrever e posicionar os cards na fala.");
  const girado = Math.abs(Number((v.side_data_list || []).find((d) => d.rotation !== undefined)?.rotation || 0)) % 180 === 90;
  const largura = girado ? v.height : v.width;
  const altura = girado ? v.width : v.height;
  const [n, d] = (v.avg_frame_rate && v.avg_frame_rate !== "0/0" ? v.avg_frame_rate : v.r_frame_rate).split("/").map(Number);
  const fps = d ? n / d : n;
  const duracao = Number(info.format.duration);
  const bitrateVideo = Number(v.bit_rate || info.format.bit_rate || 0);
  const bpp = bitrateVideo / (largura * altura * (fps || 30)); // bits por pixel por quadro
  const hdr = ["smpte2084", "arib-std-b67"].includes(v.color_transfer);
  // Vídeo de WhatsApp e afins: resolução baixa ou pouquíssimos bits por pixel.
  const comprimido = Math.min(largura, altura) < 720 || (bpp > 0 && bpp < 0.06);
  return { largura, altura, fps: arredondar(fps), duracao, bitrateVideo, bpp: arredondar(bpp, 3), hdr, comprimido, pixFmt: v.pix_fmt, transfer: v.color_transfer || "desconhecido" };
}

export function montarFiltroVideo(i, temZscale) {
  const f = [];
  if (i.hdr) {
    if (!temZscale) falhar("Esse vídeo é HDR (iPhone) e o seu ffmpeg não tem o filtro zscale para converter. Atualize o ffmpeg (instalador do kit).");
    f.push(TONEMAP);
  }
  if (i.comprimido) f.push("deblock=filter=weak:block=8"); // limpeza de blocos do WhatsApp, antes de ampliar
  // Qualquer proporção vira 9:16 com corte centrado (nunca estica nem põe tarja).
  f.push("crop='min(iw,ih*9/16)':'min(ih,iw*16/9)'");
  f.push(`scale=${LARGURA}:${ALTURA}:flags=lanczos`);
  if (i.comprimido) f.push("cas=strength=0.4", "eq=contrast=1.03:saturation=1.05");
  f.push(`fps=${FPS}`, "setsar=1", "format=yuv420p");
  return f.join(",");
}

export async function normalizarVideo(entrada, destino, info) {
  const vf = montarFiltroVideo(info, await temFiltro("zscale"));
  await ffmpeg([
    "-y", "-i", entrada, "-an", "-vf", vf,
    "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-g", String(FPS),
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
    "-movflags", "+faststart", destino,
  ]);
  return vf;
}

// Voz: passa-alta 70 Hz + loudnorm em duas passadas (mede e aplica linear) para cair em -14 LUFS,
// pico até -1,5 dBTP no vídeo final (a voz sai com -2 dBTP de folga), 48 kHz.
export async function normalizarVoz(entrada, destino) {
  const base = "highpass=f=70";
  const alvo = "I=-14:TP=-2.0:LRA=11"; // pico com folga: o AAC do render sobe um pouco
  const medir = await rodar(FFMPEG, ["-hide_banner", "-nostdin", "-i", entrada, "-vn", "-af", `${base},loudnorm=${alvo}:print_format=json`, "-f", "null", "-"]);
  const bloco = medir.erro.match(/\{[^{}]*"input_i"[^{}]*\}/);
  if (!bloco) falhar("Não consegui medir o volume da voz.");
  const m = JSON.parse(bloco[0]);
  const aplicar =
    `${base},loudnorm=${alvo}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:` +
    `measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`;
  await ffmpeg(["-y", "-i", entrada, "-vn", "-af", aplicar, "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", destino]);
  log(`   voz: medido ${m.input_i} LUFS, pico ${m.input_tp} dBTP -> alvo -14 LUFS / -2 dBTP`);
}
