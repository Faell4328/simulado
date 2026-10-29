let contadorDestaques = 0
export function novoIdDestaque() {
  contadorDestaques += 1
  return `m${Date.now().toString(36)}-${contadorDestaques}`
}

export function adicionarDestaque(destaques = [], inicio, fim, id = novoIdDestaque()) {
  const inicioTrecho = Math.max(0, Math.min(inicio, fim))
  const fimTrecho = Math.max(inicio, fim)
  if (fimTrecho <= inicioTrecho) return destaques

  const destaquesOrdenados = [...destaques, { id, inicio: inicioTrecho, fim: fimTrecho }].sort((a, b) => a.inicio - b.inicio)
  const destaquesUnidos = []
  for (const destaque of destaquesOrdenados) {
    const ultimoDestaque = destaquesUnidos[destaquesUnidos.length - 1]
    if (ultimoDestaque && destaque.inicio < ultimoDestaque.fim) {
      ultimoDestaque.fim = Math.max(ultimoDestaque.fim, destaque.fim)
    } else {
      destaquesUnidos.push({ ...destaque })
    }
  }
  return destaquesUnidos
}

export function removerDestaque(destaques = [], id) {
  return destaques.filter((destaque) => destaque.id !== id)
}

function calcularOffset(raiz, noTexto, posicaoNoTexto) {
  const range = document.createRange()
  range.selectNodeContents(raiz)
  range.setEnd(noTexto, posicaoNoTexto)
  return range.toString().length
}

export function offsetsDaSelecao(raiz, range) {
  if (!raiz || !range) return null
  if (!raiz.contains(range.startContainer) || !raiz.contains(range.endContainer)) return null

  const inicio = calcularOffset(raiz, range.startContainer, range.startOffset)
  const fim = calcularOffset(raiz, range.endContainer, range.endOffset)
  const texto = range.toString()
  if (!texto.trim()) return null

  const espacosIniciais = texto.length - texto.trimStart().length
  const espacosFinais = texto.length - texto.trimEnd().length
  const inicioSemEspacos = inicio + espacosIniciais
  const fimSemEspacos = fim - espacosFinais
  if (fimSemEspacos <= inicioSemEspacos) return null
  return { inicio: inicioSemEspacos, fim: fimSemEspacos }
}

function envolverTrecho(noTexto, inicio, fim, id) {
  let noAlvo = noTexto
  if (fim < noTexto.nodeValue.length) noTexto.splitText(fim)
  if (inicio > 0) noAlvo = noTexto.splitText(inicio)

  const elementoMarca = document.createElement('mark')
  elementoMarca.dataset.marcaTexto = id
  elementoMarca.title = 'clique para remover o grifo'
  noAlvo.parentNode.insertBefore(elementoMarca, noAlvo)
  elementoMarca.appendChild(noAlvo)
}

export function aplicarDestaques(raiz, destaques = []) {
  if (!raiz || destaques.length === 0) return

  const trechosPorNo = new Map()
  const caminhadorTextos = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT)
  const destaquesOrdenados = [...destaques].sort((a, b) => a.inicio - b.inicio)
  let posicao = 0
  let noTexto

  while ((noTexto = caminhadorTextos.nextNode())) {
    const tamanhoNo = noTexto.nodeValue.length
    const inicioNo = posicao
    const fimNo = posicao + tamanhoNo

    for (const destaque of destaquesOrdenados) {
      if (destaque.fim <= inicioNo) continue
      if (destaque.inicio >= fimNo) break
      const inicioTrecho = Math.max(destaque.inicio, inicioNo)
      const fimTrecho = Math.min(destaque.fim, fimNo)
      if (inicioTrecho >= fimTrecho) continue
      if (!trechosPorNo.has(noTexto)) trechosPorNo.set(noTexto, [])
      trechosPorNo.get(noTexto).push({ inicio: inicioTrecho - inicioNo, fim: fimTrecho - inicioNo, id: destaque.id })
    }

    posicao = fimNo
  }

  for (const [noTexto, trechos] of trechosPorNo) {
    trechos.sort((a, b) => b.inicio - a.inicio)
    for (const trecho of trechos) envolverTrecho(noTexto, trecho.inicio, trecho.fim, trecho.id)
  }
}

export function limparMarcas(raiz) {
  if (!raiz) return
  for (const elementoMarca of raiz.querySelectorAll('mark[data-marca-texto]')) {
    const pai = elementoMarca.parentNode
    while (elementoMarca.firstChild) pai.insertBefore(elementoMarca.firstChild, elementoMarca)
    pai.removeChild(elementoMarca)
  }
  raiz.normalize()
}
