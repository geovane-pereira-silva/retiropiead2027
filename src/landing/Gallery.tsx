import media from "../content/media.json";

/**
 * Fotos e vídeo reais do local. Nada é inventado: sem arquivo listado em
 * src/content/media.json, a seção não mostra imagem (e a página continua completa).
 */
export type Foto = {
  src: string;
  alt: string;
  largura?: number;
  altura?: number;
  /** object-position, ex.: "50% 30%" para não cortar rostos */
  foco?: string;
};
export type VideoInfo = { src: string; poster?: string; titulo: string };

type GrupoId = "local" | "culto" | "quartos" | "adoracao" | "convivencia";

const fotos = media.fotos as unknown as Record<GrupoId, Foto[]>;
const video = (media as unknown as { video: VideoInfo | null }).video;

export const fotosDe = (g: GrupoId): Foto[] =>
  (fotos[g] ?? []).filter((f) => f && typeof f.src === "string" && f.src && f.alt);
export const temFotos = (g: GrupoId): boolean => fotosDe(g).length > 0;
export const temMidia: boolean =
  (["local", "culto", "quartos", "adoracao", "convivencia"] as GrupoId[]).some(temFotos) ||
  !!video;
export const temVideo = !!video?.src;

function Imagem({ f, destaque }: { f: Foto; destaque?: boolean }) {
  return (
    <img
      src={f.src}
      alt={f.alt}
      width={f.largura}
      height={f.altura}
      loading={destaque ? "eager" : "lazy"}
      fetchPriority={destaque ? "high" : undefined}
      decoding="async"
      style={f.foco ? { objectPosition: f.foco } : undefined}
    />
  );
}

/** Composição fotográfica: 1 foto = destaque; 2 = lado a lado; 3+ = grade assimétrica. */
export function Cena({ grupo, max = 3 }: { grupo: GrupoId; max?: number }) {
  const itens = fotosDe(grupo).slice(0, max);
  if (itens.length === 0) return null;
  return (
    <div className={`lp-cena n${itens.length}`}>
      {itens.map((f) => (
        <figure key={f.src}>
          <Imagem f={f} destaque={false} />
        </figure>
      ))}
    </div>
  );
}

/** Vídeo só carrega ao toque (preload="none"), sem som nem reprodução automática. */
export function VideoLocal() {
  if (!video?.src) return null;
  return (
    <figure className="lp-video-bloco">
      <video controls preload="none" playsInline poster={video.poster} aria-label={video.titulo}>
        <source src={video.src} />
        Seu navegador não reproduz este vídeo.
      </video>
      <figcaption>{video.titulo}</figcaption>
    </figure>
  );
}
