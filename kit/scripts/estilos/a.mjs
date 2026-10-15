// Estilo (a): vídeo em tela cheia + cards de vidro escuro flutuando longe do rosto.
// Gera trabalho/cards.html (uma sub-composição com todos os cards e uma linha do tempo só) e o index.html.
import { falhar } from "../lib/util.mjs";

export const NOME = "a";
export const LARGURA_CARD = 880;
export const SAIDA_CARD = 0.36; // duração da saída do card (s)
export const DURACAO_MINIMA = 1.2;

const ICONES = {
  mensagem: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z" />',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4l-1.1 1.1M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.1-1.1" />',
  check: '<path d="M5 12.5l4.5 4.5L19 7" />',
  estrela: '<path d="M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 17l-5.6 3 1.3-6.2L3 9.5l6.3-.7z" />',
  raio: '<path d="M13 2L4 14h7l-1 8 9-12h-7z" />',
};
export const NOMES_ICONES = Object.keys(ICONES);

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Estima as linhas de um texto de 32 px na coluna do card (greedy por palavra).
function linhas(texto, porLinha) {
  let n = 1;
  let atual = 0;
  for (const palavra of String(texto).split(/\s+/)) {
    if (atual && atual + 1 + palavra.length > porLinha) {
      n++;
      atual = palavra.length;
    } else atual += (atual ? 1 : 0) + palavra.length;
  }
  return n;
}

const LIMITES = { titulo: 30, texto: 70, rotulo: 40, valor: 10 };
function exigir(card, i, campo, max) {
  const v = card[campo];
  if (typeof v !== "string" || !v.trim()) falhar(`cards.json, card ${i + 1}: falta o campo "${campo}" (tipo "${card.tipo}").`);
  if (v.length > max) falhar(`cards.json, card ${i + 1}: "${campo}" tem ${v.length} letras; o máximo é ${max}. Encurte.`);
}

// Valida e devolve o card já com altura calculada. Tipos: texto, numero, passo.
export function preparar(card, i) {
  const id = `c${i + 1}`;
  const base = { id, inicio: Number(card.inicio), duracao: Number(card.duracao), tipo: card.tipo };
  if (!Number.isFinite(base.inicio) || base.inicio < 0) falhar(`cards.json, card ${i + 1}: "inicio" precisa ser um número em segundos (0 ou mais).`);
  if (!Number.isFinite(base.duracao) || base.duracao < DURACAO_MINIMA) falhar(`cards.json, card ${i + 1}: "duracao" precisa ser de pelo menos ${DURACAO_MINIMA} s.`);
  base.fim = base.inicio + base.duracao;
  if (card.tipo === "texto") {
    exigir(card, i, "titulo", LIMITES.titulo);
    if (card.texto !== undefined) exigir(card, i, "texto", LIMITES.texto);
    if (card.icone !== undefined && !ICONES[card.icone]) falhar(`cards.json, card ${i + 1}: ícone "${card.icone}" não existe. Use: ${NOMES_ICONES.join(", ")}.`);
    const n = card.texto ? linhas(card.texto, 30) : 0;
    return { ...base, titulo: card.titulo, texto: card.texto || "", icone: card.icone || "mensagem", altura: 64 + Math.max(96, 46 + 40 * n) };
  }
  if (card.tipo === "numero") {
    exigir(card, i, "valor", LIMITES.valor);
    exigir(card, i, "rotulo", LIMITES.rotulo);
    return { ...base, valor: card.valor, rotulo: card.rotulo, altura: 208 };
  }
  if (card.tipo === "passo") {
    exigir(card, i, "titulo", LIMITES.titulo);
    if (card.texto !== undefined) exigir(card, i, "texto", LIMITES.texto);
    const n = card.texto ? linhas(card.texto, 34) : 0;
    return { ...base, numero: String(card.numero ?? i + 1), titulo: card.titulo, texto: card.texto || "", altura: 64 + Math.max(88, 52 + 38 * n) };
  }
  falhar(`cards.json, card ${i + 1}: tipo "${card.tipo}" não existe. Use: texto, numero ou passo.`);
}

function corpoDoCard(c) {
  if (c.tipo === "texto") {
    return `
        <div class="lead ic"><svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${ICONES[c.icone]}</svg></div>
        <div class="col">
          <div class="tit">${esc(c.titulo)}</div>${c.texto ? `\n          <div class="txt">${esc(c.texto)}</div>` : ""}
        </div>`;
  }
  if (c.tipo === "numero") {
    return `
        <div class="num" id="${c.id}-valor">${esc(c.valor)}</div>
        <div class="col"><div class="rot">${esc(c.rotulo)}</div></div>`;
  }
  return `
        <div class="lead bad">${esc(c.numero)}</div>
        <div class="col">
          <div class="tit">${esc(c.titulo)}</div>${c.texto ? `\n          <div class="txt">${esc(c.texto)}</div>` : ""}
        </div>`;
}

