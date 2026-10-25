import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { evento } from "../content/evento";
import { textoValor } from "../lib/inscricao";
import { Gallery, temMidia } from "./Gallery";

const NAV = [
  { href: "#local", rotulo: "Local" },
  { href: "#agenda", rotulo: "Dias" },
  { href: "#hospedagem", rotulo: "Hospedagem" },
  { href: "#valores", rotulo: "Valores" },
  { href: "#transporte", rotulo: "Transporte" },
  { href: "#duvidas", rotulo: "Dúvidas" },
];

/**
 * Curvas de nível da serra: arte original gerada por código (não é fotografia do local).
 * Determinística, para a renderização no servidor e no navegador serem idênticas.
 */
function curvas(): string[] {
  const linhas: string[] = [];
  for (let i = 0; i < 15; i++) {
    const base = 70 + i * 42;
    let d = "";
    for (let x = -20; x <= 1220; x += 20) {
      const y =
        base +
        34 * Math.sin(x / 210 + i * 0.42) +
        16 * Math.sin(x / 93 + i * 0.9) -
        i * 3.2 * Math.cos(x / 420);
      d += `${x === -20 ? "M" : "L"}${x} ${y.toFixed(1)} `;
    }
    linhas.push(d.trim());
  }
  return linhas;
}
const CURVAS = curvas();

function Relevo() {
  return (
    <svg
      className="lp-relevo"
      viewBox="0 0 1200 720"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      {CURVAS.map((d, i) => (
        <path
          key={i}
          d={d}
          pathLength={1}
          style={{ animationDelay: `${i * 90}ms` }}
          className={i % 5 === 2 ? "forte" : undefined}
        />
      ))}
    </svg>
  );
}

function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <a className="lp-marca" href="#topo" aria-label={`${evento.ministerio}: início da página`}>
      <img src="/logo-conexao-jovem.png" alt="" width="40" height="50" />
      {!compacta && (
        <span>
          <b>{evento.ministerio}</b>
          <small>
            {evento.igreja} de {evento.igrejaCidade}
          </small>
        </span>
      )}
    </a>
  );
}

function Cabecalho() {
  const [aberto, setAberto] = useState(false);
  return (
    <header className="lp-top">
      <div className="lp-wrap lp-top-in">
        <Marca />
        <nav className="lp-nav" aria-label="Seções da página">
          {NAV.map((n) => (
            <a key={n.href} href={n.href}>
              {n.rotulo}
            </a>
          ))}
        </nav>
        <Link to="/inscricao" className="lp-btn lp-btn-brasa lp-top-cta">
          Inscrever minha família
        </Link>
        <button
          type="button"
          className="lp-menu-btn"
          aria-expanded={aberto}
          aria-controls="menu-mobile"
          onClick={() => setAberto((v) => !v)}
        >
          {aberto ? "Fechar" : "Menu"}
        </button>
      </div>
      {aberto && (
        <nav id="menu-mobile" className="lp-menu-mobile" aria-label="Menu">
          <div className="lp-wrap">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setAberto(false)}>
                {n.rotulo}
              </a>
            ))}
            <Link to="/inscricao" className="lp-btn lp-btn-brasa" onClick={() => setAberto(false)}>
              Inscrever minha família
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

function Inicio() {
  const d = evento.dataCurta;
  return (
    <section className="lp-hero" id="topo" aria-labelledby="titulo">
      <Relevo />
      <div className="lp-wrap lp-hero-in">
        <h1 id="titulo" className="lp-nome">
          {evento.nome} {evento.edicao}
        </h1>

        <p className="lp-data" role="text" aria-label={evento.dataTexto}>
          <span className="lp-data-dias" aria-hidden="true">
            {d.de}–{d.ate}
          </span>
          <span className="lp-data-mes" aria-hidden="true">
            de {d.mes}
            <br />
            de {d.ano}
          </span>
        </p>

        <p className="lp-mensagem">{evento.mensagemPrincipal}</p>
        <p className="lp-apoio">
          {evento.publico} da {evento.igreja} de {evento.igrejaCidade}, com organização da{" "}
          {evento.ministerio}.
        </p>

        <div className="lp-hero-acoes">
          <Link to="/inscricao" className="lp-btn lp-btn-brasa lp-btn-grande">
            Inscrever minha família
          </Link>
          <a className="lp-link-claro" href="#valores">
            Ver o que está incluído
          </a>
        </div>

        <p className="lp-hero-local">
          {evento.local.nome}, em {evento.local.cidade}/{evento.local.uf}
        </p>
      </div>
    </section>
  );
}

