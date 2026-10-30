import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "framer-motion";

import { evento } from "../content/evento";
import { fotosDe } from "../landing/Gallery";
import { useMovimento } from "./useMovimento";

/* ── Textos (edite aqui) ─────────────────────────────────────────────────── */
const ROTULO_FASE_1 = `${evento.nome} ${evento.edicao}`;
const ROTULO_FASE_2 = "O que nos reúne";
const ROTULO_MARCAS = "Realização";

/** Fase 1: títulos que migram para o lado. A foto (opcional) vem de media.json. */
const TITLES: { texto: string; grupo?: "local" | "adoracao" | "convivencia" }[] = [
  { texto: "Permanecer", grupo: "local" },
  { texto: "Adorar", grupo: "adoracao" },
  { texto: "Conectar", grupo: "convivencia" },
];

/** Fase 2: linhas que sobem em pilha. */
const LINES: string[][] = [["Uma", "geração"], ["Uma só", "fé"], ["Uma", "presença"]];

const MARCAS = [
  { src: "/logo-conexao-jovem.png", nome: evento.ministerio },
  { src: "/logo-igreja.png", nome: `${evento.igreja} · ${evento.igrejaCidade}` },
];

/* ── Linha do tempo (progresso 0 → 1 do wrapper) ─────────────────────────── */
const FIM_FASE_1 = 0.42; // último título sai
const INICIO_FASE_2 = 0.42; // primeira linha começa a entrar (cruzamento)
const PRIMEIRA_LINHA = 0.52;
const ULTIMA_LINHA = 0.96;
const SPRING = { stiffness: 120, damping: 30, mass: 0.4 };

/** Pontos de translação lateral: segura, desliza, segura. `fator` > 1 = parallax mais rápido. */
function faixaX(n: number, fator = 1) {
  const passo = FIM_FASE_1 / (n - 1);
  const entrada: number[] = [0];
  const saida: string[] = ["0vw"];
  for (let k = 0; k < n - 1; k++) {
    entrada.push(k * passo + passo * 0.2, (k + 1) * passo - passo * 0.2);
    saida.push(`${-k * 100 * fator}vw`, `${-(k + 1) * 100 * fator}vw`);
  }
  entrada.push(1);
  saida.push(`${-(n - 1) * 100 * fator}vw`);
  return { entrada, saida };
}

type Vel = {
  skewX: MotionValue<number>;
  filtro: MotionValue<string>;
  ciano: MotionValue<number>;
  magenta: MotionValue<number>;
};

function Titulo({
  texto,
  imagem,
  alt,
  vel,
  progresso,
  fatorSticker,
  compacto,
}: {
  texto: string;
  imagem?: string;
  alt?: string;
  vel: Vel;
  progresso: MotionValue<number>;
  fatorSticker: { entrada: number[]; saida: string[] };
  compacto: boolean;
}) {
  // diferença entre a translação do sticker (1,4×) e a da faixa (1×)
  const stickerX = useTransform(progresso, fatorSticker.entrada, fatorSticker.saida);
  return (
    <div className="ss-titulo">
      {imagem && (
        <motion.figure className="ss-sticker" style={{ x: stickerX }} aria-hidden="true">
          <img src={imagem} alt={alt ?? ""} loading="lazy" decoding="async" />
        </motion.figure>
      )}
      <motion.div className="ss-texto" style={{ skewX: vel.skewX, filter: vel.filtro }}>
        {!compacto && (
          <>
            <motion.span className="ss-camada ss-cian" style={{ x: vel.ciano }} aria-hidden="true">
              {texto}
            </motion.span>
            <motion.span className="ss-camada ss-magenta" style={{ x: vel.magenta }} aria-hidden="true">
              {texto}
            </motion.span>
          </>
        )}
        <span className="ss-principal" aria-hidden="true">
          {texto}
        </span>
      </motion.div>
    </div>
  );
}

function Linha({
  palavras,
  indice,
  total,
  progresso,
}: {
  palavras: string[];
  indice: number;
  total: number;
  progresso: MotionValue<number>;
}) {
  const ultima = indice === total - 1;
  const passo = total > 1 ? (ULTIMA_LINHA - PRIMEIRA_LINHA) / (total - 1) : 0.3;
  const c = PRIMEIRA_LINHA + indice * passo; // centro da linha ativa

  // chave: [ponto, y(vh), opacidade, desfoque(px)]
  const pontos: [number, number, number, number][] = [];
  if (indice === 0) {
    pontos.push([INICIO_FASE_2, 30, 0, 12]);
  } else {
    pontos.push([c - passo * 0.8, 30, 0, 12], [c - passo * 0.5, 14, 0.25, 9]);
  }
  pontos.push([c, 0, 1, 0]);
  if (!ultima) {
    pontos.push([c + passo * 0.15, 0, 1, 0], [c + passo * 0.45, -30, 0, 12]);
  } else {
    pontos.push([1, 0, 1, 0]);
  }

  const t = pontos.map((p) => p[0]);
  const y = useTransform(progresso, t, pontos.map((p) => `${p[1]}vh`));
  const opacity = useTransform(progresso, t, pontos.map((p) => p[2]));
  const desfoque = useTransform(progresso, t, pontos.map((p) => p[3]));
  const filter = useMotionTemplate`blur(${desfoque}px)`;
  const pop = useTransform(progresso, [c - passo * 0.25, c], [0.6, 1], { clamp: true });

  return (
    <motion.p className="ss-linha" style={{ y, opacity, filter }}>
      <span className="ss-linha-txt">
        {palavras.map((p) => (
          <span key={p} className="ss-linha-palavra">
            {p}
          </span>
        ))}
      </span>
      <motion.i className="ss-pop" style={{ scale: pop }} aria-hidden="true" />
    </motion.p>
  );
}

