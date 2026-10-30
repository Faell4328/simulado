import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { temaInicial, aplicarTema } from "./lib/tema";

// Aplica o tema antes de renderizar pra não piscar branco no modo escuro.
aplicarTema(temaInicial());

const elementoRaiz = document.getElementById("root");
if (!elementoRaiz) throw new Error("Elemento #root não encontrado");

ReactDOM.createRoot(elementoRaiz).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// PWA: registra o service worker só em produção (não atrapalha o HMR do Vite).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline é bônus */
    });
  });
}
