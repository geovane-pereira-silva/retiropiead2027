// Extrai o shortcode de uma URL do Instagram (post, reel ou tv).
// Aceita: https://www.instagram.com/{p|reel|tv}/{SHORTCODE}/...
export function extractInstagramShortcode(url: string): string | null {
  if (!url) return null;
  const m = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i);
  return m?.[1] ?? null;
}

// URL do embed oficial do Instagram (iframe). Requer post público.
export function instagramEmbedUrl(url: string): string | null {
  const code = extractInstagramShortcode(url);
  if (!code) return null;
  return `https://www.instagram.com/p/${code}/embed/captioned/`;
}
