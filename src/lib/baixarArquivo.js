function dispararDownload(file, blob) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = file;
  a.click()
  URL.revokeObjectURL(a.href)
}

export function baixarProva(prova) {
  const blob = new Blob([JSON.stringify(prova, null, 2)], { type: 'application/json' });
  dispararDownload(`${prova.id}.json`, blob);
}

export function baixarMd(nome, conteudoMd) {
  const blob = new Blob(conteudoMd, { type: 'text/markdown' });
  dispararDownload(nome, blob);
}
