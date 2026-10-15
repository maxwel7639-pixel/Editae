// Utilitários do kit: caminhos, execução de programas e mensagens em português.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const caminho = (...partes) => path.join(RAIZ, ...partes);
export const PASTA_ENTRADA = caminho("entrada");
export const PASTA_SAIDA = caminho("saida");
export const PASTA_TRABALHO = caminho("trabalho");

export const log = (msg) => console.log(msg);
export const passo = (n, msg) => console.log(`\n[${n}] ${msg}`);

export class ErroDoKit extends Error {}
export const falhar = (msg) => {
  throw new ErroDoKit(msg);
};

// Roda um programa sem shell (funciona igual no Windows e no Mac). Devolve { codigo, saida, erro }.
export function rodar(programa, args, { aoErro = false, mostrar = false } = {}) {
  return new Promise((resolve, reject) => {
    const filho = spawn(programa, args, { cwd: RAIZ, windowsHide: true });
    let saida = "";
    let erro = "";
    filho.stdout.on("data", (d) => {
      saida += d;
      if (mostrar) process.stdout.write(d);
    });
    filho.stderr.on("data", (d) => {
      erro += d;
      if (mostrar) process.stderr.write(d);
    });
    filho.on("error", (e) => reject(e));
    filho.on("close", (codigo) => {
      if (aoErro && codigo !== 0) {
        const fim = (erro || saida).trim().split("\n").slice(-12).join("\n");
        reject(new ErroDoKit(`O programa "${path.basename(programa)}" falhou (código ${codigo}):\n${fim}`));
      } else resolve({ codigo, saida, erro });
    });
  });
}

export const FFMPEG = process.env.FFMPEG || "ffmpeg";
export const FFPROBE = process.env.FFPROBE || "ffprobe";

export async function conferirFfmpeg() {
  for (const [nome, bin] of [["ffmpeg", FFMPEG], ["ffprobe", FFPROBE]]) {
    try {
      await rodar(bin, ["-version"], { aoErro: true });
    } catch {
      falhar(
        `Não encontrei o ${nome} nesta máquina. Rode o instalador do kit (instalar-windows ou instalar-mac) ` +
          `ou instale o ffmpeg e tente de novo.`
      );
    }
  }
}

export const ffmpeg = (args, opc = {}) => rodar(FFMPEG, ["-hide_banner", "-nostdin", ...args], { aoErro: true, ...opc });
export const ffprobeJson = async (args) => JSON.parse((await rodar(FFPROBE, ["-v", "error", "-of", "json", ...args], { aoErro: true })).saida);

export async function temFiltro(nome) {
  const { saida } = await rodar(FFMPEG, ["-hide_banner", "-filters"]);
  return new RegExp(`\\s${nome}\\s`).test(saida);
}

// Caminho do executável da CLI do HyperFrames instalada em node_modules (versão fixada no package.json).
export function cliHyperframes() {
  const p = caminho("node_modules", "hyperframes", "bin", "hyperframes.mjs");
  if (!fs.existsSync(p)) falhar("O HyperFrames ainda não foi instalado. Rode `npm install` dentro da pasta do kit.");
  return p;
}

export const lerJson = (arq) => JSON.parse(fs.readFileSync(arq, "utf8"));
export const gravarJson = (arq, obj) => fs.writeFileSync(arq, JSON.stringify(obj, null, 2));
export const arredondar = (n, casas = 2) => Math.round(n * 10 ** casas) / 10 ** casas;
