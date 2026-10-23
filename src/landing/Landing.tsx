import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BedDouble,
  Bus,
  CalendarDays,
  BookOpen,
  ClipboardList,
  Clock,
  Flame,
  HeartHandshake,
  Home,
  Moon,
  MapPin,
  Menu,
  Music,
  Plus,
  Users,
  Utensils,
  Wallet,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { evento } from "../content/evento";
import { formatarReais } from "../lib/inscricao";
import { Gallery } from "./Gallery";

const NAV = [
  { href: "#sobre", rotulo: "Sobre" },
  { href: "#local", rotulo: "Local" },
  { href: "#informacoes", rotulo: "Informações" },
  { href: "#programacao", rotulo: "Programação" },
  { href: "#duvidas", rotulo: "Dúvidas" },
];

const ICONE_SOBRE = [Flame, BookOpen, HeartHandshake, Users];
const ICONE_ATIV = [Music, Flame, BookOpen, Users, Moon, HeartHandshake];
const ICONE_INFO = {
  hospedagem: BedDouble,
  alimentacao: Utensils,
  transporte: Bus,
  orientacoes: ClipboardList,
};

function Cabecalho() {
  const [aberto, setAberto] = useState(false);
  return (
    <header className="lp-nav">
      <div className="lp-wrap">
        <div className="lp-nav-in">
          <a className="lp-brand" href="#topo" aria-label={`${evento.ministerio} — início`}>
            <img
              className="lp-brand-logo"
              src="/logo-conexao-jovem.png"
              alt=""
              width="40"
              height="50"
            />
            <span className="lp-brand-txt">
              <b>{evento.ministerio}</b>
              <span>
                {evento.igreja} · {evento.igrejaCidade}
              </span>
            </span>
          </a>
          <nav className="lp-links" aria-label="Seções da página">
            {NAV.map((n) => (
              <a key={n.href} href={n.href}>
                {n.rotulo}
              </a>
            ))}
          </nav>
          <Link to="/inscricao" className="lp-btn lp-btn-fire lp-nav-cta">
            Inscreva-se
          </Link>
          <button
            type="button"
            className="lp-burger"
            aria-label={aberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={aberto}
            aria-controls="menu-mobile"
            onClick={() => setAberto((v) => !v)}
          >
            {aberto ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {aberto && (
          <nav id="menu-mobile" className="lp-drawer" aria-label="Menu">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setAberto(false)}>
                {n.rotulo}
              </a>
            ))}
            <Link to="/inscricao" className="lp-btn lp-btn-fire" onClick={() => setAberto(false)}>
              Inscrever minha família <ArrowRight size={18} />
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

/** Arte abstrata original: rede de pontos conectados (tema "conexão"). */
function Rede() {
  const nos: Array<[number, number]> = [
    [90, 140],
    [300, 260],
    [520, 120],
    [760, 300],
    [980, 160],
    [1110, 430],
    [880, 540],
    [640, 430],
    [400, 540],
    [170, 450],
  ];
  const liga: Array<[number, number]> = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 9],
    [9, 0],
    [1, 7],
    [2, 7],
    [3, 7],
    [3, 6],
    [1, 8],
    [1, 9],
    [4, 3],
  ];
  return (
    <svg
      className="lp-net"
      viewBox="0 0 1200 640"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      {liga.map(([a, b], i) => (
        <line
          key={i}
          x1={nos[a][0]}
          y1={nos[a][1]}
          x2={nos[b][0]}
          y2={nos[b][1]}
          stroke="#62aaff"
          strokeOpacity="0.28"
          strokeWidth="1.2"
        />
      ))}
      {nos.map(([x, y], i) => (
        <g key={i}>
          <circle
            cx={x}
            cy={y}
            r={i % 3 === 0 ? 16 : 10}
            fill={i % 3 === 0 ? "#ff5a1f" : "#ffb02e"}
            fillOpacity="0.14"
          />
          <circle
            cx={x}
            cy={y}
            r={i % 3 === 0 ? 5 : 3.5}
            fill={i % 3 === 0 ? "#ff7a2a" : "#ffc766"}
          />
        </g>
      ))}
    </svg>
  );
}

