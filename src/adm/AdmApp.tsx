import { useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  FileText,
  Gift,
  LayoutDashboard,
  LogOut,
  Receipt,
  Search,
  Users,
  X,
} from "lucide-react";

import { carregarAdm, entrarAdm, estadoAdm, gravarAdm, sairAdm } from "../api/adm.functions";
import type { EstadoAdm } from "../api/adm.functions";
import type { Gravacao } from "../api/adm.server";
import { fluxoPrevisto, resumirFamilia, resumirTudo, rotuloSituacao } from "./calculos";
import type { ResumoFamilia } from "./calculos";
import { criarDemo } from "./demo";
import { aplicarLocal } from "./local";
import { csvInscritos, MODELOS, resumoCamisetas, resumoTransporte, TAMANHOS } from "./relatorios";
import { CATEGORIAS } from "./tipos";
import type {
  Base,
  CategoriaDespesa,
  Doacao,
  FormaPagamento,
  Pagamento,
  SituacaoFamilia,
  StatusDespesa,
  TipoAjuste,
} from "./tipos";

const reais = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const dma = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const hojeISO = () => new Date().toISOString().slice(0, 10);
const novoId = (p: string) => `${p}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e3)}`;

type Tela = "painel" | "inscritos" | "pagamentos" | "despesas" | "doacoes" | "relatorios";
const TELAS: { id: Tela; rotulo: string; icone: typeof Users }[] = [
  { id: "painel", rotulo: "Painel", icone: LayoutDashboard },
  { id: "inscritos", rotulo: "Inscritos", icone: Users },
  { id: "pagamentos", rotulo: "Pagamentos", icone: BadgeDollarSign },
  { id: "despesas", rotulo: "Despesas", icone: Receipt },
  { id: "doacoes", rotulo: "Doações", icone: Gift },
  { id: "relatorios", rotulo: "Relatórios", icone: FileText },
];

const COR_SITUACAO: Record<SituacaoFamilia, string> = {
  pre: "neutro",
  pendente: "ambar",
  parcial: "azul",
  quitado: "verde",
  isento: "neutro",
};

function Selo({ situacao }: { situacao: SituacaoFamilia }) {
  return <span className={`adm-selo adm-selo-${COR_SITUACAO[situacao]}`}>{rotuloSituacao[situacao]}</span>;
}

/* ───────────────────────────── Entrada ───────────────────────────── */

export function Adm() {
  const [estado, setEstado] = useState<EstadoAdm | null>(null);
  const [demoAberta, setDemoAberta] = useState(false);

  useEffect(() => {
    estadoAdm().then(setEstado).catch(() => setEstado({ modo: "fechado" }));
  }, []);

  if (estado?.modo === "dentro") return <Sistema real nome={estado.nome} sair={() => setEstado({ modo: "login" })} />;
  if (estado?.modo === "demo" && demoAberta) return <Sistema real={false} nome="Demonstração" sair={() => setDemoAberta(false)} />;
  return (
    <div className="adm adm-login-fundo">
      <main className="adm-login" aria-labelledby="adm-titulo">
        <p className="adm-marca">Retiro Conexão Jovem 2027</p>
        <h1 id="adm-titulo">Gestão do retiro</h1>
        <p className="adm-sub">Inscritos, pagamentos e despesas em um só lugar.</p>
        {!estado && <p className="adm-sub">Carregando…</p>}
        {estado?.modo === "login" && <Login entrou={(nome) => setEstado({ modo: "dentro", nome })} />}
        {estado?.modo === "demo" && (
          <>
            <div className="adm-aviso">
              <strong>Prévia do sistema.</strong> Os dados são fictícios e nada é gravado. O login real (e-mail e
              senha) funciona na versão publicada, ligada à planilha.
            </div>
            <button className="adm-btn adm-btn-primario" onClick={() => setDemoAberta(true)}>Entrar na demonstração</button>
          </>
        )}
        {estado?.modo === "fechado" && <div className="adm-aviso adm-aviso-neutro">O acesso ainda está em preparação. Volte em breve.</div>}
      </main>
    </div>
  );
}

function Login({ entrou }: { entrou: (nome: string) => void }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  return (
    <form
      className="adm-login-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setErro("");
        setEnviando(true);
        try {
          const r = await entrarAdm({ data: { email, senha } });
          if (r.ok) entrou(r.dados.nome);
          else setErro(r.mensagem);
        } catch {
          setErro("Não foi possível entrar agora. Tente de novo.");
        } finally {
          setEnviando(false);
        }
      }}
    >
      <label>E-mail do cadastro
        <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>Senha (4 primeiros dígitos do seu CPF)
        <input type="password" inputMode="numeric" maxLength={4} autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value.replace(/\D/g, ""))} required />
      </label>
      {erro && <p className="adm-erro" role="alert">{erro}</p>}
      <button className="adm-btn adm-btn-primario" disabled={enviando || senha.length !== 4}>{enviando ? "Entrando…" : "Entrar"}</button>
    </form>
  );
}

