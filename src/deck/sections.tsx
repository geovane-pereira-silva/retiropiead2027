import type { ReactElement } from "react";
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";

import { retiro, calcCenario, pontoEquilibrio, totalCustosFixos, totalCustosVariaveisPorPessoa } from "../content/retiro";
import { brl, brlCompact, num } from "../lib/format";

import { Card, ChartLegend, DonutChart, HBar, Kpi, ProjectionLine, chartColors } from "./kit";
import { ComparisonTable } from "./ComparisonTable";
import { RiskMatrix, RiskTable } from "./RiskMatrix";

export type Section = {
  slug: string;
  n: number;
  short: string;
  kicker: string;
  title: string;
  lead?: string;
  Component: () => ReactElement;
};

/* ═══════════════════════ 1. RESUMO EXECUTIVO ═══════════════════════ */
function Resumo() {
  const meta = retiro.financas.metaParticipantes;
  const cen = calcCenario(meta);
  const pe = pontoEquilibrio();
  return (
    <>
      <div className="grid grid-4 gap-3 mb-6">
        <Kpi label="Meta de participantes" value={num(meta)} hint="Público-alvo" tone="gold" />
        <Kpi label="Investimento total" value={brl(cen.custoTotal)} hint="Custo estimado" />
        <Kpi label="Ticket individual" value={brl(retiro.financas.inscricao)} hint="Inscrição" />
        <Kpi label="Ponto de equilíbrio" value={`${pe} pessoas`} hint="Mínimo para cobrir custos" tone={pe <= meta ? "positive" : "negative"} />
      </div>
      <div className="grid grid-2 gap-3">
        <Card kicker="Objetivo" title="Realizar o retiro em novo local">
          <p>{retiro.resumo.objetivo}</p>
        </Card>
        <Card kicker="Justificativa" title="Por que mudar de local">
          <p>{retiro.resumo.justificativa}</p>
        </Card>
        <Card kicker="Benefícios" title="O que ganhamos" tone="success">
          <ul className="bullets">{retiro.resumo.beneficios.map((b) => <li key={b}>{b}</li>)}</ul>
        </Card>
        <Card kicker="Desafios" title="O que exige atenção" tone="danger">
          <ul className="bullets">{retiro.resumo.desafios.map((b) => <li key={b}>{b}</li>)}</ul>
        </Card>
      </div>
    </>
  );
}

/* ═══════════════════════ 2. LOCAL — SANTA CLARA ═══════════════════════ */
function Local() {
  return (
    <>
      <div className="grid grid-4 gap-3 mb-6">
        <Kpi label="Camas" value={num(retiro.local.capacidadeCamas)} hint="Dormitórios completos" tone="gold" />
        <Kpi label="Capacidade máx." value={num(retiro.local.capacidadeMax)} hint="Com colchões extras" />
        <Kpi label="Cidade" value={retiro.local.cidade} hint={`${retiro.local.uf} · ${retiro.local.tempoViagem}`} />
        <Kpi label="Cultos" value="2 espaços" hint="Salão + auditório" />
      </div>
      <div className="grid grid-3 gap-3">
        {retiro.diferenciais.map((d) => (
          <div className="e-card e-card-default" key={d.titulo}>
            <div className="e-card-title">{d.titulo}</div>
            <div className="e-card-body"><p>{d.desc}</p></div>
          </div>
        ))}
      </div>
      <div className="mt-6 e-card e-card-default" style={{ padding: 0, overflow: "hidden" }}>
        <iframe
          title="Mapa Campos do Jordão"
          src="https://www.google.com/maps?q=Campos+do+Jord%C3%A3o+SP&output=embed"
          style={{ width: "100%", height: 320, border: 0 }}
          loading="lazy"
        />
      </div>
      <p className="hint mt-4">
        Módulos de mídia (galeria de fotos e vídeos do Google Drive, embed do Instagram) estão pré-configurados —
        basta popular <code>src/content/media.json</code> e <code>retiro.instagram</code>.
      </p>
    </>
  );
}

/* ═══════════════════════ 3. COMPARATIVO ═══════════════════════ */
function Comparativo() {
  return (
    <>
      <div className="grid grid-3 gap-3 mb-6">
        <Kpi label="Ganhos" value="9 critérios" hint="Onde Santa Clara supera" tone="positive" />
        <Kpi label="Trade-offs" value="3 critérios" hint="Distância e custo" tone="negative" />
        <Kpi label="Recomendação" value="Santa Clara" hint="Melhor custo-benefício de longo prazo" tone="gold" />
      </div>
      <ComparisonTable />
    </>
  );
}

