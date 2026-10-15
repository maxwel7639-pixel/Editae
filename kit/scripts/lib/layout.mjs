// Passo c3): decide onde cada card pode ficar sem encostar no rosto.
//
// Regra (documentada em docs/POSICAO-DOS-CARDS.md (dentro do kit)):
//  1. Para cada card, junta os rostos achados na janela [início - 0,5 s, fim + 0,5 s].
//  2. Aumenta cada caixa de rosto para cobrir cabelo, pescoço e gesto (CABECA) e some tudo num retângulo só.
//  3. A área livre é a faixa acima da cabeça (a preferida) ou a faixa abaixo do queixo, sempre com uma folga
//     (FOLGA) e dentro da zona segura do Reels (sem o topo e o rodapé da interface do Instagram).
//  4. Cards que aparecem juntos empilham na faixa; se não couberem, o mais antigo sai quando o novo entra.
//  5. Se não houver rosto detectado no vídeo inteiro, usa a zona fixa de fallback (topo, y 150 a 560).
import { arredondar } from "./util.mjs";

export const TELA = { largura: 1080, altura: 1920 };
export const ZONA_SEGURA = { topo: 150, base: 1480 }; // fora disso o Instagram cobre com a interface
export const FALLBACK = { topo: 150, base: 560 }; // quando nenhum rosto é achado
export const FOLGA = 40; // distância mínima entre o card e a cabeça
export const ESPACO_ENTRE_CARDS = 24;
export const ALTURA_MINIMA = 150; // abaixo disso o card fica ilegível e é descartado com aviso
export const CABECA = { cima: 0.22, baixo: 0.15, lados: 0.2 }; // quanto cresce a caixa do rosto (fração da altura/largura dela)
const JANELA = 0.5;

function caixaDaCabeca(amostras, ini, fim) {
  let uniao = null;
  let achou = 0;
  for (const a of amostras) {
    if (a.t < ini - JANELA || a.t > fim + JANELA) continue;
    if (!a.caixas.length) continue;
    // o rosto principal é o maior
    const c = a.caixas.reduce((m, x) => ((x.x2 - x.x1) * (x.y2 - x.y1) > (m.x2 - m.x1) * (m.y2 - m.y1) ? x : m));
    const h = c.y2 - c.y1;
    const w = c.x2 - c.x1;
    const g = { x1: c.x1 - w * CABECA.lados, x2: c.x2 + w * CABECA.lados, y1: c.y1 - h * CABECA.cima, y2: c.y2 + h * CABECA.baixo };
    achou++;
    uniao = uniao
      ? { x1: Math.min(uniao.x1, g.x1), x2: Math.max(uniao.x2, g.x2), y1: Math.min(uniao.y1, g.y1), y2: Math.max(uniao.y2, g.y2) }
      : g;
  }
  return { cabeca: uniao, amostras: achou };
}

// Faixa livre para um card: { topo, base, lado: "topo" | "base", origem: "rosto" | "fallback" }.
function faixaLivre(cabeca) {
  if (!cabeca) return { topo: FALLBACK.topo, base: FALLBACK.base, lado: "topo", origem: "fallback" };
  const acima = { topo: ZONA_SEGURA.topo, base: Math.round(cabeca.y1 - FOLGA) };
  const abaixo = { topo: Math.round(cabeca.y2 + FOLGA), base: ZONA_SEGURA.base };
  const hAcima = acima.base - acima.topo;
  const hAbaixo = abaixo.base - abaixo.topo;
  // Prefere o alto (como nos Reels de referência); só vai para baixo se em cima não couber um card legível.
  if (hAcima >= ALTURA_MINIMA || hAcima >= hAbaixo) return { ...acima, lado: "topo", origem: "rosto" };
  return { ...abaixo, lado: "base", origem: "rosto" };
}

// cards: [{ id, inicio, fim, altura }], amostras: saída de detectarRostos. Devolve a lista com posição e avisos.
export function posicionar(cards, amostras, larguraCard = 880) {
  const avisos = [];
  const temRosto = amostras.some((a) => a.caixas.length);
  if (!temRosto) avisos.push("Nenhum rosto foi detectado no vídeo: usei a zona fixa do topo (y 150 a 560).");
  const envelope = temRosto ? caixaDaCabeca(amostras, -1e9, 1e9).cabeca : null;
  const ordenados = [...cards].sort((a, b) => a.inicio - b.inicio);
  const colocados = [];
  for (const c of ordenados) {
    const { cabeca, amostras: n } = temRosto ? caixaDaCabeca(amostras, c.inicio, c.fim) : { cabeca: null, amostras: 0 };
    // Sem rosto na janela deste card (rosto de lado, mão na frente...): usa o envelope do vídeo todo.
    const cab = cabeca || envelope;
    const faixa = faixaLivre(cab);
    const alturaFaixa = faixa.base - faixa.topo;
    let escala = 1;
    if (c.altura > alturaFaixa) {
      escala = alturaFaixa / c.altura;
      avisos.push(`Card "${c.id}" (${arredondar(c.inicio)} s) foi reduzido a ${Math.round(escala * 100)}% para caber longe do rosto.`);
    }
    const alturaReal = Math.round(c.altura * escala);
    if (escala < 0.75) {
      avisos.push(`Card "${c.id}" (${arredondar(c.inicio)} s) não tem área livre suficiente sem encostar no rosto: descartado.`);
      colocados.push({ ...c, descartado: true, fim: c.inicio, faixa });
      continue;
    }
    // Procura o primeiro lugar livre na faixa (de cima para baixo, ou de baixo para cima na faixa de baixo).
    // Se não houver, o card mais antigo ainda na tela sai quando este entra.
    let y = null;
    for (;;) {
      const ativos = colocados.filter((p) => !p.descartado && p.fim > c.inicio && p.faixa.lado === faixa.lado);
      y = primeiroLugar(faixa, alturaReal, ativos);
      if (y !== null || !ativos.length) break;
      const velho = ativos.reduce((m, p) => (p.inicio < m.inicio ? p : m));
      avisos.push(`Cards "${velho.id}" e "${c.id}" não cabem juntos na área livre: "${velho.id}" sai em ${arredondar(c.inicio)} s.`);
      velho.fim = c.inicio;
    }
    if (y === null) y = faixa.topo;
    colocados.push({
      ...c,
      x: Math.round((TELA.largura - larguraCard) / 2), // a escala é aplicada pelo centro do topo do card
      y,
      escala: arredondar(escala, 3),
      altura: alturaReal,
      faixa,
      cabeca: cab ? Object.fromEntries(Object.entries(cab).map(([k, v]) => [k, Math.round(v)])) : null,
      amostrasRosto: n,
    });
  }
  return { cards: colocados, avisos };
}

// Primeiro y livre dentro da faixa para um card de altura h, sem sobrepor os cards ativos (com espaço entre eles).
function primeiroLugar(faixa, h, ativos) {
  const dePraBaixo = faixa.lado === "topo";
  const candidatos = dePraBaixo
    ? [faixa.topo, ...ativos.map((p) => p.y + p.altura + ESPACO_ENTRE_CARDS)]
    : [faixa.base - h, ...ativos.map((p) => p.y - ESPACO_ENTRE_CARDS - h)];
  candidatos.sort((a, b) => (dePraBaixo ? a - b : b - a));
  for (const y of candidatos) {
    if (y < faixa.topo || y + h > faixa.base) continue;
    if (ativos.every((p) => y + h + ESPACO_ENTRE_CARDS <= p.y || y >= p.y + p.altura + ESPACO_ENTRE_CARDS)) return y;
  }
  return null;
}
