import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, Check, Loader2 } from "lucide-react";
import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import { evento } from "../content/evento";
import {
  ORDEM_CAMPOS,
  VALORES_VAZIOS,
  formatarCpf,
  formatarReais,
  formatarTelefone,
  hojeSaoPaulo,
  validar,
  type Campo,
  type Erros,
  type FormValues,
} from "../lib/inscricao";
import { enviarInscricao } from "../server/inscricao.functions";

type Confirmacao = {
  nome: string;
  idade: number;
  faixa: string;
  valor: number | null;
  jaRegistrada: boolean;
};
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

// ─── Campo de texto acessível ────────────────────────────────────────────────
type EntradaProps = {
  campo: Campo;
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
  const id = `f-${p.campo}`;
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
          name={p.campo}
          rows={4}
          value={p.valor}
          maxLength={p.maxLength}
          placeholder={p.placeholder}
          aria-invalid={p.erro ? true : undefined}
          aria-describedby={descrito}
          onBlur={p.onBlur}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => p.onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          name={p.campo}
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
          onChange={(e: ChangeEvent<HTMLInputElement>) => p.onChange(e.target.value)}
        />
      )}
      {p.dica && (
        <p id={idDica} className="lp-err" style={{ color: "var(--lp-mute)" }}>
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
      <h2 id="t-ok">{dados.jaRegistrada ? "Inscrição já registrada" : "Cadastro recebido!"}</h2>
      <p style={{ margin: 0, color: "var(--lp-mute)" }}>
        {dados.nome}, o seu cadastro no {evento.nome} {evento.edicao} foi registrado.
      </p>

      <dl>
        <div>
          <dt>Participante</dt>
          <dd>{dados.nome}</dd>
        </div>
        <div>
          <dt>Idade em {dataBr(evento.inicioData)}</dt>
          <dd>
            {dados.idade} anos · {dados.faixa}
          </dd>
        </div>
        <div>
          <dt>Valor calculado</dt>
          <dd>
            {dados.valor === null
              ? "A definir pela organização (sem cobrança automática)"
              : formatarReais(dados.valor)}
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
          Inscrever outra pessoa
        </button>
      </div>
    </section>
  );
}

