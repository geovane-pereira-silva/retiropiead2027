import { faixas } from "../content/evento";
import type {
  Ajuste,
  Base,
  CategoriaDespesa,
  Despesa,
  Doacao,
  FaixaId,
  ClassificacaoParticipante,
  Familia,
  FormaPagamento,
  Pagamento,
  Pessoa,
  StatusDespesa,
  TipoAjuste,
  Transporte,
} from "./tipos";
import { CATEGORIAS } from "./tipos";
import { lerDinheiro } from "./utilitarios";

/**
 * Estrutura das abas criadas pelo sistema. A MESMA lista existe em apps-script/Code.gs
 * (função prepararPlanilha). A aba "Inscrições" é do site e nunca é alterada por aqui.
 */
export const ABAS = {
  pagamentos: ["id", "data", "familiaId", "valor", "forma", "obs", "lancadoPor", "lancadoEm"],
  despesas: ["id", "data", "categoria", "fornecedor", "descricao", "orcado", "pago", "status", "lancadoPor", "atualizadoEm"],
  doacoes: ["id", "data", "doador", "valor", "tipo", "obs", "lancadoPor"],
  ajustes: ["id", "data", "familiaId", "tipo", "descricao", "valor", "lancadoPor"],
  extras: ["pessoaId", "tamanho", "modelo", "atualizadoPor", "atualizadoEm"],
  historico: ["quando", "usuario", "acao", "detalhe"],
} as const;

export type LinhaBruta = Record<string, unknown>;
export type DadosBrutos = {
  inscricoes: LinhaBruta[];
  pagamentos: LinhaBruta[];
  despesas: LinhaBruta[];
  doacoes: LinhaBruta[];
  ajustes: LinhaBruta[];
  extras: LinhaBruta[];
};

const txt = (v: unknown): string => (v === undefined || v === null ? "" : String(v).trim());
/** Aceita número, "1234.5" ou "R$ 1.234,50". */
export function numero(v: unknown): number {
  return lerDinheiro(v);
}
/** Datas da planilha podem chegar como "2026-11-25", ISO completo ou Date serializada. */
export function dataISO(v: unknown): string {
  const s = txt(v);
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  if (m) return m[1];
  const br = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(s);
  return br ? `${br[3]}-${br[2]}-${br[1]}` : "";
}

function faixaId(rotulo: string, idade: number | null, valor: number): FaixaId {
  if (/visitante/i.test(rotulo)) return "visitante";
  const f = faixas.find((x) => x.rotulo === rotulo);
  if (f && (f.id === "menor-5" || f.id === "5-9" || f.id === "10-mais")) return f.id;
  if (idade !== null) return idade < 5 ? "menor-5" : idade < 10 ? "5-9" : "10-mais";
  return valor === 0 ? "menor-5" : valor <= 200 ? "5-9" : "10-mais";
}

function classificar(r: LinhaBruta, papel: string, idade: number | null, valor: number): ClassificacaoParticipante {
  const gravado = txt(r.statusInterno).toLocaleLowerCase("pt-BR");
  const classificacoes: Record<string, ClassificacaoParticipante> = {
    "organizador (paga meia)": "Organizador (paga meia)",
    "apoio (não pagante)": "Apoio (não pagante)",
    "não pagante (crianças de 0 a 4)": "Não pagante (0–4 anos)",
    "participante inteira": "Participante inteira",
    "participante meia": "Participante meia",
    "visitante": "Visitante",
  };
  if (classificacoes[gravado]) return classificacoes[gravado];
  const texto = txt(r.valorTexto).toLocaleLowerCase("pt-BR");
  const faixa = txt(r.faixa).toLocaleLowerCase("pt-BR");
  if (/visitante/i.test(papel) || /visitante/.test(faixa)) return "Visitante";
  if (/equipe apoio|apoio/.test(texto)) return "Apoio (não pagante)";
  if (/organizador/.test(texto)) return "Organizador (paga meia)";
  if (idade !== null && idade < 5 && (valor === 0 || /^gratuito/.test(texto))) return "Não pagante (0–4 anos)";
  if (valor > 0 && valor <= 200) return "Participante meia";
  return "Participante inteira";
}

const FORMAS: FormaPagamento[] = ["Pix", "Cartão", "Dinheiro"];
const STATUS: StatusDespesa[] = ["Orçado", "Aprovado", "Pago"];
const TIPOS_AJUSTE: TipoAjuste[] = ["Desconto", "Isenção", "Correção de dados", "Observação"];

