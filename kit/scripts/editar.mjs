// Editaê · comando único: vídeo de entrada/ -> vídeo editado em saida/ (estilo a).
//
//   npm run editar                        usa o vídeo de entrada/ e o cards.json
//   npm run editar -- --rascunho          render rápido em qualidade baixa (para acertar tempo e posição)
//   npm run editar -- --preparar          só normaliza, transcreve e acha o rosto (para preencher o cards.json)
//   npm run editar -- --exemplo           usa o cards.exemplo.json no lugar do cards.json
//   npm run editar -- --so-conferir       refaz só a conferência (números e grade) do vídeo já renderizado
//   npm run editar -- --forcar            refaz tudo, mesmo que já esteja pronto
//   npm run editar -- --entrada nome.mp4  escolhe o arquivo quando há mais de um em entrada/
import fs from "node:fs";
import path from "node:path";
import {
  RAIZ, caminho, PASTA_ENTRADA, PASTA_SAIDA, PASTA_TRABALHO, ErroDoKit, falhar, log, passo, lerJson, gravarJson,
  conferirFfmpeg, cliHyperframes, rodar, ffprobeJson, arredondar,
} from "./lib/util.mjs";
import { analisar, normalizarVideo, normalizarVoz } from "./lib/normalizar.mjs";
import { transcrever } from "./lib/transcrever.mjs";
import { detectarRostos } from "./lib/rostos.mjs";
import { posicionar } from "./lib/layout.mjs";
import { gerarCards, gerarIndex, preparar } from "./estilos/a.mjs";
import { medirSaida, gradeDeQuadros } from "./lib/conferir.mjs";

const VERSAO_PIPELINE = "k1-1"; // muda quando a normalização muda, para refazer os arquivos de trabalho
const EXTENSOES = [".mp4", ".mov", ".m4v", ".mkv", ".webm", ".avi"];

function lerArgs(argv) {
  const a = { rascunho: false, preparar: false, exemplo: false, forcar: false, semCheck: false, soConferir: false, entrada: null };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === "--rascunho") a.rascunho = true;
    else if (v === "--preparar") a.preparar = true;
    else if (v === "--exemplo") a.exemplo = true;
    else if (v === "--forcar") a.forcar = true;
    else if (v === "--so-conferir") a.soConferir = true;
    else if (v === "--sem-check") a.semCheck = true;
    else if (v === "--entrada") a.entrada = argv[++i];
    else falhar(`Opção desconhecida: ${v}`);
  }
  return a;
}

function escolherEntrada(nome) {
  const arquivos = fs.readdirSync(PASTA_ENTRADA).filter((f) => EXTENSOES.includes(path.extname(f).toLowerCase()));
  if (nome) {
    if (!arquivos.includes(nome)) falhar(`Não achei "${nome}" na pasta entrada/.`);
    return path.join(PASTA_ENTRADA, nome);
  }
  if (!arquivos.length) falhar("A pasta entrada/ está vazia. Coloque nela o vídeo (mp4 ou mov) que você quer editar.");
  if (arquivos.length > 1) falhar(`Há ${arquivos.length} vídeos em entrada/ (${arquivos.join(", ")}). Deixe só um ou escolha: npm run editar -- --entrada nome.mp4`);
  return path.join(PASTA_ENTRADA, arquivos[0]);
}

const nomeBase = (arq) => path.basename(arq, path.extname(arq));
const seg = (ms) => `${Math.round(ms / 1000)} s`;

