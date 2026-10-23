// Trava de segurança do build (CVE-2026-102989, XSS no TanStack Start).
// Falha se as versões INSTALADAS forem menores que as corrigidas. Não há como "pular":
// para liberar o build, atualize as dependências (bun install).
//   Corrigidas: @tanstack/react-start >= 1.168.60  e  @tanstack/start-server-core >= 1.169.39
// Uso: node scripts/verificar-dependencias.mjs [pasta-do-projeto]
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const raiz = resolve(process.argv[2] ?? ".");
const MINIMOS = {
  "@tanstack/react-start": "1.168.60",
  "@tanstack/start-server-core": "1.169.39",
};

const partes = (v) => v.split("-")[0].split(".").map((n) => Number.parseInt(n, 10) || 0);
function maiorOuIgual(a, b) {
  const x = partes(a);
  const y = partes(b);
  for (let i = 0; i < 3; i++) {
    if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0);
  }
  return true;
}

function versoesInstaladas(nome) {
  // O pacote pode existir na raiz e/ou aninhado dentro de outro pacote (bun/npm).
  const achadas = [];
  const raizPkg = join(raiz, "node_modules", nome, "package.json");
  if (existsSync(raizPkg)) achadas.push([raizPkg, JSON.parse(readFileSync(raizPkg, "utf8")).version]);
  return achadas;
}

let falhou = false;
for (const [nome, minimo] of Object.entries(MINIMOS)) {
  const achadas = versoesInstaladas(nome);
  if (achadas.length === 0) {
    console.error(`✗ ${nome}: não encontrado em node_modules (rode a instalação antes do build).`);
    falhou = true;
    continue;
  }
  for (const [caminho, versao] of achadas) {
    if (maiorOuIgual(versao, minimo)) {
      console.log(`✓ ${nome}@${versao} (mínimo seguro ${minimo})`);
    } else {
      console.error(`✗ ${nome}@${versao} é VULNERÁVEL (CVE-2026-102989). Mínimo: ${minimo}. Arquivo: ${caminho}`);
      falhou = true;
    }
  }
}
if (falhou) {
  console.error("Build bloqueado por segurança. Atualize as dependências do TanStack Start.");
  process.exit(1);
}