export function montarBase(d: DadosBrutos): Base {
  const familias = new Map<string, Familia>();
  const pessoas: Pessoa[] = [];

  for (const r of d.inscricoes) {
    const familiaId = txt(r.familiaId);
    const nome = txt(r.nome);
    if (!familiaId || !nome) continue;
    const valor = numero(r.valor);
    const idadeBruta = txt(r.idadeNaDataDoRetiro);
    const idade = idadeBruta ? numero(idadeBruta) : null;
    const transporte: Transporte = /pr[oó]prio/i.test(txt(r.transporte)) ? "proprio" : "onibus";
    const idx = pessoas.filter((p) => p.familiaId === familiaId).length + 1;
    pessoas.push({
      id: `${familiaId}-${txt(r.ordem) || idx}`,
      familiaId,
      nome,
      papel: txt(r.papel) || (idx === 1 ? "Participante" : "Integrante"),
      classificacao: classificar(r, txt(r.papel), idade, valor),
      idade,
      faixa: faixaId(txt(r.faixa), idade, valor),
      valor,
      transporte,
    });
    if (!familias.has(familiaId)) {
      familias.set(familiaId, {
        id: familiaId,
        responsavel: txt(r.responsavelNome) || nome,
        telefone: txt(r.telefone),
        igreja: txt(r.igreja),
        cidade: txt(r.cidade),
        formaPrevista: "Pix",
      });
    }
  }

  const pagamentos: Pagamento[] = d.pagamentos
    .map((r): Pagamento => ({
      id: txt(r.id),
      familiaId: txt(r.familiaId),
      data: dataISO(r.data),
      valor: numero(r.valor),
      forma: (FORMAS.find((f) => f === txt(r.forma)) ?? "Pix") as FormaPagamento,
      obs: txt(r.obs) || undefined,
    }))
    .filter((p) => p.id && p.familiaId && familias.has(p.familiaId) && p.valor !== 0);

  const despesas: Despesa[] = d.despesas
    .map((r): Despesa => ({
      id: txt(r.id),
      categoria: (CATEGORIAS.find((c) => c === txt(r.categoria)) ?? "Material de apoio") as CategoriaDespesa,
      fornecedor: txt(r.fornecedor),
      descricao: txt(r.descricao),
      orcado: numero(r.orcado),
      pago: numero(r.pago),
      status: (STATUS.find((s) => s === txt(r.status)) ?? "Orçado") as StatusDespesa,
      data: dataISO(r.data) || undefined,
    }))
    .filter((x) => x.id);

  // Se já houver lançamentos só por cartão/dinheiro, não sinalize vencimentos do calendário Pix.
  for (const familia of familias.values()) {
    const formas = pagamentos.filter((p) => p.familiaId === familia.id).map((p) => p.forma);
    if (formas.length && formas.every((forma) => forma === "Cartão")) familia.formaPrevista = "Cartão";
    else if (formas.length && formas.every((forma) => forma === "Dinheiro")) familia.formaPrevista = "Dinheiro";
  }

  const doacoes: Doacao[] = d.doacoes
    .map((r): Doacao => ({
      id: txt(r.id),
      data: dataISO(r.data),
      doador: txt(r.doador),
      valor: numero(r.valor),
      tipo: txt(r.tipo) === "Apadrinhamento de vaga" ? "Apadrinhamento de vaga" : "Avulsa",
      obs: txt(r.obs) || undefined,
    }))
    .filter((x) => x.id);

  const ajustes: Ajuste[] = d.ajustes
    .map((r): Ajuste => ({
      id: txt(r.id),
      data: dataISO(r.data),
      familiaId: txt(r.familiaId),
      tipo: (TIPOS_AJUSTE.find((t) => t === txt(r.tipo)) ?? "Observação") as TipoAjuste,
      descricao: txt(r.descricao),
      valor: numero(r.valor),
    }))
    .filter((x) => x.id && familias.has(x.familiaId));

  for (const r of d.extras ?? []) {
    const p = pessoas.find((x) => x.id === txt(r.pessoaId));
    if (p) {
      p.tamanho = txt(r.tamanho) || undefined;
      p.modelo = txt(r.modelo) || undefined;
    }
  }

  return { familias: [...familias.values()], pessoas, pagamentos, despesas, doacoes, ajustes };
}