/* ───────────────────────────── Sistema ───────────────────────────── */

function Sistema({ real, nome, sair }: { real: boolean; nome: string; sair: () => void }) {
  const [base, setBase] = useState<Base | null>(() => (real ? null : criarDemo()));
  const [tela, setTela] = useState<Tela>("painel");
  const [aberta, setAberta] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ tom: "ok" | "erro"; texto: string } | null>(null);
  const [carregando, setCarregando] = useState(real);
  const [paleta, setPaleta] = useState(false);
  const hoje = hojeISO();

  const recarregar = async () => {
    setCarregando(true);
    try {
      const r = await carregarAdm();
      if (r.ok) setBase(r.dados);
      else if (r.codigo === "SESSAO") sair();
      else setAviso({ tom: "erro", texto: r.mensagem });
    } catch {
      setAviso({ tom: "erro", texto: "Não foi possível ler a planilha agora." });
    } finally {
      setCarregando(false);
    }
  };
  useEffect(() => {
    if (real) void recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [real]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaleta((v) => !v); }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  const exec = async (g: Gravacao): Promise<boolean> => {
    if (!real) {
      setBase((b) => (b ? aplicarLocal(b, g, hoje, novoId("L")) : b));
      setAviso({ tom: "ok", texto: "Registrado na prévia (nada foi gravado)." });
      return true;
    }
    try {
      const r = await gravarAdm({ data: g });
      if (!r.ok) {
        if (r.codigo === "SESSAO") sair();
        setAviso({ tom: "erro", texto: r.mensagem });
        return false;
      }
      setAviso({ tom: "ok", texto: "Salvo na planilha." });
      await recarregar();
      return true;
    } catch {
      setAviso({ tom: "erro", texto: "Não foi possível salvar. Tente de novo." });
      return false;
    }
  };

  const resumo = useMemo(() => (base ? resumirTudo(base, hoje) : null), [base, hoje]);
  const lancarPagamento = (p: Omit<Pagamento, "id">) =>
    void exec({ tipo: "pagamento", familiaId: p.familiaId, valor: p.valor, forma: p.forma, data: p.data, obs: p.obs });

  return (
    <div className="adm adm-app">
      <aside className="adm-lateral" aria-label="Menu">
        <p className="adm-logo">Gestão · Retiro 2027</p>
        <nav>
          {TELAS.map((t) => (
            <button key={t.id} className={`adm-nav ${tela === t.id ? "ativo" : ""}`} aria-current={tela === t.id ? "page" : undefined} onClick={() => setTela(t.id)}>
              <t.icone size={18} aria-hidden /> <span>{t.rotulo}</span>
            </button>
          ))}
        </nav>
        <div className="adm-usuario">
          <span className="adm-mudo">{nome}</span>
          <button className="adm-nav" onClick={async () => { if (real) await sairAdm().catch(() => undefined); sair(); }}>
            <LogOut size={18} aria-hidden /> <span>Sair</span>
          </button>
          <button className="adm-atalho" onClick={() => setPaleta(true)}>Buscar · Ctrl K</button>
        </div>
      </aside>
      <div className="adm-conteudo">
        {!real && <div className="adm-faixa" role="status">Dados de demonstração — nada é gravado na planilha.</div>}
        {aviso && <div className={`adm-toast adm-toast-${aviso.tom}`} role="status">{aviso.texto}</div>}
        {(!base || !resumo) && <main className="adm-pagina"><p className="adm-sub">{carregando ? "Carregando a planilha…" : "Sem dados."}</p></main>}
        {base && resumo && (
          <>
            {tela === "painel" && <Painel resumo={resumo} hoje={hoje} abrir={(id) => { setTela("inscritos"); setAberta(id); }} />}
            {tela === "inscritos" && <Inscritos resumo={resumo} aberta={aberta} setAberta={setAberta} hoje={hoje} base={base} lancar={lancarPagamento} exec={exec} />}
            {tela === "pagamentos" && <Pagamentos base={base} resumo={resumo} lancar={lancarPagamento} />}
            {tela === "despesas" && <Despesas base={base} exec={exec} />}
            {tela === "doacoes" && <Doacoes base={base} exec={exec} />}
            {tela === "relatorios" && <Relatorios base={base} resumo={resumo} />}
          </>
        )}
        {paleta && base && <Paleta base={base} fechar={() => setPaleta(false)} ir={(t, id) => { setTela(t); if (id) setAberta(id); setPaleta(false); }} />}
      </div>
    </div>
  );
}

