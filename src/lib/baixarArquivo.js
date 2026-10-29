function dispararDownload(nomeArquivo, conteudoBlob) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(conteudoBlob)
  link.download = nomeArquivo
  link.click()
  URL.revokeObjectURL(link.href)
}

export function baixarProva(prova) {
  const blob = new Blob([JSON.stringify(prova, null, 2)], { type: 'application/json' })
  dispararDownload(`${prova.id}.json`, blob)
}

export function baixarMd(nomeArquivo, conteudoMarkdown) {
  const blob = new Blob(conteudoMarkdown, { type: 'text/markdown' })
  dispararDownload(nomeArquivo, blob)
}
