import { useEffect, useState } from "react";
import { Camera, Video as VideoIcon, X } from "lucide-react";

import media from "../content/media.json";

/**
 * Fotos e vídeos do local vêm de src/content/media.json (nada é inventado aqui).
 *
 * Cada foto pode ser:
 *   - um caminho/URL:            "/media/quartos-01.jpg"  ou  "https://…/foto.jpg"
 *   - um objeto com texto alt:   { "src": "/media/salao.jpg", "alt": "Salão principal" }
 *   - um arquivo do Google Drive: "drive:ID_DO_ARQUIVO"  (o arquivo precisa estar
 *     compartilhado como "qualquer pessoa com o link")
 *
 * Vídeos: link do YouTube (watch/shorts/youtu.be) ou do Google Drive
 * (drive.google.com/file/d/ID/view). Outros links viram um botão "Assistir".
 */
type Foto = string | { src: string; alt?: string };

const fotos = media.fotos as unknown as Record<string, Foto[]>;
const videos = media.videos as unknown as Record<string, string>;

const GRUPOS = [
  { id: "quartos", rotulo: "Quartos", chaves: ["dormitorios", "quartos"] },
  {
    id: "saloes",
    rotulo: "Salões e auditórios",
    chaves: ["salao_principal", "auditorio", "salas"],
  },
  {
    id: "convivencia",
    rotulo: "Áreas de convivência",
    chaves: ["convivencia", "area_externa", "piscina", "refeitorio", "cozinha"],
  },
  { id: "geral", rotulo: "Visão geral", chaves: ["fachada", "vista_aerea"] },
] as const;

const ROTULO_VIDEO: Record<string, string> = {
  tour_geral: "Tour pelo local",
  drone: "Vista aérea",
  salao: "Salão",
  dormitorios: "Dormitórios",
  piscina: "Área externa",
};

function resolverFoto(f: Foto): { src: string; alt: string } {
  const bruto = typeof f === "string" ? f : f.src;
  const alt =
    typeof f === "string" ? "Foto do local do retiro" : (f.alt ?? "Foto do local do retiro");
  if (bruto.startsWith("drive:")) {
    const id = encodeURIComponent(bruto.slice(6));
    return { src: `https://drive.google.com/thumbnail?id=${id}&sz=w1600`, alt };
  }
  return { src: bruto, alt };
}

function urlDeEmbed(u: string): string | null {
  try {
    const url = new URL(u);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be")
      return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = url.searchParams.get("v");
      if (v) return `https://www.youtube-nocookie.com/embed/${v}`;
      const m = /^\/(shorts|embed)\/([\w-]+)/.exec(url.pathname);
      if (m) return `https://www.youtube-nocookie.com/embed/${m[2]}`;
    }
    if (host === "drive.google.com") {
      const m = /\/file\/d\/([\w-]+)/.exec(url.pathname);
      if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    }
  } catch {
    /* URL inválida: cai no botão */
  }
  return null;
}

const fotosDoGrupo = (chaves: readonly string[]): Foto[] => chaves.flatMap((c) => fotos[c] ?? []);
const listaVideos = Object.entries(videos).filter(
  ([, url]) => typeof url === "string" && url.trim() !== "",
);

export function Gallery() {
  const grupos = GRUPOS.map((g) => ({ ...g, itens: fotosDoGrupo(g.chaves) }));
  const primeiro = grupos.find((g) => g.itens.length > 0)?.id ?? grupos[0].id;
  const [aba, setAba] = useState<string>(primeiro);
  const [aberta, setAberta] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    if (!aberta) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAberta(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aberta]);

  const atual = grupos.find((g) => g.id === aba);

  return (
    <div>
      <div className="lp-tabs" role="tablist" aria-label="Fotos e vídeos do local">
        {grupos.map((g) => (
          <button
            key={g.id}
            type="button"
            role="tab"
            id={`aba-${g.id}`}
            aria-selected={aba === g.id}
            aria-controls="painel-local"
            className="lp-tab"
            onClick={() => setAba(g.id)}
          >
            {g.rotulo}
          </button>
        ))}
        <button
          type="button"
          role="tab"
          id="aba-videos"
          aria-selected={aba === "videos"}
          aria-controls="painel-local"
          className="lp-tab"
          onClick={() => setAba("videos")}
        >
          Vídeos
        </button>
      </div>

      <div id="painel-local" role="tabpanel" aria-labelledby={`aba-${aba}`}>
        {aba === "videos" ? (
          listaVideos.length === 0 ? (
            <div className="lp-empty">
              <VideoIcon size={28} aria-hidden="true" />
              <strong>Vídeos do local em breve</strong>
              <span>Assim que a organização enviar, o tour em vídeo aparece aqui.</span>
            </div>
          ) : (
            <div className="lp-videos">
              {listaVideos.map(([chave, url]) => {
                const embed = urlDeEmbed(url);
                const titulo = ROTULO_VIDEO[chave] ?? "Vídeo do local";
                return embed ? (
                  <div className="lp-video" key={chave}>
                    <iframe
                      src={embed}
                      title={titulo}
                      loading="lazy"
                      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <a
                    className="lp-btn lp-btn-ghost"
                    key={chave}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <VideoIcon size={18} aria-hidden="true" /> Assistir: {titulo}
                  </a>
                );
              })}
            </div>
          )
        ) : atual && atual.itens.length > 0 ? (
          <div className="lp-gallery">
            {atual.itens.map((f, i) => {
              const { src, alt } = resolverFoto(f);
              return (
                <button
                  type="button"
                  className="lp-photo"
                  key={`${src}-${i}`}
                  onClick={() => setAberta({ src, alt })}
                  aria-label={`Ampliar: ${alt}`}
                >
                  <img src={src} alt={alt} loading="lazy" decoding="async" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="lp-empty">
            <Camera size={28} aria-hidden="true" />
            <strong>Fotos de “{atual?.rotulo}” em breve</strong>
            <span>
              As imagens oficiais do local serão publicadas aqui assim que forem enviadas.
            </span>
          </div>
        )}
      </div>

      {aberta && (
        <div
          className="lp-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={aberta.alt}
          onClick={() => setAberta(null)}
        >
          <button type="button" aria-label="Fechar imagem" onClick={() => setAberta(null)}>
            <X size={22} />
          </button>
          <img src={aberta.src} alt={aberta.alt} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