function Inicio() {
  return (
    <section className="lp-hero" id="topo" aria-labelledby="titulo">
      <Rede />
      <div className="lp-wrap">
        <span className="lp-hero-badge lp-rise">
          <Users size={15} aria-hidden="true" /> {evento.tipo}
        </span>
        <h1 className="lp-title lp-rise d1" id="titulo">
          {evento.nome} <em>{evento.edicao}</em>
        </h1>
        {evento.tema && <p className="lp-tema lp-rise d1">{evento.tema}</p>}
        <p className="lp-impact lp-rise d2">{evento.fraseImpacto}</p>
        <p className="lp-org lp-rise d2">
          {evento.ministerio} · {evento.igreja} de {evento.igrejaCidade}
        </p>

        <ul className="lp-facts lp-rise d2">
          <li className="lp-fact">
            <CalendarDays size={22} aria-hidden="true" />
            <span>
              <small>Data</small>
              <strong>{evento.dataTexto}</strong>
              <small style={{ textTransform: "none", letterSpacing: 0 }}>
                {evento.periodoNota}
              </small>
            </span>
          </li>
          <li className="lp-fact">
            <MapPin size={22} aria-hidden="true" />
            <span>
              <small>Local</small>
              <strong>
                {evento.local.nome} · {evento.local.cidade}/{evento.local.uf}
              </strong>
            </span>
          </li>
          <li className="lp-fact">
            <Home size={22} aria-hidden="true" />
            <span>
              <small>Hospedagem</small>
              <strong>Quartos familiares</strong>
            </span>
          </li>
          <li className="lp-fact">
            <BookOpen size={22} aria-hidden="true" />
            <span>
              <small>Programação</small>
              <strong>Cultos, oração e estudos bíblicos</strong>
            </span>
          </li>
        </ul>

        <div className="lp-cta-row lp-rise d3">
          <Link to="/inscricao" className="lp-btn lp-btn-fire lp-btn-big">
            Inscrever minha família <ArrowRight size={20} />
          </Link>
          <a href="#local" className="lp-btn lp-btn-ghost lp-btn-big">
            Conhecer o local
          </a>
        </div>
      </div>
    </section>
  );
}

function Titulo({
  eyebrow,
  titulo,
  lead,
  id,
}: {
  eyebrow: string;
  titulo: string;
  lead?: ReactNode;
  id: string;
}) {
  return (
    <>
      <span className="lp-eyebrow">{eyebrow}</span>
      <h2 className="lp-h2" id={id}>
        {titulo}
      </h2>
      {lead && <p className="lp-lead">{lead}</p>}
    </>
  );
}