async function principal() {
  const args = lerArgs(process.argv.slice(2));
  const t0 = Date.now();
  await conferirFfmpeg();
  for (const p of [PASTA_ENTRADA, PASTA_SAIDA, PASTA_TRABALHO]) fs.mkdirSync(p, { recursive: true });
  const entrada = escolherEntrada(args.entrada);
  const base = nomeBase(entrada);
  const estatisticas = fs.statSync(entrada);
  const idEntrada = `${path.basename(entrada)}|${estatisticas.size}|${Math.round(estatisticas.mtimeMs)}|${VERSAO_PIPELINE}`;
  const arqEstado = path.join(PASTA_TRABALHO, "estado.json");
  const estado = !args.forcar && fs.existsSync(arqEstado) ? lerJson(arqEstado) : {};
  const mesmo = estado.id === idEntrada;
  const video = path.join(PASTA_TRABALHO, "video.mp4");
  const voz = path.join(PASTA_TRABALHO, "voz.wav");
  const arqTranscricao = path.join(PASTA_TRABALHO, "transcricao.json");
  const arqRostos = path.join(PASTA_TRABALHO, "rostos.json");
  log(`Editaê · estilo (a) · entrada: ${path.basename(entrada)}`);

  // a) e b) normaliza o vídeo e a voz
  passo(1, "Normalizando vídeo (1080x1920, 30 fps) e voz (-14 LUFS)");
  let info = mesmo ? estado.info : null;
  if (info && fs.existsSync(video) && fs.existsSync(voz)) log("   já está pronto, pulando (use --forcar para refazer)");
  else {
    info = await analisar(entrada);
    log(`   entrada: ${info.largura}x${info.altura}, ${info.fps} fps, ${info.pixFmt}, ${Math.round(info.bitrateVideo / 1000)} kbps, cor ${info.transfer}`);
    log(`   tratamento: ${info.hdr ? "HDR -> SDR (tonemap); " : ""}${info.comprimido ? "vídeo comprimido: limpeza de bloco + lanczos + nitidez leve; " : "sem limpeza (qualidade boa); "}crop centrado 9:16`);
    await normalizarVideo(entrada, video, info);
    await normalizarVoz(entrada, voz);
    for (const f of [arqTranscricao, arqRostos]) fs.rmSync(f, { force: true });
    gravarJson(arqEstado, { id: idEntrada, info });
  }
  const durVideo = Number((await ffprobeJson(["-select_streams", "v:0", "-show_entries", "format=duration", video])).format.duration);
  const duracao = Math.floor(durVideo * 30 - 1e-3) / 30; // termina em um quadro inteiro

  // c) transcrição local
  passo(2, "Transcrevendo a fala (Parakeet, local)");
  let palavras;
  if (fs.existsSync(arqTranscricao)) {
    palavras = lerJson(arqTranscricao);
    log(`   já está pronto (${palavras.length} palavras)`);
  } else palavras = await transcrever(voz, arqTranscricao);

  // c2) rosto
  passo(3, "Procurando o rosto em quadros amostrados (local, sem Python)");
  let rostos;
  if (fs.existsSync(arqRostos)) {
    rostos = lerJson(arqRostos);
    log("   já está pronto");
  } else {
    rostos = await detectarRostos(video);
    gravarJson(arqRostos, rostos);
  }

  if (args.preparar) {
    log(`\nPronto para preencher o cards.json. Transcrição: trabalho/transcricao.json (${Math.round((Date.now() - t0) / 1000)} s).`);
    return;
  }

  // d) cards: do cards.json (ou do exemplo) para a posição na tela
  passo(4, "Montando o estilo (a): cards de vidro longe do rosto");
  const arqCards = args.exemplo ? caminho("cards.exemplo.json") : caminho("cards.json");
  if (!fs.existsSync(arqCards)) {
    falhar(
      `Não achei o ${path.basename(arqCards)}. Ele diz quais cards entram e quando. Veja o cards.exemplo.json, ` +
        `use a transcrição (trabalho/transcricao.json) para escolher os tempos e salve como cards.json. ` +
        `Para só testar, rode: npm run editar -- --exemplo`
    );
  }
  const dados = lerJson(arqCards);
  if (!Array.isArray(dados.cards) || !dados.cards.length) falhar("O cards.json precisa ter a lista \"cards\" com pelo menos um card.");
  if (dados.cor !== undefined && !/^#[0-9a-fA-F]{6}$/.test(dados.cor)) falhar('No cards.json, "cor" precisa ser um hexadecimal como #7FA6FF.');
  const preparados = dados.cards.map((c, i) => preparar(c, i));
  for (const c of preparados) if (c.fim > duracao + 0.01) falhar(`Card ${c.id} termina em ${arredondar(c.fim)} s, depois do fim do vídeo (${arredondar(duracao)} s).`);
  const { cards, avisos } = posicionar(preparados, rostos);
  gravarJson(path.join(PASTA_TRABALHO, "layout.json"), { duracao, cards });
  for (const c of cards) {
    if (c.descartado) continue;
    const folga = c.cabeca ? (c.faixa.lado === "topo" ? c.cabeca.y1 - (c.y + c.altura) : c.y - c.cabeca.y2) : null;
    log(`   ${c.id} ${c.tipo.padEnd(6)} ${arredondar(c.inicio).toFixed(2)}-${arredondar(c.fim).toFixed(2)} s  y ${c.y}-${c.y + c.altura} (${c.faixa.lado}, ${c.faixa.origem})  ${folga === null ? "zona fixa" : `folga do rosto: ${Math.round(folga)} px`}`);
  }
  for (const a of avisos) log(`   AVISO: ${a}`);
  fs.writeFileSync(path.join(PASTA_TRABALHO, "cards.html"), gerarCards({ cards, duracaoTotal: duracao, cor: dados.cor }));
  fs.writeFileSync(caminho("index.html"), gerarIndex({ duracao, videoSrc: "trabalho/video.mp4", vozSrc: "trabalho/voz.wav" }));

  const cli = cliHyperframes();
  const nomeSaida = path.join(PASTA_SAIDA, `${base}-${args.rascunho ? "rascunho" : "editado"}.mp4`);
  if (args.soConferir) {
    if (!fs.existsSync(nomeSaida)) falhar(`Não achei ${path.relative(RAIZ, nomeSaida)}: rode o render primeiro.`);
  } else {
  if (!args.semCheck) {
    passo(5, "Conferindo o projeto (hyperframes check)");
    const r = await rodar(process.execPath, [cli, "check"]);
    const texto = (r.saida + r.erro).replace(/\u001b\[[0-9;]*m/g, "");
    log(texto.trim().split("\n").slice(-6).join("\n"));
    if (r.codigo !== 0) falhar("O hyperframes check encontrou erros no projeto (acima). Nada foi renderizado.");
  }

  // e) render
  const qualidade = args.rascunho ? "draft" : "delivery";
  passo(6, `Renderizando (${qualidade}) em ${path.relative(RAIZ, nomeSaida)}. Pode levar vários minutos.`);
  const inicioRender = Date.now();
  const batida = setInterval(() => log(`   ...renderizando há ${seg(Date.now() - inicioRender)}`), 60000);
  try {
    const r = await rodar(process.execPath, [cli, "render", "--quality", qualidade, "-o", nomeSaida]);
    if (r.codigo !== 0 || !fs.existsSync(nomeSaida)) {
      falhar("O render falhou:\n" + (r.erro || r.saida).replace(/\u001b\[[0-9;]*m/g, "").trim().split("\n").slice(-12).join("\n"));
    }
  } finally {
    clearInterval(batida);
  }
  }

  // conferência com números e quadros
  passo(7, "Conferindo o resultado");
  const m = await medirSaida(nomeSaida);
  log(m.ffprobe);
  log(m.resumoEbur128);
  const sufixo = path.join(PASTA_SAIDA, `${base}-${args.rascunho ? "rascunho" : "editado"}`);
  await gradeDeQuadros(nomeSaida, cards, sufixo);
  if (!args.rascunho && (Math.abs(m.lufs + 14) > 1 || m.truePeak > -1.4)) log(`   AVISO: volume fora do alvo (${m.lufs} LUFS, pico ${m.truePeak} dBTP).`);
  log(`\nPronto em ${seg(Date.now() - t0)}: ${nomeSaida}`);
}

principal().catch((e) => {
  if (e instanceof ErroDoKit) console.error(`\nERRO: ${e.message}`);
  else console.error(e);
  process.exit(1);
});
