import { useState } from 'react'
import { montarQuestoes } from '../lib/sessao.js'
import { ArrowLeft, Play } from '@phosphor-icons/react'

// Banco de perguntas: filtra por matéria/banca as questões de todas as provas,
// sorteia N e treina (modo estudo por padrão). Cada questão mantém a prova de
// origem, mostrada durante a resolução.
export default function BancoPerguntas({ questoes, onComecar, onVoltar }) {
  const materias = ['todas', ...new Set(questoes.map((questao) => questao.materia))]
  const bancas = ['todas', ...new Set(questoes.map((questao) => questao.banca))]
  const [materia, setMateria] = useState('todas')
  const [banca, setBanca] = useState('todas')
  const [modo, setModo] = useState('estudo')

  const questoesFiltradas = questoes.filter(
    (questao) => (materia === 'todas' || questao.materia === materia) && (banca === 'todas' || questao.banca === banca),
  )
  const quantidadeMaxima = questoesFiltradas.length
  const [quantidadeEscolhida, setQuantidadeEscolhida] = useState(10)
  const quantidadeFinal = Math.min(quantidadeEscolhida, quantidadeMaxima)

  const iniciarTreino = () => {
    if (quantidadeMaxima === 0) return
    onComecar({
      questoes: montarQuestoes(questoesFiltradas, { embaralhar: true, sortearN: quantidadeFinal }),
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
        <div className="text-xs uppercase tracking-widest text-muted">quantidade ({quantidadeFinal} de {quantidadeMaxima})</div>
        <input
          type="range"
          min="1"
          max={Math.max(1, quantidadeMaxima)}
          value={quantidadeFinal}
          onChange={(evento) => setQuantidadeEscolhida(Number(evento.target.value))}
          className="accent-primaria"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xs uppercase tracking-widest text-muted">modo</div>
        <div className="flex gap-2">
          <Opcao ativo={modo === 'estudo'} onClick={() => setModo('estudo')}>Estudo</Opcao>
          <Opcao ativo={modo === 'prova'} onClick={() => setModo('prova')}>Prova</Opcao>
        </div>
      </div>

      <button
        onClick={iniciarTreino}
        disabled={quantidadeMaxima === 0}
        className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primaria text-white font-bold hover:bg-primaria-escura transition disabled:opacity-40"
      >
        <Play size={20} weight="fill" /> {quantidadeMaxima === 0 ? 'sem questões' : 'começar'}
      </button>
    </main>
  )
}

function Filtro({ titulo, opcoes, valor, onEscolher }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs uppercase tracking-widest text-muted">{titulo}</div>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((opcao) => (
          <button
            key={opcao}
            onClick={() => onEscolher(opcao)}
            className={`px-3 py-1 rounded-full text-sm border transition ${
              valor === opcao ? 'bg-primaria text-white border-primaria' : 'border-linha hover:border-primaria'
            }`}
          >
            {opcao}
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
