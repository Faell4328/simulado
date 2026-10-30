// Tema claro/escuro. Guarda a escolha no localStorage; sem escolha, segue a
// preferência do sistema. A classe .dark no <html> ativa a paleta escura.
import type { Tema } from "../tipos";

const CHAVE_TEMA = "simulado_tema";

export function temaInicial(): Tema {
  try {
    const temaSalvo = localStorage.getItem(CHAVE_TEMA);
    if (temaSalvo === "claro" || temaSalvo === "escuro") return temaSalvo;
  } catch {
    /* ignore */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
    ? "escuro"
    : "claro";
}

export function aplicarTema(tema: Tema): void {
  document.documentElement.classList.toggle("dark", tema === "escuro");
}

export function salvarTema(tema: Tema): void {
  try {
    localStorage.setItem(CHAVE_TEMA, tema);
  } catch {
    /* ignore */
  }
}
