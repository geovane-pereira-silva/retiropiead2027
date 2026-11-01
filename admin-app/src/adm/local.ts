import type { Gravacao } from "../api/adm.server";
import type { Base } from "./tipos";

/** Aplica uma operação na base em memória. Usado SÓ na prévia com dados fictícios (nada é gravado). */
export function aplicarLocal(b: Base, g: Gravacao, hoje: string, id: string): Base {
  switch (g.tipo) {
    case "pagamento":
      return { ...b, pagamentos: [...b.pagamentos, { id, familiaId: g.familiaId, data: g.data || hoje, valor: g.valor, forma: g.forma as "Pix" | "Cartão" | "Dinheiro", obs: g.obs }] };
    case "despesa":
      return { ...b, despesas: [...b.despesas, { id, categoria: g.categoria as Base["despesas"][number]["categoria"], fornecedor: g.fornecedor, descricao: g.descricao ?? "", orcado: g.orcado, pago: g.pago ?? 0, status: (g.pago ?? 0) >= g.orcado ? "Pago" : (g.pago ?? 0) > 0 ? "Aprovado" : "Orçado", data: g.data || hoje }] };
    case "despesa-status":
      return { ...b, despesas: b.despesas.map((d) => d.id === g.id ? { ...d, status: g.status, pago: g.status === "Pago" ? d.orcado : g.status === "Orçado" ? 0 : d.pago } : d) };
    case "doacao":
      return { ...b, doacoes: [{ id, data: g.data || hoje, doador: g.doador, valor: g.valor, tipo: g.modo === "Apadrinhamento de vaga" ? "Apadrinhamento de vaga" : "Avulsa", obs: g.obs }, ...b.doacoes] };
    case "ajuste":
      return { ...b, ajustes: [...b.ajustes, { id, data: hoje, familiaId: g.familiaId, tipo: g.ajuste, descricao: g.descricao, valor: g.valor ?? 0 }] };
    case "camiseta":
      return { ...b, pessoas: b.pessoas.map((p) => p.id === g.pessoaId ? { ...p, tamanho: g.tamanho, modelo: g.modelo } : p) };
  }
}