function Paleta({ base, fechar, ir }: { base: Base; fechar: () => void; ir: (t: Tela, id?: string) => void }) {
  const [q, setQ] = useState("");
  const termo = q.trim().toLowerCase();
  const telas = TELAS.filter((t) => t.rotulo.toLowerCase().includes(termo));
  const fams = termo
    ? base.familias.filter((f) => `${f.responsavel} ${base.pessoas.filter((p) => p.familiaId === f.id).map((p) => p.nome).join(" ")}`.toLowerCase().includes(termo)).slice(0, 8)
    : [];
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [fechar]);
  return (
    <>
      <div className="adm-fundo" onClick={fechar} aria-hidden />
      <div className="adm-paleta" role="dialog" aria-modal="true" aria-label="Busca rápida">
        <input autoFocus placeholder="Ir para uma tela ou buscar uma família…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Busca rápida" />
        <ul>
          {telas.map((t) => (<li key={t.id}><button onClick={() => ir(t.id)}>{t.rotulo}</button></li>))}
          {fams.map((f) => (<li key={f.id}><button onClick={() => ir("inscritos", f.id)}>{f.responsavel}<span className="adm-mudo"> · {f.igreja}</span></button></li>))}
        </ul>
      </div>
    </>
  );
}

/* ───────────────────────────── Painel ───────────────────────────── */

function Cartao({ rotulo, valor, nota, tom }: { rotulo: string; valor: string; nota?: string; tom?: "verde" | "ambar" | "vermelho" }) {
  return (
    <div className="adm-cartao">
      <p className="adm-cartao-rotulo">{rotulo}</p>
      <p className={`adm-cartao-valor ${tom ? `tom-${tom}` : ""}`}>{valor}</p>
      {nota && <p className="adm-cartao-nota">{nota}</p>}
    </div>
  );
}

