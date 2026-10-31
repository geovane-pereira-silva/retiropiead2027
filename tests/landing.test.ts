// Proteções da landing: mídia (sem imagens inventadas), preços e datas oficiais.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";

import { evento } from "../src/content/evento.ts";

const media = JSON.parse(readFileSync("src/content/media.json", "utf8")) as {
  fotos: Record<string, { src: string; alt: string; preview?: string }[]>;
  video: { src: string; titulo: string } | null;
};
const docs = readFileSync("docs/midia.md", "utf8");

test("mídia: grupos esperados existem e só aceitam arquivos que existem em public/", () => {
  for (const g of ["hero", "local", "culto", "quartos", "adoracao", "convivencia"]) {
    assert.ok(Array.isArray(media.fotos[g]), `grupo ${g} ausente`);
    for (const f of media.fotos[g]) {
      assert.ok(f.alt && f.alt.length > 5, `foto sem texto alternativo em ${g}`);
      assert.ok(f.src.startsWith("/fotos/"), `src fora de /fotos/: ${f.src}`);
      assert.ok(
        existsSync(`public${decodeURIComponent(f.src)}`),
        `arquivo cadastrado não existe: ${f.src}`,
      );
      assert.ok(f.preview?.startsWith("/fotos/preview/"), `foto sem prévia leve: ${f.src}`);
      const previewPath = `public${decodeURIComponent(f.preview)}`;
      assert.ok(existsSync(previewPath), `prévia não existe: ${f.preview}`);
      assert.ok(statSync(previewPath).size < 60_000, `prévia pesada: ${f.preview}`);
    }
  }
  if (media.video) {
    const videoPath = `public${decodeURIComponent(media.video.src)}`;
    assert.ok(existsSync(videoPath), "vídeo cadastrado não existe");
    assert.ok(
      statSync(videoPath).size < 100_000_000,
      "vídeo ultrapassa o limite estático de 100 MB do plano Hobby",
    );
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
    "choro de adoração.jpg",
    "lagrimas de adoração.jpg",
    "jvoem chorando pelo toqe do Espirito.jpg",
  ]) {
    assert.ok(docs.includes(nome), `docs/midia.md não cita ${nome}`);
  }
});

test("fotos: todas as 16 imagens reais estão cadastradas", () => {
  const total = Object.values(media.fotos).reduce((n, fotos) => n + fotos.length, 0);
  assert.equal(total, 16);
});

test("fotos: preview carrega antes da imagem em alta resolução", () => {
  const fonte = readFileSync("src/landing/Gallery.tsx", "utf8");
  assert.match(fonte, /src=\{carregarOriginal \? f\.src : undefined\}/);
  assert.match(fonte, /src=\{f\.preview\}/);
  assert.match(fonte, /onLoad=\{\(\) => setCarregarOriginal\(true\)\}/);
});

test("fotos: imagens que não aparecem nas outras seções são exibidas na galeria final", () => {
  const fonte = readFileSync("src/landing/Landing.tsx", "utf8");
  assert.match(fonte, /function FotosAdicionais\(\)/);
  assert.match(fonte, /<FotosAdicionais \/>/);
  for (const indice of [4, 5, 6]) {
    assert.ok(fonte.includes(`grupo: "adoracao", indice: ${indice}`));
  }
  assert.ok(fonte.includes('grupo: "adoracao", indice: 2'));
  assert.ok(fonte.includes('grupo: "adoracao", indice: 3'));
  assert.ok(fonte.includes('grupo: "convivencia", indice: 1'));
  assert.ok(!fonte.includes('grupo: "convivencia", indice: 2'));
  assert.match(fonte, /Mais momentos do retiro/);
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
  assert.equal(evento.maxParticipantesPorInscricao, 1);
  assert.ok(evento.incluso.some((item) => item.titulo === "Kit do retiro e camisa"));
  const pagamento = evento.faq.find((item) => item.p === "Como faço o pagamento?")?.r ?? "";
  assert.match(pagamento, /10 parcelas de R\$ 50,00/);
  assert.match(pagamento, /16 de janeiro de 2027/);
  assert.deepEqual(evento.dataCurta, { de: "5", ate: "9", mes: "fevereiro", ano: "2027" });
});

test("ScrollStory: sequência de Atos 1:8 termina nos confins e não mistura outro congresso", () => {
  const fonte = readFileSync("src/components/ScrollStory.tsx", "utf8");
  const titulos = [...fonte.matchAll(/texto: "([^"]+)"/g)].map((m) => m[1].toLowerCase());
  const linhas = fonte.match(/const LINES: string\[\]\[\] = (\[.*\]);/)?.[1] ?? "";
  const palavras = [
    ...titulos,
    ...[...linhas.matchAll(/"([^"]+)"/g)].map((m) => m[1].toLowerCase()),
  ];
  assert.deepEqual(titulos, ["dunamis", "revestidos", "testemunhas"]);
  assert.equal(palavras[palavras.length - 1], "confins");
  assert.doesNotMatch(fonte, /permanecer/i);
  assert.doesNotMatch(readFileSync("src/content/tema.ts", "utf8"), /permanecer/i);
  assert.ok(palavras.includes("confins"));
});

test("tema Dunamis: Atos 1:8 e referências complementares presentes", async () => {
  const { tema } = await import("../src/content/tema.ts");
  assert.equal(tema.nome, "Dunamis");
  assert.equal(tema.chamada, "Recebereis poder");
  assert.match(tema.versiculo, /recebereis a virtude do Espírito Santo/);
  assert.deepEqual(
    tema.referencias.map((r) => r.ref),
    ["Lucas 24:49", "Atos 2:1-4", "2 Timóteo 1:7"],
  );
});