function Marquee() {
  const itens = [...MARCAS, ...MARCAS, ...MARCAS, ...MARCAS];
  return (
    <div className="ss-marcas" aria-label={ROTULO_MARCAS}>
      <p className="ss-marcas-rotulo">{ROTULO_MARCAS}</p>
      <div className="ss-marquee">
        <ul className="ss-marquee-trilho">
          {itens.map((m, i) => (
            <li key={i} aria-hidden={i >= MARCAS.length ? "true" : undefined}>
              <img src={m.src} alt="" width="48" height="60" loading="lazy" />
              <span>{m.nome}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Animado({ compacto }: { compacto: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const { scrollY } = useScroll();
  const p = useSpring(scrollYProgress, SPRING);
  const velocidade = useSpring(useVelocity(scrollY), SPRING);

  // velocidade → inclinação, desfoque e aberração cromática
  const inclinacao = useTransform(velocidade, [-3000, 3000], [-12, 12], { clamp: true });
  const skewX = useTransform(inclinacao, (v) => v - 8); // -8°: itálico simulado
  const desfoqueVel = useTransform(velocidade, (v) => Math.min(compacto ? 3 : 6, Math.abs(v) / 450));
  const filtro = useMotionTemplate`blur(${desfoqueVel}px)`;
  const ciano = useTransform(velocidade, [-3000, 3000], [-16, 16], { clamp: true });
  const magenta = useTransform(ciano, (v) => -v);
  const vel: Vel = { skewX, filtro, ciano, magenta };

  const n = TITLES.length;
  const faixa = faixaX(n);
  const sticker = faixaX(n, 1.4);
  const x = useTransform(p, faixa.entrada, faixa.saida);
  const saidaFase1 = useTransform(p, [FIM_FASE_1, 0.5], [1, 0], { clamp: true });
  const saidaBlur = useTransform(p, [FIM_FASE_1, 0.5], [0, 14], { clamp: true });
  const saidaFiltro = useMotionTemplate`blur(${saidaBlur}px)`;
  const rotulo1 = useTransform(p, [0.38, 0.46], [1, 0], { clamp: true });
  const rotulo2 = useTransform(p, [0.46, 0.54], [0, 1], { clamp: true });
  const final = useTransform(p, [0.9, 1], [0, 1], { clamp: true });

  const passos = n - 1 + LINES.length;

  return (
    <section
      ref={ref}
      className="ss"
      style={{ ["--ss-passos" as string]: passos + 1 }}
      aria-labelledby="ss-titulo"
    >
      <h2 id="ss-titulo" className="pv-sr">
        {TITLES.map((t) => t.texto).join(", ")}
      </h2>
      <p className="pv-sr">{LINES.map((l) => l.join(" ")).join(". ")}.</p>

      <div className="ss-palco" aria-hidden="true">
        <div className="ss-rotulos">
          <motion.span style={{ opacity: rotulo1 }}>{ROTULO_FASE_1}</motion.span>
          <motion.span style={{ opacity: rotulo2 }}>{ROTULO_FASE_2}</motion.span>
        </div>

        <motion.div className="ss-fase1" style={{ opacity: saidaFase1, filter: saidaFiltro }}>
          <motion.div className="ss-faixa" style={{ x, width: `${n * 100}vw` }}>
            {TITLES.map((t) => {
              const foto = t.grupo ? fotosDe(t.grupo)[0] : undefined;
              return (
                <Titulo
                  key={t.texto}
                  texto={t.texto}
                  imagem={foto?.src}
                  alt={foto?.alt}
                  vel={vel}
                  progresso={p}
                  fatorSticker={sticker}
                  compacto={compacto}
                />
              );
            })}
          </motion.div>
        </motion.div>

        <div className="ss-fase2">
          {LINES.map((l, i) => (
            <Linha key={l.join(" ")} palavras={l} indice={i} total={LINES.length} progresso={p} />
          ))}
        </div>
        <motion.span className="ss-fim" style={{ opacity: final }} />
      </div>
    </section>
  );
}

/** Versão sem movimento: mesma mensagem, sem trava de rolagem, sem deslocamento. */
function Estatico() {
  return (
    <section className="ss-estatico" aria-labelledby="ss-titulo">
      <div className="pv-wrap">
        <p className="ss-rotulo-fixo">{ROTULO_FASE_1}</p>
        <h2 id="ss-titulo" className="ss-estatico-titulos">
          {TITLES.map((t) => (
            <span key={t.texto}>{t.texto}</span>
          ))}
        </h2>
        <p className="ss-rotulo-fixo">{ROTULO_FASE_2}</p>
        <p className="ss-estatico-linhas">
          {LINES.map((l) => (
            <span key={l.join(" ")}>{l.join(" ")}</span>
          ))}
        </p>
      </div>
    </section>
  );
}

export function ScrollStory() {
  const { reduzir, compacto } = useMovimento();
  return (
    <>
      {reduzir ? <Estatico /> : <Animado compacto={compacto} />}
      <Marquee />
    </>
  );
}
