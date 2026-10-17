import { useState } from 'react'
import Questao from './Questao.jsx'
import { House, ShareNetwork, ArrowClockwise, Robot } from '@phosphor-icons/react'
import { copiarTexto } from '../lib/copiar.js'

// Resultado: placar, estatísticas por matéria, refazer as erradas, compartilhar
// e correção completa. O resultado já foi salvo no histórico pelo App.
export default function Resultado({ resultado, subtitulo, onVoltar, onRefazerErradas }) {
  const { acertos, erros, liquido, pontuacao, total, percentual, porMateria, detalhe } = resultado
  const cebraspe = pontuacao === 'cebraspe'
  const notaPrincipal = cebraspe ? liquido : acertos
  const [copiado, setCopiado] = useState(false)
  const erradas = detalhe.filter((d) => !d.certa).map((d) => d.questao)

  const texto =
    `simulado.tche.studio\n` +
    `${subtitulo ? subtitulo + '\n' : ''}` +
    `Acertei ${notaPrincipal}/${total} (${percentual}%${cebraspe ? ' líquido' : ''}).`

  const compartilhar = async () => {
    if (navigator.share) {
      try { await navigator.share({ text: texto }); return }
      catch (e) { if (e?.name === 'AbortError') return }
    }
    if (await copiarTexto(texto)) { setCopiado(true); setTimeout(() => setCopiado(false), 1800) }
  }

  const descreverAlternativa = (questao, valor) => {
    if (valor === undefined || valor === null) return 'em branco'
    if (questao.tipo === 'certo_errado') return valor ? 'Certo' : 'Errado'
    const alternativa = (questao.alternativas || [])[valor]
    return `${String.fromCharCode(65 + valor)}) ${alternativa ?? '?'}`
  }

  const formatarQuestao = (resultadoQuestao, indice) => {
    const { questao, resposta } = resultadoQuestao
    const linhas = [`${indice + 1}. [${questao.materia} · ${questao.banca} - ${questao.ano || ''}]`]
    linhas.push(questao.enunciado)
    ;(questao.alternativas || []).forEach((alternativa, posicao) => linhas.push(`${String.fromCharCode(65 + posicao)}) ${alternativa}`))
    linhas.push(`Resposta marcada: ${descreverAlternativa(questao, resposta)}`)
    linhas.push(`Gabarito: ${descreverAlternativa(questao, questao.gabarito)}`)
    return linhas.join('\n')
  }

  const montarPrompt = async () => {
    const questoesCertas = []
    const questoesErradas = []
    for (const resultadoQuestao of detalhe) {
      (resultadoQuestao.certa ? questoesCertas : questoesErradas).push(resultadoQuestao)
    }
    const formatarLista = (resultados) =>
      resultados.length
        ? resultados.map((resultadoQuestao, indice) => formatarQuestao(resultadoQuestao, indice)).join('\n\n')
        : '(nenhuma)'

    const prompt =
      `Atue como meu professor particular na revisão de um simulado que acabei de fazer. ` +
      `Consolide o que eu acertei e me oriente no que errei, explicando o raciocínio de cada questão errada ` +
      `e apontando o que devo reforçar.\n\n` +
      `Resultado: acertei ${notaPrincipal} de ${total} questões.\n\n` +
      `Questões que acertei:\n${formatarLista(questoesCertas)}\n\n` +
      `Questões que errei:\n${formatarLista(questoesErradas)}`
    if (await copiarTexto(prompt)) { setCopiado(true); setTimeout(() => setCopiado(false), 1800) }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 flex flex-col gap-6 animar-entrada">
      <div className="text-center flex flex-col items-center gap-1">
        <span className="text-sm uppercase tracking-widest text-muted">resultado</span>
        <span className="text-5xl font-black text-primaria animar-pop">{notaPrincipal}<span className="text-2xl text-muted">/{total}</span></span>
        <span className="text-lg font-bold">{percentual}% {cebraspe ? 'líquido' : 'de acerto'}</span>
        {cebraspe && <span className="text-sm text-muted">{acertos} acertos · {erros} erros (nota líquida Cebraspe)</span>}
        {subtitulo && <span className="text-sm text-muted">{subtitulo}</span>}
      </div>

      <section className="rounded-xl bg-cartao border border-linha p-4">
        <div className="text-sm font-semibold text-muted mb-3">desempenho por matéria</div>
        <div className="flex flex-col gap-2">
          {Object.entries(porMateria).map(([materia, m]) => {
            const pct = Math.round((m.acertos / m.total) * 100)
            return (
              <div key={materia}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{materia}</span>
                  <span className="text-muted tabular-nums">{m.acertos}/{m.total}</span>
                </div>
                <div className="h-2 rounded-full bg-linha overflow-hidden">
                  <div className="h-full bg-primaria" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="relative flex flex-wrap items-center justify-center gap-3">
        {erradas.length > 0 && (
          <button onClick={() => onRefazerErradas(erradas)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-tinta text-fundo font-bold hover:opacity-90 transition">
            <ArrowClockwise size={18} weight="bold" /> refazer as {erradas.length} erradas
          </button>
        )}
        <button onClick={compartilhar} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primaria text-white font-bold hover:bg-primaria-escura transition">
          <ShareNetwork size={18} weight="fill" /> compartilhar
        </button>
        <button onClick={onVoltar} className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-linha font-semibold hover:border-primaria transition">
          <House size={18} weight="fill" /> início
        </button>
        <button onClick={montarPrompt} className="flex items-center gap-2 px-5 py-2.5 rounded-lg border text-acerto border-linha font-semibold hover:border-acerto transition">
          <Robot size={18} weight="fill" /> copiar prompt para revisar com a IA
        </button>
        {copiado && (
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-tinta text-fundo text-xs font-bold px-3 py-1">
            copiado!
          </span>
        )}
      </div>

      <section className="flex flex-col gap-4">
        <div className="text-sm font-semibold text-muted">correção</div>
        {detalhe.map((d, i) => {
          const status = d.resposta == null ? 'branco' : d.certa ? 'certo' : 'errado'
          const borda = { branco: 'border-linha', certo: 'border-acerto', errado: 'border-erro' }[status]
          const aviso = {
            branco: { texto: 'Você deixou em branco essa questão', classe: 'bg-white text-black' },
            certo: { texto: 'Você acertou essa questão', classe: 'bg-green-600 text-white' },
            errado: { texto: 'Você errou essa questão', classe: 'bg-red-600 text-white' },
          }[status]
          return (
            <div key={d.questao.id} className={`rounded-xl bg-cartao border p-4 ${borda}`}>
              <div className="block mt-1 mb-5">
                <span className={`py-2 px-2 rounded-md ${aviso.classe}`}>{aviso.texto}</span>
              </div>
              <Questao questao={d.questao} numero={i + 1} resposta={d.resposta} revelar />
            </div>
          )
        })}
      </section>
    </main>
  )
}
