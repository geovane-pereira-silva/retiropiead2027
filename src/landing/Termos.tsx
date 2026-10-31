import { useEffect } from "react";

import { evento } from "../content/evento";

/** Abre o <details> cujo id está no hash da URL (ex.: /inscricao#privacidade). */
function abrirPeloHash() {
  const id = window.location.hash.replace("#", "");
  if (id !== "regras" && id !== "privacidade") return;
  const el = document.getElementById(id) as HTMLDetailsElement | null;
  if (el) {
    el.open = true;
    el.scrollIntoView({ block: "start" });
  }
}

export function Termos() {
  useEffect(() => {
    abrirPeloHash();
    window.addEventListener("hashchange", abrirPeloHash);
    return () => window.removeEventListener("hashchange", abrirPeloHash);
  }, []);

  return (
    <div className="lp-terms">
      <details id="regras">
        <summary>Regras do retiro</summary>
        <div className="body">
          {evento.regras.length === 0 ? (
            <p>
              As regras oficiais do retiro estão em elaboração pela organização e serão publicadas
              nesta página.
            </p>
          ) : (
            <ul>
              {evento.regras.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      </details>

      <details id="privacidade">
        <summary>Aviso de privacidade (LGPD)</summary>
        <div className="body">
          <p>
            <em>Texto-base, sujeito à revisão da liderança da igreja antes da divulgação.</em>
          </p>
          <h4>Quem organiza</h4>
          <p>
            {evento.ministerio} — {evento.igreja} de {evento.igrejaCidade}.
          </p>
          <h4>Quais dados coletamos</h4>
          <p>
            Para o retiro, faça um cadastro por participante. Coletamos nome, data de nascimento, CPF (obrigatório para
            adultos e opcional para menores), transporte escolhido, igreja de origem, congregação
            ou, para convidados, nome da igreja, pastor presidente e líder de jovens, além do
            contato de emergência. Para participante menor, coletamos o nome, vínculo e celular do
            pai, mãe ou responsável legal. Também as necessidades de hospedagem ou alimentação
            informadas. Para visitantes, coletamos o nome, celular, dia da visita e período escolhido
            (dia todo ou somente à noite).
          </p>
          <h4>Para que usamos</h4>
          <p>
            Organizar os cadastros do retiro e de visitantes: identificação, contato, hospedagem,
            alimentação, dia e período da visita, segurança e comunicação em caso de emergência. O
            CPF serve para identificar a inscrição do retiro e evitar duplicidade.
          </p>
          <h4>Dados de crianças e adolescentes</h4>
          <p>
            Os dados de crianças e adolescentes são informados pelo pai, mãe ou responsável legal,
            cujo celular será usado para comunicações sobre o cadastro e a segurança no retiro. Os
            dados são usados somente para os fins descritos acima.
          </p>
          <h4>Compartilhamento e acesso</h4>
          <p>
            Os dados não são divulgados publicamente nem vendidos. O acesso é restrito às pessoas
            autorizadas da organização do retiro.
          </p>
          <h4>Seus direitos</h4>
          <p>
            Você pode pedir acesso, correção ou exclusão dos seus dados à liderança da Conexão
            Jovem, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
          </p>
        </div>
      </details>
    </div>
  );
}
