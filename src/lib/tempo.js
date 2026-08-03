// Formata segundos como mm:ss (ou hh:mm:ss se passar de uma hora).
export function formatarTempo(segundos) {
  const s = Math.max(0, Math.floor(segundos))
  const h = Math.floor(s / 3600)
  const min = Math.floor((s % 3600) / 60)
  const seg = s % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(min)}:${pad(seg)}` : `${pad(min)}:${pad(seg)}`
}
