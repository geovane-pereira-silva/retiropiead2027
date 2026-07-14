import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bed,
  Church,
  Presentation,
  GraduationCap,
  UtensilsCrossed,
  Coffee,
  Waves,
  Trees,
  Car,
  Check,
  MapPin,
  QrCode,
  CreditCard,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";

import heroImg from "../assets/hero-santa-clara.jpg";
import { retiro } from "../content/retiro";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `Retiro ${retiro.nome} ${retiro.edicao} — ${retiro.tema}` },
      {
        name: "description",
        content: `Retiro ${retiro.nome} ${retiro.edicao} no Sítio Santa Clara, Campos do Jordão. ${retiro.dataTexto}. Inscrições abertas.`,
      },
      { property: "og:title", content: `Retiro ${retiro.nome} ${retiro.edicao} — ${retiro.tema}` },
      {
        property: "og:description",
        content: `Sítio Santa Clara · Campos do Jordão · ${retiro.dataTexto}. Três dias de comunhão e crescimento.`,
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Landing,
});

const iconMap: Record<string, LucideIcon> = {
  Bed, Church, Presentation, GraduationCap, UtensilsCrossed, Coffee, Waves, Trees, Car,
};

function Landing() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Sobre />
        <Local />
        <Estrutura />
        <Programacao />
        <Incluso />
        <Valores />
        <Depoimentos />
        <Faq />
        <Localizacao />
        <CtaFinal />
      </main>
      <SiteFooter />
    </>
  );
}

/* ————————————————————————— Header ————————————————————————— */
function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className="site-header">
      <div className={`site-header-inner ${scrolled ? "glass" : ""}`}>
        <a href="#top" className="flex items-center gap-2 font-display text-lg font-semibold">
          <Sparkles size={18} className="text-[color:var(--color-gold)]" />
          {retiro.nome}
        </a>
        <nav>
          <a href="#sobre">Retiro</a>
          <a href="#local">Local</a>
          <a href="#programacao">Programação</a>
          <a href="#valores">Valores</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a href="#inscricao" className="btn btn-primary" style={{ padding: "0.55rem 1.1rem", fontSize: "0.85rem" }}>
          Inscreva-se <ArrowRight size={16} />
        </a>
      </div>
    </header>
  );
}

/* ————————————————————————— Hero ————————————————————————— */
function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero-bg">
        <img src={heroImg} alt="Vista das montanhas em Campos do Jordão ao amanhecer" width={1536} height={1920} />
      </div>
      <div className="container-x hero-content">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="kicker">Retiro {retiro.nome} · {retiro.edicao}</span>
          <h1>{retiro.hero.titulo}</h1>
          <p className="lead" style={{ color: "rgba(245,242,234,0.85)", fontSize: "1.2rem", maxWidth: "34rem" }}>
            {retiro.dataTexto} · {retiro.local.nome}, {retiro.local.cidade} — {retiro.local.uf}
          </p>
          <p className="verse">{retiro.hero.versiculo}</p>
          <div className="hero-cta">
            <a href="#inscricao" className="btn btn-primary">Quero participar <ArrowRight size={18} /></a>
            <a href="#local" className="btn btn-ghost">Conheça o local</a>
          </div>
          <Countdown target={retiro.dataInicio} />
        </motion.div>
      </div>
    </section>
  );
}

function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, new Date(target).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  const s = Math.floor((diff / 1000) % 60);
  const cells = [
    { n: d, l: "Dias" }, { n: h, l: "Horas" }, { n: m, l: "Min" }, { n: s, l: "Seg" },
  ];
  return (
    <div className="countdown" aria-label="Contagem regressiva">
      {cells.map((c) => (
        <div className="cell" key={c.l}>
          <div className="num">{String(c.n).padStart(2, "0")}</div>
          <div className="lbl">{c.l}</div>
        </div>
      ))}
    </div>
  );
}

