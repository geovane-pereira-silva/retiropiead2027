import { Link } from "@tanstack/react-router";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { evento } from "../content/evento";
import {
  formatarReais,
  formatarTelefone,
  PRECO_CAMISA_AVULSA,
  validarDadosVisitante,
  type DadosVisitante,
  type PeriodoVisitante,
} from "../lib/inscricao";
import { enviarCadastroVisitante, modoFormulario } from "../api/inscricao.functions";
import { CamisaCampos } from "./CamisaCampos";

type Resultado = Exclude<Awaited<ReturnType<typeof enviarCadastroVisitante>>, { ok: true }>;

const vazio: DadosVisitante = {
  nome: "",
  telefone: "",
  dia: "",
  periodo: "",
  camisaModelo: "",
  camisaTamanho: "",
  camisaMedida: "",
  aceitePrivacidade: false,
  website: "",
};

function chaveNova(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function VisitorForm() {
  const [values, setValues] = useState<DadosVisitante>(vazio);
  const [tentou, setTentou] = useState(false);
  const [ensaio, setEnsaio] = useState<boolean | null>(null);
  const [estado, setEstado] = useState<
    | { tipo: "livre" }
    | { tipo: "enviando" }
    | { tipo: "resultado"; resposta: Resultado }
    | {
        tipo: "sucesso";
        nome: string;
        dia: string;
        periodo: string;
        valor: number;
        camisa: string;
        valorCamisa: number;
      }
  >({ tipo: "livre" });
  const chaveRef = useRef<string | null>(null);

  useEffect(() => {
    let vivo = true;
    modoFormulario()
      .then((r) => vivo && setEnsaio(r.ensaio))
      .catch(() => vivo && setEnsaio(null));
    return () => {
      vivo = false;
    };
  }, []);

  const erros = useMemo(
    () =>
      validarDadosVisitante(
        values,
        evento.visitantes.dias.map((d) => d.data),
      ),
    [values],
  );
  const erro = (campo: string) => (tentou ? erros[campo] : undefined);
  const valor =
    values.periodo === "dia-todo"
      ? evento.visitantes.valorDiaTodo
      : values.periodo === "somente-noite"
        ? evento.visitantes.valorSomenteNoite
        : null;
  const valorCamisa = values.camisaModelo ? PRECO_CAMISA_AVULSA : 0;
  const total = valor === null ? null : valor + valorCamisa;

  const setCampo = <K extends keyof DadosVisitante>(campo: K, valorCampo: DadosVisitante[K]) =>
    setValues((atual) => ({ ...atual, [campo]: valorCampo }));

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTentou(true);
    if (Object.keys(erros).length) return;
    setEstado({ tipo: "enviando" });
    try {
      chaveRef.current ??= chaveNova();
      const resposta = await enviarCadastroVisitante({
        data: { values, idempotencyKey: chaveRef.current },
      });
      if (resposta.ok) {
        chaveRef.current = null;
        setEstado({
          tipo: "sucesso",
          nome: resposta.nome,
          dia: resposta.dia,
          periodo: resposta.periodo,
          valor: resposta.valor,
          camisa: resposta.camisa,
          valorCamisa: resposta.valorCamisa,
        });
      } else {
        if (resposta.codigo === "ENSAIO" && resposta.ensaio) chaveRef.current = null;
        setEstado({ tipo: "resultado", resposta });
      }
    } catch {
      setEstado({
        tipo: "resultado",
        resposta: {
          ok: false,
          codigo: "NAO_CONFIRMADO",
          mensagem: "Não foi possível confirmar o cadastro. Confira sua conexão e tente novamente.",
        },
      });
    }
  }

  if (!evento.visitantes.inscricoesAbertas)
    return (
      <div className="lp-empty">
        <strong>O cadastro de visitantes não está aberto no momento.</strong>
        <span>Acompanhe as novidades da Conexão Jovem.</span>
      </div>
    );

  if (estado.tipo === "sucesso")
    return (
      <section className="lp-done" role="status" aria-live="polite">
        <span className="lp-done-ico">
          <Check size={28} aria-hidden="true" />
        </span>
        <h2>Cadastro de visitante recebido</h2>
        <p>
          {estado.nome} · {estado.dia} · {estado.periodo} · Total {formatarReais(estado.valor)}
        </p>
        {estado.camisa && (
          <p>
            Day use {formatarReais(estado.valor - estado.valorCamisa)} + camisa {estado.camisa}{" "}
            {formatarReais(estado.valorCamisa)}
          </p>
        )}
        <p className="lp-done-palavra">
          Que Deus abençoe sua visita e renove sua fé. Esperamos você para viver esse tempo de
          comunhão!
        </p>
        <p>O cadastro não confirma o pagamento.</p>
        <Link to="/" className="lp-btn lp-btn-brasa">
          Voltar ao início
        </Link>
      </section>
    );

  if (estado.tipo === "resultado") {
    const ensaioDados = estado.resposta.codigo === "ENSAIO" ? estado.resposta.ensaio : undefined;
    return (
      <section
        className={ensaioDados ? "lp-ensaio-tela" : "lp-empty"}
        role="status"
        aria-live="polite"
      >
        {ensaioDados ? (
          <>
            <p className="lp-ensaio-selo">Modo de ensaio</p>
            <h2>Dados conferidos. Nada foi gravado.</h2>
            <p>
              {ensaioDados.nome} · {ensaioDados.dia} · {ensaioDados.periodo} · Total{" "}
              {formatarReais(ensaioDados.valor)}
            </p>
            {ensaioDados.camisa && (
              <p>
                Day use {formatarReais(ensaioDados.valor - ensaioDados.valorCamisa)} + camisa{" "}
                {ensaioDados.camisa} {formatarReais(ensaioDados.valorCamisa)}
              </p>
            )}
          </>
        ) : (
          <strong>{estado.resposta.mensagem}</strong>
        )}
        <button
          type="button"
          className="lp-btn lp-btn-brasa"
          onClick={() => setEstado({ tipo: "livre" })}
        >
          Voltar ao formulário
        </button>
      </section>
    );
  }

  return (
    <>
      {ensaio && (
        <p className="lp-ensaio-faixa" role="note">
          <b>Pré-visualização em ensaio.</b> O envio valida os dados sem gravar cadastro.
        </p>
      )}
      <form
        className="lp-form lp-visitante-form"
        onSubmit={enviar}
        noValidate
        aria-busy={estado.tipo === "enviando"}
      >
        <div className="lp-honey" aria-hidden="true">
          <label>
            Não preencha este campo
            <input
              tabIndex={-1}
              autoComplete="off"
              value={values.website}
              onChange={(e) => setCampo("website", e.target.value)}
            />
          </label>
        </div>
        <fieldset className="lp-fs">
          <legend>Cadastro de visitante</legend>
          <p className="hint">
            Um cadastro por visitante, inclusive bebês. Para menores, informe o nome da criança e o
            celular de um adulto responsável.
          </p>
          <div className="lp-field">
            <label htmlFor="visitante-nome">Nome completo do visitante</label>
            <input
              id="visitante-nome"
              autoComplete="name"
              maxLength={100}
              value={values.nome}
              onChange={(e) => setCampo("nome", e.target.value)}
              aria-invalid={erro("nome") ? true : undefined}
            />
            {erro("nome") && (
              <p className="lp-err" role="alert">
                {erro("nome")}
              </p>
            )}
          </div>
          <div className="lp-field">
            <label htmlFor="visitante-telefone">Celular para contato</label>
            <input
              id="visitante-telefone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="(00) 00000-0000"
              maxLength={15}
              value={values.telefone}
              onChange={(e) => setCampo("telefone", formatarTelefone(e.target.value))}
              aria-invalid={erro("telefone") ? true : undefined}
            />
            {erro("telefone") && (
              <p className="lp-err" role="alert">
                {erro("telefone")}
              </p>
            )}
          </div>
          <div className="lp-field">
            <label htmlFor="visitante-dia">Em qual dia você virá?</label>
            <select
              id="visitante-dia"
              value={values.dia}
              onChange={(e) => setCampo("dia", e.target.value)}
              aria-invalid={erro("dia") ? true : undefined}
            >
              <option value="">Selecione o dia</option>
              {evento.visitantes.dias.map((dia) => (
                <option key={dia.data} value={dia.data}>
                  {dia.rotulo}
                </option>
              ))}
            </select>
            {erro("dia") && (
              <p className="lp-err" role="alert">
                {erro("dia")}
              </p>
            )}
          </div>
          <div className="lp-field">
            <p id="visitante-periodo-label" className="lp-field-label">
              Por quanto tempo?
            </p>
            <div
              className="lp-origem-opcoes"
              role="radiogroup"
              aria-labelledby="visitante-periodo-label"
              aria-invalid={erro("periodo") ? true : undefined}
            >
              {(
                [
                  ["dia-todo", "Dia todo", evento.visitantes.valorDiaTodo],
                  ["somente-noite", "Somente à noite", evento.visitantes.valorSomenteNoite],
                ] as const
              ).map(([id, rotulo, preco]) => (
                <label className="lp-origem-opcao lp-visita-opcao" key={id}>
                  <input
                    type="radio"
                    name="visitante-periodo"
                    checked={values.periodo === id}
                    onChange={() => setCampo("periodo", id as PeriodoVisitante)}
                  />
                  <span>
                    {rotulo}
                    <strong>{formatarReais(preco)}</strong>
                  </span>
                </label>
              ))}
            </div>
            {erro("periodo") && (
              <p className="lp-err" role="alert">
                {erro("periodo")}
              </p>
            )}
          </div>
          <div style={{ marginTop: "1rem" }}>
            <CamisaCampos
              chave=""
              modelo={values.camisaModelo}
              tamanho={values.camisaTamanho}
              medida={values.camisaMedida}
              opcional
              onModelo={(v) => {
                setCampo("camisaModelo", v);
                setCampo("camisaTamanho", "");
                setCampo("camisaMedida", "");
              }}
              onTamanho={(v) => setCampo("camisaTamanho", v)}
              onMedida={(v) => setCampo("camisaMedida", v)}
              erroModelo={erro("camisaModelo")}
              erroTamanho={erro("camisaTamanho")}
              erroMedida={erro("camisaMedida")}
            />
          </div>
          <p className="lp-visitante-sem-onibus">
            O cadastro de visitante não inclui transporte de ônibus.
          </p>
          <label className="lp-check">
            <input
              type="checkbox"
              checked={values.aceitePrivacidade}
              onChange={(e) => setCampo("aceitePrivacidade", e.target.checked)}
              aria-invalid={erro("aceitePrivacidade") ? true : undefined}
            />
            <span>
              Estou ciente do <a href="/inscricao#privacidade">aviso de privacidade</a>.
            </span>
          </label>
          {erro("aceitePrivacidade") && (
            <p className="lp-err" role="alert">
              {erro("aceitePrivacidade")}
            </p>
          )}
        </fieldset>
        {total !== null && (
          <div className="lp-price" aria-live="polite">
            <div>
              <small>
                {valorCamisa
                  ? `Day use ${formatarReais(valor!)} + camisa ${formatarReais(valorCamisa)}`
                  : "Valor do day use"}
              </small>
              <strong>{formatarReais(total)}</strong>
            </div>
            <small>O cadastro não confirma o pagamento.</small>
          </div>
        )}
        <div className="lp-passos">
          <span />
          <button
            type="submit"
            className="lp-btn lp-btn-brasa"
            disabled={estado.tipo === "enviando"}
          >
            {estado.tipo === "enviando" ? (
              <>
                <Loader2 size={18} className="lp-spinner" aria-hidden="true" /> Enviando…
              </>
            ) : (
              "Enviar cadastro de visitante"
            )}
          </button>
        </div>
      </form>
    </>
  );
}
