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
            Do responsável pela inscrição: nome, data de nascimento, CPF, telefone, WhatsApp, e-mail
            (opcional), igreja ou congregação, cidade e contato de emergência. De cada integrante da
            família cadastrado: nome, data de nascimento e CPF (opcional para menores de 18 anos).
            Também as necessidades de hospedagem ou alimentação informadas.
          </p>
          <h4>Para que usamos</h4>
          <p>
            Organizar a inscrição e o retiro: identificação do participante, contato, hospedagem,
            alimentação, segurança e comunicação em caso de emergência. O CPF serve para identificar
            a inscrição e evitar duplicidade.
          </p>
          <h4>Dados de crianças e adolescentes</h4>
          <p>
            Os dados de menores de 18 anos são informados pelo responsável pela inscrição, que atua
            como responsável legal, e são usados somente para os fins acima.
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