/* ═══════════════════════ 4. ESTUDO FINANCEIRO ═══════════════════════ */
function Financeiro() {
  const meta = retiro.financas.metaParticipantes;
  const cen = calcCenario(meta);
  const pe = pontoEquilibrio();
  const custoFixo = totalCustosFixos();
  const custoVarUnit = totalCustosVariaveisPorPessoa();
  const liquidoUnit = retiro.financas.inscricao - custoVarUnit;
  const anterior = retiro.financas.anterior;

  const projecao = [60, 80, 100, 120, 140, 160, 180].map((p) => {
    const c = calcCenario(p);
    return { participantes: p, receita: c.receita, custo: c.custoTotal, saldo: c.saldo };
  });

  return (
    <>
      <div className="grid grid-4 gap-3 mb-6">
        <Kpi label="Ponto de equilíbrio" value={`${pe} pessoas`} tone={pe <= meta ? "positive" : "negative"} hint={`Meta: ${meta}`} />
        <Kpi label="Custo fixo total" value={brl(custoFixo)} hint="Independe do nº de inscritos" />
        <Kpi label="Custo variável / pessoa" value={brl(custoVarUnit)} hint="Alimentação, camiseta, kit" />
        <Kpi label="Líquido / participante" value={brl(liquidoUnit)} hint="Após custos variáveis" tone="gold" />
      </div>

      <div className="grid grid-2 gap-4">
        <Card kicker="Composição" title={`Onde vai o ${brl(retiro.financas.inscricao)}`}>
          <DonutChart data={retiro.financas.composicaoUnitaria} />
          <ChartLegend
            items={retiro.financas.composicaoUnitaria.map((c, i) => ({
              color: ["#d8b26a", "#e9c98a", "#c98a5c", "#8fb4a8", "#7d8bb5", "#a37fbf"][i % 6],
              label: `${c.rotulo} · ${brl(c.valor)}`,
            }))}
          />
        </Card>

        <Card kicker="Custos fixos" title="Onde está o dinheiro">
          <HBar data={retiro.financas.custosFixos} />
        </Card>
      </div>

      <div className="grid grid-2 gap-4 mt-4">
        <Card kicker="Projeção" title="Saldo por nº de participantes">
          <ProjectionLine data={projecao} />
          <ChartLegend items={[
            { color: chartColors.GOLD_SOFT, label: "Receita" },
            { color: chartColors.RED, label: "Custo total" },
            { color: chartColors.GREEN, label: "Saldo" },
          ]} />
        </Card>

        <Card kicker="Comparativo" title="2027 (meta) vs. retiro anterior">
          <table className="cmp">
            <thead><tr><th>Métrica</th><th>Anterior</th><th>Meta 2027</th></tr></thead>
            <tbody>
              <tr><th scope="row">Participantes</th><td>{anterior.participantes}</td><td className="win">{meta}</td></tr>
              <tr><th scope="row">Inscrição</th><td>{brl(anterior.inscricao)}</td><td className="win">{brl(retiro.financas.inscricao)}</td></tr>
              <tr><th scope="row">Receita</th><td>{brl(anterior.receita)}</td><td className="win">{brl(cen.receita)}</td></tr>
              <tr><th scope="row">Custo total</th><td>{brl(anterior.custo)}</td><td>{brl(cen.custoTotal)}</td></tr>
              <tr>
                <th scope="row">Saldo</th>
                <td className={anterior.receita - anterior.custo >= 0 ? "win" : "lose"}>{brl(anterior.receita - anterior.custo)}</td>
                <td className={cen.saldo >= 0 ? "win" : "lose"}>{brl(cen.saldo)}</td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}

/* ═══════════════════════ 5. CENÁRIOS ═══════════════════════ */
function Cenarios() {
  const cenarios = retiro.cenarios.map((c) => ({ ...c, ...calcCenario(c.participantes, c.inscricao) }));
  return (
    <div className="grid grid-3 gap-4">
      {cenarios.map((c) => {
        const positivo = c.saldo >= 0;
        return (
          <div key={c.nome} className={`e-card e-card-${positivo ? "success" : "danger"}`} style={{ padding: 24 }}>
            <div className="e-card-kicker">{c.nome}</div>
            <div className="scenario-num">{c.participantes}</div>
            <div className="hint">participantes</div>
            <hr className="hairline mt-4 mb-4" />
            <dl className="scen-list">
              <div><dt>Receita</dt><dd>{brl(c.receita)}</dd></div>
              <div><dt>Custo total</dt><dd>{brl(c.custoTotal)}</dd></div>
              <div><dt>Saldo</dt><dd className={positivo ? "positive" : "negative"}>
                {positivo ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {brl(c.saldo)}
              </dd></div>
              <div><dt>Margem</dt><dd>{c.receita > 0 ? ((c.saldo / c.receita) * 100).toFixed(0) : 0}%</dd></div>
            </dl>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════ 6. RISCOS ═══════════════════════ */
function Riscos() {
  return (
    <div className="grid grid-2-1 gap-4">
      <RiskMatrix />
      <RiskTable />
    </div>
  );
}

/* ═══════════════════════ 7. CUSTOS ADICIONAIS ═══════════════════════ */
function CustosExtras() {
  const grupos = retiro.custosExtras.reduce<Record<string, typeof retiro.custosExtras>>((acc, c) => {
    (acc[c.categoria] ||= []).push(c);
    return acc;
  }, {});
  const total = retiro.custosExtras.reduce((s, c) => s + c.valor, 0);
  return (
    <>
      <div className="grid grid-4 gap-3 mb-6">
        {Object.entries(grupos).map(([cat, itens]) => {
          const sub = itens.reduce((s, x) => s + x.valor, 0);
          return <Kpi key={cat} label={cat} value={brl(sub)} hint={`${itens.length} itens`} />;
        })}
      </div>
      <div className="grid grid-2 gap-4">
        {Object.entries(grupos).map(([cat, itens]) => (
          <Card kicker={cat} title="" key={cat}>
            <table className="cmp cmp-compact">
              <tbody>
                {itens.map((i) => (
                  <tr key={i.item}>
                    <th scope="row" style={{ fontWeight: 400 }}>{i.item}</th>
                    <td style={{ textAlign: "right" }}>{brl(i.valor)}</td>
                  </tr>
                ))}
                <tr>
                  <th scope="row">Subtotal</th>
                  <td style={{ textAlign: "right", color: chartColors.GOLD, fontWeight: 600 }}>
                    {brl(itens.reduce((s, x) => s + x.valor, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>
        ))}
      </div>
      <p className="hint mt-6" style={{ textAlign: "right", fontSize: "1rem" }}>
        Total geral: <strong style={{ color: chartColors.GOLD }}>{brl(total)}</strong>
      </p>
    </>
  );
}

/* ═══════════════════════ 8. SWOT ═══════════════════════ */
function Swot() {
  const s = retiro.swot;
  const cells: { label: string; items: string[]; tone: "success" | "danger" | "gold" | "default" }[] = [
    { label: "Forças",         items: s.forcas,        tone: "success" },
    { label: "Fraquezas",      items: s.fraquezas,     tone: "danger"  },
    { label: "Oportunidades",  items: s.oportunidades, tone: "gold"    },
    { label: "Ameaças",        items: s.ameacas,       tone: "danger"  },
  ];
  return (
    <div className="grid grid-2 gap-4">
      {cells.map((c) => (
        <div key={c.label} className={`e-card e-card-${c.tone}`} style={{ padding: 24 }}>
          <div className="e-card-kicker">{c.label}</div>
          <ul className="bullets mt-3">
            {c.items.map((i) => <li key={i}>{i}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════ 9. CRESCIMENTO ═══════════════════════ */
function Crescimento() {
  return (
    <div className="grid grid-2 gap-4">
      {retiro.crescimento.map((c) => (
        <div key={c.titulo} className="e-card e-card-default" style={{ padding: 24 }}>
          <div className="e-card-kicker">Oportunidade</div>
          <div className="e-card-title">{c.titulo}</div>
          <p style={{ color: "var(--color-muted)" }}>{c.descricao}</p>
          <div className="grid grid-2 gap-2 mt-3">
            <div>
              <div className="hint" style={{ color: chartColors.GREEN }}>Vantagens</div>
              <ul className="bullets small">{c.vantagens.map((v) => <li key={v}>{v}</li>)}</ul>
            </div>
            <div>
              <div className="hint" style={{ color: chartColors.RED }}>Desafios</div>
              <ul className="bullets small">{c.desafios.map((v) => <li key={v}>{v}</li>)}</ul>
            </div>
          </div>
          <hr className="hairline mt-3 mb-3" />
          <div style={{ fontSize: "0.9rem", color: chartColors.GOLD, display: "flex", alignItems: "center", gap: 6 }}>
            <ArrowUpRight size={16} /> {c.impacto}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════ 10. CONCLUSÃO ═══════════════════════ */
function Conclusao() {
  const c = retiro.conclusao;
  return (
    <>
      <div className="grid grid-2 gap-4">
        <Card kicker="Principais benefícios" title="" tone="success">
          <ul className="bullets">{c.beneficios.map((b) => <li key={b}>{b}</li>)}</ul>
        </Card>
        <Card kicker="Principais riscos" title="" tone="danger">
          <ul className="bullets">{c.riscosPrincipais.map((b) => <li key={b}>{b}</li>)}</ul>
        </Card>
        <Card kicker="Condições para aprovação" title="" tone="gold">
          <ul className="bullets">{c.condicoes.map((b) => <li key={b}>{b}</li>)}</ul>
        </Card>
        <Card kicker="Recomendações" title="">
          <ul className="bullets">{c.recomendacoes.map((b) => <li key={b}>{b}</li>)}</ul>
        </Card>
      </div>
      <div className="mt-6">
        <div className="e-card-kicker mb-3">Próximos passos</div>
        <div className="timeline-h">
          {c.proximosPassos.map((p) => (
            <div key={p.quando} className="timeline-h-item">
              <div className="timeline-h-when">{p.quando}</div>
              <div className="timeline-h-what">{p.oque}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════ REGISTRO ═══════════════════════ */
export const sections: Section[] = [
  { slug: "resumo",       n: 1,  short: "Resumo",       kicker: "01 · Resumo Executivo",     title: "Retiro de Carnaval 2027", lead: `${retiro.dataTexto} · ${retiro.local.nome} — ${retiro.local.cidade}/${retiro.local.uf}`, Component: Resumo },
  { slug: "local",        n: 2,  short: "Local",        kicker: "02 · Novo Local",           title: `${retiro.local.nome}`, lead: "Uma estrutura à altura do próximo capítulo do ministério.", Component: Local },
  { slug: "comparativo",  n: 3,  short: "Comparativo",  kicker: "03 · Comparativo",          title: "Local anterior vs. Santa Clara", lead: "Onde ganhamos e onde há trade-offs.", Component: Comparativo },
  { slug: "financeiro",   n: 4,  short: "Financeiro",   kicker: "04 · Estudo Financeiro",    title: "Números do projeto", lead: "Ponto de equilíbrio, composição do ticket e projeções.", Component: Financeiro },
  { slug: "cenarios",     n: 5,  short: "Cenários",     kicker: "05 · Cenários",             title: "Conservador, provável e otimista", lead: "Impacto financeiro em cada faixa de participantes.", Component: Cenarios },
  { slug: "riscos",       n: 6,  short: "Riscos",       kicker: "06 · Gestão de Riscos",     title: "Matriz de riscos", lead: "Probabilidade × impacto — com plano de mitigação para cada item.", Component: Riscos },
  { slug: "custos-extras",n: 7,  short: "Custos",       kicker: "07 · Custos Adicionais",    title: "Despesas frequentemente esquecidas", lead: "Levantamento por categoria — evita surpresas no orçamento.", Component: CustosExtras },
  { slug: "swot",         n: 8,  short: "SWOT",         kicker: "08 · Análise SWOT",         title: "Forças, fraquezas, oportunidades e ameaças", Component: Swot },
  { slug: "crescimento",  n: 9,  short: "Crescimento",  kicker: "09 · Oportunidades",        title: "Onde este projeto pode crescer", lead: "Estudos de expansão do retiro nos próximos anos.", Component: Crescimento },
  { slug: "conclusao",    n: 10, short: "Conclusão",    kicker: "10 · Conclusão Executiva",  title: "Recomendação e próximos passos", Component: Conclusao },
];