/* ————————————————————————— Section wrapper ————————————————————————— */
function Section({ id, kicker, title, lead, children }: {
  id?: string; kicker?: string; title: string; lead?: string; children?: React.ReactNode;
}) {
  return (
    <section id={id} style={{ padding: "6rem 0" }}>
      <div className="container-x">
        <div style={{ maxWidth: "42rem", marginBottom: "2.5rem" }}>
          {kicker && <span className="kicker">{kicker}</span>}
          <h2 className="section-title">{title}</h2>
          {lead && <p className="lead">{lead}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

/* ————————————————————————— Sobre ————————————————————————— */
function Sobre() {
  return (
    <Section id="sobre" kicker="Sobre o retiro" title="Três dias. Uma jornada.">
      <div className="grid-3">
        {retiro.sobre.map((s) => (
          <div className="card" key={s.titulo}>
            <h3 className="font-display" style={{ fontSize: "1.35rem", margin: "0 0 0.5rem" }}>{s.titulo}</h3>
            <p style={{ color: "var(--color-muted)", lineHeight: 1.55, margin: 0 }}>{s.texto}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ————————————————————————— Local ————————————————————————— */
function Local() {
  return (
    <Section id="local" kicker="Novo local" title="Sítio Santa Clara" lead="Uma evolução dos nossos retiros anteriores: mais estrutura, mais conforto, o mesmo coração.">
      <div className="split">
        <div className="split-media">
          <img src={heroImg} alt="Sítio Santa Clara" loading="lazy" />
        </div>
        <div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              "140 camas + capacidade para 200 pessoas",
              "Salão principal e auditório secundário",
              "Cozinha industrial e refeitório amplo",
              "Salas de aula para discipulado",
              "Piscina e amplas áreas verdes",
              "Ambiente preparado para retiros cristãos",
            ].map((t) => (
              <li key={t} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <span style={{ marginTop: "0.35rem" }}>
                  <Check size={18} className="text-[color:var(--color-gold)]" />
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: "2rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <a href="#inscricao" className="btn btn-primary">Reservar minha vaga</a>
            <a href={retiro.local.mapsUrl} target="_blank" rel="noreferrer" className="btn btn-ghost">
              <MapPin size={16} /> Ver no mapa
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ————————————————————————— Estrutura ————————————————————————— */
function Estrutura() {
  return (
    <Section kicker="Estrutura" title="Tudo pensado para você viver o retiro.">
      <div className="grid-auto">
        {retiro.estrutura.map((e) => {
          const Icon = iconMap[e.icon] ?? Sparkles;
          return (
            <div className="card" key={e.titulo}>
              <Icon size={26} className="text-[color:var(--color-gold)]" />
              <h3 className="font-display" style={{ fontSize: "1.15rem", margin: "0.85rem 0 0.3rem" }}>{e.titulo}</h3>
              <p style={{ color: "var(--color-muted)", fontSize: "0.95rem", margin: 0 }}>{e.desc}</p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ————————————————————————— Programação ————————————————————————— */
function Programacao() {
  return (
    <Section id="programacao" kicker="Programação" title="O ritmo dos três dias." lead="Uma programação equilibrada entre buscar a Deus, descansar e viver comunhão.">
      <div className="timeline">
        {retiro.programacao.map((d) => (
          <div className="timeline-day" key={d.dia}>
            <h4>{d.dia}</h4>
            {d.blocos.map((b) => (
              <div className="period-block" key={b.periodo}>
                <span className="period">{b.periodo}</span>
                <ul>{b.itens.map((it) => <li key={it}>{it}</li>)}</ul>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ————————————————————————— Incluso ————————————————————————— */
function Incluso() {
  return (
    <Section kicker="Incluso" title="O que já está no seu valor.">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
        {retiro.incluso.map((i) => (
          <span className="chip" key={i}><Check size={16} /> {i}</span>
        ))}
      </div>
    </Section>
  );
}

/* ————————————————————————— Valores ————————————————————————— */
function Valores() {
  const total = retiro.valores.inscricao;
  return (
    <Section id="valores" kicker="Investimento" title="Um valor justo por uma experiência transformadora.">
      <div className="grid-2">
        <div className="card" style={{ padding: "2rem" }}>
          <div className="kicker">Inscrição individual</div>
          <div className="font-display" style={{ fontSize: "3.5rem", lineHeight: 1, margin: "1rem 0 0.5rem" }}>
            R$ {total}
          </div>
          <p style={{ color: "var(--color-muted)", margin: "0 0 1.5rem" }}>{retiro.valores.parcelamento}</p>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <span className="chip"><QrCode size={16} /> PIX</span>
            <span className="chip"><CreditCard size={16} /> Cartão em até 4x</span>
          </div>
          <a href="#inscricao" className="btn btn-primary" style={{ marginTop: "1.75rem" }}>
            Quero garantir minha vaga <ArrowRight size={16} />
          </a>
        </div>

        <details className="card" style={{ padding: "2rem" }}>
          <summary style={{ cursor: "pointer", listStyle: "none", fontWeight: 600 }}>
            Para onde vai o seu R$ {total}?
          </summary>
          <hr className="hairline" style={{ margin: "1rem 0" }} />
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {retiro.valores.composicao.map((c) => (
              <li key={c.rotulo} style={{ display: "flex", justifyContent: "space-between", color: "var(--color-muted)" }}>
                <span>{c.rotulo}</span>
                <span style={{ color: "var(--color-ink)", fontVariantNumeric: "tabular-nums" }}>R$ {c.valor}</span>
              </li>
            ))}
          </ul>
          <p style={{ color: "var(--color-muted)", fontSize: "0.9rem", marginTop: "1.25rem", lineHeight: 1.5 }}>
            Transparência total: o valor cobre alimentação, camiseta, hospedagem, transporte, estrutura,
            brindes, decoração, materiais e demais custos da produção do retiro.
          </p>
        </details>
      </div>
    </Section>
  );
}

/* ————————————————————————— Depoimentos ————————————————————————— */
function Depoimentos() {
  return (
    <Section kicker="Depoimentos" title="O que ficou de outros retiros.">
      <div className="grid-3">
        {retiro.depoimentos.map((d) => (
          <div className="card" key={d.nome}>
            <p className="font-display" style={{ fontSize: "1.15rem", lineHeight: 1.45, fontStyle: "italic", margin: 0 }}>
              “{d.texto}”
            </p>
            <p style={{ marginTop: "1rem", color: "var(--color-muted)", fontSize: "0.9rem" }}>— {d.nome}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ————————————————————————— FAQ ————————————————————————— */
function Faq() {
  return (
    <Section id="faq" kicker="Perguntas frequentes" title="Tudo o que você precisa saber.">
      <div style={{ maxWidth: "48rem" }}>
        {retiro.faq.map((f) => (
          <details className="faq-item" key={f.q}>
            <summary className="faq-summary">
              <span>{f.q}</span>
              <ArrowRight size={18} />
            </summary>
            <div className="faq-answer">{f.a}</div>
          </details>
        ))}
      </div>
    </Section>
  );
}

/* ————————————————————————— Localização ————————————————————————— */
function Localizacao() {
  return (
    <Section kicker="Como chegar" title={`${retiro.local.cidade} — ${retiro.local.uf}`} lead={retiro.local.tempoViagem + " · Transporte incluso saindo da igreja."}>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <iframe
          title="Mapa Campos do Jordão"
          src="https://www.google.com/maps?q=Campos+do+Jord%C3%A3o+SP&output=embed"
          style={{ width: "100%", height: "420px", border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </Section>
  );
}

/* ————————————————————————— CTA final ————————————————————————— */
function CtaFinal() {
  return (
    <section id="inscricao" style={{ padding: "8rem 0" }}>
      <div className="container-x" style={{ textAlign: "center", maxWidth: "40rem" }}>
        <span className="kicker">Sua vaga espera por você</span>
        <h2 className="section-title" style={{ marginTop: "1rem" }}>Vem viver esses três dias com a gente.</h2>
        <p className="lead" style={{ margin: "0 auto 2rem" }}>
          Vagas limitadas a {140} camas. Garanta a sua e reserve seu lugar no {retiro.local.nome}.
        </p>
        <a href={`https://wa.me/?text=${encodeURIComponent(`Quero me inscrever no Retiro ${retiro.nome} ${retiro.edicao}`)}`} className="btn btn-primary" style={{ padding: "1.1rem 1.8rem", fontSize: "1rem" }}>
          Fazer minha inscrição <ArrowRight size={18} />
        </a>
      </div>
    </section>
  );
}

/* ————————————————————————— Footer ————————————————————————— */
function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container-x">
        <hr className="hairline" style={{ marginBottom: "2rem" }} />
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div className="font-display" style={{ fontSize: "1.15rem", color: "var(--color-ink)" }}>
              Retiro {retiro.nome} · {retiro.edicao}
            </div>
            <div>{retiro.local.nome} — {retiro.local.cidade}/{retiro.local.uf}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div>Contato: <a href={`mailto:${retiro.valores.pix}`}>{retiro.valores.pix}</a></div>
            <div style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>© {new Date().getFullYear()} Ministério de Jovens</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
