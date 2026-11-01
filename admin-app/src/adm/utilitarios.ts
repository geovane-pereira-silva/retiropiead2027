export type DirecaoOrdenacao = "asc" | "desc";

/** Lê valores monetários digitados em pt-BR ou planilhas, sem perder separador de milhar. */
export function lerDinheiro(valor: unknown): number {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  let texto = String(valor ?? "").trim().replace(/\s|R\$/gi, "").replace(/[^\d,.-]/g, "");
  if (!texto) return 0;
  const negativo = texto.startsWith("-");
  texto = texto.replace(/-/g, "");
  const virgula = texto.lastIndexOf(",");
  const ponto = texto.lastIndexOf(".");
  if (virgula >= 0 && ponto >= 0) {
    const decimal = Math.max(virgula, ponto);
    texto = `${texto.slice(0, decimal).replace(/[.,]/g, "")}.${texto.slice(decimal + 1).replace(/[.,]/g, "")}`;
  } else if (virgula >= 0) {
    texto = `${texto.slice(0, virgula).replace(/,/g, "")}.${texto.slice(virgula + 1).replace(/,/g, "")}`;
  } else if ((texto.match(/\./g)?.length ?? 0) > 1 || /^\d{1,3}\.\d{3}$/.test(texto)) {
    texto = texto.replace(/\./g, "");
  }
  const numero = Number(texto);
  return Number.isFinite(numero) ? (negativo ? -numero : numero) : 0;
}

export function normalizarBusca(valor: unknown): string {
  return String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

export function ordenarPor<T>(itens: readonly T[], valor: (item: T) => string | number, direcao: DirecaoOrdenacao = "asc"): T[] {
  const fator = direcao === "asc" ? 1 : -1;
  const numerico = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });
  return [...itens].sort((a, b) => {
    const va = valor(a);
    const vb = valor(b);
    const comparacao = typeof va === "number" && typeof vb === "number" ? va - vb : numerico.compare(String(va), String(vb));
    return fator * comparacao;
  });
}

export function hojeLocalISO(agora = new Date()): string {
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function dataISOValida(valor: unknown): valor is string {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}