function Sobre() {
  return (
    <section className="lp-section" id="sobre" aria-labelledby="t-sobre">
      <div className="lp-wrap">
        <Titulo
          id="t-sobre"
          eyebrow="Sobre o retiro"
          titulo="Um tempo para a família estar com Deus"
          lead="O retiro é um tempo separado, organizado pela Conexão Jovem, para as famílias da igreja viverem a fé juntas: adoração, oração, Palavra de Deus, convivência e descanso."
        />
        <div className="lp-grid c4">
          {evento.sobre.map((s, i) => {
            const Icone = ICONE_SOBRE[i % ICONE_SOBRE.length];
            return (
              <article className="lp-card" key={s.titulo}>
                <span className={`lp-ico${i % 2 ? " sky" : ""}`}>
                  <Icone size={24} aria-hidden="true" />
                </span>
                <h3>{s.titulo}</h3>
                <p>{s.texto}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Local() {
  return (
    <section className="lp-section alt" id="local" aria-labelledby="t-local">
      <div className="lp-wrap">
        <Titulo
          id="t-local"
          eyebrow="Conheça o local"
          titulo={`${evento.local.nome}, ${evento.local.cidade}/${evento.local.uf}`}
          lead="A estrutura do retiro é pensada para a convivência das famílias e para as atividades cristãs. Detalhes ainda não confirmados serão divulgados pela organização."
        />
        <div className="lp-grid c3" style={{ marginBottom: "2.5rem" }}>
          {evento.localDestaques.map((d, i) => (
            <article className="lp-card lp-destaque" key={d.titulo}>
              <span className={`lp-ico${i % 2 ? " sky" : ""}`}>
                {i === 0 ? (
                  <Home size={24} aria-hidden="true" />
                ) : i === 1 ? (
                  <BookOpen size={24} aria-hidden="true" />
                ) : (
                  <Users size={24} aria-hidden="true" />
                )}
              </span>
              <h3>{d.titulo}</h3>
              <p>{d.texto}</p>
              <p className="lp-nota">
                <span className="lp-badge pend">A confirmar</span> {d.nota}
              </p>
            </article>
          ))}
        </div>
        <Gallery />
        {evento.local.mapsUrl && (
          <p style={{ marginTop: "1.5rem" }}>
            <a
              className="lp-btn lp-btn-ghost"
              href={evento.local.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPin size={18} aria-hidden="true" /> Ver no mapa
            </a>
          </p>
        )}
      </div>
    </section>
  );
}

function Informacoes() {
  return (
    <section className="lp-section" id="informacoes" aria-labelledby="t-info">
      <div className="lp-wrap">
        <Titulo
          id="t-info"
          eyebrow="Informações importantes"
          titulo="Tudo o que você precisa saber"
          lead="O que já está definido aparece aqui. Os itens marcados como “A confirmar” serão divulgados pela organização."
        />
        <div className="lp-grid c3">
          <article className="lp-card">
            <span className="lp-ico">
              <Wallet size={24} aria-hidden="true" />
            </span>
            <h3>
              Valores <span className="lp-badge ok">Confirmado</span>
            </h3>
            <ul className="lp-prices">
              {evento.faixas.map((f) => (
                <li key={f.id}>
                  <span>{f.rotulo}</span>
                  {f.valor === null ? (
                    <span className="tbd">{f.nota ?? "A definir"}</span>
                  ) : (
                    <b>{formatarReais(f.valor)}</b>
                  )}
                </li>
              ))}
            </ul>
            <p style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>
              Valor por pessoa, conforme a idade em 05/02/2027 (início do retiro). Os valores serão
              confirmados pela organização para o formato familiar.
            </p>
          </article>

          {evento.informacoes.map((c) => {
            const Icone = ICONE_INFO[c.id];
            return (
              <article className="lp-card" key={c.id}>
                <span className="lp-ico sky">
                  <Icone size={24} aria-hidden="true" />
                </span>
                <h3>
                  {c.titulo}
                  <span className={`lp-badge ${c.status === "confirmado" ? "ok" : "pend"}`}>
                    {c.status === "confirmado" ? "Confirmado" : "A confirmar"}
                  </span>
                </h3>
                <p>{c.texto}</p>
                {c.itens && (
                  <ul className="lp-list">
                    {c.itens.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Programacao() {
  return (
    <section className="lp-section alt" id="programacao" aria-labelledby="t-prog">
      <div className="lp-wrap">
        <Titulo
          id="t-prog"
          eyebrow="Programação"
          titulo="O que vamos viver juntos"
          lead="Esta é a proposta geral do retiro. Horários, temas e ministradores ainda serão divulgados pela organização."
        />
        <div className="lp-grid c3">
          {evento.atividades.map((a, i) => {
            const Icone = ICONE_ATIV[i % ICONE_ATIV.length];
            return (
              <article className="lp-card" key={a.titulo}>
                <span className={`lp-ico${i % 2 ? " sky" : ""}`}>
                  <Icone size={24} aria-hidden="true" />
                </span>
                <h3>{a.titulo}</h3>
                <p>{a.texto}</p>
              </article>
            );
          })}
        </div>

        {evento.programacao.length === 0 ? (
          <div className="lp-empty" style={{ marginTop: "2rem" }}>
            <Clock size={28} aria-hidden="true" />
            <strong>Horários a divulgar</strong>
            <span>
              O cronograma completo será publicado aqui quando for confirmado pela organização.
            </span>
          </div>
        ) : (
          <div className="lp-grid c3" style={{ marginTop: "2rem" }}>
            {evento.programacao.map((d) => (
              <article className="lp-day" key={d.titulo}>
                <h3>{d.titulo}</h3>
                {d.data && <small>{d.data}</small>}
                <ul className="lp-slots">
                  {d.itens.map((it, i) => (
                    <li key={`${it.titulo}-${i}`}>
                      <time>{it.hora ?? ""}</time>
                      <span>
                        <strong>{it.titulo}</strong>
                        {it.descricao && (
                          <span style={{ display: "block", color: "var(--lp-mute)" }}>
                            {it.descricao}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Duvidas() {
  return (
    <section className="lp-section" id="duvidas" aria-labelledby="t-faq">
      <div className="lp-wrap">
        <Titulo id="t-faq" eyebrow="Dúvidas frequentes" titulo="Respostas objetivas" />
        <div className="lp-faq">
          {evento.faq.map((q) => (
            <details key={q.p}>
              <summary>
                <span>
                  {q.p}
                  {q.status === "a-confirmar" && <span className="lp-badge pend">A confirmar</span>}
                </span>
                <Plus size={20} aria-hidden="true" />
              </summary>
              <p>{q.r}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function ChamadaFinal() {
  return (
    <section className="lp-final" aria-labelledby="t-final">
      <div className="lp-wrap">
        <h2 className="lp-h2" id="t-final">
          Venha com a sua família ao {evento.nome} {evento.edicao}
        </h2>
        <p className="lp-lead">
          Uma pessoa maior de idade inscreve toda a família em poucos minutos. O valor de cada
          pessoa e o total aparecem antes do envio.
        </p>
        <Link to="/inscricao" className="lp-btn lp-btn-fire lp-btn-big">
          Inscrever minha família <ArrowRight size={20} />
        </Link>
      </div>
    </section>
  );
}

export function Rodape() {
  const { whatsapp, instagram, email } = evento.contato;
  return (
    <footer className="lp-foot">
      <div className="lp-wrap lp-foot-in">
        <span className="lp-foot-brand">
          <img src="/logo-igreja.png" alt="" width="42" height="52" loading="lazy" />
          <span>
            {evento.ministerio} · {evento.igreja} · {evento.igrejaCidade}
          </span>
        </span>
        <span>
          <a href="/inscricao#regras">Regras</a> · <a href="/inscricao#privacidade">Privacidade</a>
          {whatsapp && (
            <>
              {" · "}
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </>
          )}
          {instagram && (
            <>
              {" · "}
              <a href={instagram} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </>
          )}
          {email && (
            <>
              {" · "}
              <a href={`mailto:${email}`}>{email}</a>
            </>
          )}
        </span>
      </div>
    </footer>
  );
}

export function Landing() {
  return (
    <div className="lp">
      <Cabecalho />
      <main>
        <Inicio />
        <Sobre />
        <Local />
        <Informacoes />
        <Programacao />
        <Duvidas />
        <ChamadaFinal />
      </main>
      <Rodape />
    </div>
  );
}