// Divide "R$ 1.200+" em prefixo, número e sufixo, para o contador subir até o valor.
function partesDoValor(v) {
  const m = String(v).match(/^(\D*?)(\d+)(\D*)$/);
  return m ? { prefixo: m[1], numero: Number(m[2]), sufixo: m[3] } : null;
}

export function gerarCards({ cards, duracaoTotal, cor }) {
  const itens = cards.filter((c) => !c.descartado);
  const destaque = cor || "#7FA6FF";
  const html = itens
    .map(
      (c) => `
      <div id="${c.id}-pos" class="pos" style="left:${c.x}px; top:${c.y}px; width:${LARGURA_CARD}px; height:${Math.round(c.altura / c.escala)}px;">
        <div id="${c.id}-flut" class="flut">
          <div id="${c.id}-sombra" class="sombra"></div>
          <div id="${c.id}-card" class="card t-${c.tipo}">
            <div class="borda"></div>${corpoDoCard(c)}
            <div id="${c.id}-brilho" class="brilho" data-layout-ignore></div>
          </div>
        </div>
      </div>`
    )
    .join("\n");

  const linhaDoTempo = itens
    .map((c) => {
      const dir = c.faixa.lado === "topo" ? -1 : 1; // entra vindo do lado da borda da tela
      const t0 = Number(c.inicio.toFixed(3));
      const tSai = Number((c.fim - SAIDA_CARD).toFixed(3));
      const partes = [
        `gsap.set("#${c.id}-pos", { scale: ${c.escala}, transformOrigin: "50% 0%" });`,
        `gsap.set("#${c.id}-brilho", { rotation: 18 });`,
        `tl.fromTo("#${c.id}-sombra", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power1.out" }, ${t0});`,
        `tl.fromTo("#${c.id}-card", { opacity: 0, y: ${dir * 90}, scale: 0.96, filter: "blur(10px)" }, { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.6, ease: "expo.out" }, ${t0});`,
        `tl.fromTo("#${c.id}-card .lead, #${c.id}-card .num", { scale: 0.6, rotation: -14 }, { scale: 1, rotation: 0, duration: 0.5, ease: "back.out(2)" }, ${Number((t0 + 0.1).toFixed(3))});`,
        `tl.fromTo("#${c.id}-card .col > *", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out", stagger: 0.07 }, ${Number((t0 + 0.16).toFixed(3))});`,
        `tl.fromTo("#${c.id}-brilho", { x: 0 }, { x: 1400, duration: 0.85, ease: "power2.inOut" }, ${Number((t0 + 0.4).toFixed(3))});`,
      ];
      const pernas = Math.floor((c.duracao - 1.0) / 0.8);
      if (pernas >= 1)
        partes.push(`tl.fromTo("#${c.id}-flut", { y: 0 }, { y: -6, duration: 0.8, ease: "sine.inOut", yoyo: true, repeat: ${pernas - 1} }, ${Number((t0 + 0.6).toFixed(3))});`);
      if (c.tipo === "numero") {
        const p = partesDoValor(c.valor);
        if (p)
          partes.push(
            `{ const o = { v: 0 }; tl.to(o, { v: ${p.numero}, duration: ${Number(Math.min(1.6, c.duracao - 0.9).toFixed(2))}, ease: "power2.out", onUpdate: () => { document.getElementById("${c.id}-valor").textContent = ${JSON.stringify(p.prefixo)} + Math.round(o.v).toLocaleString("pt-BR") + ${JSON.stringify(p.sufixo)}; } }, ${Number((t0 + 0.35).toFixed(3))}); }`
          );
      }
      partes.push(
        `tl.to("#${c.id}-card", { opacity: 0, y: ${dir * 46}, scale: 0.97, filter: "blur(8px)", duration: ${SAIDA_CARD}, ease: "power2.in" }, ${tSai});`,
        `tl.to("#${c.id}-sombra", { opacity: 0, duration: ${SAIDA_CARD}, ease: "power1.in" }, ${tSai});`
      );
      return `          // ${c.id} (${c.tipo}) ${c.inicio.toFixed(2)} a ${c.fim.toFixed(2)} s, faixa: ${c.faixa.lado}\n          ` + partes.join("\n          ");
    })
    .join("\n\n");

  return `<!DOCTYPE html>
<!--
  GERADO por scripts/editar.mjs a partir do cards.json. Não edite à mão: mude o cards.json e rode de novo.
  Estilo (a): cards de vidro escuro flutuando na área livre, longe do rosto.
-->
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
  </head>
  <body>
    <template>
      <style>
        @font-face { font-family: "Figtree"; src: url("assets/fonts/Figtree-600.ttf"); font-weight: 600; }
        @font-face { font-family: "Figtree"; src: url("assets/fonts/Figtree-700.ttf"); font-weight: 700; }
        @font-face { font-family: "Figtree"; src: url("assets/fonts/Figtree-800.ttf"); font-weight: 800; }
        #cards { position: absolute; inset: 0; overflow: hidden; font-family: "Figtree", sans-serif; color: #f2f4f8; --destaque: ${destaque}; }
        #cards .pos { position: absolute; }
        #cards .flut { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
        #cards .sombra { position: absolute; left: -90px; top: -70px; width: calc(100% + 180px); height: calc(100% + 140px); background: radial-gradient(closest-side, rgba(5, 8, 16, 0.5), rgba(5, 8, 16, 0) 100%); }
        #cards .card { position: absolute; left: 0; top: 0; width: 100%; height: 100%; border-radius: 40px; overflow: hidden; display: flex; align-items: center; gap: 28px; padding: 0 36px 0 32px; background: linear-gradient(160deg, rgba(26, 38, 76, 0.82) 0%, rgba(12, 17, 32, 0.9) 55%, rgba(7, 9, 12, 0.93) 100%); backdrop-filter: blur(18px) saturate(140%); box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25), 0 18px 36px rgba(0, 0, 0, 0.32), 0 50px 100px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.18), inset 0 0 0 1px rgba(127, 166, 255, 0.2); }
        #cards .borda { position: absolute; left: 0; top: 0; width: 100%; height: 2px; background: linear-gradient(90deg, rgba(127, 166, 255, 0) 0%, rgba(160, 190, 255, 0.95) 50%, rgba(127, 166, 255, 0) 100%); }
        #cards .brilho { position: absolute; left: -260px; top: -200px; width: 180px; height: 700px; background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.14) 50%, rgba(255, 255, 255, 0) 100%); }
        #cards .lead { flex: none; width: 96px; height: 96px; border-radius: 28px; display: flex; align-items: center; justify-content: center; background: linear-gradient(145deg, #4f78ff, #1e50f0); box-shadow: 0 12px 30px rgba(30, 80, 240, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.35); }
        #cards .lead svg { width: 52px; height: 52px; }
        #cards .bad { width: 88px; height: 88px; border-radius: 44px; font-weight: 800; font-size: 46px; color: #ffffff; }
        #cards .col { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 6px; }
        #cards .tit { font-weight: 800; font-size: 40px; line-height: 1.1; color: #f2f4f8; }
        #cards .txt { font-weight: 600; font-size: 32px; line-height: 40px; color: #dfe5f2; }
        #cards .num { flex: none; font-weight: 800; font-size: 124px; line-height: 1; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; color: var(--destaque); text-shadow: 0 6px 30px rgba(30, 80, 240, 0.55); }
        #cards .rot { font-weight: 700; font-size: 40px; line-height: 1.15; color: #f2f4f8; }
      </style>

      <div id="cards" data-composition-id="cards" data-width="1080" data-height="1920">${html}
      </div>

      <script>
        (function () {
          const tl = gsap.timeline({ paused: true });
${linhaDoTempo}
          window.__timelines["cards"] = tl;
        })();
      </script>
    </template>
  </body>
</html>
`;
}

