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

test("vídeo: inicia sem som ao entrar na tela e mostra só som e tela cheia", () => {
  const fonte = readFileSync("src/landing/Landing.tsx", "utf8");
  assert.match(fonte, /new IntersectionObserver/);
  assert.match(fonte, /muted=\{!som\}/);
  assert.match(fonte, /el\.play\(\)/);
  assert.match(fonte, /aria-label=\{som \? "Desativar som" : "Ativar som"\}/);
  assert.match(fonte, /Maximize2/);
  assert.doesNotMatch(fonte, /Pausar vídeo|Reproduzir com som|Este vídeo tem som/);
});

test("vídeo: mantém o quadro inteiro no celular e oferece tela cheia", () => {
  const componente = readFileSync("src/landing/Landing.tsx", "utf8");
  const estilos = readFileSync("src/landing/palavra.css", "utf8");
  assert.match(componente, /Abrir em tela cheia/);
  assert.match(componente, /requestFullscreen\(\)/);
  assert.match(componente, /webkitEnterFullscreen/);
  assert.match(componente, /reduzir \|\| telaEstreita \? undefined/);
  assert.match(estilos, /@media \(max-width: 47\.99rem\)[\s\S]*?\.pv-video-midia video\s*\{\s*object-fit: contain;/);
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
  assert.match(pagamento, /até R\$ 50,00, em até 10 vezes/);
  assert.match(pagamento, /25 de janeiro de 2027/);
  assert.deepEqual(evento.pagamento.datasPix, ["2026-11-25", "2026-12-05", "2026-12-25"]);
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

test("vídeo não prende a rolagem no celular e ocupa apenas uma tela", () => {
  const estilos = readFileSync("src/landing/palavra.css", "utf8");
  assert.match(estilos, /\.pv-video\s*\{\s*position:\s*relative;\s*height:\s*105svh;/);
  assert.match(
    estilos,
    /@media \(max-width: 47\.99rem\)[\s\S]*?\.pv-video\s*\{\s*height:\s*100svh;\s*\}[\s\S]*?\.pv-video-palco\s*\{\s*position:\s*relative;/,
  );
});

test("ScrollStory aceita movimento horizontal e organiza fotos sem sobreposição no celular", () => {
  const componente = readFileSync("src/components/ScrollStory.tsx", "utf8");
  const estilos = readFileSync("src/landing/palavra.css", "utf8");
  assert.match(componente, /addEventListener\("wheel", wheel, \{ passive: false \}\)/);
  assert.match(componente, /addEventListener\("touchmove", touchMove, \{ passive: false \}\)/);
  assert.match(estilos, /height: calc\(var\(--ss-passos, 6\) \* 88svh\)/);
  assert.match(estilos, /height: calc\(var\(--ss-passos, 6\) \* 120svh\)/);
  assert.match(estilos, /\.ss-titulo\s*\{[\s\S]*?flex-direction: column;/);
});

test("rotina inicia fechada e sinaliza que a primeira faixa pode ser aberta", () => {
  const landing = readFileSync("src/landing/Landing.tsx", "utf8");
  const estilos = readFileSync("src/landing/palavra.css", "utf8");
  assert.match(landing, /padrao=\{false\}/);
  assert.match(estilos, /pv-cartao-rotina:first-child:not\(\.aberto\)[\s\S]*?animation: pv-sinal-toque/);
});

test("formulário usa data digitada e seleção de igreja visível", () => {
  const form = readFileSync("src/landing/RegistrationForm.tsx", "utf8");
  assert.match(form, /type=\{dataDigitada \? "text"/);
  assert.match(form, /placeholder=\{p\.placeholder \?\? \(dataDigitada \? "DD\/MM\/AAAA"/);
  assert.match(form, /role="radiogroup"[\s\S]*?Primeira Assembleia de Deus[\s\S]*?Outra igreja/);
  assert.match(form, /O contato de emergência deve ser alguém que não irá ao retiro/);
  assert.match(form, /temNecessidades === "sim"/);
  assert.doesNotMatch(form, /rotulo="Cidade"/);
});

test("cadastro distingue participante e responsável e informa um envio por familiar", () => {
  const form = readFileSync("src/landing/RegistrationForm.tsx", "utf8");
  assert.match(form, /Dados do participante/);
  assert.match(form, /Dados do responsável/);
  assert.match(form, /inclusive bebês/);
  assert.match(form, /Responsável pelo menor/);
});

test("seção e formulário visitante mostram day use, datas e ausência de ônibus", () => {
  const landing = readFileSync("src/landing/Landing.tsx", "utf8");
  const form = readFileSync("src/landing/VisitorForm.tsx", "utf8");
  assert.match(landing, /function Visitantes\(\)/);
  assert.match(landing, /to="\/visitantes"/);
  assert.match(form, /não inclui transporte de ônibus/i);
  assert.match(form, /evento\.visitantes\.dias\.map/);
  assert.match(form, /evento\.visitantes\.valorDiaTodo/);
  assert.match(form, /evento\.visitantes\.valorSomenteNoite/);
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
