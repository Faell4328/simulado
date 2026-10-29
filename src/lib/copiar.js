// Copia texto pra área de transferência, com fallback pra navegadores/contextos
// sem a Clipboard API (http, iframe sem permissão). Retorna true se copiou.
export async function copiarTexto(texto) {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(texto); return true } catch { /* fallback */ }
  }
  try {
    const campoTemporario = document.createElement('textarea')
    campoTemporario.value = texto
    campoTemporario.setAttribute('readonly', '')
    campoTemporario.style.position = 'fixed'
    campoTemporario.style.left = '-9999px'
    document.body.appendChild(campoTemporario)
    campoTemporario.select()
    const copiou = document.execCommand('copy')
    document.body.removeChild(campoTemporario)
    return copiou
  } catch { return false }
}
