import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { temaInicial, aplicarTema } from './lib/tema.js'

// Aplica o tema antes de renderizar pra não piscar branco no modo escuro.
aplicarTema(temaInicial())

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// PWA: registra o service worker só em produção (não atrapalha o HMR do Vite).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* offline é bônus */ })
  })
}
