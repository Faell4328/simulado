// Copia texto pra área de transferência, com fallback pra navegadores/contextos
// sem a Clipboard API (http, iframe sem permissão). Retorna true se copiou.
export async function copiarTexto(t) {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(t); return true } catch { /* fallback */ }
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = t
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch { return false }
}
