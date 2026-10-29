import { useState } from 'react'
import { montarQuestoes } from '../lib/sessao.js'
import { ArrowLeft, Play } from '@phosphor-icons/react'

// Tela de configuração antes de começar: tempo (sugerido pela prova, editável),
// embaralhar, modo estudo/prova e sortear N questões.
export default function ConfigProva({ prova, onComecar, onVoltar }) {
  const totalQuestoes = prova.questoes.length
  const temCertoErrado = prova.questoes.some((questao) => questao.tipo === 'certo_errado')
  const [semLimiteTempo, setSemLimiteTempo] = useState(false)
  const [tempoMin, setTempoMin] = useState(prova.tempoMin || 60)
  const [embaralhar, setEmbaralhar] = useState(false)
  const [embaralharAlternativas, setEmbaralharAlternativas] = useState(false)
  const [modo, setModo] = useState('prova') // 'prova' | 'estudo'
  const [pontuacao, setPontuacao] = useState('bruto') // 'bruto' | 'cebraspe'
  const [quantidadeQuestoes, setQuantidadeQuestoes] = useState(totalQuestoes)

  const iniciarProva = () => {
    const questoes = montarQuestoes(prova.questoes, {
      embaralhar,
      embaralharAlt: embaralharAlternativas,
      sortearN: quantidadeQuestoes < totalQuestoes ? quantidadeQuestoes : null,
    })
    onComecar({
      questoes,
      duracaoSeg: semLimiteTempo ? null : tempoMin * 60,
      modo,
      pontuacao,
      titulo: prova.titulo,
      provaId: prova.id,
      origem: 'prova',
    })
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8 flex flex-col gap-6 animar-entrada">
      <button onClick={onVoltar} className="self-start text-muted hover:text-tinta flex items-center gap-1 text-sm">
        <ArrowLeft size={16} /> voltar
      </button>

      <div>
        <h1 className="text-xl font-bold">{prova.titulo}</h1>
        <div className="text-sm text-muted">{prova.banca} · {totalQuestoes} questões</div>
      </div>

      <Bloco titulo="Tempo">
        <div className="flex items-center gap-3">
          <input
            type="number" min="1" value={tempoMin} disabled={semLimiteTempo}
            onChange={(evento) => setTempoMin(Math.max(1, Number(evento.target.value) || 1))}
            className="w-24 px-3 py-2 rounded-lg border border-linha disabled:opacity-40"
          />
          <span className="text-muted text-sm">minutos</span>
          <label className="ml-auto flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={semLimiteTempo} onChange={(evento) => setSemLimiteTempo(evento.target.checked)} />
            sem limite
          </label>
        </div>
      </Bloco>

      <Bloco titulo="Modo">
        <div className="flex gap-2">
          <Opcao ativo={modo === 'prova'} onClick={() => setModo('prova')}>
            Prova <span className="block text-[11px] opacity-70">corrige no fim</span>
          </Opcao>
          <Opcao ativo={modo === 'estudo'} onClick={() => setModo('estudo')}>
            Estudo <span className="block text-[11px] opacity-70">gabarito na hora</span>
          </Opcao>
        </div>
      </Bloco>

      <Bloco titulo={`Questões (${quantidadeQuestoes} de ${totalQuestoes})`}>
        <div className="flex flex-col gap-2">
          <input
            type="range" min="1" max={totalQuestoes} value={quantidadeQuestoes}
            onChange={(evento) => setQuantidadeQuestoes(Number(evento.target.value))}
            className="accent-primaria"
          />
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={embaralhar} onChange={(evento) => setEmbaralhar(evento.target.checked)} />
              embaralhar questões
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={embaralharAlternativas} onChange={(evento) => setEmbaralharAlternativas(evento.target.checked)} />
              embaralhar alternativas
            </label>
          </div>
        </div>
      </Bloco>

      {temCertoErrado && (
        <Bloco titulo="Pontuação">
          <div className="flex gap-2">
            <Opcao ativo={pontuacao === 'bruto'} onClick={() => setPontuacao('bruto')}>
              Bruta <span className="block text-[11px] opacity-70">só conta acertos</span>
            </Opcao>
            <Opcao ativo={pontuacao === 'cebraspe'} onClick={() => setPontuacao('cebraspe')}>
              Cebraspe <span className="block text-[11px] opacity-70">errada anula certa</span>
            </Opcao>
          </div>
        </Bloco>
      )}

      <button
        onClick={iniciarProva}
        className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primaria text-white font-bold hover:bg-primaria-escura hover:shadow-lg hover:shadow-primaria/30 active:scale-[.98]"
      >
        <Play size={20} weight="fill" /> começar
      </button>
    </main>
  )
}

function Bloco({ titulo, children }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs uppercase tracking-widest text-muted">{titulo}</div>
      {children}
    </div>
  )
}

function Opcao({ ativo, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-4 py-2 rounded-lg border text-center font-semibold transition ${
        ativo ? 'bg-primaria text-white border-primaria' : 'border-linha hover:border-primaria'
      }`}
    >
      {children}
    </button>
  )
}
