// Helpers to turn Google Drive share links / IDs into usable URLs.
export function driveImage(idOrUrl: string, size = 2000): string {
  const id = extractId(idOrUrl);
  if (!id) return idOrUrl;
  return `https://drive.google.com/thumbnail?id=${id}&sz=w${size}`;
}

export function driveVideoEmbed(idOrUrl: string): string {
  const id = extractId(idOrUrl);
  if (!id) return idOrUrl;
  return `https://drive.google.com/file/d/${id}/preview`;
}

function extractId(input: string): string | null {
  if (!input) return null;
  if (!input.includes("/") && !input.includes("?")) return input;
  const m = input.match(/\/d\/([a-zA-Z0-9_-]+)/) || input.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m?.[1] ?? null;
}
