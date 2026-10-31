// Proteções da landing: mídia (sem imagens inventadas), preços e datas oficiais.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

import { evento } from "../src/content/evento";

const media = JSON.parse(readFileSync("src/content/media.json", "utf8")) as {
  fotos: Record<string, { src: string; alt: string }[]>;
  video: { src: string; titulo: string } | null;
};
const docs = readFileSync("docs/midia.md", "utf8");

test("mídia: grupos esperados existem e só aceitam arquivos que existem em public/", () => {
  for (const g of ["hero", "local", "culto", "quartos", "adoracao", "convivencia"]) {
    assert.ok(Array.isArray(media.fotos[g]), `grupo ${g} ausente`);
    for (const f of media.fotos[g]) {
      assert.ok(f.alt && f.alt.length > 5, `foto sem texto alternativo em ${g}`);
      assert.ok(f.src.startsWith("/midia/"), `src fora de /midia/: ${f.src}`);
      assert.ok(existsSync(`public${f.src}`), `arquivo cadastrado não existe: ${f.src}`);
    }
  }
  if (media.video) {
    assert.ok(existsSync(`public${media.video.src}`), "vídeo cadastrado não existe");
    assert.ok(media.video.titulo, "vídeo sem título");
  }
});

test("docs/midia.md lista todos os arquivos pendentes", () => {
  for (const nome of [
    "frente do local 16x9.jpg",
    "frente do local.jpg",
    "espalo de culto.jpg",
    "quarto.jpg",
    "quarto a.jpg",
    "quarto b.jpg",
    "jovens adorando.jpg",
    "jovens abraçados adorando.jpg",
    "oração e adoração.jpg",
    "oração pelo jovem.jpg",
    "jovem feliz.jpg",
    "jovem na gincana feliz.jpg",
  ]) {
    assert.ok(docs.includes(nome), `docs/midia.md não cita ${nome}`);
  }
});

test("dados oficiais do evento permanecem inalterados", () => {
  assert.equal(evento.nome, "Retiro Conexão Jovem");
  assert.equal(evento.edicao, "2027");
  assert.deepEqual(
    evento.faixas.map((f) => [f.id, f.valor]),
    [
      ["menor-5", 0],
      ["5-9", 200],
      ["10-mais", 400],
    ],
  );
  assert.equal(evento.maxParticipantesPorInscricao, 10);
  assert.deepEqual(evento.dataCurta, { de: "5", ate: "9", mes: "fevereiro", ano: "2027" });
});
