import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { useMemo, useRef, useState, type FormEvent, type MouseEvent } from "react";

import { evento } from "../content/evento";
import {
  PESSOA_VAZIA,
  VALORES_VAZIOS,
  formatarCpf,
  formatarReais,
  formatarTelefone,
  hojeSaoPaulo,
  validar,
  type Erros,
  type FormValues,
  type Pessoa,
} from "../lib/inscricao";
import { enviarInscricao } from "../api/inscricao.functions";

type Confirmacao = Extract<Awaited<ReturnType<typeof enviarInscricao>>, { ok: true }>;
type Estado =
  | { tipo: "livre" }
  | { tipo: "enviando" }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "sucesso"; dados: Confirmacao };

const novaChave = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

const dataBr = (iso: string): string => iso.split("-").reverse().join("/");
const idDe = (chave: string): string => `f-${chave.replace(/\./g, "-")}`;
const textoValor = (v: number | null): string => (v === null ? "A definir" : formatarReais(v));

// ─── Campo acessível ─────────────────────────────────────────────────────────
type EntradaProps = {
  chave: string;
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  erro?: string;
  opcional?: boolean;
  dica?: string;
  tipo?: string;
  modo?: "text" | "numeric" | "tel" | "email";
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
  multilinha?: boolean;
  min?: string;
  max?: string;
};

