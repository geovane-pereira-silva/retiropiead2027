import { Check, X, Minus } from "lucide-react";

import { retiro } from "../content/retiro";

export function ComparisonTable() {
  const { anteriorNome, novoNome, criterios } = retiro.comparativo;
  return (
    <div className="cmp-wrap">
      <table className="cmp">
        <thead>
          <tr>
            <th style={{ width: "34%" }}>Critério</th>
            <th>{anteriorNome}</th>
            <th>{novoNome}</th>
          </tr>
        </thead>
        <tbody>
          {criterios.map((c) => {
            const anteriorWin = c.melhor === "anterior";
            const novoWin = c.melhor === "novo";
            return (
              <tr key={c.criterio}>
                <th scope="row">{c.criterio}</th>
                <td className={anteriorWin ? "win" : novoWin ? "lose" : ""}>
                  <span className="cmp-value">{c.anterior}</span>
                  <span className="cmp-icon">
                    {anteriorWin ? <Check size={16} /> : novoWin ? <X size={16} /> : <Minus size={16} />}
                  </span>
                </td>
                <td className={novoWin ? "win" : anteriorWin ? "lose" : ""}>
                  <span className="cmp-value">{c.novo}</span>
                  <span className="cmp-icon">
                    {novoWin ? <Check size={16} /> : anteriorWin ? <X size={16} /> : <Minus size={16} />}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
