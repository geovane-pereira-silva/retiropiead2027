import type { Base, Despesa, Familia, Pagamento, Pessoa, SituacaoFamilia } from "./tipos";

/** Vencimentos das parcelas do Pix (iguais às do site público). */
export const VENCIMENTOS_PIX = ["2026-11-25", "2026-12-05", "2026-12-25", "2027-01-25"] as const;
export const DATA_EVENTO = "2027-02-05";

const arred = (n: number) => Math.round(n * 100) / 100;

export type ResumoFamilia = {
  familia: Familia;
  pessoas: Pessoa[];
  pagamentos: Pagamento[];
  devido: number;
  descontos: number;
  pago: number;
  aReceber: number;
  situacao: SituacaoFamilia;
  /** parcelas Pix em aberto com data já vencida */
  atrasado: number;
  /** próximo vencimento com valor em aberto */
  proximoVencimento?: { data: string; valor: number };
  parcelasAbertas: { data: string; valor: number }[];
};

export function resumirFamilia(
  familia: Familia,
  base: Base,
  hoje: string,
): ResumoFamilia {
  const pessoas = base.pessoas.filter((p) => p.familiaId === familia.id);
  const pagamentos = base.pagamentos
    .filter((p) => p.familiaId === familia.id)
    .sort((a, b) => a.data.localeCompare(b.data));
  const bruto = arred(pessoas.reduce((s, p) => s + p.valor, 0));
  const descontos = arred(
    base.ajustes
      .filter((a) => a.familiaId === familia.id && (a.tipo === "Desconto" || a.tipo === "Isenção"))
      .reduce((s, a) => s + a.valor, 0),
  );
  const devido = Math.max(0, arred(bruto - descontos));
  const pago = arred(pagamentos.reduce((s, p) => s + p.valor, 0));
  const aReceber = Math.max(0, arred(devido - pago));

  let situacao: SituacaoFamilia;
  if (pessoas.length === 0) situacao = "pre";
  else if (devido === 0) situacao = "isento";
  else if (pago >= devido) situacao = "quitado";
  else if (pago > 0) situacao = "parcial";
  else situacao = "pendente";

  // Distribui o já pago pelas parcelas, da mais antiga para a mais nova.
  const parcela = devido / VENCIMENTOS_PIX.length;
  let restantePago = pago;
  const parcelasAbertas: { data: string; valor: number }[] = [];
  for (const data of VENCIMENTOS_PIX) {
    const coberto = Math.min(parcela, Math.max(0, restantePago));
    restantePago -= coberto;
    const aberto = arred(parcela - coberto);
    if (aberto > 0.004) parcelasAbertas.push({ data, valor: aberto });
  }
  if (devido === 0) parcelasAbertas.length = 0;
  const atrasado = parcelasAbertas.filter((p) => p.data < hoje).length;
  const proximoVencimento = parcelasAbertas.find((p) => p.data >= hoje) ?? parcelasAbertas[0];
  return { familia, pessoas, pagamentos, devido, descontos, pago, aReceber, situacao, atrasado, proximoVencimento, parcelasAbertas };
}

export type ResumoGeral = {
  familias: ResumoFamilia[];
  totalPessoas: number;
  pessoasPagantes: number;
  gratuitas: number;
  devido: number;
  recebido: number;
  aReceber: number;
  doacoes: number;
  orcado: number;
  despesasPagas: number;
  despesasAPagar: number;
  saldoAtual: number; // recebido + doações - despesas pagas
  saldoProjetado: number; // devido + doações - orçado
  ticketMedio: number;
  pontoEquilibrio: number; // pessoas pagantes necessárias para cobrir o orçado
  atrasadas: ResumoFamilia[];
  porSituacao: Record<SituacaoFamilia, number>;
};

export function resumirTudo(base: Base, hoje: string): ResumoGeral {
  const familias = base.familias.map((f) => resumirFamilia(f, base, hoje));
  const totalPessoas = base.pessoas.length;
  const pessoasPagantes = base.pessoas.filter((p) => p.valor > 0).length;
  const devido = arred(familias.reduce((s, f) => s + f.devido, 0));
  const recebido = arred(familias.reduce((s, f) => s + f.pago, 0));
  const aReceber = arred(familias.reduce((s, f) => s + f.aReceber, 0));
  const doacoes = arred(base.doacoes.reduce((s, d) => s + d.valor, 0));
  const orcado = arred(base.despesas.reduce((s, d) => s + d.orcado, 0));
  const despesasPagas = arred(base.despesas.reduce((s, d) => s + d.pago, 0));
  const despesasAPagar = Math.max(0, arred(orcado - despesasPagas));
  const ticketMedio = pessoasPagantes ? arred(devido / pessoasPagantes) : 0;
  const pontoEquilibrio = ticketMedio ? Math.ceil(Math.max(0, orcado - doacoes) / ticketMedio) : 0;
  const porSituacao: Record<SituacaoFamilia, number> = { pre: 0, pendente: 0, parcial: 0, quitado: 0, isento: 0 };
  for (const f of familias) porSituacao[f.situacao]++;
  return {
    familias,
    totalPessoas,
    pessoasPagantes,
    gratuitas: totalPessoas - pessoasPagantes,
    devido,
    recebido,
    aReceber,
    doacoes,
    orcado,
    despesasPagas,
    despesasAPagar,
    saldoAtual: arred(recebido + doacoes - despesasPagas),
    saldoProjetado: arred(devido + doacoes - orcado),
    ticketMedio,
    pontoEquilibrio,
    atrasadas: familias.filter((f) => f.atrasado > 0),
    porSituacao,
  };
}

/** Previsão de entradas em aberto, agrupada por vencimento. */
export function fluxoPrevisto(resumo: ResumoGeral, hoje: string): { data: string; valor: number; vencido: boolean }[] {
  return resumo.familias.length
    ? (VENCIMENTOS_PIX as readonly string[]).map((data) => ({
        data,
        valor: arred(
          resumo.familias.reduce(
            (s, f) => s + (f.parcelasAbertas.find((p) => p.data === data)?.valor ?? 0),
            0,
          ),
        ),
        vencido: data < hoje,
      }))
    : [];
}

export const totalDespesa = (d: Despesa) => Math.max(d.orcado, d.pago);

export const rotuloSituacao: Record<SituacaoFamilia, string> = {
  pre: "Pré-inscrita",
  pendente: "Pagamento pendente",
  parcial: "Parcialmente paga",
  quitado: "Quitada",
  isento: "Isenta",
};
