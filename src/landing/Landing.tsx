import { Link } from "@tanstack/react-router";
import { motion, useMotionTemplate, useScroll, useTransform } from "framer-motion";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { ScrollStory } from "../components/ScrollStory";
import { useMovimento } from "../components/useMovimento";
import { evento } from "../content/evento";
import { tema } from "../content/tema";
import { textoValor } from "../lib/inscricao";
import { Imagem, Midia, fotosDe, marcaInfo, videoInfo, type Foto } from "./Gallery";

const NAV = [
  { href: "#local", rotulo: "Local" },
  { href: "#hospedagem", rotulo: "Hospedagem" },
  { href: "#agenda", rotulo: "Dias" },
  { href: "#valores", rotulo: "Valores" },
  { href: "#transporte", rotulo: "Transporte" },
  { href: "#duvidas", rotulo: "Dúvidas" },
];

function Marca() {
  return (
    <a
      className="lp-marca"
      href="#topo"
      aria-label={`${tema.nome}: ${tema.chamada}. ${evento.ministerio}. Início da página`}
    >
      <img src="/marca/logo-conexao-jovem-verde.png" alt="" width="40" height="50" />
      {marcaInfo ? (
        <img className="pv-marca-arte" src={marcaInfo.src} alt="" height="40" />
      ) : (
        <span className="pv-marca-txt" aria-hidden="true">
          <b>{tema.nome}</b>
          <small>{tema.chamada}</small>
        </span>
      )}
    </a>
  );
}

