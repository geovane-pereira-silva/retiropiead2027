import { useEffect, useState } from "react";
import { ExternalLink, Play, X, Instagram } from "lucide-react";
import { instagramEmbedUrl } from "../lib/instagram";

export type InstagramItem = {
  url: string;
  titulo: string;
  descricao?: string;
  thumb?: string;
};

export function InstagramGallery({ items }: { items: InstagramItem[] }) {
  const [openUrl, setOpenUrl] = useState<string | null>(null);

  if (!items.length) return null;

  return (
    <>
      <div className="grid-3">
        {items.map((it) => (
          <InstagramCard key={it.url} item={it} onOpen={() => setOpenUrl(it.url)} />
        ))}
      </div>
      {openUrl && <InstagramModal url={openUrl} onClose={() => setOpenUrl(null)} />}
    </>
  );
}

function InstagramCard({ item, onOpen }: { item: InstagramItem; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="ig-card">
      <div className="ig-thumb">
        {item.thumb ? (
          <img src={item.thumb} alt={item.titulo} loading="lazy" />
        ) : (
          <div className="ig-thumb-fallback">
            <Instagram size={40} />
          </div>
        )}
        <span className="ig-play"><Play size={28} fill="currentColor" /></span>
      </div>
      <div className="ig-meta">
        <h3 className="font-display" style={{ fontSize: "1.1rem", margin: 0 }}>{item.titulo}</h3>
        {item.descricao && (
          <p style={{ color: "var(--color-muted)", fontSize: "0.9rem", margin: "0.35rem 0 0" }}>
            {item.descricao}
          </p>
        )}
      </div>
    </button>
  );
}

function InstagramModal({ url, onClose }: { url: string; onClose: () => void }) {
  const embed = instagramEmbedUrl(url);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="ig-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ig-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="ig-close" onClick={onClose} aria-label="Fechar">
          <X size={20} />
        </button>
        {embed ? (
          <iframe
            src={embed}
            title="Instagram"
            className="ig-iframe"
            loading="lazy"
            allow="encrypted-media"
            allowFullScreen
          />
        ) : (
          <p style={{ padding: "2rem", textAlign: "center" }}>Link do Instagram inválido.</p>
        )}
        <a href={url} target="_blank" rel="noreferrer" className="btn btn-ghost ig-open">
          Abrir no Instagram <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
}