function Proposito() {
  return (
    <section className="lp-faixa lp-linho" id="proposito" aria-labelledby="t-proposito">
      <div className="lp-wrap lp-duas">
        <div>
          <h2 id="t-proposito" className="lp-h2">
            Um tempo separado para estar diante de Deus com a família
          </h2>
        </div>
        <div className="lp-prosa">
          <p>
            O {evento.nome} {evento.edicao} reúne famílias, adultos e jovens da {evento.igreja} de{" "}
            {evento.igrejaCidade} em Campos do Jordão. A rotina combina devocional, culto de louvor e
            adoração e uma vigília pentecostal, com tempo para a convivência entre as famílias e para o
            descanso.
          </p>
          <dl className="lp-pilares">
            <div>
              <dt>Buscar a Deus</dt>
              <dd>Devocional pela manhã, culto de louvor e adoração à noite e uma vigília de oração.</dd>
            </div>
            <div>
              <dt>Fortalecer a família</dt>
              <dd>Dias inteiros juntos, longe da correria, com pais, filhos e irmãos na fé.</dd>
            </div>
            <div>
              <dt>Viver a comunhão</dt>
              <dd>Adultos e jovens com atividades próprias, e todos reunidos nos cultos.</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

function Local() {
  return (
    <section className="lp-faixa lp-mata" id="local" aria-labelledby="t-local">
      <div className="lp-wrap">
        <div className="lp-local-cab">
          <h2 id="t-local" className="lp-h2">
            {evento.local.nome}
          </h2>
          <p className="lp-lead">
            Em {evento.local.cidade}/{evento.local.uf}. Um espaço pensado para cultos, convivência e
            descanso.
          </p>
        </div>

        <ul className="lp-estrutura">
          {evento.estrutura.map((e) => (
            <li key={e.titulo}>
              <span className="lp-estrutura-num">{e.destaque}</span>
              <span className="lp-estrutura-txt">
                <strong>{e.titulo}</strong>
                <span>{e.texto}</span>
              </span>
            </li>
          ))}
        </ul>

        {temMidia ? (
          <Gallery />
        ) : (
          <p className="lp-nota-fotos">
            As fotografias reais do local serão publicadas aqui assim que a organização as enviar.
          </p>
        )}
        {evento.local.mapsUrl && (
          <p>
            <a className="lp-link-claro" href={evento.local.mapsUrl} target="_blank" rel="noopener noreferrer">
              Ver no mapa
            </a>
          </p>
        )}
      </div>
    </section>
  );
}

function Agenda() {
  return (
    <section className="lp-faixa lp-linho" id="agenda" aria-labelledby="t-agenda">
      <div className="lp-wrap">
        <h2 id="t-agenda" className="lp-h2 lp-h2-largo">
          Como são os dias do retiro
        </h2>

        <ol className="lp-calendario" aria-label="Dias do retiro">
          {evento.dias.map((dia) => (
            <li key={dia.numero} className={dia.nota ? "marcado" : undefined}>
              <span className="lp-cal-sem">{dia.rotulo}</span>
              <span className="lp-cal-num">{dia.numero}</span>
              <span className="lp-cal-nota">{dia.nota || " "}</span>
            </li>
          ))}
        </ol>

        <div className="lp-rotina">
          {evento.rotina.map((r) => (
            <div className="lp-periodo" key={r.periodo}>
              <h3>{r.periodo}</h3>
              <ul>
                {r.itens.map((i) => (
                  <li key={i.titulo}>
                    <strong>{i.titulo}</strong>
                    <span>{i.texto}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <aside className="lp-vigilia" aria-label={evento.vigilia.titulo}>
          <h3>{evento.vigilia.titulo}</h3>
          <p>{evento.vigilia.texto}</p>
          <p className="lp-vigilia-nota">{evento.vigilia.nota}</p>
        </aside>

        <p className="lp-rodape-secao">{evento.agendaNota}</p>
      </div>
    </section>
  );
}

function Hospedagem() {
  const h = evento.hospedagem;
  return (
    <section className="lp-hosp" id="hospedagem" aria-labelledby="t-hosp">
      <div className="lp-hosp-topo lp-areia">
        <div className="lp-wrap">
          <h2 id="t-hosp" className="lp-h2">
            Onde cada um dorme
          </h2>
        </div>
      </div>
      <div className="lp-hosp-grade">
        <div className="lp-hosp-bloco lp-areia">
          <div className="lp-wrap-meio">
            <h3>{h.familias.titulo}</h3>
            <p>{h.familias.texto}</p>
          </div>
        </div>
        <div className="lp-hosp-bloco lp-musgo">
          <div className="lp-wrap-meio">
            <h3>{h.jovens.titulo}</h3>
            <p>{h.jovens.texto}</p>
          </div>
        </div>
      </div>
      <p className="lp-hosp-nota lp-areia">
        <span className="lp-wrap">{h.nota}</span>
      </p>
    </section>
  );
}

function Valores() {
  return (
    <section className="lp-faixa lp-mata" id="valores" aria-labelledby="t-valores">
      <div className="lp-wrap lp-duas lp-duas-valores">
        <div>
          <h2 id="t-valores" className="lp-h2">
            O que está incluído no valor
          </h2>
          <ul className="lp-incluso">
            {evento.incluso.map((i) => (
              <li key={i.titulo}>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M5 12.5l4.2 4.2L19 7" />
                </svg>
                <span>
                  <strong>{i.titulo}</strong> {i.texto}
                </span>
              </li>
            ))}
          </ul>
          <p className="lp-carro">{evento.inclusoCarro}</p>
        </div>

        <div className="lp-tabela">
          <h3>Valor por pessoa</h3>
          <ul>
            {evento.faixas.map((f) => (
              <li key={f.id}>
                <span>{f.rotulo}</span>
                <b>{textoValor(f.valor)}</b>
              </li>
            ))}
          </ul>
          <p>A idade é contada em 5 de fevereiro de 2027, data de início do retiro.</p>
          <p>
            As orientações de pagamento serão divulgadas pela organização. O formulário registra o
            cadastro e não confirma pagamento.
          </p>
        </div>
      </div>
    </section>
  );
}

function Transporte() {
  const t = evento.transporte;
  return (
    <section className="lp-faixa lp-linho" id="transporte" aria-labelledby="t-transp">
      <div className="lp-wrap lp-duas">
        <div>
          <h2 id="t-transp" className="lp-h2">
            Transporte e orientações
          </h2>
          <dl className="lp-viagem">
            <div>
              <dt>Ida</dt>
              <dd>
                <strong>{t.ida.dia}</strong>
                <span>{t.ida.texto}</span>
              </dd>
            </div>
            <div>
              <dt>Retorno</dt>
              <dd>
                <strong>{t.retorno.dia}</strong>
                <span>{t.retorno.texto}</span>
              </dd>
            </div>
          </dl>
          <p className="lp-prosa-simples">{t.carroProprio}</p>
          <p className="lp-prosa-simples lp-pendente">{t.pendente}</p>
        </div>
        <div>
          <h3 className="lp-h3">Para se inscrever</h3>
          <ul className="lp-orient">
            {evento.orientacoes.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Duvidas() {
  return (
    <section className="lp-faixa lp-papel" id="duvidas" aria-labelledby="t-faq">
      <div className="lp-wrap lp-duas lp-duas-faq">
        <div>
          <h2 id="t-faq" className="lp-h2">
            Dúvidas frequentes
          </h2>
          <p className="lp-lead-escuro">
            O que ainda não foi definido aparece como “será divulgado pela organização”.
          </p>
        </div>
        <div className="lp-faq">
          {evento.faq.map((q) => (
            <details key={q.p} open={q.aberto ? true : undefined}>
              <summary>
                <span>{q.p}</span>
                <i aria-hidden="true" />
              </summary>
              <p className={q.pendente ? "lp-pendente" : undefined}>{q.r}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function ChamadaFinal() {
  return (
    <section className="lp-final" id="inscrever" aria-labelledby="t-final">
      <div className="lp-wrap lp-final-in">
        <h2 id="t-final">Inscreva sua família</h2>
        <p>
          {evento.dataTexto}, {evento.local.cidade}/{evento.local.uf}. O formulário leva poucos minutos e
          mostra o valor de cada pessoa antes do envio.
        </p>
        <Link to="/inscricao" className="lp-btn lp-btn-brasa lp-btn-grande">
          Inscrever minha família
        </Link>
      </div>
    </section>
  );
}

export function Rodape() {
  const { whatsapp, instagram, email } = evento.contato;
  const temContato = whatsapp || instagram || email;
  return (
    <footer className="lp-foot">
      <div className="lp-wrap lp-foot-in">
        <div className="lp-foot-marcas">
          <img src="/logo-conexao-jovem.png" alt={evento.ministerio} width="44" height="55" loading="lazy" />
          <img src="/logo-igreja.png" alt={`${evento.igreja} de ${evento.igrejaCidade}`} width="44" height="54" loading="lazy" />
        </div>
        <p>
          {evento.nome} {evento.edicao}. Organização da {evento.ministerio}, {evento.igreja} de{" "}
          {evento.igrejaCidade}.
        </p>
        <p>
          {temContato ? (
            <>
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              )}{" "}
              {instagram && (
                <a href={instagram} target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              )}{" "}
              {email && <a href={`mailto:${email}`}>{email}</a>}
            </>
          ) : (
            "Dúvidas: procure a liderança da Conexão Jovem. Os contatos oficiais serão divulgados aqui."
          )}
        </p>
        <p>
          <a href="/inscricao#regras">Regras do retiro</a> <a href="/inscricao#privacidade">Privacidade</a>
        </p>
      </div>
    </footer>
  );
}

/** Barra de inscrição no celular: aparece depois do topo e some junto à chamada final. */
function BarraMovel() {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const topo = document.getElementById("topo");
    const final = document.getElementById("inscrever");
    if (!topo || typeof IntersectionObserver === "undefined") return;
    let topoVisivel = true;
    let finalVisivel = false;
    const atualizar = () => setVisivel(!topoVisivel && !finalVisivel);
    const o1 = new IntersectionObserver(([e]) => {
      topoVisivel = e.isIntersecting;
      atualizar();
    });
    const o2 = new IntersectionObserver(([e]) => {
      finalVisivel = e.isIntersecting;
      atualizar();
    });
    o1.observe(topo);
    if (final) o2.observe(final);
    return () => {
      o1.disconnect();
      o2.disconnect();
    };
  }, []);
  return (
    <div className={`lp-barra${visivel ? " on" : ""}`} aria-hidden={!visivel}>
      <span>
        <b>
          {evento.dataCurta.de}–{evento.dataCurta.ate} de {evento.dataCurta.mes}
        </b>
        <small>
          {evento.local.cidade}/{evento.local.uf}
        </small>
      </span>
      <Link to="/inscricao" className="lp-btn lp-btn-brasa" tabIndex={visivel ? 0 : -1}>
        Inscrever
      </Link>
    </div>
  );
}

export function Landing() {
  return (
    <div className="lp">
      <Cabecalho />
      <main>
        <Inicio />
        <Proposito />
        <Local />
        <Agenda />
        <Hospedagem />
        <Valores />
        <Transporte />
        <Duvidas />
        <ChamadaFinal />
      </main>
      <Rodape />
      <BarraMovel />
    </div>
  );
}
