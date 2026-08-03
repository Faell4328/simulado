import { useState } from 'react'
import { montarQuestoes } from '../lib/sessao.js'
import { ArrowLeft, Play } from '@phosphor-icons/react'

// Banco de perguntas: filtra por matéria/banca as questões de todas as provas,
// sorteia N e treina (modo estudo por padrão). Cada questão mantém a prova de
// origem, mostrada durante a resolução.
export default function BancoPerguntas({ questoes, onComecar, onVoltar }) {
  const materias = ['todas', ...new Set(questoes.map((q) => q.materia))]
  const bancas = ['todas', ...new Set(questoes.map((q) => q.banca))]
  const [materia, setMateria] = useState('todas')
  const [banca, setBanca] = useState('todas')
  const [modo, setModo] = useState('estudo')

  const filtradas = questoes.filter(
    (q) => (materia === 'todas' || q.materia === materia) && (banca === 'todas' || q.banca === banca),
  )
  const max = filtradas.length
  const [n, setN] = useState(10)
  const nFinal = Math.min(n, max)

  const comecar = () => {
    if (max === 0) return
    onComecar({
      questoes: montarQuestoes(filtradas, { embaralhar: true, sortearN: nFinal }),
      duracaoSeg: null,
      modo,
      titulo: 'Banco de perguntas',
      provaId: 'banco',
      origem: 'banco',
    })
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8 flex flex-col gap-6 animar-entrada">
      <div className="flex items-center gap-3">
        <button onClick={onVoltar} className="text-muted hover:text-tinta flex items-center gap-1 text-sm">
          <ArrowLeft size={16} /> início
        </button>
        <h1 className="text-lg font-bold">Banco de perguntas</h1>
      </div>

      <Filtro titulo="Matéria" opcoes={materias} valor={materia} onEscolher={setMateria} />
      <Filtro titulo="Banca" opcoes={bancas} valor={banca} onEscolher={setBanca} />

      <div className="flex flex-col gap-2">
        <div className="text-xs uppercase tracking-widest text-muted">quantidade ({nFinal} de {max})</div>
        <input type="range" min="1" max={Math.max(1, max)} value={nFinal} onChange={(e) => setN(Number(e.target.value))} className="accent-primaria" />
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xs uppercase tracking-widest text-muted">modo</div>
        <div className="flex gap-2">
          <Opcao ativo={modo === 'estudo'} onClick={() => setModo('estudo')}>Estudo</Opcao>
          <Opcao ativo={modo === 'prova'} onClick={() => setModo('prova')}>Prova</Opcao>
        </div>
      </div>

      <button
        onClick={comecar}
        disabled={max === 0}
        className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primaria text-white font-bold hover:bg-primaria-escura transition disabled:opacity-40"
      >
        <Play size={20} weight="fill" /> {max === 0 ? 'sem questões' : 'começar'}
      </button>
    </main>
  )
}

function Filtro({ titulo, opcoes, valor, onEscolher }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs uppercase tracking-widest text-muted">{titulo}</div>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((o) => (
          <button
            key={o}
            onClick={() => onEscolher(o)}
            className={`px-3 py-1 rounded-full text-sm border transition ${
              valor === o ? 'bg-primaria text-white border-primaria' : 'border-linha hover:border-primaria'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
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
