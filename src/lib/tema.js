// Tema claro/escuro. Guarda a escolha no localStorage; sem escolha, segue a
// preferência do sistema. A classe .dark no <html> ativa a paleta escura.
const CHAVE = 'simulado_tema'

export function temaInicial() {
  try {
    const s = localStorage.getItem(CHAVE)
    if (s === 'claro' || s === 'escuro') return s
  } catch { /* ignore */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro'
}

export function aplicarTema(t) {
  document.documentElement.classList.toggle('dark', t === 'escuro')
}

export function salvarTema(t) {
  try { localStorage.setItem(CHAVE, t) } catch { /* ignore */ }
}
