import { useEffect, useState } from "react";

/**
 * Preferências de movimento/tela lidas só depois da montagem, para que a primeira
 * renderização do navegador seja igual à do servidor (sem erro de hidratação).
 */
export function useMovimento() {
  const [estado, setEstado] = useState({ reduzir: false, compacto: false });
  useEffect(() => {
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compacto = window.matchMedia("(max-width: 47.99rem)");
    const ler = () => setEstado({ reduzir: reduzir.matches, compacto: compacto.matches });
    ler();
    reduzir.addEventListener("change", ler);
    compacto.addEventListener("change", ler);
    return () => {
      reduzir.removeEventListener("change", ler);
      compacto.removeEventListener("change", ler);
    };
  }, []);
  return estado;
}
