import media from "../content/media.json";

/**
 * Fotos e vídeo reais do retiro. Nada é inventado: o que está listado em
 * src/content/media.json aparece; o que falta aparece como espaço reservado
 * identificado (com o nome do arquivo esperado) e some sozinho quando o arquivo
 * for cadastrado.
 */
export type Foto = {
  src: string;
  alt: string;
  largura?: number;
  altura?: number;
  /** object-position, ex.: "50% 30%" para não cortar rostos */
  foco?: string;
  /** versão vertical (celular) opcional, usada na abertura */
  srcMobile?: string;
};
export type VideoInfo = { src: string; poster?: string; titulo: string };

export type GrupoId = "hero" | "local" | "culto" | "quartos" | "adoracao" | "convivencia";

/** Arquivos que a organização deve enviar, por grupo. */
export const ESPERADAS: Record<GrupoId, { rotulo: string; arquivos: string[] }> = {
  hero: { rotulo: "Fachada do sítio", arquivos: ["frente do local 16x9.jpg", "frente do local.jpg"] },
  local: { rotulo: "O sítio", arquivos: ["frente do local.jpg"] },
  culto: { rotulo: "Espaço de culto", arquivos: ["espalo de culto.jpg"] },
  quartos: { rotulo: "Quartos", arquivos: ["quarto.jpg", "quarto a.jpg", "quarto b.jpg"] },
  adoracao: {
    rotulo: "Adoração e oração",
    arquivos: ["jovens adorando.jpg", "jovens abraçados adorando.jpg", "oração e adoração.jpg", "oração pelo jovem.jpg"],
  },
  convivencia: {
    rotulo: "Convivência e gincanas",
    arquivos: ["jovem feliz.jpg", "jovem na gincana feliz.jpg", "espaço coberto gincanas.jpg"],
  },
};

const fotos = media.fotos as unknown as Partial<Record<GrupoId, Foto[]>>;
/** Arte oficial DUNAMIS (opcional). Sem ela, o site usa a versão tipográfica provisória. */
export type MarcaInfo = { src: string; fundo?: string; alt: string; largura?: number; altura?: number };
export const marcaInfo = (media as unknown as { marca?: MarcaInfo | null }).marca ?? null;
export const videoInfo = (media as unknown as { video: VideoInfo | null }).video;

export const fotosDe = (g: GrupoId): Foto[] =>
  (fotos[g] ?? []).filter((f) => f && typeof f.src === "string" && f.src && f.alt);
export const temFotos = (g: GrupoId): boolean => fotosDe(g).length > 0;
export const temVideo = !!videoInfo?.src;

export function Imagem({ f, prioridade }: { f: Foto; prioridade?: boolean }) {
  const img = (
    <img
      src={f.src}
      alt={f.alt}
      width={f.largura}
      height={f.altura}
      loading={prioridade ? "eager" : "lazy"}
      fetchPriority={prioridade ? "high" : undefined}
      decoding="async"
      style={f.foco ? { objectPosition: f.foco } : undefined}
    />
  );
  if (!f.srcMobile) return img;
  return (
    <picture>
      <source media="(max-width: 47.99rem)" srcSet={f.srcMobile} />
      {img}
    </picture>
  );
}

/** Espaço reservado identificado: mostra qual arquivo real deve ser enviado. */
export function Reserva({
  grupo,
  arquivo,
  className = "",
}: {
  grupo: GrupoId;
  arquivo?: string;
  className?: string;
}) {
  const nomes = arquivo ? [arquivo] : ESPERADAS[grupo].arquivos;
  return (
    <div
      className={`pv-reserva ${className}`}
      role="img"
      aria-label={`Espaço reservado: foto real pendente (${nomes.join(", ")})`}
    >
      <span className="pv-reserva-selo">
        Foto real pendente
        <small>{nomes.join(" · ")}</small>
      </span>
    </div>
  );
}

/** Foto real do grupo (posição i) ou, se ainda não cadastrada, o espaço reservado. */
export function Midia({
  grupo,
  i = 0,
  prioridade,
  className,
}: {
  grupo: GrupoId;
  i?: number;
  prioridade?: boolean;
  className?: string;
}) {
  const f = fotosDe(grupo)[i];
  return f ? (
    <Imagem f={f} prioridade={prioridade} />
  ) : (
    <Reserva grupo={grupo} arquivo={ESPERADAS[grupo].arquivos[i]} className={className} />
  );
}
