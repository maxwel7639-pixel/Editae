// Passo c): transcrição local (palavras e tempos) com o Parakeet do HyperFrames. Nada sai da máquina.
import fs from "node:fs";
import path from "node:path";
import { rodar, cliHyperframes, falhar, lerJson, gravarJson, PASTA_TRABALHO, log } from "./util.mjs";

export async function transcrever(voz, destino) {
  const cli = cliHyperframes();
  const antes = path.join(PASTA_TRABALHO, "transcript.json");
  fs.rmSync(antes, { force: true });
  const r = await rodar(process.execPath, [cli, "transcribe", voz, "--engine", "parakeet", "-l", "pt", "--dir", PASTA_TRABALHO]);
  if (r.codigo !== 0 || !fs.existsSync(antes)) {
    const fim = (r.erro || r.saida).trim().split("\n").slice(-8).join("\n");
    falhar(
      "A transcrição local falhou. Confira se o modelo Parakeet está instalado " +
        "(`npx hyperframes models install parakeet`) e tente de novo.\n" +
        fim
    );
  }
  const palavras = lerJson(antes);
  fs.rmSync(antes, { force: true });
  if (!Array.isArray(palavras) || !palavras.length) falhar("A transcrição voltou vazia: não ouvi fala no vídeo.");
  const limpas = palavras.map((p, i) => ({ id: p.id ?? `w${i}`, texto: p.text ?? p.texto, inicio: p.start ?? p.inicio, fim: p.end ?? p.fim }));
  gravarJson(destino, limpas);
  log(`   ${limpas.length} palavras, de ${limpas[0].inicio} s a ${limpas.at(-1).fim} s`);
  return limpas;
}
