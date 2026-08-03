// Provas que o usuário sobe do próprio PC. Ficam salvas no localStorage (sem
// login, sem servidor) e aparecem na lista junto com as embutidas.
import { normalizarProva, validarProva } from '../data/conteudo.js'

const CHAVE = 'simulado_provas_usuario'

export function getProvasUsuario() {
  try {
    const cru = JSON.parse(localStorage.getItem(CHAVE) || '[]')
    return cru.map((p) => normalizarProva(p, '', 'usuario'))
  } catch {
    return []
  }
}

function salvarCru(lista) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista))
  } catch {
    // Cota do navegador estourada (~5MB) — provavelmente imagens grandes.
    throw new Error('não coube no navegador (armazenamento cheio). Remova provas antigas ou use imagens menores.')
  }
}

function lerCru() {
  try { return JSON.parse(localStorage.getItem(CHAVE) || '[]') } catch { return [] }
}

// Adiciona (ou substitui, se o id já existir) uma prova crua já validada.
// Retorna { norm, substituiu } pra avisar quando troca uma prova de mesmo id.
export function adicionarProvaUsuario(provaCrua) {
  const norm = normalizarProva(provaCrua, '', 'usuario')
  const antes = lerCru()
  const substituiu = antes.some((p) => (p.id || '') === norm.id)
  const lista = antes.filter((p) => (p.id || '') !== norm.id)
  lista.push({ ...provaCrua, id: norm.id })
  salvarCru(lista)
  return { norm, substituiu }
}

export function removerProvaUsuario(id) {
  salvarCru(lerCru().filter((p) => (p.id || '') !== id))
}

// Lê um arquivo (File) escolhido pelo usuário e devolve { prova, avisos } ou
// lança erro se o JSON for inválido.
export function lerArquivoProva(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const prova = JSON.parse(reader.result)
        resolve({ prova, avisos: validarProva(prova) })
      } catch {
        reject(new Error('arquivo não é um JSON válido'))
      }
    }
    reader.onerror = () => reject(new Error('não deu pra ler o arquivo'))
    reader.readAsText(file)
  })
}

// Lê uma pasta inteira (FileList do input com webkitdirectory): pega todos os
// .json e adiciona os válidos. Retorna { adicionadas, erros: [{nome, erro}] }.
export async function subirPastaProvas(fileList) {
  const files = Array.from(fileList).filter((f) => f.name.toLowerCase().endsWith('.json'))
  let adicionadas = 0
  const erros = []
  for (const f of files) {
    try {
      const { prova } = await lerArquivoProva(f)
      adicionarProvaUsuario(prova)
      adicionadas++
    } catch (e) {
      erros.push({ nome: f.name, erro: e.message })
    }
  }
  return { adicionadas, erros, total: files.length }
}
