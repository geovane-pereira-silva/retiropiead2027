// Guarded service-worker registration.
// Registers only in the real published app — never in dev, iframes, or Lovable previews.

const SW_URL = "/sw.js";

function isRefusedContext(): boolean {
  if (!import.meta.env.PROD) return true;

  try {
    if (window.self !== window.top) return true; // inside an iframe
  } catch {
    return true; // cross-origin iframe access threw
  }

  const url = new URL(window.location.href);
  if (url.searchParams.get("sw") === "off") return true;

  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;

  return false;
}

async function unregisterMatching(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs
      .filter((r) => r.active?.scriptURL.endsWith(SW_URL) || r.installing?.scriptURL.endsWith(SW_URL))
      .map((r) => r.unregister()),
  );
}

export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  if (isRefusedContext()) {
    void unregisterMatching();
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(SW_URL).catch((err) => {
      console.error("SW registration failed", err);
    });
  });
}