export function gerarIndex({ duracao, videoSrc, vozSrc }) {
  const d = Number(duracao.toFixed(3));
  return `<!DOCTYPE html>
<!--
  GERADO por scripts/editar.mjs (estilo a). 1080x1920, 30 fps, ${d} s.
  Vídeo em tela cheia + cards de vidro escuro flutuando longe do rosto (trabalho/cards.html).
-->
<html lang="pt-BR" data-resolution="portrait">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1080, height=1920">
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #07090c; }
      #main { position: relative; width: 100%; height: 100%; overflow: hidden; background: #07090c; }
      #video { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; object-fit: cover; }
      .cena { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; }
    </style>
  </head>
  <body>
    <div id="main" data-composition-id="main" data-start="0" data-duration="${d}" data-width="1080" data-height="1920">
      <video id="video" class="clip" src="${videoSrc}" muted playsinline data-start="0" data-duration="${d}" data-track-index="0"></video>
      <div id="h-cards" class="cena" data-composition-id="cards" data-composition-src="trabalho/cards.html" data-start="0" data-duration="${d}" data-track-index="2" data-track-kind="graphics" data-width="1080" data-height="1920"></div>
      <audio id="voz" src="${vozSrc}" data-start="0" data-duration="${d}" data-track-index="5" data-volume="1"></audio>
    </div>

    <script>
      const tl = gsap.timeline({ paused: true });
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
}
