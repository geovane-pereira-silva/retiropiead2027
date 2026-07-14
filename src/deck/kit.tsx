import type { ReactNode } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from "recharts";

import { brl, brlCompact } from "../lib/format";

const GOLD = "#d8b26a";
const GOLD_SOFT = "#e9c98a";
const GREEN = "#5cbd8f";
const RED = "#e07a7a";
const INK = "#f5f2ea";
const MUTED = "#9aa0aa";
const LINE = "rgba(245,242,234,0.10)";

export const chartColors = { GOLD, GOLD_SOFT, GREEN, RED, INK, MUTED, LINE };

/* ─── KPI ─────────────────────────────────────────────────────────────── */
export function Kpi({
  label, value, hint, tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "positive" | "negative" | "gold";
}) {
  const color =
    tone === "positive" ? GREEN :
    tone === "negative" ? RED :
    tone === "gold" ? GOLD : INK;
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color }}>{value}</div>
      {hint && <div className="kpi-hint">{hint}</div>}
    </div>
  );
}

/* ─── Card genérico ────────────────────────────────────────────────────── */
export function Card({
  title, kicker, tone, children,
}: {
  title?: string; kicker?: string; tone?: "default" | "gold" | "success" | "danger";
  children: ReactNode;
}) {
  return (
    <div className={`e-card e-card-${tone ?? "default"}`}>
      {kicker && <div className="e-card-kicker">{kicker}</div>}
      {title && <div className="e-card-title">{title}</div>}
      <div className="e-card-body">{children}</div>
    </div>
  );
}

/* ─── Tooltip escuro comum ─────────────────────────────────────────────── */
const tooltipStyle = {
  contentStyle: {
    background: "#0f1116",
    border: `1px solid ${LINE}`,
    borderRadius: 12,
    color: INK,
    fontSize: 13,
  } as const,
  cursor: { fill: "rgba(255,255,255,0.04)" },
};

/* ─── PieChart ────────────────────────────────────────────────────────── */
export function DonutChart({
  data, height = 260,
}: { data: { rotulo: string; valor: number }[]; height?: number }) {
  const palette = [GOLD, GOLD_SOFT, "#c98a5c", "#8fb4a8", "#7d8bb5", "#a37fbf"];
  const total = data.reduce((s, d) => s + d.valor, 0);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="valor"
          nameKey="rotulo"
          innerRadius="55%"
          outerRadius="88%"
          paddingAngle={2}
          stroke="transparent"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={palette[i % palette.length]} />
          ))}
        </Pie>
        <Tooltip
          {...tooltipStyle}
          formatter={((v: number, n: string) => [`${brl(v)} (${((v / total) * 100).toFixed(0)}%)`, n]) as never}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ─── BarChart horizontal ─────────────────────────────────────────────── */
export function HBar({
  data, height = 300, valueFormatter = brlCompact,
}: {
  data: { rotulo: string; valor: number }[];
  height?: number;
  valueFormatter?: (n: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
        <CartesianGrid stroke={LINE} horizontal={false} />
        <XAxis type="number" stroke={MUTED} tick={{ fill: MUTED, fontSize: 12 }} tickFormatter={valueFormatter} />
        <YAxis type="category" dataKey="rotulo" stroke={MUTED} tick={{ fill: INK, fontSize: 13 }} width={170} />
        <Tooltip {...tooltipStyle} formatter={((v: number) => valueFormatter(v)) as never} />
        <Bar dataKey="valor" fill={GOLD} radius={[0, 8, 8, 0]}>
          <LabelList dataKey="valor" position="right" formatter={((v: number) => valueFormatter(v)) as never} fill={INK} fontSize={12} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ─── LineChart de projeção ───────────────────────────────────────────── */
export function ProjectionLine({
  data, height = 300,
}: { data: { participantes: number; saldo: number; receita: number; custo: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
        <CartesianGrid stroke={LINE} />
        <XAxis dataKey="participantes" stroke={MUTED} tick={{ fill: MUTED, fontSize: 12 }} label={{ value: "Participantes", position: "insideBottom", offset: -4, fill: MUTED, fontSize: 12 }} />
        <YAxis stroke={MUTED} tick={{ fill: MUTED, fontSize: 12 }} tickFormatter={brlCompact} />
        <Tooltip {...tooltipStyle} formatter={((v: number) => brl(v)) as never} labelFormatter={((l: number) => `${l} participantes`) as never} />
        <Line type="monotone" dataKey="receita" stroke={GOLD_SOFT} strokeWidth={2} dot={false} name="Receita" />
        <Line type="monotone" dataKey="custo"   stroke={RED}       strokeWidth={2} dot={false} name="Custo total" strokeDasharray="4 4" />
        <Line type="monotone" dataKey="saldo"   stroke={GREEN}     strokeWidth={3} dot={{ r: 3, fill: GREEN }} name="Saldo" />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ─── Legenda ─────────────────────────────────────────────────────────── */
export function ChartLegend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="chart-legend">
      {items.map((it) => (
        <span key={it.label} className="chart-legend-item">
          <span className="chart-legend-dot" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
