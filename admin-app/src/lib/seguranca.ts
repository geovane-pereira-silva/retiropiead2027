export function higienizarCelula(value: string): string {
  const text = String(value ?? "").trim();
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}