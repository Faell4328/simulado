// Formata segundos como mm:ss (ou hh:mm:ss se passar de uma hora).
export function formatarTempo(segundos: number): string {
  const totalSegundos = Math.max(0, Math.floor(segundos));
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundosRestantes = totalSegundos % 60;
  const comDoisDigitos = (numero: number) => String(numero).padStart(2, "0");
  return horas > 0
    ? `${comDoisDigitos(horas)}:${comDoisDigitos(minutos)}:${comDoisDigitos(segundosRestantes)}`
    : `${comDoisDigitos(minutos)}:${comDoisDigitos(segundosRestantes)}`;
}
