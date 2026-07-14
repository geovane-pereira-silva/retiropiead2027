import { retiro } from "../content/retiro";

/**
 * Matriz de risco 5×5 (probabilidade × impacto).
 * Eixo X = impacto (1..5), Eixo Y = probabilidade (5..1 de cima para baixo).
 * Cor de cada célula = prob × impacto.
 */
export function RiskMatrix() {
  const riscos = retiro.riscos;
  const grid: Record<string, typeof riscos> = {};
  for (const r of riscos) {
    const key = `${r.prob}-${r.impacto}`;
    (grid[key] ||= []).push(r);
  }

  const cellColor = (p: number, i: number) => {
    const score = p * i; // 1..25
    if (score >= 15) return "risk-high";
    if (score >= 8) return "risk-med";
    return "risk-low";
  };

  const probs = [5, 4, 3, 2, 1];
  const impactos = [1, 2, 3, 4, 5];

  return (
    <div className="risk-wrap">
      <div className="risk-matrix" role="img" aria-label="Matriz de risco 5 por 5">
        <div className="risk-axis-y">Probabilidade →</div>
        <div className="risk-grid">
          {probs.map((p) =>
            impactos.map((i) => {
              const items = grid[`${p}-${i}`] ?? [];
              return (
                <div key={`${p}-${i}`} className={`risk-cell ${cellColor(p, i)}`} title={`P${p} × I${i}`}>
                  <span className="risk-cell-coord">{p}·{i}</span>
                  <div className="risk-cell-items">
                    {items.map((r, idx) => (
                      <span key={idx} className="risk-bubble" title={r.risco}>
                        {r.risco.length > 18 ? r.risco.slice(0, 16) + "…" : r.risco}
                      </span>
                    ))}
                  </div>
                </div>
              );
            }),
          )}
        </div>
        <div className="risk-axis-x">Impacto →</div>
      </div>

      <div className="risk-legend">
        <span className="chip"><i className="risk-dot risk-low" /> Baixo</span>
        <span className="chip"><i className="risk-dot risk-med" /> Médio</span>
        <span className="chip"><i className="risk-dot risk-high" /> Alto</span>
      </div>
    </div>
  );
}

export function RiskTable() {
  return (
    <div className="cmp-wrap">
      <table className="cmp">
        <thead>
          <tr>
            <th>Risco</th>
            <th style={{ width: "8%" }}>Prob.</th>
            <th style={{ width: "8%" }}>Impacto</th>
            <th style={{ width: "50%" }}>Plano de mitigação</th>
          </tr>
        </thead>
        <tbody>
          {retiro.riscos.map((r) => (
            <tr key={r.risco}>
              <th scope="row">{r.risco}</th>
              <td><span className="chip">{r.prob}/5</span></td>
              <td><span className="chip">{r.impacto}/5</span></td>
              <td style={{ color: "var(--color-muted)" }}>{r.mitigacao}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
