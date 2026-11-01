import { rotuloSituacao } from "./calculos";
import type { ResumoGeral } from "./calculos";
import type { Base } from "./tipos";

export const MODELOS = ["Infantil", "Baby look", "Normal"];
export const TAMANHOS_POR_MODELO = {
  Infantil: ["6", "8", "10", "12", "14", "Medida especial"],
  "Baby look": ["P", "M", "G", "GG", "XG"],
  Normal: ["P", "M", "G", "GG", "XG", "Medida especial"],
} as const;

export function resumoTransporte(b: Base) {
  const onibus = b.pessoas.filter((p) => p.transporte === "onibus").length;
  return { onibus, proprio: b.pessoas.length - onibus };
}

export function resumoCamisetas(b: Base) {
  const mapa = new Map<string, number>();
  let semTamanho = 0;
  for (const p of b.pessoas) {
    if (!p.tamanho) { semTamanho++; continue; }
    const k = `${p.modelo || "Sem modelo"} · ${p.tamanho}`;
    mapa.set(k, (mapa.get(k) ?? 0) + 1);
  }
  return { itens: [...mapa.entries()].sort((a, c) => a[0].localeCompare(c[0], "pt-BR", { numeric: true })), semTamanho };
}

const celula = (v: string | number) => {
  const s = String(v);
  const seguro = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[";\n]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
};

/** CSV (separador ";" para abrir direto no Excel/Sheets em português). */
export function csvInscritos(b: Base, r: ResumoGeral): string {
  const linhas = [["Família", "Pessoa", "Papel", "Classificação interna", "Idade", "Valor individual", "Transporte", "Camiseta", "Situação da família", "Pago pela família (preencher só na 1ª linha)", "Devido pela família (preencher só na 1ª linha)", "Telefone", "Igreja"]];
  for (const f of r.familias) {
    const pessoas = b.pessoas.filter((x) => x.familiaId === f.familia.id);
    pessoas.forEach((p, indice) => {
      linhas.push([
        f.familia.responsavel, p.nome, p.papel, p.classificacao, p.idade === null ? "" : String(p.idade), String(p.valor),
        p.transporte === "onibus" ? "Ônibus" : "Carro próprio",
        p.tamanho ? `${p.modelo ?? ""} ${p.tamanho}`.trim() : "",
        rotuloSituacao[f.situacao], indice === 0 ? String(f.pago) : "", indice === 0 ? String(f.devido) : "", f.familia.telefone, f.familia.igreja,
      ]);
    });
  }
  return "﻿" + linhas.map((l) => l.map(celula).join(";")).join("\r\n");
}
