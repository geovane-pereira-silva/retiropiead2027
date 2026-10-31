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
    "espaço coberto gincanas.jpg",
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

test("ScrollStory: sequência de Atos 1:8 termina em PERMANECER", () => {
  const fonte = readFileSync("src/components/ScrollStory.tsx", "utf8");
  const titulos = [...fonte.matchAll(/texto: "([^"]+)"/g)].map((m) => m[1].toLowerCase());
  const linhas = fonte.match(/const LINES: string\[\]\[\] = (\[.*\]);/)?.[1] ?? "";
  const palavras = [...titulos, ...[...linhas.matchAll(/"([^"]+)"/g)].map((m) => m[1].toLowerCase())];
  assert.deepEqual(titulos, ["dunamis", "revestidos", "testemunhas"]);
  assert.equal(palavras[palavras.length - 1], "permanecer");
  assert.equal(palavras.filter((p) => p === "permanecer").length, 1);
  assert.ok(palavras.includes("confins"));
});

test("tema Dunamis: Atos 1:8 e referências complementares presentes", async () => {
  const { tema } = await import("../src/content/tema");
  assert.equal(tema.nome, "Dunamis");
  assert.equal(tema.chamada, "Recebereis poder");
  assert.match(tema.versiculo, /recebereis a virtude do Espírito Santo/);
  assert.deepEqual(
    tema.referencias.map((r) => r.ref),
    ["Lucas 24:49", "Atos 2:1-4", "João 15:4-5", "2 Timóteo 1:7"],
  );
});