function Cabecalho() {
  const [aberto, setAberto] = useState(false);
  const [rolou, setRolou] = useState(false);
  useEffect(() => {
    const ler = () => setRolou(window.scrollY > 40);
    ler();
    window.addEventListener("scroll", ler, { passive: true });
    return () => window.removeEventListener("scroll", ler);
  }, []);
  return (
    <header className={`lp-top${rolou || aberto ? " rolou" : ""}`}>
      <a className="lp-skip" href="#conteudo">
        Ir para o conteúdo
      </a>
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
          Fazer meu cadastro
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
              Fazer meu cadastro
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

/** Palavra em letras que sobem em sequência (CSS puro; funciona sem JavaScript). */
function Letras({ texto, base = 0 }: { texto: string; base?: number }) {
  return (
    <span className="pv-palavra" aria-hidden="true">
      {Array.from(texto).map((l, i) => (
        <span key={i} className="pv-letra" style={{ ["--i" as string]: base + i }}>
          {l === " " ? "\u00A0" : l}
        </span>
      ))}
    </span>
  );
}

/* ── 1. Abertura: fotografia do sítio ─────────────────────────────────── */
function Abertura() {
  const ref = useRef<HTMLElement>(null);
  const { reduzir } = useMovimento();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const fotoY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const fotoZoom = useTransform(scrollYProgress, [0, 1], [1.08, 1]);
  const linhaA = useTransform(scrollYProgress, [0, 1], ["0vw", "-12vw"]);
  const linhaB = useTransform(scrollYProgress, [0, 1], ["0vw", "12vw"]);
  const dataY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const d = evento.dataCurta;
  const foto = fotosDe("hero")[0] ?? fotosDe("local")[0];

  return (
    <section ref={ref} className="pv-abertura" id="topo" aria-labelledby="titulo">
      <motion.div
        className="pv-abertura-foto"
        style={reduzir ? undefined : { y: fotoY, scale: fotoZoom }}
      >
        {foto ? <Imagem f={foto} prioridade /> : <Midia grupo="hero" />}
      </motion.div>
      <div className="pv-abertura-veu" aria-hidden="true" />

      <div className="pv-wrap pv-abertura-in">
        <h1 id="titulo" className="pv-nome">
          <span className="pv-sr">
            {tema.nome}: {tema.chamada}. {evento.nome} {evento.edicao}
          </span>
          <span className="pv-evento" aria-hidden="true">
            {evento.nome} {evento.edicao}
          </span>
          <motion.span className="pv-dunamis" style={reduzir ? undefined : { x: linhaA }}>
            {marcaInfo ? (
              <img className="pv-dunamis-arte" src={marcaInfo.src} alt="" />
            ) : (
              <Letras texto={tema.nome} base={4} />
            )}
          </motion.span>
          <motion.span
            className="pv-poder"
            aria-hidden="true"
            style={reduzir ? undefined : { x: linhaB }}
          >
            <Letras texto={tema.chamada} base={14} />
          </motion.span>
        </h1>

        <motion.div className="pv-data" style={reduzir ? undefined : { y: dataY }}>
          <p className="pv-data-num">
            <span className="pv-sr">{evento.dataTexto}</span>
            <span aria-hidden="true">
              {d.de}–{d.ate}
            </span>
          </p>
          <p className="pv-data-txt" aria-hidden="true">
            de {d.mes}
            <br />
            de {d.ano}
          </p>
        </motion.div>

        <div className="pv-abertura-rodape">
          <p className="pv-abertura-local">
            {evento.local.nome}
            <br />
            {evento.local.cidade}/{evento.local.uf}
          </p>
          <div className="pv-abertura-acoes">
            <Link to="/inscricao" className="lp-btn lp-btn-brasa lp-btn-grande">
              Fazer meu cadastro
            </Link>
            <a className="pv-link" href="#valores">
              Ver o que está incluído
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 2. Vídeo em tela cheia (expande com a rolagem) ───────────────────── */
function VideoCinema() {
  const ref = useRef<HTMLElement>(null);
  const palco = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const { reduzir } = useMovimento();
  const [som, setSom] = useState(false);
  const [tocando, setTocando] = useState(false);
  const [erroReproducao, setErroReproducao] = useState(false);
  const [telaCheia, setTelaCheia] = useState(false);
  const [erroTelaCheia, setErroTelaCheia] = useState(false);
  const [telaEstreita, setTelaEstreita] = useState(false);
  const temVideo = !!videoInfo?.src;

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start start"] });
  const v = useTransform(scrollYProgress, [0, 1], [11, 0]);
  const h = useTransform(scrollYProgress, [0, 1], [7, 0]);
  const r = useTransform(scrollYProgress, [0, 1], [28, 0]);
  const zoom = useTransform(scrollYProgress, [0, 1], [1.18, 1]);
  const recorte = useMotionTemplate`inset(${v}svh ${h}vw round ${r}px)`;

  useEffect(() => {
    const consulta = window.matchMedia("(max-width: 47.99rem)");
    const atualizar = () => setTelaEstreita(consulta.matches);
    atualizar();
    if (consulta.addEventListener) {
      consulta.addEventListener("change", atualizar);
      return () => consulta.removeEventListener("change", atualizar);
    }
    consulta.addListener(atualizar);
    return () => consulta.removeListener(atualizar);
  }, []);

  // Pré-carrega apenas os metadados; o vídeo começa após a pessoa ativar o som.
  useEffect(() => {
    const el = video.current;
    if (!el || !temVideo) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    let carregar: IntersectionObserver | undefined;
    if (!reduzir && !conn?.saveData) {
      carregar = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            el.preload = "metadata";
            el.load();
            carregar?.disconnect();
          }
        },
        { rootMargin: "900px 0px", threshold: 0 },
      );
      carregar.observe(el);
    }
    const visibilidade = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting && !el.paused) {
        el.pause();
        setTocando(false);
      }
    });
    visibilidade.observe(el);
    return () => {
      carregar?.disconnect();
      visibilidade.disconnect();
    };
  }, [temVideo, reduzir]);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const sincronizar = () => {
      const videoWebkit = el as HTMLVideoElement & { webkitDisplayingFullscreen?: boolean };
      setTelaCheia(
        document.fullscreenElement === palco.current ||
          document.fullscreenElement === el ||
          videoWebkit.webkitDisplayingFullscreen === true,
      );
    };
    document.addEventListener("fullscreenchange", sincronizar);
    el.addEventListener("webkitbeginfullscreen", sincronizar);
    el.addEventListener("webkitendfullscreen", sincronizar);
    return () => {
      document.removeEventListener("fullscreenchange", sincronizar);
      el.removeEventListener("webkitbeginfullscreen", sincronizar);
      el.removeEventListener("webkitendfullscreen", sincronizar);
    };
  }, [temVideo]);

  const reproduzirComSom = () => {
    const el = video.current;
    if (!el) return;
    el.muted = false;
    el.volume = 1;
    setSom(true);
    setErroReproducao(false);
    if (el.paused)
      el.play().then(
        () => setTocando(true),
        () => setErroReproducao(true),
      );
  };

  const alternarSom = () => {
    const el = video.current;
    if (!el) return;
    if (el.muted) reproduzirComSom();
    else {
      el.muted = true;
      setSom(false);
    }
  };
  const alternarPlay = () => {
    const el = video.current;
    if (!el) return;
    if (el.paused) reproduzirComSom();
    else {
      el.pause();
      setTocando(false);
    }
  };

  const alternarTelaCheia = async () => {
    const el = video.current as
      | (HTMLVideoElement & {
          webkitEnterFullscreen?: () => void;
          webkitExitFullscreen?: () => void;
          webkitDisplayingFullscreen?: boolean;
        })
      | null;
    if (!el) return;
    setErroTelaCheia(false);
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      if (el.webkitDisplayingFullscreen && el.webkitExitFullscreen) {
        el.webkitExitFullscreen();
        return;
      }
      if (palco.current?.requestFullscreen) {
        await palco.current.requestFullscreen();
        return;
      }
      if (el.webkitEnterFullscreen) {
        el.webkitEnterFullscreen();
        return;
      }
      setErroTelaCheia(true);
    } catch {
      if (el.webkitEnterFullscreen) el.webkitEnterFullscreen();
      else setErroTelaCheia(true);
    }
  };

  return (
    <section ref={ref} className="pv-video" id="video" aria-label="Vídeo do retiro">
      <div ref={palco} className="pv-video-palco">
        <motion.div className="pv-video-quadro" style={reduzir ? undefined : { clipPath: recorte }}>
          {temVideo ? (
            <motion.div
              className="pv-video-midia"
              style={reduzir || telaEstreita ? undefined : { scale: zoom }}
            >
              <video
                ref={video}
                muted={!som}
                loop
                playsInline
                preload="none"
                poster={videoInfo?.poster}
                aria-label={videoInfo?.titulo}
                onPlay={() => setTocando(true)}
                onPause={() => setTocando(false)}
              >
                <source src={videoInfo?.src} />
              </video>
            </motion.div>
          ) : (
            <div
              className="pv-reserva pv-reserva-video"
              role="img"
              aria-label="Espaço reservado: vídeo real pendente"
            >
              <span className="pv-reserva-selo">
                Vídeo real pendente
                <small>Envie o vídeo do retiro (MP4) para ocupar esta tela</small>
              </span>
            </div>
          )}
        </motion.div>

        {temVideo && (
          <div className="pv-video-controles">
            {(!tocando || erroTelaCheia) && (
              <p className="pv-video-aviso" role="status">
                {erroTelaCheia
                  ? "A tela cheia não está disponível neste navegador."
                  : erroReproducao
                  ? "O vídeo não iniciou. Toque em “Reproduzir com som” para tentar novamente."
                  : "Este vídeo tem som. Toque em “Reproduzir com som” para assistir."}
              </p>
            )}
            <button type="button" onClick={alternarPlay}>
              {tocando ? "Pausar vídeo" : "Reproduzir com som"}
            </button>
            <button type="button" onClick={alternarSom}>
              {som ? "Desativar som" : "Ativar som"}
            </button>
            <button type="button" onClick={alternarTelaCheia}>
              {telaCheia ? "Sair da tela cheia" : "Ver em tela cheia"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Cartão interativo: abre ao toque, ao teclado e ao passar o mouse ── */
function Cartao({
  variante,
  titulo,
  destaque,
  children,
  padrao = false,
  imagem,
}: {
  variante: string;
  titulo: ReactNode;
  destaque?: ReactNode;
  children: ReactNode;
  padrao?: boolean;
  imagem?: ReactNode;
}) {
  const [aberto, setAberto] = useState(padrao);
  const id = useId();
  return (
    <div
      className={`pv-cartao pv-cartao-${variante}${aberto ? " aberto" : ""}`}
      onPointerEnter={(e) => e.pointerType === "mouse" && setAberto(true)}
    >
      {imagem && <div className="pv-cartao-img">{imagem}</div>}
      <button
        type="button"
        className="pv-cartao-topo"
        aria-expanded={aberto}
        aria-controls={id}
        onClick={() => setAberto((v) => !v)}
      >
        {destaque && <span className="pv-cartao-destaque">{destaque}</span>}
        <span className="pv-cartao-titulo">{titulo}</span>
        <i aria-hidden="true" />
      </button>
      <div id={id} className="pv-cartao-corpo">
        <div>{children}</div>
      </div>
    </div>
  );
}

/* ── 3. Fundamento bíblico: Atos 1:8 ───────────────────────────────── */
function Fundamento() {
  return (
    <section className="pv-fundamento" id="tema" aria-labelledby="t-tema">
      <div className="pv-wrap">
        <h2 id="t-tema" className="pv-titulo">
          {tema.nome}: {tema.chamada}
        </h2>
        <figure className="pv-versiculo">
          <blockquote>
            <p>“{tema.versiculo}”</p>
          </blockquote>
          <figcaption>{tema.referencia}</figcaption>
        </figure>
        <p className="pv-nota">{tema.nota}</p>

        <ol className="pv-ideias" aria-label="Três ideias do tema">
          {tema.ideias.map((i) => (
            <li key={i.titulo}>
              <h3>{i.titulo}</h3>
              <p>{i.texto}</p>
            </li>
          ))}
        </ol>

        <h3 className="pv-h3 pv-refs-titulo">Outras passagens que sustentam o tema</h3>
        <div className="pv-refs">
          {tema.referencias.map((r) => (
            <Cartao key={r.ref} variante="ref" destaque={r.ref} titulo={r.papel}>
              {r.texto}
            </Cartao>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 4. Proposta ──────────────────────────────────────────────────────── */
function Proposta() {
  return (
    <section className="pv-proposta" id="proposito" aria-labelledby="t-proposito">
      <div className="pv-wrap pv-proposta-grade">
        <div className="pv-proposta-texto">
          <h2 id="t-proposito" className="pv-titulo">
            Um tempo separado para estar diante de Deus com a família
          </h2>
          <p className="pv-lead">
            O {evento.nome} {evento.edicao} reúne famílias, adultos e jovens da {evento.igreja} de{" "}
            {evento.igrejaCidade} em Campos do Jordão. A rotina combina devocional, culto de louvor
            e adoração e uma vigília pentecostal, com tempo para a convivência entre as famílias e
            para o descanso.
          </p>
        </div>
        <div className="pv-proposta-fotos">
          <figure className="pv-foto pv-foto-a" data-rev>
            <Midia grupo="adoracao" i={0} />
          </figure>
          <figure className="pv-foto pv-foto-b" data-rev>
            <Midia grupo="adoracao" i={1} />
          </figure>
        </div>
        <div className="pv-pilares">
          <Cartao variante="pilar" titulo="Buscar a Deus" padrao>
            Devocional pela manhã, culto de louvor e adoração à noite e uma vigília de oração.
          </Cartao>
          <Cartao variante="pilar" titulo="Fortalecer a família">
            Dias inteiros juntos, longe da correria, com pais, filhos e irmãos na fé.
          </Cartao>
          <Cartao variante="pilar" titulo="Viver a comunhão">
            Adultos e jovens com atividades próprias, e todos reunidos nos cultos.
          </Cartao>
        </div>
      </div>
    </section>
  );
}

/* ── 5. Local ─────────────────────────────────────────────────────────── */
function Local() {
  return (
    <section className="pv-local" id="local" aria-labelledby="t-local">
      <div className="pv-wrap">
        <h2 id="t-local" className="pv-titulo pv-titulo-claro">
          {evento.local.nome}
        </h2>
        <p className="pv-lead pv-lead-claro">
          Em {evento.local.cidade}/{evento.local.uf}. Um espaço pensado para cultos, convivência e
          descanso.
        </p>

        <div className="pv-local-fotos">
          <figure className="pv-foto pv-foto-fachada" data-rev>
            <Midia grupo="local" i={0} />
          </figure>
          <figure className="pv-foto pv-foto-culto" data-rev>
            <Midia grupo="culto" i={0} />
          </figure>
        </div>

        <div className="pv-estrutura">
          {evento.estrutura.map((e) => (
            <Cartao key={e.titulo} variante="estrutura" destaque={e.destaque} titulo={e.titulo}>
              {e.texto}
            </Cartao>
          ))}
        </div>

        {evento.local.mapsUrl && (
          <p>
            <a
              className="pv-link"
              href={evento.local.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver no mapa
            </a>
          </p>
        )}
      </div>
    </section>
  );
}

/* ── 6. Hospedagem ────────────────────────────────────────────────────── */
function Hospedagem() {
  const h = evento.hospedagem;
  return (
    <section className="pv-hosp" id="hospedagem" aria-labelledby="t-hosp">
      <div className="pv-wrap">
        <h2 id="t-hosp" className="pv-titulo">
          Quartos
        </h2>
        <div className="pv-quartos">
          {[0, 1, 2].map((i) => (
            <figure key={i} className={`pv-foto pv-quarto pv-quarto-${i}`} data-rev>
              <Midia grupo="quartos" i={i} />
            </figure>
          ))}
        </div>
        <div className="pv-hosp-blocos">
          <article className="pv-hosp-bloco">
            <h3>{h.familias.titulo}</h3>
            <p>{h.familias.texto}</p>
          </article>
          <article className="pv-hosp-bloco pv-hosp-jovens">
            <h3>{h.jovens.titulo}</h3>
            <p>{h.jovens.texto}</p>
          </article>
        </div>
        <p className="pv-nota">{h.nota}</p>
      </div>
    </section>
  );
}

/* ── 7. Programação ───────────────────────────────────────────────────── */
const FOTO_PERIODO: Record<number, { grupo: "adoracao" | "convivencia"; i: number }> = {
  0: { grupo: "adoracao", i: 2 },
  1: { grupo: "convivencia", i: 1 },
  2: { grupo: "adoracao", i: 3 },
};

function Vigilia() {
  const ref = useRef<HTMLElement>(null);
  const { reduzir } = useMovimento();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 30%"] });
  const fundo = useTransform(scrollYProgress, [0, 1], ["#f7f6f1", "#0a1a15"]);
  const cor = useTransform(scrollYProgress, [0, 1], ["#0e2a21", "#f7f6f1"]);
  return (
    <motion.aside
      ref={ref}
      className="pv-vigilia"
      aria-label={evento.vigilia.titulo}
      style={reduzir ? undefined : { backgroundColor: fundo, color: cor }}
    >
      <div className="pv-wrap pv-vigilia-in">
        <h3 className="pv-titulo">{evento.vigilia.titulo}</h3>
        <div>
          <p className="pv-lead">{evento.vigilia.texto}</p>
          <p className="pv-nota">{evento.vigilia.nota}</p>
        </div>
      </div>
    </motion.aside>
  );
}

function Agenda() {
  return (
    <section className="pv-agenda" id="agenda" aria-labelledby="t-agenda">
      <div className="pv-wrap">
        <h2 id="t-agenda" className="pv-titulo">
          Como são os dias do retiro
        </h2>

        <ol className="pv-dias" aria-label="Dias do retiro">
          {evento.dias.map((dia) => (
            <li key={dia.numero} className={dia.nota ? "marcado" : undefined}>
              <span className="pv-dia-num">{dia.numero}</span>
              <span className="pv-dia-sem">{dia.rotulo}</span>
              {dia.nota && <span className="pv-dia-nota">{dia.nota}</span>}
            </li>
          ))}
        </ol>

        <div className="pv-rotina">
          {evento.rotina.map((r, idx) => {
            const f = FOTO_PERIODO[idx % 3];
            return (
              <Cartao
                key={r.periodo}
                variante="rotina"
                titulo={r.periodo}
                padrao={idx === 0}
                imagem={<Midia grupo={f.grupo} i={f.i} />}
              >
                <ul>
                  {r.itens.map((i) => (
                    <li key={i.titulo}>
                      <strong>{i.titulo}</strong>
                      <span>{i.texto}</span>
                    </li>
                  ))}
                </ul>
              </Cartao>
            );
          })}
        </div>
        <p className="pv-nota">{evento.agendaNota}</p>
      </div>
      <Vigilia />
    </section>
  );
}

const FOTOS_ADICIONAIS = [
  { grupo: "adoracao", indice: 2 },
  { grupo: "convivencia", indice: 1 },
  { grupo: "adoracao", indice: 3 },
  { grupo: "adoracao", indice: 4 },
  { grupo: "adoracao", indice: 5 },
  { grupo: "adoracao", indice: 6 },
] as const;

/** Exibe as fotos reais ainda não usadas nas outras seções. */
function FotosAdicionais() {
  const fotos = FOTOS_ADICIONAIS.map(({ grupo, indice }) => fotosDe(grupo)[indice]).filter(
    (foto): foto is Foto => !!foto,
  );
  if (fotos.length === 0) return null;

  return (
    <section className="pv-momentos" aria-labelledby="t-momentos">
      <div className="pv-wrap">
        <h2 id="t-momentos" className="pv-titulo">
          Mais momentos do retiro
        </h2>
        <div className="pv-momentos-grade">
          {fotos.map((foto) => (
            <figure className="pv-foto pv-momentos-foto" key={foto.src} data-rev>
              <Imagem f={foto} />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 8. Valores ───────────────────────────────────────────────────────── */
function Valores() {
  return (
    <section className="pv-valores" id="valores" aria-labelledby="t-valores">
      <div className="pv-wrap pv-valores-grade">
        <div>
          <h2 id="t-valores" className="pv-titulo">
            O que está incluído no valor
          </h2>
          <ul className="pv-incluso">
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
          <p className="pv-nota-forte">{evento.inclusoCarro}</p>
        </div>

        <div className="pv-precos">
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
            Pix: quitação até 16 de janeiro de 2027 (20 dias antes do retiro). Cartão de crédito:
            até 10 parcelas de R$ 50,00 (R$ 500,00 no total). O formulário registra o cadastro e
            não confirma pagamento.
          </p>
          <Link to="/inscricao" className="lp-btn lp-btn-grande pv-btn-tinta">
            Fazer meu cadastro
          </Link>
        </div>
      </div>
    </section>
  );
}

function Transporte() {
  const t = evento.transporte;
  return (
    <section className="pv-transp" id="transporte" aria-labelledby="t-transp">
      <div className="pv-wrap pv-transp-grade">
        <div>
          <h2 id="t-transp" className="pv-titulo">
            Transporte e orientações
          </h2>
          <dl className="pv-viagem">
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
          <aside className="pv-carro" aria-labelledby="t-carro">
            <span aria-hidden="true">🚗</span>
            <div>
              <h3 id="t-carro">Vai de carro próprio?</h3>
              <p>{t.carroProprio}</p>
              <strong>Você escolhe o carro próprio no cadastro de cada participante.</strong>
            </div>
          </aside>
          <p className="lp-pendente">{t.pendente}</p>
        </div>
        <div>
          <h3 className="pv-h3">Para se inscrever</h3>
          <ol className="pv-orient">
            {evento.orientacoes.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Duvidas() {
  return (
    <section className="pv-duvidas" id="duvidas" aria-labelledby="t-faq">
      <div className="pv-wrap pv-duvidas-grade">
        <div>
          <h2 id="t-faq" className="pv-titulo">
            Dúvidas frequentes
          </h2>
          <p className="pv-lead">
            O que ainda não foi definido aparece como “será divulgado pela organização”.
          </p>
        </div>
        <div className="pv-faq">
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
    <section className="pv-final" id="inscrever" aria-labelledby="t-final">
      <div className="pv-wrap pv-final-in">
        <h2 id="t-final">Faça seu cadastro</h2>
        <p>
          Um cadastro por pessoa, inclusive para menores. {evento.dataTexto}, {evento.local.cidade}/
          {evento.local.uf}. O formulário mostra o valor antes do envio.
        </p>
        <Link to="/inscricao" className="lp-btn lp-btn-grande pv-btn-tinta">
          Fazer meu cadastro
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
          <img
            src="/marca/logo-conexao-jovem-verde.png"
            alt={evento.ministerio}
            width="44"
            height="55"
            loading="lazy"
          />
          <img
            src="/logo-igreja.png"
            alt={`${evento.igreja} de ${evento.igrejaCidade}`}
            width="44"
            height="54"
            loading="lazy"
          />
        </div>
        <p>
          {evento.nome} {evento.edicao}. Organização da {evento.ministerio}, {evento.igreja} de{" "}
          {evento.igrejaCidade}.
        </p>
        <p>Líder de jovens: Dc Geovane Pereira · Pastor Presidente: Ricardo Ribeiro.</p>
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
          <a href="/inscricao#regras">Regras do retiro</a>{" "}
          <a href="/inscricao#privacidade">Privacidade</a>
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
  const raiz = useRef<HTMLDivElement>(null);

  // Revelação das fotos ao entrar na tela. Sem JavaScript, tudo já aparece.
  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    el.classList.add("js");
    if (typeof IntersectionObserver === "undefined") return;
    const o = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("on");
            o.unobserve(e.target);
          }
        }),
      { threshold: 0.15 },
    );
    el.querySelectorAll("[data-rev]").forEach((n) => o.observe(n));
    return () => o.disconnect();
  }, []);

  return (
    <div className="lp pv" ref={raiz}>
      <Cabecalho />
      <main id="conteudo">
        <Abertura />
        <VideoCinema />
        <ScrollStory />
        <Fundamento />
        <Proposta />
        <Local />
        <Hospedagem />
        <FotosAdicionais />
        <Agenda />
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