function Painel({ resumo, hoje, abrir }: { resumo: ReturnType<typeof resumirTudo>; hoje: string; abrir: (id: string) => void }) {
  const fluxo = fluxoPrevisto(resumo, hoje);
  const maximo = Math.max(1, ...fluxo.map((f) => f.valor));
  const proximos = resumo.familias
    .filter((f) => f.proximoVencimento && f.atrasado === 0)
    .sort((a, b) => a.proximoVencimento!.data.localeCompare(b.proximoVencimento!.data))
    .slice(0, 5);
  const falta = Math.max(0, resumo.pontoEquilibrio - resumo.pessoasPagantes);
  return (
    <main className="adm-pagina">
      <h1>Visão geral</h1>
      <section className="adm-grade" aria-label="Resumo financeiro">
        <Cartao rotulo="Recebido" valor={reais(resumo.recebido)} tom="verde" nota={`de ${reais(resumo.devido)} previstos`} />
        <Cartao rotulo="A receber" valor={reais(resumo.aReceber)} tom="ambar" nota={`${resumo.atrasadas.length} família(s) em atraso`} />
        <Cartao rotulo="Despesas pagas" valor={reais(resumo.despesasPagas)} tom="vermelho" nota={`orçado ${reais(resumo.orcado)}`} />
        <Cartao rotulo="Saldo atual" valor={reais(resumo.saldoAtual)} nota={`projetado ${reais(resumo.saldoProjetado)}`} />
      </section>

      <section className="adm-bloco" aria-label="Ponto de equilíbrio">
        <h2>Ponto de equilíbrio</h2>
        <p className="adm-sub">
          {resumo.pessoasPagantes} pessoas pagantes inscritas · precisam ser {resumo.pontoEquilibrio} para cobrir o
          orçamento ({reais(resumo.ticketMedio)} em média por pessoa).{" "}
          {falta > 0 ? `Faltam ${falta}.` : "Meta atingida."}
        </p>
        <div className="adm-barra" role="progressbar" aria-valuemin={0} aria-valuemax={resumo.pontoEquilibrio} aria-valuenow={Math.min(resumo.pessoasPagantes, resumo.pontoEquilibrio)}>
          <span style={{ width: `${Math.min(100, (resumo.pessoasPagantes / Math.max(1, resumo.pontoEquilibrio)) * 100)}%` }} />
        </div>
      </section>

      <div className="adm-duas">
        <section className="adm-bloco" aria-label="Entradas previstas">
          <h2>Entradas previstas por vencimento</h2>
          <ul className="adm-colunas">
            {fluxo.map((f) => (
              <li key={f.data} className={f.vencido ? "vencido" : ""}>
                <span className="adm-coluna-valor">{reais(f.valor)}</span>
                <span className="adm-coluna-barra" style={{ height: `${Math.max(4, (f.valor / maximo) * 100)}%` }} />
                <span className="adm-coluna-rotulo">{dm(f.data)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="adm-bloco" aria-label="Alertas">
          <h2>Atenção</h2>
          {resumo.atrasadas.length === 0 && <p className="adm-vazio">Nenhuma parcela vencida em aberto.</p>}
          <ul className="adm-lista">
            {resumo.atrasadas.map((f) => (
              <li key={f.familia.id}>
                <button onClick={() => abrir(f.familia.id)}>
                  <span>{f.familia.responsavel}</span>
                  <span className="adm-selo adm-selo-vermelho">{f.atrasado} em atraso · {reais(f.aReceber)}</span>
                </button>
              </li>
            ))}
          </ul>
          <h3>Próximos vencimentos</h3>
          {proximos.length === 0 && <p className="adm-vazio">Nada a vencer.</p>}
          <ul className="adm-lista">
            {proximos.map((f) => (
              <li key={f.familia.id}>
                <button onClick={() => abrir(f.familia.id)}>
                  <span>{f.familia.responsavel}</span>
                  <span className="adm-mudo">{dm(f.proximoVencimento!.data)} · {reais(f.proximoVencimento!.valor)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

/* ───────────────────────────── Inscritos ───────────────────────────── */

const COLUNAS_QUADRO: SituacaoFamilia[] = ["pendente", "parcial", "quitado", "isento"];

function Inscritos({
  resumo, aberta, setAberta, hoje, base, lancar, exec,
}: {
  resumo: ReturnType<typeof resumirTudo>;
  aberta: string | null;
  setAberta: (id: string | null) => void;
  hoje: string;
  base: Base;
  lancar: (p: Omit<Pagamento, "id">) => void;
  exec: (g: Gravacao) => Promise<boolean>;
}) {
  const [visao, setVisao] = useState<"tabela" | "quadro">("tabela");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<SituacaoFamilia | "todas">("todas");

  const lista = resumo.familias.filter((f) => {
    const alvo = `${f.familia.responsavel} ${f.familia.igreja} ${f.pessoas.map((p) => p.nome).join(" ")}`.toLowerCase();
    return alvo.includes(busca.toLowerCase()) && (filtro === "todas" || f.situacao === filtro);
  });
  const atual = aberta ? resumo.familias.find((f) => f.familia.id === aberta) : undefined;

  return (
    <main className="adm-pagina">
      <div className="adm-topo">
        <h1>Inscritos</h1>
        <div className="adm-alternar" role="group" aria-label="Visualização">
          <button className={visao === "tabela" ? "ativo" : ""} onClick={() => setVisao("tabela")}>Tabela</button>
          <button className={visao === "quadro" ? "ativo" : ""} onClick={() => setVisao("quadro")}>Quadro</button>
        </div>
      </div>
      <div className="adm-ferramentas">
        <label className="adm-busca">
          <Search size={16} aria-hidden />
          <input type="search" placeholder="Buscar família, pessoa ou igreja" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar" />
        </label>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value as SituacaoFamilia | "todas")} aria-label="Filtrar por situação">
          <option value="todas">Todas as situações</option>
          {COLUNAS_QUADRO.map((s) => (<option key={s} value={s}>{rotuloSituacao[s]}</option>))}
        </select>
        <span className="adm-mudo">{lista.length} família(s) · {lista.reduce((s, f) => s + f.pessoas.length, 0)} pessoa(s)</span>
      </div>

      {visao === "tabela" ? (
        <div className="adm-tabela-caixa">
          <table className="adm-tabela">
            <thead>
              <tr><th>Responsável</th><th>Pessoas</th><th>Devido</th><th>Pago</th><th>Situação</th><th>Próximo vencimento</th></tr>
            </thead>
            <tbody>
              {lista.map((f) => (
                <tr key={f.familia.id} onClick={() => setAberta(f.familia.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setAberta(f.familia.id)}>
                  <td><strong>{f.familia.responsavel}</strong><span className="adm-mudo adm-bloco-sub">{f.familia.igreja}</span></td>
                  <td>{f.pessoas.length}</td>
                  <td>{reais(f.devido)}</td>
                  <td>{reais(f.pago)}</td>
                  <td><Selo situacao={f.situacao} />{f.atrasado > 0 && <span className="adm-selo adm-selo-vermelho">atraso</span>}</td>
                  <td className="adm-mudo">{f.proximoVencimento ? `${dm(f.proximoVencimento.data)} · ${reais(f.proximoVencimento.valor)}` : "—"}</td>
                </tr>
              ))}
              {lista.length === 0 && (<tr><td colSpan={6} className="adm-vazio">Nenhuma família encontrada.</td></tr>)}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="adm-quadro">
          {COLUNAS_QUADRO.map((s) => (
            <section key={s} className="adm-quadro-col" aria-label={rotuloSituacao[s]}>
              <h2>{rotuloSituacao[s]} <span className="adm-mudo">{lista.filter((f) => f.situacao === s).length}</span></h2>
              {lista.filter((f) => f.situacao === s).map((f) => (
                <button key={f.familia.id} className="adm-ficha" onClick={() => setAberta(f.familia.id)}>
                  <strong>{f.familia.responsavel}</strong>
                  <span className="adm-mudo">{f.pessoas.length} pessoa(s) · {reais(f.pago)} de {reais(f.devido)}</span>
                  {f.atrasado > 0 && <span className="adm-selo adm-selo-vermelho">atraso</span>}
                </button>
              ))}
            </section>
          ))}
        </div>
      )}

      {atual && <Ficha f={atual} fechar={() => setAberta(null)} lancar={lancar} exec={exec} hoje={hoje} base={base} />}
    </main>
  );
}

function Ficha({ f, fechar, lancar, exec, hoje, base }: { f: ResumoFamilia; fechar: () => void; lancar: (p: Omit<Pagamento, "id">) => void; exec: (g: Gravacao) => Promise<boolean>; hoje: string; base: Base }) {
  // recalcula com a base atual (após novos lançamentos)
  const atual = resumirFamilia(f.familia, base, hoje);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [fechar]);
  return (
    <>
      <div className="adm-fundo" onClick={fechar} aria-hidden />
      <aside className="adm-gaveta" role="dialog" aria-modal="true" aria-label={`Ficha de ${atual.familia.responsavel}`}>
        <header>
          <div>
            <h2>{atual.familia.responsavel}</h2>
            <p className="adm-mudo">{atual.familia.igreja} · {atual.familia.telefone}</p>
          </div>
          <button className="adm-icone" onClick={fechar} aria-label="Fechar"><X size={18} /></button>
        </header>
        <div className="adm-gaveta-resumo">
          <Selo situacao={atual.situacao} />
          <span>{reais(atual.pago)} pagos de {reais(atual.devido)}</span>
        </div>
        <h3>Pessoas</h3>
        <ul className="adm-lista adm-lista-simples">
          {atual.pessoas.map((p) => (
            <li key={p.id} className="adm-pessoa">
              <span>{p.nome} <span className="adm-mudo">· {p.idade} anos · {p.papel} · {p.transporte === "onibus" ? "ônibus" : "carro próprio"}</span></span>
              <span>{p.valor === 0 ? "Gratuito" : reais(p.valor)}</span>
              <Camiseta key={`${p.id}-${p.tamanho}-${p.modelo}`} p={p} exec={exec} />
            </li>
          ))}
        </ul>
        <h3>Pagamentos</h3>
        {atual.pagamentos.length === 0 && <p className="adm-vazio">Nenhum pagamento lançado.</p>}
        <ul className="adm-lista adm-lista-simples">
          {atual.pagamentos.map((p) => (
            <li key={p.id}><span>{dma(p.data)} · {p.forma}{p.obs ? ` · ${p.obs}` : ""}</span><span className={p.valor < 0 ? "tom-vermelho" : "tom-verde"}>{reais(p.valor)}</span></li>
          ))}
        </ul>
        {atual.parcelasAbertas.length > 0 && (
          <>
            <h3>Parcelas em aberto</h3>
            <ul className="adm-lista adm-lista-simples">
              {atual.parcelasAbertas.map((p) => (
                <li key={p.data}><span>{dma(p.data)}{p.data < hoje && <span className="adm-selo adm-selo-vermelho">vencida</span>}</span><span>{reais(p.valor)}</span></li>
              ))}
            </ul>
          </>
        )}
        <h3>Lançar pagamento</h3>
        <FormPagamento familias={[atual.familia]} fixa lancar={lancar} />
        <h3>Ajustes</h3>
        {base.ajustes.filter((a) => a.familiaId === atual.familia.id).length === 0 && <p className="adm-vazio">Nenhum ajuste.</p>}
        <ul className="adm-lista adm-lista-simples">
          {base.ajustes.filter((a) => a.familiaId === atual.familia.id).map((a) => (
            <li key={a.id}><span>{dma(a.data)} · {a.tipo} · {a.descricao}</span><span>{a.valor > 0 ? reais(a.valor) : ""}</span></li>
          ))}
        </ul>
        <FormAjuste familiaId={atual.familia.id} exec={exec} />
      </aside>
    </>
  );
}

function Camiseta({ p, exec }: { p: Base["pessoas"][number]; exec: (g: Gravacao) => Promise<boolean> }) {
  const [tamanho, setTamanho] = useState(p.tamanho ?? "");
  const [modelo, setModelo] = useState(p.modelo ?? "");
  const mudou = tamanho !== (p.tamanho ?? "") || modelo !== (p.modelo ?? "");
  return (
    <span className="adm-camiseta">
      <select value={modelo} onChange={(e) => setModelo(e.target.value)} aria-label={`Modelo da camiseta de ${p.nome}`}>
        <option value="">Modelo</option>{MODELOS.map((m) => (<option key={m}>{m}</option>))}
      </select>
      <select value={tamanho} onChange={(e) => setTamanho(e.target.value)} aria-label={`Tamanho da camiseta de ${p.nome}`}>
        <option value="">Tamanho</option>{TAMANHOS.map((t) => (<option key={t}>{t}</option>))}
      </select>
      {mudou && tamanho && (<button className="adm-btn adm-btn-fantasma" onClick={() => void exec({ tipo: "camiseta", pessoaId: p.id, tamanho, modelo })}>Salvar</button>)}
    </span>
  );
}

function FormAjuste({ familiaId, exec }: { familiaId: string; exec: (g: Gravacao) => Promise<boolean> }) {
  const [tipo, setTipo] = useState<TipoAjuste>("Observação");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const n = Number(valor.replace(",", "."));
  const comValor = tipo === "Desconto" || tipo === "Isenção";
  const valido = descricao.trim() && (!comValor || (Number.isFinite(n) && n > 0));
  return (
    <form className="adm-form" onSubmit={async (e) => {
      e.preventDefault();
      if (!valido) return;
      if (await exec({ tipo: "ajuste", familiaId, ajuste: tipo, descricao: descricao.trim(), valor: comValor ? n : 0 })) { setDescricao(""); setValor(""); }
    }}>
      <label>Tipo
        <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoAjuste)}>
          <option>Observação</option><option>Desconto</option><option>Isenção</option><option>Correção de dados</option>
        </select>
      </label>
      {comValor && <label>Valor (R$)<input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" /></label>}
      <label className="adm-form-largo">Descrição<input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: bolsa concedida pela liderança" /></label>
      <button className="adm-btn adm-btn-fantasma" disabled={!valido}>Registrar ajuste</button>
    </form>
  );
}

/* ───────────────────────────── Pagamentos ───────────────────────────── */

function FormPagamento({ familias, fixa, lancar }: { familias: { id: string; responsavel: string }[]; fixa?: boolean; lancar: (p: Omit<Pagamento, "id">) => void }) {
  const [familiaId, setFamiliaId] = useState(familias[0]?.id ?? "");
  const [valor, setValor] = useState("");
  const [forma, setForma] = useState<FormaPagamento>("Pix");
  const [data, setData] = useState(hojeISO());
  const [obs, setObs] = useState("");
  const n = Number(valor.replace(",", "."));
  const valido = familiaId && Number.isFinite(n) && n > 0;
  return (
    <form className="adm-form" onSubmit={(e) => {
      e.preventDefault();
      if (!valido) return;
      lancar({ familiaId, valor: n, forma, data, obs: obs.trim() || undefined });
      setValor(""); setObs("");
    }}>
      {!fixa && (
        <label>Família
          <select value={familiaId} onChange={(e) => setFamiliaId(e.target.value)}>
            {familias.map((f) => (<option key={f.id} value={f.id}>{f.responsavel}</option>))}
          </select>
        </label>
      )}
      <label>Valor (R$)<input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" /></label>
      <label>Forma
        <select value={forma} onChange={(e) => setForma(e.target.value as FormaPagamento)}>
          <option>Pix</option><option>Cartão</option><option>Dinheiro</option>
        </select>
      </label>
      <label>Data<input type="date" value={data} onChange={(e) => setData(e.target.value)} /></label>
      <label className="adm-form-largo">Observação<input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Opcional" /></label>
      <button className="adm-btn adm-btn-primario" disabled={!valido}>Lançar pagamento</button>
    </form>
  );
}

function Pagamentos({ base, resumo, lancar }: { base: Base; resumo: ReturnType<typeof resumirTudo>; lancar: (p: Omit<Pagamento, "id">) => void }) {
  const nome = (id: string) => base.familias.find((f) => f.id === id)?.responsavel ?? id;
  const ordenados = [...base.pagamentos].sort((a, b) => b.data.localeCompare(a.data));
  return (
    <main className="adm-pagina">
      <h1>Pagamentos</h1>
      <section className="adm-grade adm-grade-3">
        <Cartao rotulo="Recebido" valor={reais(resumo.recebido)} tom="verde" />
        <Cartao rotulo="A receber" valor={reais(resumo.aReceber)} tom="ambar" />
        <Cartao rotulo="Lançamentos" valor={String(base.pagamentos.length)} />
      </section>
      <section className="adm-bloco">
        <h2>Novo lançamento</h2>
        <FormPagamento familias={base.familias} lancar={lancar} />
      </section>
      <section className="adm-bloco">
        <h2>Histórico</h2>
        <p className="adm-sub">Pagamentos não são editados. Para corrigir um erro, lance um estorno.</p>
        <div className="adm-tabela-caixa">
          <table className="adm-tabela">
            <thead><tr><th>Data</th><th>Família</th><th>Forma</th><th>Valor</th><th></th></tr></thead>
            <tbody>
              {ordenados.map((p) => (
                <tr key={p.id}>
                  <td>{dma(p.data)}</td><td>{nome(p.familiaId)}{p.obs && <span className="adm-mudo adm-bloco-sub">{p.obs}</span>}</td><td>{p.forma}</td>
                  <td className={p.valor < 0 ? "tom-vermelho" : "tom-verde"}>{reais(p.valor)}</td>
                  <td>{p.valor > 0 && (<button className="adm-btn adm-btn-fantasma" onClick={() => lancar({ familiaId: p.familiaId, valor: -p.valor, forma: p.forma, data: hojeISO(), obs: `Estorno de ${dma(p.data)}` })}>Estornar</button>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

/* ───────────────────────────── Despesas ───────────────────────────── */

function Despesas({ base, exec }: { base: Base; exec: (g: Gravacao) => Promise<boolean> }) {
  const [categoria, setCategoria] = useState<CategoriaDespesa>(CATEGORIAS[0]);
  const [fornecedor, setFornecedor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [orcado, setOrcado] = useState("");
  const n = Number(orcado.replace(",", "."));
  const valido = fornecedor.trim() && Number.isFinite(n) && n > 0;
  const total = (c: CategoriaDespesa) => base.despesas.filter((d) => d.categoria === c);
  const mudarStatus = (id: string, status: StatusDespesa) => void exec({ tipo: "despesa-status", id, status });
  return (
    <main className="adm-pagina">
      <h1>Despesas</h1>
      <section className="adm-bloco">
        <h2>Nova despesa</h2>
        <form className="adm-form" onSubmit={async (e) => {
          e.preventDefault();
          if (!valido) return;
          if (await exec({ tipo: "despesa", categoria, fornecedor: fornecedor.trim(), descricao: descricao.trim(), orcado: n })) { setFornecedor(""); setDescricao(""); setOrcado(""); }
        }}>
          <label>Categoria
            <select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaDespesa)}>
              {CATEGORIAS.map((c) => (<option key={c}>{c}</option>))}
            </select>
          </label>
          <label>Fornecedor<input value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} /></label>
          <label>Valor orçado (R$)<input inputMode="decimal" value={orcado} onChange={(e) => setOrcado(e.target.value)} placeholder="0,00" /></label>
          <label className="adm-form-largo">Descrição<input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Opcional" /></label>
          <button className="adm-btn adm-btn-primario" disabled={!valido}>Lançar despesa</button>
        </form>
      </section>
      {CATEGORIAS.map((c) => (
        <section className="adm-bloco" key={c}>
          <h2>{c} <span className="adm-mudo">{reais(total(c).reduce((s, d) => s + d.orcado, 0))} orçados</span></h2>
          {total(c).length === 0 && <p className="adm-vazio">Sem despesas nesta categoria.</p>}
          <div className="adm-tabela-caixa">
            <table className="adm-tabela">
              <tbody>
                {total(c).map((d) => (
                  <tr key={d.id}>
                    <td><strong>{d.fornecedor}</strong><span className="adm-mudo adm-bloco-sub">{d.descricao}</span></td>
                    <td>{reais(d.orcado)}</td>
                    <td className="tom-vermelho">{reais(d.pago)}</td>
                    <td><span className={`adm-selo adm-selo-${d.status === "Pago" ? "verde" : d.status === "Aprovado" ? "azul" : "neutro"}`}>{d.status}</span></td>
                    <td>
                      {d.status === "Orçado" && <button className="adm-btn adm-btn-fantasma" onClick={() => mudarStatus(d.id, "Aprovado")}>Aprovar</button>}
                      {d.status !== "Pago" && <button className="adm-btn adm-btn-fantasma" onClick={() => mudarStatus(d.id, "Pago")}>Marcar pago</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </main>
  );
}

/* ───────────────────────────── Doações ───────────────────────────── */

function Doacoes({ base, exec }: { base: Base; exec: (g: Gravacao) => Promise<boolean> }) {
  const [doador, setDoador] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState<Doacao["tipo"]>("Avulsa");
  const [obs, setObs] = useState("");
  const n = Number(valor.replace(",", "."));
  const valido = doador.trim() && Number.isFinite(n) && n > 0;
  const total = base.doacoes.reduce((s, d) => s + d.valor, 0);
  return (
    <main className="adm-pagina">
      <h1>Doações e apadrinhamento</h1>
      <section className="adm-grade adm-grade-3"><Cartao rotulo="Total arrecadado" valor={reais(total)} tom="verde" /></section>
      <section className="adm-bloco">
        <h2>Nova doação</h2>
        <form className="adm-form" onSubmit={async (e) => {
          e.preventDefault();
          if (!valido) return;
          if (await exec({ tipo: "doacao", doador: doador.trim(), valor: n, modo: tipo, obs: obs.trim() || undefined })) { setDoador(""); setValor(""); setObs(""); }
        }}>
          <label>Doador<input value={doador} onChange={(e) => setDoador(e.target.value)} /></label>
          <label>Valor (R$)<input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" /></label>
          <label>Tipo
            <select value={tipo} onChange={(e) => setTipo(e.target.value as Doacao["tipo"])}>
              <option>Avulsa</option><option>Apadrinhamento de vaga</option>
            </select>
          </label>
          <label className="adm-form-largo">Observação<input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Opcional" /></label>
          <button className="adm-btn adm-btn-primario" disabled={!valido}>Registrar</button>
        </form>
      </section>
      <section className="adm-bloco">
        <h2>Registradas</h2>
        <ul className="adm-lista adm-lista-simples">
          {base.doacoes.map((d) => (
            <li key={d.id}><span>{dma(d.data)} · <strong>{d.doador}</strong> <span className="adm-mudo">· {d.tipo}{d.obs ? ` · ${d.obs}` : ""}</span></span><span className="tom-verde">{reais(d.valor)}</span></li>
          ))}
        </ul>
      </section>
    </main>
  );
}

/* ───────────────────────────── Relatórios ───────────────────────────── */

function Relatorios({ base, resumo }: { base: Base; resumo: ReturnType<typeof resumirTudo> }) {
  const t = resumoTransporte(base);
  const c = resumoCamisetas(base);
  const baixar = () => {
    const blob = new Blob([csvInscritos(base, resumo)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `inscritos-retiro-2027-${hojeISO()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <main className="adm-pagina">
      <h1>Relatórios</h1>
      <section className="adm-grade adm-grade-3">
        <Cartao rotulo="Pessoas inscritas" valor={String(resumo.totalPessoas)} nota={`${resumo.pessoasPagantes} pagantes · ${resumo.gratuitas} gratuitas`} />
        <Cartao rotulo="Vão de ônibus" valor={String(t.onibus)} />
        <Cartao rotulo="Carro próprio" valor={String(t.proprio)} />
      </section>
      <section className="adm-bloco">
        <h2>Camisetas</h2>
        {c.itens.length === 0 && <p className="adm-vazio">Nenhum tamanho registrado ainda. Registre na ficha de cada família.</p>}
        <ul className="adm-lista adm-lista-simples">
          {c.itens.map(([k, n]) => (<li key={k}><span>{k}</span><span>{n}</span></li>))}
          <li><span className="adm-mudo">Sem tamanho informado</span><span>{c.semTamanho}</span></li>
        </ul>
      </section>
      <section className="adm-bloco">
        <h2>Lista completa</h2>
        <p className="adm-sub">Todas as pessoas com situação de pagamento, transporte e camiseta, para abrir no Excel ou Planilhas.</p>
        <button className="adm-btn adm-btn-primario" onClick={baixar}>Baixar lista (CSV)</button>
      </section>
    </main>
  );
}
