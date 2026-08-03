// Converte um arquivo de imagem (escolhido pelo usuário) em data URI, reduzindo
// a largura máxima pra não gerar um JSON gigante nem estourar o localStorage.
// Assim a imagem fica embutida na prova, sem precisar hospedar em lugar nenhum.
export function arquivoParaDataURI(file, maxLarg = 1200) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const escala = Math.min(1, maxLarg / img.width)
      const w = Math.round(img.width * escala)
      const h = Math.round(img.height * escala)
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      // JPEG 0.85 dá bom equilíbrio de tamanho; PNG ficaria grande demais.
      resolve(c.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('imagem inválida')) }
    img.src = url
  })
}
