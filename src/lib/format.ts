// Formatadores comuns para a apresentação executiva.
export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const brlCompact = (n: number) => {
  if (Math.abs(n) >= 1000) return `R$ ${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return brl(n);
};

export const pct = (n: number, d = 0) => `${(n * 100).toFixed(d)}%`;

export const num = (n: number) => n.toLocaleString("pt-BR");