function Entrada(p: EntradaProps) {
  const id = idDe(p.chave);
  const idErro = `${id}-erro`;
  const idDica = `${id}-dica`;
  const descrito =
    [p.erro ? idErro : "", p.dica ? idDica : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className="lp-field">
      <label htmlFor={id}>
        {p.rotulo}
        {p.opcional && <small> (opcional)</small>}
      </label>
      {p.multilinha ? (
        <textarea
          id={id}
          name={p.chave}
          rows={4}
          value={p.valor}
          maxLength={p.maxLength}
          placeholder={p.placeholder}
          aria-invalid={p.erro ? true : undefined}
          aria-describedby={descrito}
          onBlur={p.onBlur}
          onChange={(e) => p.onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          name={p.chave}
          type={p.tipo ?? "text"}
          inputMode={p.modo}
          autoComplete={p.autoComplete}
          value={p.valor}
          maxLength={p.maxLength}
          placeholder={p.placeholder}
          min={p.min}
          max={p.max}
          aria-invalid={p.erro ? true : undefined}
          aria-describedby={descrito}
          onBlur={p.onBlur}
          onChange={(e) => p.onChange(e.target.value)}
        />
      )}
      {p.dica && (
        <p id={idDica} className="lp-hint">
          {p.dica}
        </p>
      )}
      {p.erro && (
        <p id={idErro} className="lp-err" role="alert">
          {p.erro}
        </p>
      )}
    </div>
  );
}

function abrirTermo(e: MouseEvent<HTMLAnchorElement>, id: "regras" | "privacidade") {
  e.preventDefault();
  const el = document.getElementById(id) as HTMLDetailsElement | null;
  if (!el) return;
  el.open = true;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
}

// ─── Confirmação ─────────────────────────────────────────────────────────────
function TelaConfirmacao({ dados, onNova }: { dados: Confirmacao; onNova: () => void }) {
  return (
    <section className="lp-done" role="status" aria-live="polite" aria-labelledby="t-ok">
      <span className="lp-done-ico">
        <Check size={28} aria-hidden="true" />
      </span>
      <h2 id="t-ok">
        {dados.jaRegistrada ? "Inscrição já registrada" : "Cadastro da família recebido!"}
      </h2>
      <p style={{ margin: 0, color: "var(--lp-mute)" }}>
        {dados.responsavel}, o cadastro da sua família no {evento.nome} {evento.edicao} (
        {evento.dataTexto}) foi registrado.
      </p>

      <ul className="lp-people">
        {dados.participantes.map((p, i) => (
          <li key={`${p.nome}-${i}`}>
            <span>
              <strong>{p.nome}</strong>
              <small>
                {p.idade} anos · {p.faixa}
              </small>
            </span>
            <b>{textoValor(p.valor)}</b>
          </li>
        ))}
      </ul>
      <dl>
        <div>
          <dt>Valor total calculado</dt>
          <dd>
            {formatarReais(dados.total)}
            {dados.temValorADefinir && " + valores a definir pela organização"}
          </dd>
        </div>
        <div>
          <dt>Situação</dt>
          <dd>Cadastro recebido · pagamento NÃO confirmado</dd>
        </div>
      </dl>

      <p style={{ margin: "0 0 0.25rem", fontWeight: 700 }}>Próximos passos</p>
      <ol>
        {evento.proximosPassos.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ol>

      <div className="lp-cta-row" style={{ marginTop: 0 }}>
        <Link to="/" className="lp-btn lp-btn-fire">
          Voltar ao início
        </Link>
        <button type="button" className="lp-btn lp-btn-ghost" onClick={onNova}>
          Inscrever outra família
        </button>
      </div>
    </section>
  );
}

// ─── Formulário ──────────────────────────────────────────────────────────────
export function RegistrationForm() {
  const [values, setValues] = useState<FormValues>(VALORES_VAZIOS);
  const [tocados, setTocados] = useState<Record<string, boolean>>({});
  const [tentou, setTentou] = useState(false);
  const [mesmoWhats, setMesmoWhats] = useState(true);
  const [errosServidor, setErrosServidor] = useState<Erros>({});
  const [estado, setEstado] = useState<Estado>({ tipo: "livre" });
  const [hoje] = useState<string>(() => hojeSaoPaulo());
  const chaveRef = useRef<string | null>(null);
  const enviandoRef = useRef(false);
  const uidRef = useRef(0);

  const ctx = useMemo(
    () => ({
      dataReferencia: evento.inicioData,
      hoje,
      faixas: evento.faixas,
      maxParticipantes: evento.maxParticipantesPorInscricao,
    }),
    [hoje],
  );
  const efetivos = (v: FormValues, igual: boolean): FormValues =>
    igual ? { ...v, whatsapp: v.telefone } : v;
  const calc = useMemo(() => validar(efetivos(values, mesmoWhats), ctx), [values, mesmoWhats, ctx]);

  const limparErroServidor = (chave: string) =>
    setErrosServidor((e) =>
      e[chave] ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== chave)) : e,
    );
  const tocar = (chave: string) => setTocados((t) => (t[chave] ? t : { ...t, [chave]: true }));
  const erro = (chave: string): string | undefined =>
    tentou || tocados[chave] ? (calc.erros[chave] ?? errosServidor[chave]) : undefined;

  const setCampo = <K extends keyof FormValues>(campo: K, valor: FormValues[K]) => {
    setValues((v) => ({ ...v, [campo]: valor }));
    limparErroServidor(campo as string);
  };
  const setResp = (campo: keyof Pessoa, valor: string) => {
    setValues((v) => ({ ...v, responsavel: { ...v.responsavel, [campo]: valor } }));
    limparErroServidor(`responsavel.${campo}`);
  };
  const setIntegrante = (i: number, campo: keyof Pessoa, valor: string) => {
    setValues((v) => ({
      ...v,
      integrantes: v.integrantes.map((p, j) => (j === i ? { ...p, [campo]: valor } : p)),
    }));
    limparErroServidor(`integrantes.${i}.${campo}`);
  };
  const adicionar = () => {
    if (values.integrantes.length >= evento.maxParticipantesPorInscricao - 1) return;
    uidRef.current += 1;
    setValues((v) => ({
      ...v,
      integrantes: [...v.integrantes, { ...PESSOA_VAZIA, uid: `i${uidRef.current}` }],
    }));
    setTimeout(
      () => document.getElementById(idDe(`integrantes.${values.integrantes.length}.nome`))?.focus(),
      30,
    );
  };
  const remover = (i: number) => {
    setValues((v) => ({ ...v, integrantes: v.integrantes.filter((_, j) => j !== i) }));
    setTocados((t) =>
      Object.fromEntries(Object.entries(t).filter(([k]) => !k.startsWith("integrantes."))),
    );
    setErrosServidor({});
  };

  const focarPrimeiroErro = (erros: Erros) => {
    const primeiro = Object.keys(erros)[0];
    if (!primeiro) return;
    const alvo =
      document.getElementById(idDe(primeiro)) ?? document.getElementById("integrantes-titulo");
    alvo?.scrollIntoView({ behavior: "smooth", block: "center" });
    (alvo as HTMLElement | null)?.focus({ preventScroll: true });
  };

  async function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviandoRef.current) return; // trava contra clique duplo
    setTentou(true);
    const envio = efetivos(values, mesmoWhats);
    const r = validar(envio, ctx);
    if (Object.keys(r.erros).length > 0) {
      setEstado({ tipo: "livre" });
      focarPrimeiroErro(r.erros);
      return;
    }

    enviandoRef.current = true;
    setEstado({ tipo: "enviando" });
    try {
      if (!chaveRef.current) chaveRef.current = novaChave();
      const resp = await enviarInscricao({
        data: { values: envio, idempotencyKey: chaveRef.current },
      });
      if (resp.ok) {
        chaveRef.current = null;
        setEstado({ tipo: "sucesso", dados: resp });
        setValues(VALORES_VAZIOS);
        setTocados({});
        setTentou(false);
        setMesmoWhats(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        if (resp.erros) {
          setErrosServidor(resp.erros);
          focarPrimeiroErro(resp.erros);
        }
        setEstado({ tipo: "erro", mensagem: resp.mensagem });
      }
    } catch {
      setEstado({
        tipo: "erro",
        mensagem:
          "Não conseguimos confirmar o envio (verifique sua conexão). Você pode tentar de novo: se a inscrição já tiver sido gravada, avisaremos.",
      });
    } finally {
      enviandoRef.current = false;
    }
  }

  if (!evento.inscricoesAbertas) {
    return (
      <div className="lp-empty">
        <strong>As inscrições não estão abertas no momento.</strong>
        <span>Acompanhe as novidades da Conexão Jovem.</span>
      </div>
    );
  }

  if (estado.tipo === "sucesso") {
    return <TelaConfirmacao dados={estado.dados} onNova={() => setEstado({ tipo: "livre" })} />;
  }

  const enviando = estado.tipo === "enviando";
  const valorDe = (chave: string) => calc.participantes.find((p) => p.chave === chave);
  const respCalc = valorDe("responsavel");
  const podeAdicionar = values.integrantes.length < evento.maxParticipantesPorInscricao - 1;

  return (
    <form className="lp-form" onSubmit={aoEnviar} noValidate aria-busy={enviando}>
      {/* Campo-isca: invisível para pessoas */}
      <div className="lp-honey" aria-hidden="true">
        <label>
          Não preencha este campo
          <input
            tabIndex={-1}
            autoComplete="off"
            name="website"
            value={values.website}
            onChange={(e) => setCampo("website", e.target.value)}
          />
        </label>
      </div>

      <fieldset className="lp-fs">
        <legend>Responsável pela inscrição</legend>
        <p className="hint">Uma pessoa maior de idade faz a inscrição de toda a família.</p>
        <Entrada
          chave="responsavel.nome"
          rotulo="Nome completo"
          valor={values.responsavel.nome}
          onChange={(v) => setResp("nome", v)}
          onBlur={() => tocar("responsavel.nome")}
          erro={erro("responsavel.nome")}
          autoComplete="name"
          maxLength={100}
        />
        <div className="lp-row two" style={{ marginTop: "1rem" }}>
          <Entrada
            chave="responsavel.dataNascimento"
            rotulo="Data de nascimento"
            valor={values.responsavel.dataNascimento}
            onChange={(v) => setResp("dataNascimento", v)}
            onBlur={() => tocar("responsavel.dataNascimento")}
            erro={erro("responsavel.dataNascimento")}
            tipo="date"
            autoComplete="bday"
            min="1900-01-01"
            max={hoje}
          />
          <Entrada
            chave="responsavel.cpf"
            rotulo="CPF"
            valor={values.responsavel.cpf}
            onChange={(v) => setResp("cpf", formatarCpf(v))}
            onBlur={() => tocar("responsavel.cpf")}
            erro={erro("responsavel.cpf")}
            modo="numeric"
            placeholder="000.000.000-00"
            maxLength={14}
            autoComplete="off"
          />
        </div>
        <label className="lp-check">
          <input
            type="checkbox"
            checked={values.responsavelParticipa}
            onChange={(e) => setCampo("responsavelParticipa", e.target.checked)}
          />
          <span>
            Eu também vou participar do retiro
            {values.responsavelParticipa && respCalc && (
              <small className="lp-chip">
                {respCalc.idade} anos · {textoValor(respCalc.valor)}
              </small>
            )}
          </span>
        </label>
      </fieldset>

      <fieldset className="lp-fs">
        <legend>Contato da família</legend>
        <div className="lp-row two">
          <Entrada
            chave="telefone"
            rotulo="Telefone"
            valor={values.telefone}
            onChange={(v) => setCampo("telefone", formatarTelefone(v))}
            onBlur={() => tocar("telefone")}
            erro={erro("telefone")}
            tipo="tel"
            modo="tel"
            autoComplete="tel-national"
            placeholder="(00) 00000-0000"
            maxLength={15}
          />
          {!mesmoWhats && (
            <Entrada
              chave="whatsapp"
              rotulo="WhatsApp"
              valor={values.whatsapp}
              onChange={(v) => setCampo("whatsapp", formatarTelefone(v))}
              onBlur={() => tocar("whatsapp")}
              erro={erro("whatsapp")}
              tipo="tel"
              modo="tel"
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
          )}
        </div>
        <label className="lp-check">
          <input
            type="checkbox"
            checked={mesmoWhats}
            onChange={(e) => setMesmoWhats(e.target.checked)}
          />
          <span>Este telefone também é o meu WhatsApp</span>
        </label>
        <div style={{ marginTop: "1rem" }}>
          <Entrada
            chave="email"
            rotulo="E-mail"
            opcional
            valor={values.email}
            onChange={(v) => setCampo("email", v)}
            onBlur={() => tocar("email")}
            erro={erro("email")}
            tipo="email"
            modo="email"
            autoComplete="email"
            maxLength={120}
          />
        </div>
        <div className="lp-row two" style={{ marginTop: "1rem" }}>
          <Entrada
            chave="igreja"
            rotulo="Igreja ou congregação"
            valor={values.igreja}
            onChange={(v) => setCampo("igreja", v)}
            onBlur={() => tocar("igreja")}
            erro={erro("igreja")}
            maxLength={100}
          />
          <Entrada
            chave="cidade"
            rotulo="Cidade"
            valor={values.cidade}
            onChange={(v) => setCampo("cidade", v)}
            onBlur={() => tocar("cidade")}
            erro={erro("cidade")}
            autoComplete="address-level2"
            maxLength={80}
          />
        </div>
      </fieldset>

      <fieldset className="lp-fs">
        <legend id="integrantes-titulo" tabIndex={-1}>
          Integrantes da família
        </legend>
        <p className="hint">
          Cadastre aqui cônjuge, filhos e demais pessoas da família que vão participar. O valor de
          cada um é calculado pela idade em {dataBr(evento.inicioData)}.
        </p>

        {values.integrantes.length === 0 && (
          <p className="lp-vazio">Nenhum integrante adicionado além do responsável.</p>
        )}

        <ul className="lp-members">
          {values.integrantes.map((p, i) => {
            const chave = `integrantes.${i}`;
            const info = valorDe(chave);
            const menor = info ? info.menorDeIdade : false;
            return (
              <li className="lp-member" key={p.uid ?? chave}>
                <div className="lp-member-head">
                  <strong>Integrante {i + 1}</strong>
                  {info && (
                    <span className="lp-chip">
                      {info.idade} anos · {textoValor(info.valor)}
                    </span>
                  )}
                  <button
                    type="button"
                    className="lp-icon-btn"
                    onClick={() => remover(i)}
                    aria-label={`Remover integrante ${i + 1}`}
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </div>
                <Entrada
                  chave={`${chave}.nome`}
                  rotulo="Nome completo"
                  valor={p.nome}
                  onChange={(v) => setIntegrante(i, "nome", v)}
                  onBlur={() => tocar(`${chave}.nome`)}
                  erro={erro(`${chave}.nome`)}
                  maxLength={100}
                />
                <div className="lp-row two" style={{ marginTop: "1rem" }}>
                  <Entrada
                    chave={`${chave}.dataNascimento`}
                    rotulo="Data de nascimento"
                    valor={p.dataNascimento}
                    onChange={(v) => setIntegrante(i, "dataNascimento", v)}
                    onBlur={() => tocar(`${chave}.dataNascimento`)}
                    erro={erro(`${chave}.dataNascimento`)}
                    tipo="date"
                    min="1900-01-01"
                    max={hoje}
                  />
                  <Entrada
                    chave={`${chave}.cpf`}
                    rotulo="CPF"
                    opcional={menor}
                    valor={p.cpf}
                    onChange={(v) => setIntegrante(i, "cpf", formatarCpf(v))}
                    onBlur={() => tocar(`${chave}.cpf`)}
                    erro={erro(`${chave}.cpf`)}
                    dica={info ? undefined : "Obrigatório para maiores de 18 anos."}
                    modo="numeric"
                    placeholder="000.000.000-00"
                    maxLength={14}
                    autoComplete="off"
                  />
                </div>
              </li>
            );
          })}
        </ul>

        {erro("integrantes") && (
          <p className="lp-err" role="alert">
            {erro("integrantes")}
          </p>
        )}
        <button
          type="button"
          className="lp-btn lp-btn-ghost lp-add"
          onClick={adicionar}
          disabled={!podeAdicionar}
        >
          <Plus size={18} aria-hidden="true" /> Adicionar integrante
        </button>
        {!podeAdicionar && (
          <p className="lp-hint">
            Limite de {evento.maxParticipantesPorInscricao} pessoas por inscrição. Para mais
            pessoas, faça uma segunda inscrição.
          </p>
        )}
      </fieldset>

      <section className="lp-price" aria-live="polite" aria-label="Resumo dos valores">
        <div className="lp-price-top">
          <div>
            <small>Valor total calculado</small>
            <strong>
              {calc.participantes.length === 0 ? "—" : formatarReais(calc.total)}
              {calc.temValorADefinir && <span className="lp-plus"> + a definir</span>}
            </strong>
          </div>
          <p>
            {calc.participantes.length === 0
              ? "Informe as datas de nascimento para ver os valores."
              : `${calc.participantes.length} ${calc.participantes.length === 1 ? "pessoa" : "pessoas"} · idade em ${dataBr(evento.inicioData)}. O cadastro não é pagamento confirmado.`}
          </p>
        </div>
        {calc.participantes.length > 0 && (
          <ul className="lp-people compact">
            {calc.participantes.map((p) => (
              <li key={p.chave}>
                <span>
                  <strong>{p.nome || "Sem nome"}</strong>
                  <small>
                    {p.idade} anos · {p.faixa.rotulo}
                  </small>
                </span>
                <b>{textoValor(p.valor)}</b>
              </li>
            ))}
          </ul>
        )}
        {calc.temValorADefinir && (
          <p className="lp-hint" style={{ margin: "0.5rem 0 0" }}>
            Menores de 5 anos: valor a definir pela organização, sem cobrança automática.
          </p>
        )}
      </section>

      <fieldset className="lp-fs">
        <legend>Emergência e necessidades</legend>
        <div className="lp-row two">
          <Entrada
            chave="emergenciaNome"
            rotulo="Contato de emergência (nome)"
            valor={values.emergenciaNome}
            onChange={(v) => setCampo("emergenciaNome", v)}
            onBlur={() => tocar("emergenciaNome")}
            erro={erro("emergenciaNome")}
            maxLength={100}
          />
          <Entrada
            chave="emergenciaTelefone"
            rotulo="Contato de emergência (telefone)"
            valor={values.emergenciaTelefone}
            onChange={(v) => setCampo("emergenciaTelefone", formatarTelefone(v))}
            onBlur={() => tocar("emergenciaTelefone")}
            erro={erro("emergenciaTelefone")}
            tipo="tel"
            modo="tel"
            placeholder="(00) 00000-0000"
            maxLength={15}
          />
        </div>
        <div style={{ marginTop: "1rem" }}>
          <Entrada
            chave="necessidades"
            rotulo="Necessidades relevantes para hospedagem ou alimentação"
            opcional
            multilinha
            valor={values.necessidades}
            onChange={(v) => setCampo("necessidades", v)}
            onBlur={() => tocar("necessidades")}
            erro={erro("necessidades")}
            maxLength={500}
            placeholder="Ex.: restrição alimentar, mobilidade reduzida…"
            dica={`${values.necessidades.length}/500 caracteres`}
          />
        </div>
      </fieldset>

      <fieldset className="lp-fs">
        <legend>Aceites</legend>
        <label className="lp-check" style={{ marginTop: 0 }}>
          <input
            id="f-aceiteRegras"
            type="checkbox"
            checked={values.aceiteRegras}
            aria-invalid={erro("aceiteRegras") ? true : undefined}
            onChange={(e) => setCampo("aceiteRegras", e.target.checked)}
            onBlur={() => tocar("aceiteRegras")}
          />
          <span>
            Li e aceito as{" "}
            <a href="#regras" onClick={(e) => abrirTermo(e, "regras")}>
              regras do retiro
            </a>
            .
          </span>
        </label>
        {erro("aceiteRegras") && (
          <p className="lp-err" role="alert">
            {erro("aceiteRegras")}
          </p>
        )}
        <label className="lp-check">
          <input
            id="f-aceitePrivacidade"
            type="checkbox"
            checked={values.aceitePrivacidade}
            aria-invalid={erro("aceitePrivacidade") ? true : undefined}
            onChange={(e) => setCampo("aceitePrivacidade", e.target.checked)}
            onBlur={() => tocar("aceitePrivacidade")}
          />
          <span>
            Estou ciente do{" "}
            <a href="#privacidade" onClick={(e) => abrirTermo(e, "privacidade")}>
              aviso de privacidade
            </a>{" "}
            e autorizo o tratamento dos dados de todos os integrantes cadastrados (inclusive
            menores, como responsável legal) para a organização do retiro.
          </span>
        </label>
        {erro("aceitePrivacidade") && (
          <p className="lp-err" role="alert">
            {erro("aceitePrivacidade")}
          </p>
        )}
      </fieldset>

      {estado.tipo === "erro" && (
        <div className="lp-alert" role="alert">
          <AlertTriangle size={20} aria-hidden="true" />
          <p>{estado.mensagem}</p>
        </div>
      )}

      <button type="submit" className="lp-btn lp-btn-fire lp-btn-big lp-submit" disabled={enviando}>
        {enviando ? (
          <>
            <Loader2 size={20} className="lp-spin" aria-hidden="true" /> Enviando…
          </>
        ) : (
          "Enviar inscrição da família"
        )}
      </button>
      <p className="lp-hint" style={{ textAlign: "center", margin: 0 }}>
        O envio é apenas cadastro e não confirma pagamento.
      </p>
      <Link to="/" className="lp-back" style={{ justifySelf: "center" }}>
        <ArrowLeft size={16} aria-hidden="true" /> Voltar à página do retiro
      </Link>
    </form>
  );
}