// ─── Formulário ──────────────────────────────────────────────────────────────
export function RegistrationForm() {
  const [values, setValues] = useState<FormValues>(VALORES_VAZIOS);
  const [tocados, setTocados] = useState<Partial<Record<Campo, boolean>>>({});
  const [tentou, setTentou] = useState(false);
  const [mesmoWhats, setMesmoWhats] = useState(true);
  const [errosServidor, setErrosServidor] = useState<Erros>({});
  const [estado, setEstado] = useState<Estado>({ tipo: "livre" });
  const [hoje] = useState<string>(() => hojeSaoPaulo());
  const chaveRef = useRef<string | null>(null);
  const enviandoRef = useRef(false);

  const efetivos: FormValues = mesmoWhats ? { ...values, whatsapp: values.telefone } : values;
  const calc = useMemo(
    () =>
      validar(mesmoWhats ? { ...values, whatsapp: values.telefone } : values, {
        dataReferencia: evento.inicioData,
        hoje,
        faixas: evento.faixas,
      }),
    [values, mesmoWhats, hoje],
  );

  const set = <K extends Campo>(campo: K, valor: FormValues[K]) => {
    setValues((v) => ({ ...v, [campo]: valor }));
    setErrosServidor((e) => (e[campo] ? { ...e, [campo]: undefined } : e));
  };
  const tocar = (campo: Campo) => setTocados((t) => (t[campo] ? t : { ...t, [campo]: true }));
  const erro = (campo: Campo): string | undefined =>
    tentou || tocados[campo] ? (calc.erros[campo] ?? errosServidor[campo]) : undefined;

  const campoTexto = (campo: Campo, extra: Partial<EntradaProps> & { rotulo: string }) => (
    <Entrada
      campo={campo}
      valor={String(values[campo])}
      onChange={(v) => set(campo, v as never)}
      onBlur={() => tocar(campo)}
      erro={erro(campo)}
      {...extra}
    />
  );

  const focarPrimeiroErro = (erros: Erros) => {
    const primeiro = ORDEM_CAMPOS.find((c) => erros[c]);
    if (!primeiro) return;
    const el = document.getElementById(`f-${primeiro}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    (el as HTMLElement | null)?.focus({ preventScroll: true });
  };

  async function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviandoRef.current) return; // trava contra clique duplo
    setTentou(true);
    const r = validar(efetivos, { dataReferencia: evento.inicioData, hoje, faixas: evento.faixas });
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
        data: { values: efetivos, idempotencyKey: chaveRef.current },
      });
      if (resp.ok) {
        chaveRef.current = null;
        setEstado({
          tipo: "sucesso",
          dados: {
            nome: resp.nome,
            idade: resp.idade,
            faixa: resp.faixa,
            valor: resp.valor,
            jaRegistrada: !!resp.jaRegistrada,
          },
        });
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
  const temData = calc.idade !== null;

  let precoPrincipal: ReactNode = "—";
  let precoNota = "Informe a data de nascimento para ver o valor da inscrição.";
  if (temData && calc.faixa) {
    precoPrincipal = calc.valor === null ? "A definir" : formatarReais(calc.valor);
    precoNota =
      calc.valor === null
        ? `${calc.faixa.rotulo}: valor definido pela organização. Nenhuma cobrança automática.`
        : `${calc.idade} anos em ${dataBr(evento.inicioData)} · ${calc.faixa.rotulo}.`;
  }

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
            onChange={(e) => set("website", e.target.value)}
          />
        </label>
      </div>

      <fieldset className="lp-fs">
        <legend>Participante</legend>
        {campoTexto("nomeCompleto", {
          rotulo: "Nome completo",
          autoComplete: "name",
          maxLength: 100,
        })}
        <div className="lp-row two" style={{ marginTop: "1rem" }}>
          {campoTexto("dataNascimento", {
            rotulo: "Data de nascimento",
            tipo: "date",
            autoComplete: "bday",
            min: "1900-01-01",
            max: hoje,
          })}
          <Entrada
            campo="cpf"
            rotulo="CPF"
            valor={values.cpf}
            onChange={(v) => set("cpf", formatarCpf(v))}
            onBlur={() => tocar("cpf")}
            erro={erro("cpf")}
            modo="numeric"
            placeholder="000.000.000-00"
            maxLength={14}
            autoComplete="off"
          />
        </div>
      </fieldset>

      <div className="lp-price" aria-live="polite">
        <div>
          <small>Valor da inscrição</small>
          <strong>{precoPrincipal}</strong>
        </div>
        <p>{precoNota} O cadastro não é pagamento confirmado.</p>
      </div>

      <fieldset className="lp-fs">
        <legend>Contato</legend>
        <div className="lp-row two">
          <Entrada
            campo="telefone"
            rotulo="Telefone"
            valor={values.telefone}
            onChange={(v) => set("telefone", formatarTelefone(v))}
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
              campo="whatsapp"
              rotulo="WhatsApp"
              valor={values.whatsapp}
              onChange={(v) => set("whatsapp", formatarTelefone(v))}
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
          {campoTexto("email", {
            rotulo: "E-mail",
            opcional: true,
            tipo: "email",
            modo: "email",
            autoComplete: "email",
            maxLength: 120,
          })}
        </div>
      </fieldset>

      <fieldset className="lp-fs">
        <legend>Igreja e cidade</legend>
        <div className="lp-row two">
          {campoTexto("igreja", { rotulo: "Igreja ou congregação", maxLength: 100 })}
          {campoTexto("cidade", {
            rotulo: "Cidade",
            autoComplete: "address-level2",
            maxLength: 80,
          })}
        </div>
      </fieldset>

      {calc.menorDeIdade && (
        <fieldset className="lp-fs">
          <legend>Responsável legal</legend>
          <p className="hint">Obrigatório para participantes menores de 18 anos.</p>
          <div className="lp-row two">
            {campoTexto("responsavelNome", { rotulo: "Nome do responsável", maxLength: 100 })}
            <Entrada
              campo="responsavelTelefone"
              rotulo="Telefone do responsável"
              valor={values.responsavelTelefone}
              onChange={(v) => set("responsavelTelefone", formatarTelefone(v))}
              onBlur={() => tocar("responsavelTelefone")}
              erro={erro("responsavelTelefone")}
              tipo="tel"
              modo="tel"
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
          </div>
        </fieldset>
      )}

      <fieldset className="lp-fs">
        <legend>Emergência e necessidades</legend>
        <div className="lp-row two">
          {campoTexto("emergenciaNome", { rotulo: "Contato de emergência (nome)", maxLength: 100 })}
          <Entrada
            campo="emergenciaTelefone"
            rotulo="Contato de emergência (telefone)"
            valor={values.emergenciaTelefone}
            onChange={(v) => set("emergenciaTelefone", formatarTelefone(v))}
            onBlur={() => tocar("emergenciaTelefone")}
            erro={erro("emergenciaTelefone")}
            tipo="tel"
            modo="tel"
            placeholder="(00) 00000-0000"
            maxLength={15}
          />
        </div>
        <div style={{ marginTop: "1rem" }}>
          {campoTexto("necessidades", {
            rotulo: "Necessidades relevantes para hospedagem ou alimentação",
            opcional: true,
            multilinha: true,
            maxLength: 500,
            placeholder: "Ex.: restrição alimentar, mobilidade reduzida…",
            dica: `${values.necessidades.length}/500 caracteres`,
          })}
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
            onChange={(e) => set("aceiteRegras", e.target.checked)}
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
            onChange={(e) => set("aceitePrivacidade", e.target.checked)}
            onBlur={() => tocar("aceitePrivacidade")}
          />
          <span>
            Estou ciente do{" "}
            <a href="#privacidade" onClick={(e) => abrirTermo(e, "privacidade")}>
              aviso de privacidade
            </a>{" "}
            e do tratamento dos meus dados para a organização do retiro.
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

      <p style={{ margin: 0, color: "var(--lp-mute)", fontSize: "0.9rem" }}>
        Valor calculado: <strong style={{ color: "var(--lp-ink)" }}>{precoPrincipal}</strong> · O
        envio é apenas cadastro e não confirma pagamento.
      </p>
      <button type="submit" className="lp-btn lp-btn-fire lp-btn-big lp-submit" disabled={enviando}>
        {enviando ? (
          <>
            <Loader2 size={20} className="lp-spin" aria-hidden="true" /> Enviando…
          </>
        ) : (
          "Enviar inscrição"
        )}
      </button>
      <Link to="/" className="lp-back" style={{ justifySelf: "center" }}>
        <ArrowLeft size={16} aria-hidden="true" /> Voltar à página do retiro
      </Link>
    </form>
  );
}
