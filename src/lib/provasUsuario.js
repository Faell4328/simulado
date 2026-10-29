// Provas que o usuário sobe do próprio PC. Ficam salvas no localStorage (sem
// login, sem servidor) e aparecem na lista junto com as embutidas.
import { normalizarProva, validarProva } from '../data/conteudo.js'

const CHAVE_ARMAZENAMENTO = 'simulado_provas_usuario'

export function getProvasUsuario() {
  try {
    const provasSalvas = JSON.parse(localStorage.getItem(CHAVE_ARMAZENAMENTO) || '[]')
    return provasSalvas.map((prova) => normalizarProva(prova, '', 'usuario'))
  } catch {
    return []
  }
}

function salvarProvas(provas) {
  try {
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(provas))
  } catch {
    // Cota do navegador estourada (~5MB) — provavelmente imagens grandes.
    throw new Error('não coube no navegador (armazenamento cheio). Remova provas antigas ou use imagens menores.')
  }
}

function lerProvasSalvas() {
  try { return JSON.parse(localStorage.getItem(CHAVE_ARMAZENAMENTO) || '[]') } catch { return [] }
}

// Adiciona (ou substitui, se o id já existir) uma prova já validada.
// Retorna { provaNormalizada, substituiu } pra avisar quando troca uma prova de mesmo id.
export function adicionarProvaUsuario(provaCrua) {
  const provaNormalizada = normalizarProva(provaCrua, '', 'usuario')
  const provasAtuais = lerProvasSalvas()
  const substituiu = provasAtuais.some((prova) => (prova.id || '') === provaNormalizada.id)
  const provasRestantes = provasAtuais.filter((prova) => (prova.id || '') !== provaNormalizada.id)
  provasRestantes.push({ ...provaCrua, id: provaNormalizada.id })
  salvarProvas(provasRestantes)
  return { provaNormalizada, substituiu }
}

export function removerProvaUsuario(id) {
  salvarProvas(lerProvasSalvas().filter((prova) => (prova.id || '') !== id))
}

// Lê um arquivo (File) escolhido pelo usuário e devolve { prova, avisos } ou
// lança erro se o JSON for inválido.
export function lerArquivoProva(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => {
      try {
        const prova = JSON.parse(leitor.result)
        resolve({ prova, avisos: validarProva(prova) })
      } catch {
        reject(new Error('arquivo não é um JSON válido'))
      }
    }
    leitor.onerror = () => reject(new Error('não deu pra ler o arquivo'))
    leitor.readAsText(arquivo)
  })
}

// Lê uma pasta inteira (FileList do input com webkitdirectory): pega todos os
// .json e adiciona os válidos. Retorna { adicionadas, erros: [{nome, erro}] }.
export async function subirPastaProvas(listaArquivos) {
  const arquivosJson = Array.from(listaArquivos).filter((arquivo) => arquivo.name.toLowerCase().endsWith('.json'))
  let quantidadeAdicionadas = 0
  const erros = []
  for (const arquivo of arquivosJson) {
    try {
      const { prova } = await lerArquivoProva(arquivo)
      adicionarProvaUsuario(prova)
      quantidadeAdicionadas++
    } catch (erro) {
      erros.push({ nome: arquivo.name, erro: erro.message })
    }
  }
  return { adicionadas: quantidadeAdicionadas, erros, total: arquivosJson.length }
}
