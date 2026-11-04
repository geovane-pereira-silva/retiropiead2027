import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction, type FormEvent } from "react";
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

import { carregarAdm, carregarPreviewAdm, entrarAdm, estadoAdm, gravarAdm, sairAdm } from "../api/adm.functions";
import type { EstadoAdm } from "../api/adm.functions";
import type { Gravacao } from "../api/adm.server";
import { fluxoPrevisto, resumirFamilia, resumirTudo, rotuloSituacao } from "./calculos";
import type { ResumoFamilia } from "./calculos";
import { criarDemo } from "./demo";
import { aplicarLocal } from "./local";
import { csvInscritos, MODELOS, resumoCamisetas, resumoTransporte, TAMANHOS_POR_MODELO } from "./relatorios";
import { CATEGORIAS } from "./tipos";
import { hojeLocalISO, lerDinheiro, normalizarBusca, ordenarPor, type DirecaoOrdenacao } from "./utilitarios";
import type {
  Base,
  CategoriaDespesa,
  ClassificacaoParticipante,
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
const hojeISO = () => hojeLocalISO();
const novoId = (p: string) => `${p}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e3)}`;

type Tela = "painel" | "inscritos" | "pagamentos" | "despesas" | "doacoes" | "fluxo" | "relatorios" | "usuarios" | "logs";
const TELAS: { id: Tela; rotulo: string; icone: typeof Users }[] = [
  { id: "painel", rotulo: "Painel", icone: LayoutDashboard },
  { id: "inscritos", rotulo: "Cadastros", icone: Users },
  { id: "pagamentos", rotulo: "Recebimentos", icone: BadgeDollarSign },
  { id: "despesas", rotulo: "Despesas", icone: Receipt },
  { id: "doacoes", rotulo: "Doações", icone: Gift },
  { id: "fluxo", rotulo: "Fluxo financeiro", icone: Receipt },
  { id: "relatorios", rotulo: "Relatórios", icone: FileText },
  { id: "usuarios", rotulo: "Usuários", icone: Users },
  { id: "logs", rotulo: "Logs", icone: FileText },
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
              <strong>Prévia do sistema.</strong> O painel usa uma cópia protegida das planilhas para esta prévia. Nada é gravado na planilha.
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
  const [base, setBase] = useState<Base | null>(null);
  const [tela, setTela] = useState<Tela>("painel");
  const [aberta, setAberta] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ tom: "ok" | "erro"; texto: string } | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [paleta, setPaleta] = useState(false);
  const [faixaVisivel, setFaixaVisivel] = useState(true);
  const [logs, setLogs] = useState<LogAdm[]>([]);
  const [categoriasExtras, setCategoriasExtras] = useState<string[]>([]);
  const [caixas, setCaixas] = useState<CaixaAdm[]>(CAIXAS_INICIAIS);
  const [filtroDataPainel, setFiltroDataPainel] = useState<string | null>(null);
  const gravacaoEmAndamento = useRef(false);
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
    if (real) {
      void recarregar();
      return;
    }
    let ativo = true;
    setCarregando(true);
    carregarPreviewAdm()
      .then((r) => { if (ativo && r.ok) setBase(r.dados); })
      .catch(() => undefined)
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
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
    if (gravacaoEmAndamento.current) return false;
    gravacaoEmAndamento.current = true;
    try {
      if (!real) {
        setBase((b) => (b ? aplicarLocal(b, g, hoje, novoId("L")) : b));
        setLogs((items) => [{ id: novoId("LOG"), quando: new Date().toISOString(), usuario: nome, acao: "Lançamento de " + g.tipo, detalhe: "Alteração demonstrativa nesta sessão." }, ...items]);
        setAviso({ tom: "ok", texto: "Simulação registrada nesta sessão; a planilha original não foi alterada." });
        return true;
      }
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
    } finally {
      gravacaoEmAndamento.current = false;
    }
  };

  const resumo = useMemo(() => (base ? resumirTudo(base, hoje) : null), [base, hoje]);
  const lancarPagamento = (p: Omit<Pagamento, "id">) =>
    exec({ tipo: "pagamento", familiaId: p.familiaId, valor: p.valor, forma: p.forma, data: p.data, obs: p.obs });

  return (
    <div className="adm adm-app">
      <aside className="adm-lateral" aria-label="Menu">
        <div className="adm-logo adm-brand"><img src="/adm/logo-conexao-jovem-branca.png" alt="Conexão Jovem" /><span>Gestão<br />Retiro 2027</span></div>
        <nav>
          {TELAS.filter((t) => t.id !== "logs" || !real).map((t) => (
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
        {!real && faixaVisivel && <div className="adm-faixa" role="status"><span>Cópia das planilhas para avaliação — nenhum lançamento altera os dados originais.</span><button type="button" className="adm-faixa-fechar" aria-label="Fechar aviso" onClick={() => setFaixaVisivel(false)}><X size={16} aria-hidden /></button></div>}
        {aviso && <div className={`adm-toast adm-toast-${aviso.tom}`} role="status">{aviso.texto}</div>}
        {(!base || !resumo) && <main className="adm-pagina"><p className="adm-sub">{carregando ? "Carregando a planilha…" : "Sem dados."}</p></main>}
        {base && resumo && (
          <>
            {tela === "painel" && <Painel resumo={resumo} hoje={hoje} abrir={(id) => { setTela("inscritos"); setAberta(id); }} navegar={setTela} abrirData={(data) => { setFiltroDataPainel(data); setTela("pagamentos"); }} />}
            {tela === "inscritos" && <Inscritos resumo={resumo} aberta={aberta} setAberta={setAberta} hoje={hoje} base={base} lancar={lancarPagamento} exec={exec} irParaPagamentos={() => setTela("pagamentos")} />}
            {tela === "pagamentos" && <Pagamentos base={base} resumo={resumo} lancar={lancarPagamento} abrirFamilia={(id) => { setTela("inscritos"); setAberta(id); }} dataFiltro={filtroDataPainel} />}
            {tela === "despesas" && <Despesas base={base} exec={exec} categoriasExtras={categoriasExtras} onAdicionarCategoria={(nomeCategoria) => { setCategoriasExtras((lista) => lista.includes(nomeCategoria) ? lista : [...lista, nomeCategoria]); setLogs((items) => [{ id: novoId("LOG"), quando: new Date().toISOString(), usuario: nome, acao: "Nova categoria de despesa", detalhe: nomeCategoria }, ...items]); }} />}
            {tela === "doacoes" && <Doacoes base={base} exec={exec} />}
            {tela === "fluxo" && <FluxoFinanceiro base={base} resumo={resumo} caixas={caixas} setCaixas={setCaixas} irPara={(destino) => setTela(destino)} registrarLog={(acao, detalhe) => setLogs((items) => [{ id: novoId("LOG"), quando: new Date().toISOString(), usuario: nome, acao, detalhe }, ...items])} />}\n            {tela === "relatorios" && <Relatorios base={base} resumo={resumo} navegar={(destino) => setTela(destino)} />}\n            {tela === "logs" && <Logs registros={logs} administradorDemo={!real} />}
            {tela === "usuarios" && <Usuarios />}
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

function Painel({ resumo, hoje, abrir, navegar, abrirData }: { resumo: ReturnType<typeof resumirTudo>; hoje: string; abrir: (id: string) => void; navegar: (tela: Tela) => void; abrirData: (data: string) => void }) {
  const fluxo = fluxoPrevisto(resumo, hoje);
  const maximo = Math.max(1, ...fluxo.map((f) => f.valor));
  const proximos = resumo.familias
    .filter((f) => f.proximoVencimento && f.atrasado === 0)
    .sort((a, b) => a.proximoVencimento!.data.localeCompare(b.proximoVencimento!.data))
    .slice(0, 5);
  const falta = resumo.pontoEquilibrio === null ? null : Math.max(0, resumo.pontoEquilibrio - resumo.pessoasPagantes);
  return (
    <main className="adm-pagina">
      <header className="adm-cabecalho">
        <div>
          <p className="adm-eyebrow">CENTRAL FINANCEIRA <span aria-hidden="true">·</span> RETIRO 2027</p>
          <h1>Visão geral</h1>
          <p className="adm-cabecalho-sub">Inscrições, recebimentos e custos em uma visão clara.</p>
        </div>
        <div className="adm-cabecalho-acoes">
          <span className="adm-data-chip">Atualizado em {dma(hoje)}</span>
          <button className="adm-btn adm-btn-secundario" onClick={() => navegar("despesas")}><Receipt size={16} aria-hidden /> Nova despesa</button>
          <button className="adm-btn adm-btn-primario" onClick={() => navegar("pagamentos")}><BadgeDollarSign size={17} aria-hidden /> Lançar recebimento</button>
        </div>
      </header>
      <section className="adm-grade" aria-label="Resumo financeiro">
        <Cartao rotulo="Recebido" valor={reais(resumo.recebido)} tom="verde" nota={`de ${reais(resumo.devido)} previstos`} />
        <Cartao rotulo="A receber" valor={reais(resumo.aReceber)} tom="ambar" nota={`${resumo.atrasadas.length} família(s) em atraso`} />
        <Cartao rotulo="Despesas pagas" valor={reais(resumo.despesasPagas)} tom="vermelho" nota={`orçado ${reais(resumo.orcado)}`} />
        <Cartao rotulo="Saldo atual" valor={reais(resumo.saldoAtual)} nota={`projetado ${reais(resumo.saldoProjetado)}`} />
      </section>

      <section className="adm-bloco" aria-label="Ponto de equilíbrio">
        <h2>Ponto de equilíbrio</h2>
        {falta === null
          ? <p className="adm-sub">A estimativa aparecerá após o primeiro participante pagante. Assim evitamos projetar uma média sem dados.</p>
          : <>
              <p className="adm-sub">{resumo.pessoasPagantes} pessoas pagantes inscritas · estimativa de {resumo.pontoEquilibrio} para cobrir o orçamento ({reais(resumo.ticketMedio)} em média por pessoa). {falta > 0 ? `Faltam ${falta}.` : "Meta atingida."}</p>
              <div className="adm-barra" role="progressbar" aria-label="Progresso do ponto de equilíbrio" aria-valuemin={0} aria-valuemax={resumo.pontoEquilibrio} aria-valuenow={Math.min(resumo.pessoasPagantes, resumo.pontoEquilibrio)}>
                <span style={{ width: `${Math.min(100, (resumo.pessoasPagantes / Math.max(1, resumo.pontoEquilibrio)) * 100)}%` }} />
              </div>
            </>}
      </section>

      <div className="adm-duas">
        <section className="adm-bloco" aria-label="Entradas previstas">
          <h2>Entradas previstas por vencimento</h2><p className="adm-grafico-hint">Selecione uma coluna para abrir os lançamentos desse vencimento.</p>
          <p className="adm-sub">Alertas e previsão de vencimentos consideram o calendário Pix. Cartão e dinheiro entram no saldo conforme os recebimentos são registrados.</p>
          <ul className="adm-colunas">
            {fluxo.map((f) => (
              <li key={f.data} className={f.vencido ? "vencido" : ""}>
                <button className="adm-coluna-link" type="button" onClick={() => abrirData(f.data)} aria-label={`Ver recebimentos de ${dma(f.data)}: ${reais(f.valor)}`}>
                  <span className="adm-coluna-valor">{reais(f.valor)}</span>
                  <span className="adm-coluna-barra" style={{ height: `${Math.max(4, (f.valor / maximo) * 100)}%` }} />
                  <span className="adm-coluna-rotulo">{dm(f.data)}</span>
                </button>
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
const CLASSIFICACOES: ClassificacaoParticipante[] = ["Organizador (paga meia)", "Apoio (não pagante)", "Não pagante (0–4 anos)", "Participante inteira", "Participante meia", "Visitante"];

function Inscritos({
  resumo, aberta, setAberta, hoje, base, lancar, exec, irParaPagamentos,
}: {
  resumo: ReturnType<typeof resumirTudo>;
  aberta: string | null;
  setAberta: (id: string | null) => void;
  hoje: string;
  base: Base;
  lancar: (p: Omit<Pagamento, "id">) => Promise<boolean>;
  exec: (g: Gravacao) => Promise<boolean>;
  irParaPagamentos: () => void;
}) {
  const [visao, setVisao] = useState<"tabela" | "quadro">("tabela");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<SituacaoFamilia | "todas">("todas");
  const [classificacao, setClassificacao] = useState<ClassificacaoParticipante | "todas">("todas");
  const [transporte, setTransporte] = useState<"todos" | "onibus" | "proprio" | "nao-informado">("todos");
  const [ordenacao, setOrdenacao] = useState("nome");
  const [direcao, setDirecao] = useState<DirecaoOrdenacao>("asc");

  const filtradas = resumo.familias.filter((f) => {
    const alvo = `${f.familia.responsavel} ${f.familia.igreja} ${f.pessoas.map((p) => p.nome).join(" ")}`.toLowerCase();
    return normalizarBusca(alvo).includes(normalizarBusca(busca))
      && (filtro === "todas" || f.situacao === filtro)
      && (classificacao === "todas" || f.pessoas.some((p) => p.classificacao === classificacao))
      && (transporte === "todos" || f.pessoas.some((p) => p.transporte === transporte));
  });
  const lista = ordenarPor(filtradas, (f) => {
    switch (ordenacao) {
      case "pessoas": return f.pessoas.length;
      case "devido": return f.devido;
      case "pago": return f.pago;
      case "vencimento": return f.proximoVencimento?.data ?? "9999-12-31";
      case "situacao": return rotuloSituacao[f.situacao];
      default: return f.familia.responsavel;
    }
  }, direcao);
  const atual = aberta ? resumo.familias.find((f) => f.familia.id === aberta) : undefined;

  return (
    <main className="adm-pagina">
      <div className="adm-topo adm-topo-inscritos">
        <h1>Inscritos</h1>
        <button className="adm-btn adm-btn-primario" type="button" onClick={irParaPagamentos}><BadgeDollarSign size={17} aria-hidden /> Lançar recebimento</button>
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
          {(["pre", ...COLUNAS_QUADRO] as SituacaoFamilia[]).map((s) => (<option key={s} value={s}>{rotuloSituacao[s]}</option>))}
        </select>
        <select value={classificacao} onChange={(e) => setClassificacao(e.target.value as ClassificacaoParticipante | "todas")} aria-label="Filtrar por classificação">
          <option value="todas">Todas as categorias</option>{CLASSIFICACOES.map((x) => <option key={x}>{x}</option>)}
        </select>
        <select value={transporte} onChange={(e) => setTransporte(e.target.value as typeof transporte)} aria-label="Filtrar por transporte">
          <option value="todos">Todos os transportes</option><option value="onibus">Ônibus</option><option value="proprio">Carro próprio</option><option value="nao-informado">Não informado</option>
        </select>
        <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)} aria-label="Ordenar inscritos por">
          <option value="nome">Ordenar: nome</option><option value="pessoas">Número de pessoas</option><option value="devido">Valor devido</option><option value="pago">Valor pago</option><option value="situacao">Situação</option><option value="vencimento">Próximo vencimento</option>
        </select>
        <button className="adm-btn adm-btn-fantasma" onClick={() => setDirecao((d) => d === "asc" ? "desc" : "asc")} aria-label={`Ordem ${direcao === "asc" ? "crescente" : "decrescente"}`} title="Inverter ordem">{direcao === "asc" ? "↑ Crescente" : "↓ Decrescente"}</button>
        {(busca || filtro !== "todas" || classificacao !== "todas" || transporte !== "todos") && <button className="adm-btn adm-btn-fantasma" onClick={() => { setBusca(""); setFiltro("todas"); setClassificacao("todas"); setTransporte("todos"); }}>Limpar filtros</button>}
        <span className="adm-mudo">{lista.length} família(s) · {lista.reduce((s, f) => s + f.pessoas.length, 0)} pessoa(s)</span>
      </div>

      {visao === "tabela" ? (
        <div className="adm-tabela-caixa">
          <table className="adm-tabela adm-tabela-inscritos">
            <thead>
              <tr><th>Responsável</th><th>Pessoas</th><th>Devido</th><th>Pago</th><th>Situação</th><th>Próximo vencimento</th><th>Cadastro</th></tr>
            </thead>
            <tbody>
              {lista.map((f) => (
                <tr key={f.familia.id} onClick={() => setAberta(f.familia.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setAberta(f.familia.id)}>
                  <td className="adm-td-nome" data-label="Responsável"><strong>{f.familia.responsavel}</strong><span className="adm-mudo adm-bloco-sub">{f.familia.igreja}</span></td>
                  <td data-label="Pessoas">{f.pessoas.length}</td>
                  <td data-label="Devido">{reais(f.devido)}</td>
                  <td data-label="Pago">{reais(f.pago)}</td>
                  <td data-label="Situação"><Selo situacao={f.situacao} />{f.atrasado > 0 && <span className="adm-selo adm-selo-vermelho">atraso</span>}</td>
                  <td className="adm-mudo" data-label="Próximo vencimento">{f.proximoVencimento ? `${dm(f.proximoVencimento.data)} · ${reais(f.proximoVencimento.valor)}` : "—"}</td>
                  <td data-label="Cadastro"><button className="adm-btn adm-btn-fantasma adm-abrir-cadastro" onClick={(e) => { e.stopPropagation(); setAberta(f.familia.id); }}>Abrir cadastro <span aria-hidden="true">↗</span></button></td>
                </tr>
              ))}
              {lista.length === 0 && (<tr><td colSpan={7} className="adm-vazio">Nenhuma família encontrada.</td></tr>)}
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

function Ficha({ f, fechar, lancar, exec, hoje, base }: { f: ResumoFamilia; fechar: () => void; lancar: (p: Omit<Pagamento, "id">) => Promise<boolean>; exec: (g: Gravacao) => Promise<boolean>; hoje: string; base: Base }) {
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
              <span>{p.nome} <span className="adm-mudo">· {p.idade === null ? "idade não informada" : `${p.idade} anos`} · {p.classificacao} · {p.transporte === "onibus" ? "ônibus" : p.transporte === "proprio" ? "carro próprio" : "transporte não informado"}</span></span>
              <span>{p.valorInformado === false ? <span className="adm-selo adm-selo-ambar">A confirmar</span> : p.valor === 0 ? "Gratuito" : reais(p.valor)}</span>
              <Camiseta key={`${p.id}-${p.tamanho}-${p.modelo}`} p={p} exec={exec} />
            </li>
          ))}
        </ul>
        <h3>Recebimentos</h3>
        {atual.pagamentos.length === 0 && <p className="adm-vazio">Nenhum recebimento lançado.</p>}
        <ul className="adm-lista adm-lista-simples">
          {atual.pagamentos.map((p) => (
            <li key={p.id}><span>{dma(p.data)} · {p.forma}{p.obs ? ` · ${p.obs}` : ""}{p.forma === "Cartão" && p.valor >= 0 && <span className="adm-mudo adm-bloco-sub">Cobrado {reais(p.valorBruto ?? p.valor)} · taxa {reais(p.taxaCartao ?? 0)} · líquido {reais(p.valorLiquido ?? p.valor)}</span>}</span><span className={p.valor < 0 ? "tom-vermelho" : "tom-verde"}>{reais(p.valorLiquido ?? p.valor)}</span></li>
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
        <h3>Recebimentos e histórico</h3>
        <FormPagamento familias={[atual.familia]} fixa lancar={lancar} estornoPermitido limiteEstorno={() => Math.max(0, atual.pago)} sugestao={() => Math.max(0, atual.devido)} />
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
  const [modelo, setModelo] = useState(p.modelo ?? "");
  const tamanhos: readonly string[] = modelo ? TAMANHOS_POR_MODELO[modelo as keyof typeof TAMANHOS_POR_MODELO] ?? [] : Object.values(TAMANHOS_POR_MODELO).flat();
  const existenteEhEspecial = !!p.tamanho && !tamanhos.includes(p.tamanho);
  const [tamanho, setTamanho] = useState(existenteEhEspecial ? "Medida especial" : p.tamanho ?? "");
  const [medida, setMedida] = useState(existenteEhEspecial ? p.tamanho ?? "" : "");
  const valorFinal = tamanho === "Medida especial" ? medida.trim() : tamanho;
  const mudou = valorFinal !== (p.tamanho ?? "") || modelo !== (p.modelo ?? "");
  return (
    <span className="adm-camiseta">
      <select value={modelo} onChange={(e) => {
        const novoModelo = e.target.value;
        const permitidos: readonly string[] = novoModelo ? TAMANHOS_POR_MODELO[novoModelo as keyof typeof TAMANHOS_POR_MODELO] ?? [] : Object.values(TAMANHOS_POR_MODELO).flat();
        if (tamanho && !permitidos.includes(tamanho)) { setTamanho(""); setMedida(""); }
        setModelo(novoModelo);
      }} aria-label={`Modelo da camiseta de ${p.nome}`}>
        <option value="">Modelo</option>{MODELOS.map((m) => (<option key={m}>{m}</option>))}
      </select>
      <select value={tamanho} onChange={(e) => setTamanho(e.target.value)} aria-label={`Tamanho da camiseta de ${p.nome}`}>
        <option value="">Tamanho</option>{tamanhos.map((t) => (<option key={t}>{t}</option>))}
      </select>
      {tamanho === "Medida especial" && <input className="adm-camiseta-medida" value={medida} onChange={(e) => setMedida(e.target.value)} maxLength={80} placeholder="Descreva a medida" aria-label={`Medida especial da camiseta de ${p.nome}`} />}
      {mudou && valorFinal && modelo && (<button className="adm-btn adm-btn-fantasma" onClick={() => void exec({ tipo: "camiseta", pessoaId: p.id, tamanho: valorFinal, modelo })}>Salvar</button>)}
    </span>
  );
}

function FormAjuste({ familiaId, exec }: { familiaId: string; exec: (g: Gravacao) => Promise<boolean> }) {
  const [tipo, setTipo] = useState<TipoAjuste>("Observação");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const n = lerDinheiro(valor);
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

function FormPagamento({ familias, fixa, lancar, limiteEstorno, estornoPermitido = false, sugestao }: { familias: { id: string; responsavel: string }[]; fixa?: boolean; lancar: (p: Omit<Pagamento, "id">) => Promise<boolean>; limiteEstorno?: (familiaId: string) => number; estornoPermitido?: boolean; sugestao?: (familiaId: string) => number }) {
  const [familiaId, setFamiliaId] = useState(familias[0]?.id ?? "");
  const [valor, setValor] = useState("");
  const [valorLiquido, setValorLiquido] = useState("");
  const [buscaFamilia, setBuscaFamilia] = useState("");
  const [forma, setForma] = useState<FormaPagamento>("Pix");
  const [data, setData] = useState(hojeISO());
  const [obs, setObs] = useState("");
  const [salvando, setSalvando] = useState(false);
  const n = lerDinheiro(valor);
  const liquidoCartao = lerDinheiro(valorLiquido);
  const taxaCartao = Number((n - liquidoCartao).toFixed(2));
  const familiasOrdenadas = useMemo(() => [...familias].sort((a, b) => a.responsavel.localeCompare(b.responsavel, "pt-BR")), [familias]);
  const familiasFiltradas = familiasOrdenadas.filter((f) => normalizarBusca(f.responsavel).includes(normalizarBusca(buscaFamilia)));
  const maximoEstorno = limiteEstorno?.(familiaId) ?? 0;
  const estorno = n < 0;
  const cartaoValido = forma !== "Cartão" || estorno || (Number.isFinite(liquidoCartao) && liquidoCartao > 0 && liquidoCartao <= n);
  const valido = familiaId && Number.isFinite(n) && n !== 0 && cartaoValido && (!estorno || (estornoPermitido && Math.abs(n) <= maximoEstorno));
  return (
    <form className="adm-form" onSubmit={async (e) => {
      e.preventDefault();
      if (!valido || salvando) return;
      if (n < 0 && !window.confirm(`Confirmar estorno de ${reais(Math.abs(n))}? O valor será abatido do total recebido desta família.`)) return;
      setSalvando(true);
      try {
        const liquido = forma === "Cartão" && !estorno ? liquidoCartao : n;
        const bruto = n;
        const taxa = forma === "Cartão" && !estorno ? taxaCartao : 0;
        const ok = await lancar({ familiaId, valor: liquido, valorBruto: bruto, taxaCartao: taxa, valorLiquido: liquido, forma, data, obs: obs.trim() || undefined });
        if (ok) { setValor(""); setValorLiquido(""); setObs(""); }
      } finally {
        setSalvando(false);
      }
    }}>
      {!fixa && (
        <>
          <label>Buscar família<input type="search" value={buscaFamilia} onChange={(e) => setBuscaFamilia(e.target.value)} placeholder="Digite um nome" /></label>
          <label>Família
            <select value={familiaId} onChange={(e) => setFamiliaId(e.target.value)}>
              {familiasFiltradas.map((f) => (<option key={f.id} value={f.id}>{f.responsavel}</option>))}
            </select>
          </label>
        </>
      )}
      <label>{forma === "Cartão" && !estorno ? "Valor cobrado (R$)" : "Valor (R$)"}<input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" /></label>
      {forma !== "Cartão" && !estorno && (sugestao?.(familiaId) ?? 0) > 0 && <button type="button" className="adm-btn adm-btn-fantasma adm-pagamento-rapido" onClick={() => setValor((sugestao?.(familiaId) ?? 0).toFixed(2).replace(".", ","))}>Preencher saldo em aberto · {reais(sugestao?.(familiaId) ?? 0)}</button>}
      {forma === "Cartão" && !estorno && <label>Valor líquido recebido (R$)<input inputMode="decimal" value={valorLiquido} onChange={(e) => setValorLiquido(e.target.value)} placeholder="Após as taxas" /></label>}
      <label>Forma
        <select value={forma} onChange={(e) => setForma(e.target.value as FormaPagamento)}>
          <option>Pix</option><option>Cartão</option><option>Dinheiro</option>
        </select>
      </label>
      <label>Data<input type="date" value={data} onChange={(e) => setData(e.target.value)} required /></label>
      <label className="adm-form-largo">Observação<input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Opcional" /></label>
      {forma === "Cartão" && !estorno && n > 0 && liquidoCartao > 0 && <p className="adm-mudo adm-form-largo">Taxa descontada: <strong>{reais(Math.max(0, taxaCartao))}</strong> · Líquido no caixa: <strong>{reais(liquidoCartao)}</strong>.</p>}
      {estorno && <p className="adm-mudo adm-form-largo">Disponível para estorno: {reais(maximoEstorno)}.</p>}
      <button className="adm-btn adm-btn-primario" disabled={!valido || salvando}>{salvando ? "Salvando…" : n < 0 ? "Registrar estorno" : "Registrar recebimento"}</button>
    </form>
  );
}

function Pagamentos({ base, resumo, lancar, abrirFamilia, dataFiltro }: { base: Base; resumo: ReturnType<typeof resumirTudo>; lancar: (p: Omit<Pagamento, "id">) => Promise<boolean>; abrirFamilia: (id: string) => void; dataFiltro: string | null }) {
  const nome = (id: string) => base.familias.find((f) => f.id === id)?.responsavel ?? id;
  const [busca, setBusca] = useState("");
  const [forma, setForma] = useState<"todas" | FormaPagamento>("todas");
  const [tipo, setTipo] = useState<"todos" | "entrada" | "estorno">("todos");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [ordenacao, setOrdenacao] = useState("data");
  const [direcao, setDirecao] = useState<DirecaoOrdenacao>("desc");
  useEffect(() => { if (dataFiltro) { setDe(dataFiltro); setAte(dataFiltro); } }, [dataFiltro]);
  const filtrados = base.pagamentos.filter((p) => {
    const texto = `${nome(p.familiaId)} ${p.forma} ${p.obs ?? ""}`;
    return normalizarBusca(texto).includes(normalizarBusca(busca))
      && (forma === "todas" || p.forma === forma)
      && (tipo === "todos" || (tipo === "entrada" ? p.valor > 0 : p.valor < 0))
      && (!de || p.data >= de) && (!ate || p.data <= ate);
  });
  const ordenados = ordenarPor(filtrados, (p) => {
    switch (ordenacao) {
      case "familia": return nome(p.familiaId);
      case "forma": return p.forma;
      case "valor": return p.valor;
      default: return p.data;
    }
  }, direcao);
  return (
    <main className="adm-pagina">
      <h1>Recebimentos</h1>
      <section className="adm-grade adm-grade-3">
        <Cartao rotulo="Recebido" valor={reais(resumo.recebido)} tom="verde" />
        <Cartao rotulo="A receber" valor={reais(resumo.aReceber)} tom="ambar" />
        <Cartao rotulo="Lançamentos" valor={String(base.pagamentos.length)} />
      </section>
      <section className="adm-bloco adm-pagamento-sticky">
        <div className="adm-topo adm-pagamento-cab"><div><p className="adm-eyebrow">RECEBIMENTOS</p><h2>Registrar recebimento do inscrito</h2><p className="adm-sub">Escolha o cadastro principal e registre o valor recebido.</p></div><span className="adm-pagamento-selo">Histórico da pessoa no cadastro</span></div>
        <FormPagamento familias={base.familias} lancar={lancar} limiteEstorno={(id) => Math.max(0, resumo.familias.find((f) => f.familia.id === id)?.pago ?? 0)} sugestao={(id) => Math.max(0, resumo.familias.find((f) => f.familia.id === id)?.devido ?? 0)} />
      </section>
      <section className="adm-bloco">
        <h2>Histórico</h2>
        <p className="adm-sub">O histórico completo e a ação de estorno ficam dentro do cadastro principal do inscrito.</p>
        <div className="adm-ferramentas" role="search" aria-label="Filtrar recebimentos">
          <label className="adm-busca"><Search size={16} aria-hidden /><input type="search" placeholder="Buscar família ou observação" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar recebimento" /></label>
          <select value={forma} onChange={(e) => setForma(e.target.value as typeof forma)} aria-label="Filtrar por forma de recebimento"><option value="todas">Todas as formas</option><option>Pix</option><option>Cartão</option><option>Dinheiro</option></select>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)} aria-label="Filtrar entradas e estornos"><option value="todos">Entradas e estornos</option><option value="entrada">Entradas</option><option value="estorno">Estornos</option></select>
          <label>De<input type="date" value={de} onChange={(e) => setDe(e.target.value)} aria-label="Data inicial" /></label>
          <label>Até<input type="date" value={ate} onChange={(e) => setAte(e.target.value)} aria-label="Data final" /></label>
          <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)} aria-label="Ordenar recebimentos por"><option value="data">Ordenar: data</option><option value="familia">Família</option><option value="forma">Forma</option><option value="valor">Valor</option></select>
          <button className="adm-btn adm-btn-fantasma" onClick={() => setDirecao((d) => d === "asc" ? "desc" : "asc")} aria-label="Inverter ordem">{direcao === "asc" ? "↑" : "↓"}</button>
          {(busca || forma !== "todas" || tipo !== "todos" || de || ate) && <button className="adm-btn adm-btn-fantasma" onClick={() => { setBusca(""); setForma("todas"); setTipo("todos"); setDe(""); setAte(""); }}>Limpar filtros</button>}
          <span className="adm-mudo">{ordenados.length} de {base.pagamentos.length} lançamento(s)</span>
        </div>
        <div className="adm-tabela-caixa">
          <table className="adm-tabela adm-tabela-pagamentos">
            <thead><tr><th>Data</th><th>Família</th><th>Forma</th><th>Valor recebido</th><th>Cadastro</th></tr></thead>
            <tbody>
              {ordenados.map((p) => (
                <tr key={p.id} onClick={() => abrirFamilia(p.familiaId)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && abrirFamilia(p.familiaId)}>
                  <td data-label="Data">{dma(p.data)}</td>
                  <td className="adm-td-nome" data-label="Família"><strong>{nome(p.familiaId)}</strong>{p.obs && <span className="adm-mudo adm-bloco-sub">{p.obs}</span>}</td>
                  <td data-label="Forma">{p.forma}</td>
                  <td data-label="Valor recebido" className={p.valor < 0 ? "tom-vermelho" : "tom-verde"}>{p.forma === "Cartão" && p.valor >= 0 ? <span className="adm-pagamento-valores"><strong>Líquido {reais(p.valorLiquido ?? p.valor)}</strong><small>Cobrado {reais(p.valorBruto ?? p.valor)} · taxa {reais(p.taxaCartao ?? 0)}</small></span> : reais(p.valorLiquido ?? p.valor)}</td>
                  <td data-label="Cadastro"><button className="adm-btn adm-btn-fantasma adm-abrir-cadastro" onClick={(e) => { e.stopPropagation(); abrirFamilia(p.familiaId); }}>Ver histórico <span aria-hidden="true">↗</span></button></td>
                </tr>
              ))}
              {ordenados.length === 0 && <tr><td colSpan={5} className="adm-vazio">Nenhum lançamento corresponde a esses filtros.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

/* ───────────────────────────── Despesas ───────────────────────────── */

function Despesas({ base, exec, categoriasExtras, onAdicionarCategoria }: { base: Base; exec: (g: Gravacao) => Promise<boolean>; categoriasExtras: string[]; onAdicionarCategoria: (nome: string) => void }) {
  const [categoria, setCategoria] = useState<string>(CATEGORIAS[0]);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [adicionandoCategoria, setAdicionandoCategoria] = useState(false);
  const [fornecedor, setFornecedor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [orcado, setOrcado] = useState("");
  const [pago, setPago] = useState("");
  const [responsavelCompra, setResponsavelCompra] = useState("");
  const [data, setData] = useState(hojeISO());
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | StatusDespesa>("todos");
  const [ordenacao, setOrdenacao] = useState("data");
  const [direcao, setDirecao] = useState<DirecaoOrdenacao>("desc");
  const n = lerDinheiro(orcado);
  const valorPago = lerDinheiro(pago);
  const valido = fornecedor.trim() && responsavelCompra.trim() && Number.isFinite(n) && n > 0 && Number.isFinite(valorPago) && valorPago >= 0;
  const filtradas = base.despesas.filter((d) => normalizarBusca(`${d.fornecedor} ${d.descricao} ${d.categoria} ${d.status}`).includes(normalizarBusca(busca))
    && (filtroCategoria === "todas" || d.categoria === filtroCategoria) && (filtroStatus === "todos" || d.status === filtroStatus));
  const despesas = ordenarPor(filtradas, (d) => {
    switch (ordenacao) {
      case "fornecedor": return d.fornecedor;
      case "categoria": return d.categoria;
      case "orcado": return d.orcado;
      case "pago": return d.pago;
      case "status": return d.status;
      default: return d.data ?? "";
    }
  }, direcao);
  const mudarStatus = async (id: string, status: StatusDespesa) => {
    if (status === "Pago" && !window.confirm("Confirmar que esta despesa foi paga?")) return;
    await exec({ tipo: "despesa-status", id, status });
  };
  return (
    <main className="adm-pagina">
      <h1>Despesas</h1>
      <section className="adm-grade adm-grade-3" aria-label="Resumo de despesas">
        <Cartao rotulo="Orçado" valor={reais(base.despesas.reduce((s, d) => s + d.orcado, 0))} />
        <Cartao rotulo="Já pago" valor={reais(base.despesas.reduce((s, d) => s + d.pago, 0))} tom="vermelho" />
        <Cartao rotulo="Saldo a pagar" valor={reais(base.despesas.reduce((s, d) => s + Math.max(0, d.orcado - d.pago), 0))} tom="ambar" />
      </section>
      <section className="adm-bloco">
        <h2>Nova despesa</h2>
        <form id="adm-nova-despesa" className="adm-form" onSubmit={async (e) => {
          e.preventDefault();
          if (!valido || salvando) return;
          setSalvando(true);
          try {
            if (await exec({ tipo: "despesa", categoria: categoria as CategoriaDespesa, fornecedor: fornecedor.trim(), responsavelCompra: responsavelCompra.trim(), descricao: descricao.trim(), orcado: n, pago: valorPago, data })) { setFornecedor(""); setResponsavelCompra(""); setDescricao(""); setOrcado(""); setPago(""); setData(hojeISO()); }
          } finally { setSalvando(false); }
        }}>
          <label>Categoria<div className="adm-categoria-controle"><select value={categoria} onChange={(e) => setCategoria(e.target.value)}>{[...CATEGORIAS, ...categoriasExtras].map((c) => (<option key={c}>{c}</option>))}</select><button type="button" className="adm-btn adm-btn-fantasma" onClick={() => setAdicionandoCategoria((v) => !v)}>+ Nova</button></div></label>
          {adicionandoCategoria && <div className="adm-nova-categoria"><label>Nome da nova categoria<input value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)} placeholder="Ex.: Comunicação" /></label><button type="button" className="adm-btn" disabled={!novaCategoria.trim() || [...CATEGORIAS, ...categoriasExtras].some((c) => c.toLowerCase() === novaCategoria.trim().toLowerCase())} onClick={() => { const nomeCategoria = novaCategoria.trim(); onAdicionarCategoria(nomeCategoria); setCategoria(nomeCategoria); setNovaCategoria(""); setAdicionandoCategoria(false); }}>Adicionar categoria</button></div>}
          <label>Fornecedor<input value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} required /></label>
          <label>Quem fez a compra<input value={responsavelCompra} onChange={(e) => setResponsavelCompra(e.target.value)} required placeholder="Nome da pessoa responsável" /></label>
          <label>Valor orçado (R$)<input inputMode="decimal" value={orcado} onChange={(e) => setOrcado(e.target.value)} placeholder="0,00" /></label>
          <label>Valor já pago (R$)<input inputMode="decimal" value={pago} onChange={(e) => setPago(e.target.value)} placeholder="0,00" /></label>
          <label>Data<input type="date" value={data} onChange={(e) => setData(e.target.value)} required /></label>
          <label className="adm-form-largo">Descrição<input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Opcional" /></label>
          <button className="adm-btn adm-btn-primario" disabled={!valido || salvando}>{salvando ? "Salvando…" : "Lançar despesa"}</button>
        </form>
      </section>
      <section className="adm-bloco">
        <div className="adm-topo"><h2>Lançamentos</h2><span className="adm-mudo">{despesas.length} de {base.despesas.length}</span></div>
        <div className="adm-ferramentas" role="search" aria-label="Filtrar despesas">
          <label className="adm-busca"><Search size={16} aria-hidden /><input type="search" placeholder="Buscar fornecedor, descrição ou categoria" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar despesas" /></label>
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value as typeof filtroCategoria)} aria-label="Filtrar categoria"><option value="todas">Todas as categorias</option>{[...CATEGORIAS, ...categoriasExtras].map((c) => <option key={c}>{c}</option>)}</select>
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as typeof filtroStatus)} aria-label="Filtrar situação"><option value="todos">Todos os status</option><option>Orçado</option><option>Aprovado</option><option>Pago</option></select>
          <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)} aria-label="Ordenar despesas por"><option value="data">Ordenar: data</option><option value="fornecedor">Fornecedor</option><option value="categoria">Categoria</option><option value="orcado">Valor orçado</option><option value="pago">Valor pago</option><option value="status">Status</option></select>
          <button className="adm-btn adm-btn-fantasma" onClick={() => setDirecao((d) => d === "asc" ? "desc" : "asc")} aria-label="Inverter ordem">{direcao === "asc" ? "↑" : "↓"}</button>
          {(busca || filtroCategoria !== "todas" || filtroStatus !== "todos") && <button className="adm-btn adm-btn-fantasma" onClick={() => { setBusca(""); setFiltroCategoria("todas"); setFiltroStatus("todos"); }}>Limpar filtros</button>}
        </div>
        <div className="adm-tabela-caixa">
          <table className="adm-tabela adm-tabela-despesas"><thead><tr><th>Data</th><th>Categoria</th><th>Fornecedor / descrição</th><th>Orçado</th><th>Pago</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>{despesas.map((d) => <tr key={d.id}>
              <td>{d.data ? dma(d.data) : "—"}</td><td>{d.categoria}</td><td><strong>{d.fornecedor}</strong><span className="adm-mudo adm-bloco-sub">{d.descricao}</span><span className="adm-mudo adm-bloco-sub">Compra feita por: {d.responsavelCompra || "não informado"}</span></td>
              <td>{reais(d.orcado)}</td><td className="tom-vermelho">{reais(d.pago)}</td>
              <td><span className={`adm-selo adm-selo-${d.status === "Pago" ? "verde" : d.status === "Aprovado" ? "azul" : "neutro"}`}>{d.status}</span></td>
              <td>{d.status === "Orçado" && <button className="adm-btn adm-btn-fantasma" onClick={() => void mudarStatus(d.id, "Aprovado")}>Aprovar</button>}{d.status !== "Pago" && <button className="adm-btn adm-btn-fantasma" onClick={() => void mudarStatus(d.id, "Pago")}>Marcar pago</button>}</td>
            </tr>)}{despesas.length === 0 && <tr><td colSpan={7}><div className="adm-estado-vazio"><span>{base.despesas.length === 0 ? "Ainda não há despesas lançadas nesta prévia." : "Nenhuma despesa corresponde aos filtros atuais."}</span><button className="adm-btn adm-btn-fantasma" type="button" onClick={() => { const form = document.getElementById("adm-nova-despesa"); form?.scrollIntoView({ behavior: "smooth", block: "center" }); (form?.querySelector("input,select") as HTMLElement | null)?.focus({ preventScroll: true }); }}>Abrir formulário de despesa</button></div></td></tr>}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

/* ───────────────────────────── Doações ───────────────────────────── */

function Doacoes({ base, exec }: { base: Base; exec: (g: Gravacao) => Promise<boolean> }) {
  const [doador, setDoador] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState<Doacao["tipo"]>("Avulsa");
  const [data, setData] = useState(hojeISO());
  const [obs, setObs] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | Doacao["tipo"]>("todos");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [ordenacao, setOrdenacao] = useState("data");
  const [direcao, setDirecao] = useState<DirecaoOrdenacao>("desc");
  const n = lerDinheiro(valor);
  const valido = doador.trim() && Number.isFinite(n) && n > 0;
  const total = base.doacoes.reduce((s, d) => s + d.valor, 0);
  const doacoes = ordenarPor(base.doacoes.filter((d) => normalizarBusca(`${d.doador} ${d.tipo} ${d.obs ?? ""}`).includes(normalizarBusca(busca))
    && (filtroTipo === "todos" || d.tipo === filtroTipo) && (!de || d.data >= de) && (!ate || d.data <= ate)), (d) => ordenacao === "doador" ? d.doador : ordenacao === "valor" ? d.valor : d.data, direcao);
  return (
    <main className="adm-pagina">
      <h1>Doações e apadrinhamento</h1>
      <section className="adm-grade adm-grade-3"><Cartao rotulo="Total arrecadado" valor={reais(total)} tom="verde" /></section>
      <section className="adm-bloco">
        <h2>Nova doação</h2>
        <form id="adm-nova-doacao" className="adm-form" onSubmit={async (e) => {
          e.preventDefault();
          if (!valido) return;
          if (salvando) return;
          setSalvando(true);
          try {
            if (await exec({ tipo: "doacao", doador: doador.trim(), valor: n, modo: tipo, data, obs: obs.trim() || undefined })) { setDoador(""); setValor(""); setObs(""); setData(hojeISO()); }
          } finally { setSalvando(false); }
        }}>
          <label>Doador<input value={doador} onChange={(e) => setDoador(e.target.value)} /></label>
          <label>Valor (R$)<input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" /></label>
          <label>Data<input type="date" value={data} onChange={(e) => setData(e.target.value)} required /></label>
          <label>Tipo
            <select value={tipo} onChange={(e) => setTipo(e.target.value as Doacao["tipo"])}>
              <option>Avulsa</option><option>Apadrinhamento de vaga</option>
            </select>
          </label>
          <label>Observação<input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Opcional" /></label>
          <button className="adm-btn adm-btn-primario" disabled={!valido || salvando}>{salvando ? "Salvando…" : "Registrar doação"}</button>
        </form>
      </section>
      <section className="adm-bloco">
        <h2>Registradas</h2>
        <div className="adm-ferramentas" role="search" aria-label="Filtrar doações">
          <label className="adm-busca"><Search size={16} aria-hidden /><input type="search" placeholder="Buscar doador ou observação" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar doações" /></label>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as typeof filtroTipo)} aria-label="Filtrar tipo de doação"><option value="todos">Todos os tipos</option><option>Avulsa</option><option>Apadrinhamento de vaga</option></select>
          <label>De<input type="date" value={de} onChange={(e) => setDe(e.target.value)} aria-label="Data inicial" /></label>
          <label>Até<input type="date" value={ate} onChange={(e) => setAte(e.target.value)} aria-label="Data final" /></label>
          <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)} aria-label="Ordenar doações por"><option value="data">Ordenar: data</option><option value="doador">Doador</option><option value="valor">Valor</option></select>
          <button className="adm-btn adm-btn-fantasma" onClick={() => setDirecao((d) => d === "asc" ? "desc" : "asc")} aria-label="Inverter ordem">{direcao === "asc" ? "↑" : "↓"}</button>
          {(busca || filtroTipo !== "todos" || de || ate) && <button className="adm-btn adm-btn-fantasma" onClick={() => { setBusca(""); setFiltroTipo("todos"); setDe(""); setAte(""); }}>Limpar filtros</button>}
          <span className="adm-mudo">{doacoes.length} de {base.doacoes.length} doação(ões)</span>
        </div>
        <ul className="adm-lista adm-lista-simples">
          {doacoes.map((d) => (
            <li key={d.id}><span>{dma(d.data)} · <strong>{d.doador}</strong> <span className="adm-mudo">· {d.tipo}{d.obs ? ` · ${d.obs}` : ""}</span></span><span className="tom-verde">{reais(d.valor)}</span></li>
          ))}
        </ul>
        {doacoes.length === 0 && <div className="adm-estado-vazio"><span>{base.doacoes.length === 0 ? "Ainda não há doações lançadas nesta prévia." : "Nenhuma doação corresponde aos filtros atuais."}</span><button className="adm-btn adm-btn-fantasma" type="button" onClick={() => { const form = document.getElementById("adm-nova-doacao"); form?.scrollIntoView({ behavior: "smooth", block: "center" }); (form?.querySelector("input,select") as HTMLElement | null)?.focus({ preventScroll: true }); }}>Abrir formulário de doação</button></div>}
      </section>
    </main>
  );
}

type CaixaAdm = { id: string; nome: string; tipo: "Dinheiro" | "Conta bancária" | "Carteira digital" };
const CAIXAS_INICIAIS: CaixaAdm[] = [
  { id: "caixa-fisico", nome: "Caixa físico", tipo: "Dinheiro" },
  { id: "nubank-ana", nome: "Nubank · Ana Paula", tipo: "Conta bancária" },
  { id: "mp-janaina", nome: "Mercado Pago · Janaina", tipo: "Carteira digital" },
];
type LogAdm = { id: string; quando: string; usuario: string; acao: string; detalhe: string };

function FluxoFinanceiro({ base, resumo, caixas, setCaixas, irPara, registrarLog }: {
  base: Base;
  resumo: ReturnType<typeof resumirTudo>;
  caixas: CaixaAdm[];
  setCaixas: Dispatch<SetStateAction<CaixaAdm[]>>;
  irPara: (destino: Tela) => void;
  registrarLog: (acao: string, detalhe: string) => void;
}) {
  const [mes, setMes] = useState("");
  const [nomeCaixa, setNomeCaixa] = useState("");
  const [tipoCaixa, setTipoCaixa] = useState<CaixaAdm["tipo"]>("Conta bancária");
  const [mostraNovoCaixa, setMostraNovoCaixa] = useState(false);
  const movimentos = [
    ...base.pagamentos.map((p) => ({ id: p.id, data: p.data, tipo: p.valor < 0 ? "Saída" : "Entrada", origem: "Recebimento", descricao: base.familias.find((f) => f.id === p.familiaId)?.responsavel ?? "Cadastro", valor: Math.abs(p.valor), destino: "pagamentos" as Tela })),
    ...base.doacoes.map((d) => ({ id: d.id, data: d.data, tipo: "Entrada", origem: "Doação", descricao: d.doador || "Doação sem identificação", valor: d.valor, destino: "doacoes" as Tela })),
    ...base.despesas.map((d) => ({ id: d.id, data: d.data || "", tipo: "Saída", origem: "Despesa", descricao: d.fornecedor + (d.descricao ? " · " + d.descricao : ""), valor: d.pago, destino: "despesas" as Tela })),
  ].sort((a, b) => b.data.localeCompare(a.data));
  const recortados = movimentos.filter((m) => !mes || m.data.startsWith(mes));
  const meses = Array.from(new Set(movimentos.map((m) => m.data.slice(0, 7)).filter(Boolean))).sort().slice(-7);
  const porMes = meses.map((chave) => ({
    chave,
    label: chave.slice(5) + "/" + chave.slice(0, 4),
    entradas: movimentos.filter((m) => m.data.startsWith(chave) && m.tipo === "Entrada").reduce((n, m) => n + m.valor, 0),
    saidas: movimentos.filter((m) => m.data.startsWith(chave) && m.tipo === "Saída").reduce((n, m) => n + m.valor, 0),
  }));
  const maximo = Math.max(1, ...porMes.flatMap((m) => [m.entradas, m.saidas]));
  const adicionarCaixa = (e: FormEvent) => {
    e.preventDefault();
    const nome = nomeCaixa.trim();
    if (!nome || caixas.some((c) => c.nome.toLowerCase() === nome.toLowerCase())) return;
    const novo = { id: novoId("CX"), nome, tipo: tipoCaixa };
    setCaixas((atuais) => [...atuais, novo]);
    registrarLog("Cadastro de caixa", nome + " · " + tipoCaixa + " (prévia)");
    setNomeCaixa("");
    setMostraNovoCaixa(false);
  };
  const cenarios = [
    { nome: "Pessimista", fator: .7, custo: 1.1, tom: "vermelho", nota: "70% dos valores em aberto recebidos · despesas 10% acima do orçado" },
    { nome: "Realista", fator: .85, custo: 1.05, tom: "azul", nota: "85% dos valores em aberto recebidos · despesas 5% acima do orçado" },
    { nome: "Otimista", fator: .95, custo: 1, tom: "verde", nota: "95% dos valores em aberto recebidos · despesas dentro do orçamento" },
  ];
  return (
    <main className="adm-pagina">
      <div className="adm-cabecalho"><div><p className="adm-eyebrow">SAÚDE FINANCEIRA</p><h1>Fluxo financeiro</h1><p className="adm-cabecalho-sub">Entradas, saídas, caixas e previsões em uma visão única.</p></div><span className="adm-selo adm-selo-ambar">Dados da prévia · não conciliados</span></div>
      <section className="adm-grade adm-grade-3">
        <button type="button" className="adm-cartao adm-cartao-link" onClick={() => irPara("pagamentos")}><span className="adm-mudo">Recebido</span><strong className="tom-verde">{reais(resumo.recebido + resumo.doacoes)}</strong><small>Recebimentos e doações · abrir origem ↗</small></button>
        <button type="button" className="adm-cartao adm-cartao-link" onClick={() => irPara("despesas")}><span className="adm-mudo">Despesas pagas</span><strong className="tom-vermelho">{reais(resumo.despesasPagas)}</strong><small>Saídas registradas · abrir despesas ↗</small></button>
        <article className="adm-cartao"><span className="adm-mudo">Saldo calculado</span><strong>{reais(resumo.saldoAtual)}</strong><small>Entradas menos despesas pagas</small></article>
        <article className="adm-cartao"><span className="adm-mudo">A receber</span><strong className="tom-ambar">{reais(resumo.aReceber)}</strong><small>Valores previstos dos cadastros</small></article>
        <article className="adm-cartao"><span className="adm-mudo">Provisão de despesas</span><strong>{reais(resumo.despesasAPagar)}</strong><small>Orçado menos o que já foi pago</small></article>
        <article className="adm-cartao"><span className="adm-mudo">Saldo projetado</span><strong>{reais(resumo.saldoProjetado)}</strong><small>Considerando todo o orçamento e valores devidos</small></article>
      </section>
      <section className="adm-bloco">
        <div className="adm-topo"><div><h2>Caixas e contas</h2><p className="adm-sub">Cadastros da prévia; ainda sem conciliação por conta.</p></div><button type="button" className="adm-btn adm-btn-primario" onClick={() => setMostraNovoCaixa((v) => !v)}>+ Novo caixa</button></div>
        {mostraNovoCaixa && <form className="adm-form adm-form-caixa" onSubmit={adicionarCaixa}><label>Nome do caixa<input value={nomeCaixa} onChange={(e) => setNomeCaixa(e.target.value)} placeholder="Ex.: Conta bancária" required /></label><label>Tipo<select value={tipoCaixa} onChange={(e) => setTipoCaixa(e.target.value as CaixaAdm["tipo"])}><option>Dinheiro</option><option>Conta bancária</option><option>Carteira digital</option></select></label><button className="adm-btn adm-btn-primario" type="submit" disabled={!nomeCaixa.trim()}>Adicionar caixa</button></form>}
        <div className="adm-caixas">{caixas.map((c) => <article className="adm-caixa" key={c.id}><span className="adm-caixa-icone">{c.tipo === "Dinheiro" ? "$" : c.tipo === "Conta bancária" ? "↔" : "▣"}</span><span><strong>{c.nome}</strong><small>{c.tipo}</small></span><span className="adm-selo adm-selo-neutro">Aguardando conciliação</span></article>)}</div>
      </section>
      <section className="adm-bloco">
        <div className="adm-topo"><div><h2>Movimento por mês</h2><p className="adm-sub">Selecione um mês para filtrar o extrato abaixo.</p></div><label>Mês<input type="month" value={mes} onChange={(e) => setMes(e.target.value)} /></label></div>
        {porMes.length ? <div className="adm-fluxo-grafico" role="list" aria-label="Gráfico de entradas e saídas por mês">{porMes.map((m) => <button type="button" key={m.chave} className={"adm-fluxo-coluna" + (mes === m.chave ? " ativo" : "")} onClick={() => setMes(mes === m.chave ? "" : m.chave)} aria-label={"Filtrar extrato por " + m.label + ": entradas " + reais(m.entradas) + ", saídas " + reais(m.saidas)}><span className="adm-fluxo-barras"><i className="entrada" style={{ height: Math.max(3, 100 * m.entradas / maximo) + "%" }} /><i className="saida" style={{ height: Math.max(3, 100 * m.saidas / maximo) + "%" }} /></span><span>{m.label}</span></button>)}</div> : <p className="adm-vazio">Ainda não há movimentos com data para montar o gráfico.</p>}
        <div className="adm-legenda"><span><i className="entrada" /> Entradas</span><span><i className="saida" /> Saídas</span></div>
      </section>
      <section className="adm-duas">
        <article className="adm-bloco"><h2>Previsões e provisões</h2><div className="adm-cenarios-fluxo">{cenarios.map((c) => { const saldo = resumo.saldoAtual + resumo.aReceber * c.fator - resumo.despesasAPagar * c.custo; return <div key={c.nome} className="adm-cenario"><span className={"adm-selo adm-selo-" + c.tom}>{c.nome}</span><strong>{reais(saldo)}</strong><small>{c.nota}</small></div>; })}</div><p className="adm-sub">Estimativas de planejamento, não representam saldo bancário confirmado.</p></article>
        <article className="adm-bloco"><h2>Pontos de atenção</h2>{resumo.atrasadas.length ? <button type="button" className="adm-alerta-link" onClick={() => irPara("inscritos")}>{resumo.atrasadas.length} famílias com parcelas vencidas · revisar cadastros ↗</button> : <p className="adm-vazio">Sem parcelas vencidas identificadas nos dados disponíveis.</p>}<button type="button" className="adm-alerta-link" onClick={() => irPara("despesas")}>{reais(resumo.despesasAPagar)} em provisões de despesas · revisar saídas ↗</button></article>
      </section>
      <section className="adm-bloco">
        <div className="adm-topo"><div><h2>Extrato consolidado</h2><p className="adm-sub">{recortados.length} movimento(s) · verde indica entrada e vermelho indica saída.</p></div>{mes && <button className="adm-btn adm-btn-fantasma" type="button" onClick={() => setMes("")}>Limpar mês</button>}</div>
        <div className="adm-tabela-caixa"><table className="adm-tabela adm-tabela-fluxo"><thead><tr><th>Data</th><th>Movimento</th><th>Origem</th><th>Descrição</th><th>Valor</th></tr></thead><tbody>{recortados.map((m) => <tr key={m.id} onClick={() => irPara(m.destino)}><td>{m.data ? dma(m.data) : "—"}</td><td><span className={"adm-selo adm-selo-" + (m.tipo === "Entrada" ? "verde" : "vermelho")}>{m.tipo}</span></td><td>{m.origem}</td><td>{m.descricao}</td><td className={m.tipo === "Entrada" ? "tom-verde" : "tom-vermelho"}>{m.tipo === "Saída" ? "−" : "+"}{reais(m.valor)}</td></tr>)}{!recortados.length && <tr><td colSpan={5}><p className="adm-vazio">Nenhum movimento neste recorte.</p></td></tr>}</tbody></table></div>
      </section>
    </main>
  );
}

function Logs({ registros, administradorDemo }: { registros: LogAdm[]; administradorDemo: boolean }) {
  const [busca, setBusca] = useState("");
  if (!administradorDemo) return <main className="adm-pagina"><h1>Logs</h1><p className="adm-aviso">Acesso restrito ao administrador. A validação real de funções será configurada junto com a integração.</p></main>;
  const filtrados = registros.filter((r) => (r.acao + " " + r.usuario + " " + r.detalhe).toLowerCase().includes(busca.toLowerCase()));
  return <main className="adm-pagina"><div className="adm-cabecalho"><div><p className="adm-eyebrow">AUDITORIA · ADMINISTRADOR</p><h1>Logs do sistema</h1><p className="adm-cabecalho-sub">Registro demonstrativo limitado à sessão atual da prévia.</p></div><span className="adm-selo adm-selo-ambar">Não é um log permanente</span></div><section className="adm-bloco"><div className="adm-ferramentas"><label className="adm-busca"><Search size={16} aria-hidden/><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar ação ou usuário" /></label><span className="adm-mudo">{filtrados.length} evento(s)</span></div>{filtrados.length ? <div className="adm-tabela-caixa"><table className="adm-tabela"><thead><tr><th>Quando</th><th>Usuário</th><th>Ação</th><th>Detalhe</th></tr></thead><tbody>{filtrados.map((r) => <tr key={r.id}><td>{new Date(r.quando).toLocaleString("pt-BR")}</td><td>{r.usuario}</td><td>{r.acao}</td><td>{r.detalhe}</td></tr>)}</tbody></table></div> : <div className="adm-estado-vazio"><span>Nenhuma ação registrada nesta sessão.</span></div>}</section></main>;
}

/* ───────────────────────────── Relatórios ───────────────────────────── */

function Relatorios({ base, resumo, navegar }: { base: Base; resumo: ReturnType<typeof resumirTudo>; navegar: (destino: Tela) => void }) {
  const [cenarioSelecionado, setCenarioSelecionado] = useState<"Pessimista" | "Realista" | "Otimista">("Realista");
  const [busca, setBusca] = useState("");
  const [classificacao, setClassificacao] = useState<ClassificacaoParticipante | "todas">("todas");
  const [transporte, setTransporte] = useState<"todos" | "onibus" | "proprio">("todos");
  const [situacao, setSituacao] = useState<SituacaoFamilia | "todas">("todas");
  const [ordenacao, setOrdenacao] = useState("nome");
  const [direcao, setDirecao] = useState<DirecaoOrdenacao>("asc");
  const familiasFiltradas = ordenarPor(resumo.familias.filter((f) => {
    const pessoas = f.pessoas;
    const termo = normalizarBusca(busca);
    const responsavelIgreja = normalizarBusca(`${f.familia.responsavel} ${f.familia.igreja}`);
    const buscaHit = !termo || responsavelIgreja.includes(termo) || pessoas.some((p) => normalizarBusca(p.nome).includes(termo));
    return buscaHit
      && pessoas.some((p) => (classificacao === "todas" || p.classificacao === classificacao) && (transporte === "todos" || p.transporte === transporte))
      && (situacao === "todas" || f.situacao === situacao);
  }), (f) => ordenacao === "devido" ? f.devido : ordenacao === "pessoas" ? f.pessoas.length : f.familia.responsavel, direcao);
  const ids = new Set(familiasFiltradas.map((f) => f.familia.id));
  const termoBusca = normalizarBusca(busca);
  const responsavelHit = (id: string) => {
    const familia = base.familias.find((f) => f.id === id);
    return !!termoBusca && normalizarBusca(`${familia?.responsavel ?? ""} ${familia?.igreja ?? ""}`).includes(termoBusca);
  };
  const pessoasNoRecorte = base.pessoas.filter((p) => ids.has(p.familiaId)
    && (classificacao === "todas" || p.classificacao === classificacao)
    && (transporte === "todos" || p.transporte === transporte)
    && (!termoBusca || responsavelHit(p.familiaId) || normalizarBusca(p.nome).includes(termoBusca)));
  const baseFiltrada: Base = { ...base, familias: base.familias.filter((f) => ids.has(f.id)), pessoas: pessoasNoRecorte, pagamentos: base.pagamentos.filter((p) => ids.has(p.familiaId)), ajustes: base.ajustes.filter((a) => ids.has(a.familiaId)) };
  const pessoasPagantesRecorte = pessoasNoRecorte.filter((p) => p.valor > 0).length;
  const transporteFiltrado = resumoTransporte(baseFiltrada);
  const camisetasFiltradas = resumoCamisetas(baseFiltrada);
  const pessoasPorCategoria = CLASSIFICACOES.map((nome) => ({ nome, total: pessoasNoRecorte.filter((p) => p.classificacao === nome).length }));
  const maxCategoria = Math.max(1, ...pessoasPorCategoria.map((x) => x.total));
  const fatoresCenario = { Pessimista: { recebimento: .7, despesa: 1.1 }, Realista: { recebimento: .85, despesa: 1.05 }, Otimista: { recebimento: .95, despesa: 1 } };
  const cenario = fatoresCenario[cenarioSelecionado];
  const saldoPrevisto = resumo.saldoAtual + resumo.aReceber * cenario.recebimento - resumo.despesasAPagar * cenario.despesa;
  const analiseResumo = resumo.atrasadas.length
    ? resumo.atrasadas.length + " família(s) têm parcelas vencidas. Priorize o contato e acompanhe os recebimentos antes de assumir novas despesas."
    : "Não há parcelas vencidas identificadas. Acompanhe os valores a receber e compare novas despesas com o orçamento disponível.";
  const baixar = () => {
    const resumoCsv = { ...resumo, familias: resumo.familias.filter((f) => ids.has(f.familia.id)) };
    const blob = new Blob([csvInscritos(baseFiltrada, resumoCsv)], { type: "text/csv;charset=utf-8" });
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
        <Cartao rotulo="Pessoas no recorte" valor={String(pessoasNoRecorte.length)} nota={`${pessoasPagantesRecorte} pagantes · ${pessoasNoRecorte.length - pessoasPagantesRecorte} gratuitas`} />
        <Cartao rotulo="Valores a confirmar" valor={String(pessoasNoRecorte.filter((p) => p.valorInformado === false).length)} nota="Sem valor definido na planilha" />
        <Cartao rotulo="Vão de ônibus" valor={String(transporteFiltrado.onibus)} />
        <Cartao rotulo="Carro próprio" valor={String(transporteFiltrado.proprio)} />
        <Cartao rotulo="Transporte não informado" valor={String(pessoasNoRecorte.filter((p) => p.transporte === "nao-informado").length)} />
      </section>
      <section className="adm-bloco">
        <h2>Camisetas</h2>
        {camisetasFiltradas.itens.length === 0 && <p className="adm-vazio">Nenhum tamanho registrado neste recorte. Registre na ficha de cada família.</p>}
        <ul className="adm-lista adm-lista-simples">
          {camisetasFiltradas.itens.map(([k, n]) => (<li key={k}><span>{k}</span><span>{n}</span></li>))}
          <li><span className="adm-mudo">Sem tamanho informado</span><span>{camisetasFiltradas.semTamanho}</span></li>
        </ul>
      </section>
      <section className="adm-bloco">
        <h2>Lista de inscritos</h2>
        <p className="adm-sub">Os filtros abaixo também definem o conteúdo do CSV que será baixado.</p>
        <div className="adm-ferramentas" role="search" aria-label="Filtrar relatório de inscritos">
          <label className="adm-busca"><Search size={16} aria-hidden /><input type="search" placeholder="Buscar pessoa, família ou igreja" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar no relatório" /></label>
          <select value={classificacao} onChange={(e) => setClassificacao(e.target.value as typeof classificacao)} aria-label="Filtrar classificação"><option value="todas">Todas as categorias</option>{CLASSIFICACOES.map((x) => <option key={x}>{x}</option>)}</select>
          <select value={transporte} onChange={(e) => setTransporte(e.target.value as typeof transporte)} aria-label="Filtrar transporte"><option value="todos">Todos os transportes</option><option value="onibus">Ônibus</option><option value="proprio">Carro próprio</option><option value="nao-informado">Não informado</option></select>
          <select value={situacao} onChange={(e) => setSituacao(e.target.value as typeof situacao)} aria-label="Filtrar situação financeira"><option value="todas">Todas as situações</option>{Object.entries(rotuloSituacao).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)} aria-label="Ordenar relatório por"><option value="nome">Ordenar: nome</option><option value="pessoas">Número de pessoas</option><option value="devido">Valor devido</option></select>
          <button className="adm-btn adm-btn-fantasma" onClick={() => setDirecao((d) => d === "asc" ? "desc" : "asc")} aria-label="Inverter ordem">{direcao === "asc" ? "↑" : "↓"}</button>
          {(busca || classificacao !== "todas" || transporte !== "todos" || situacao !== "todas") && <button className="adm-btn adm-btn-fantasma" onClick={() => { setBusca(""); setClassificacao("todas"); setTransporte("todos"); setSituacao("todas"); }}>Limpar filtros</button>}
          <span className="adm-mudo">{pessoasNoRecorte.length} pessoa(s) · {familiasFiltradas.length} família(s)</span>
        </div>
        <button className="adm-btn adm-btn-primario" onClick={baixar}>Baixar lista (CSV)</button>
      </section>
    </main>
  );
}


type FuncaoUsuario = "Administrador" | "Líder financeiro" | "Líder";
type UsuarioPreview = { id: string; nome: string; email: string; funcao: FuncaoUsuario };

function Usuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioPreview[]>([
    { id: "admin", nome: "Administrador principal", email: "Acesso administrativo", funcao: "Administrador" },
    { id: "financeiro", nome: "Liderança financeira", email: "Acesso financeiro", funcao: "Líder financeiro" },
  ]);
  const [adicionando, setAdicionando] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [funcao, setFuncao] = useState<FuncaoUsuario>("Líder");
  const [avisoLocal, setAvisoLocal] = useState("");
  const salvar = (e: FormEvent) => {
    e.preventDefault();
    const normalizado = email.trim().toLowerCase();
    if (!nome.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizado)) {
      setAvisoLocal("Informe um nome e um e-mail válido.");
      return;
    }
    if (usuarios.some((u) => u.email.toLowerCase() === normalizado)) {
      setAvisoLocal("Esse e-mail já tem acesso.");
      return;
    }
    setUsuarios((lista) => [...lista, { id: `usr-${Date.now()}`, nome: nome.trim(), email: normalizado, funcao }]);
    setNome(""); setEmail(""); setFuncao("Líder"); setAvisoLocal("Acesso incluído nesta prévia; a alteração não foi salva.");
    setAdicionando(false);
  };
  const acesso: Record<FuncaoUsuario, string> = {
    "Administrador": "Acesso completo, incluindo usuários e financeiro.",
    "Líder financeiro": "Consulta geral e lançamento de recebimentos e despesas.",
    "Líder": "Consulta e relatórios, sem permissão para alterar registros.",
  };
  return (
    <main className="adm-pagina">
      <div className="adm-topo">
        <div><h1>Usuários</h1><p className="adm-sub">Defina o que cada liderança pode consultar ou registrar.</p></div>
        <button className="adm-btn adm-btn-primario" onClick={() => { setAdicionando((v) => !v); setAvisoLocal(""); }}>
          {adicionando ? "Cancelar" : "Adicionar usuário"}
        </button>
      </div>
      <div className="adm-faixa" role="status">Demonstração de permissões: alterações temporárias, sem mudança de acessos reais.</div>
      {avisoLocal && <p className="adm-toast adm-toast-ok" role="status">{avisoLocal}</p>}
      {adicionando && (
        <form className="adm-bloco adm-usuario-form" onSubmit={salvar}>
          <label>Nome<input value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" required /></label>
          <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
          <label>Função<select value={funcao} onChange={(e) => setFuncao(e.target.value as FuncaoUsuario)}>
            <option>Administrador</option><option>Líder financeiro</option><option>Líder</option>
          </select></label>
          <button className="adm-btn adm-btn-primario" type="submit">Adicionar acesso</button>
        </form>
      )}
      <section className="adm-bloco">
        <div className="adm-tabela-rolagem">
          <table className="adm-tabela">
            <thead><tr><th>Nome de acesso</th><th>Identificação</th><th>Função</th><th>Permissões</th></tr></thead>
            <tbody>{usuarios.map((u) => (
              <tr key={u.id}><th scope="row">{u.nome}</th><td>{u.email}</td><td><span className="adm-selo adm-selo-verde">{u.funcao}</span></td><td>{acesso[u.funcao]}</td></tr>
            ))}</tbody>
          </table>
        </div>
        {usuarios.length === 0 && <p className="adm-vazio">Nenhum usuário cadastrado.</p>}
      </section>
      <section className="adm-grade adm-grade-3" aria-label="Resumo das permissões">
        {(Object.keys(acesso) as FuncaoUsuario[]).map((papel) => (
          <article className="adm-bloco" key={papel}><h2>{papel}</h2><p className="adm-sub">{acesso[papel]}</p>
            <strong>{usuarios.filter((u) => u.funcao === papel).length} usuário(s)</strong>
          </article>
        ))}
      </section>
    </main>
  );
}

