let contador = 0
export function novoIdDestaque() {
  contador += 1
  return `m${Date.now().toString(36)}-${contador}`
}

export function adicionarDestaque(lista = [], inicio, fim, id = novoIdDestaque()) {
  const de = Math.max(0, Math.min(inicio, fim))
  const ate = Math.max(inicio, fim)
  if (ate <= de) return lista

  const todos = [...lista, { id, inicio: de, fim: ate }].sort((a, b) => a.inicio - b.inicio)
  const resultado = []
  for (const destaque of todos) {
    const ultimo = resultado[resultado.length - 1]
    if (ultimo && destaque.inicio < ultimo.fim) {
      ultimo.fim = Math.max(ultimo.fim, destaque.fim)
    } else {
      resultado.push({ ...destaque })
    }
  }
  return resultado
}

export function removerDestaque(lista = [], id) {
  return lista.filter((destaque) => destaque.id !== id)
}

function offsetDoPonto(raiz, no, deslocamento) {
  const range = document.createRange()
  range.selectNodeContents(raiz)
  range.setEnd(no, deslocamento)
  return range.toString().length
}

export function offsetsDaSelecao(raiz, range) {
  if (!raiz || !range) return null
  if (!raiz.contains(range.startContainer) || !raiz.contains(range.endContainer)) return null

  const inicio = offsetDoPonto(raiz, range.startContainer, range.startOffset)
  const fim = offsetDoPonto(raiz, range.endContainer, range.endOffset)
  const texto = range.toString()
  if (!texto.trim()) return null

  const sobraInicio = texto.length - texto.trimStart().length
  const sobraFim = texto.length - texto.trimEnd().length
  const de = inicio + sobraInicio
  const ate = fim - sobraFim
  if (ate <= de) return null
  return { inicio: de, fim: ate }
}

function envolver(no, de, ate, id) {
  let alvo = no
  if (ate < no.nodeValue.length) no.splitText(ate)
  if (de > 0) alvo = no.splitText(de)

  const marca = document.createElement('mark')
  marca.dataset.marcaTexto = id
  marca.title = 'clique para remover o grifo'
  alvo.parentNode.insertBefore(marca, alvo)
  marca.appendChild(alvo)
}

export function aplicarDestaques(raiz, destaques = []) {
  if (!raiz || destaques.length === 0) return

  const porNo = new Map()
  const walker = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT)
  const ordenados = [...destaques].sort((a, b) => a.inicio - b.inicio)
  let posicao = 0
  let no

  while ((no = walker.nextNode())) {
    const tamanho = no.nodeValue.length
    const inicioNo = posicao
    const fimNo = posicao + tamanho

    for (const destaque of ordenados) {
      if (destaque.fim <= inicioNo) continue
      if (destaque.inicio >= fimNo) break
      const de = Math.max(destaque.inicio, inicioNo)
      const ate = Math.min(destaque.fim, fimNo)
      if (de >= ate) continue
      if (!porNo.has(no)) porNo.set(no, [])
      porNo.get(no).push({ de: de - inicioNo, ate: ate - inicioNo, id: destaque.id })
    }

    posicao = fimNo
  }

  for (const [no, trechos] of porNo) {
    trechos.sort((a, b) => b.de - a.de)
    for (const trecho of trechos) envolver(no, trecho.de, trecho.ate, trecho.id)
  }
}

export function limparMarcas(raiz) {
  if (!raiz) return
  for (const marca of raiz.querySelectorAll('mark[data-marca-texto]')) {
    const pai = marca.parentNode
    while (marca.firstChild) pai.insertBefore(marca.firstChild, marca)
    pai.removeChild(marca)
  }
  raiz.normalize()
}
