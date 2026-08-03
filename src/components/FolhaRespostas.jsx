// Grade de navegação: mostra respondidas, a atual e as marcadas para revisão.
export default function FolhaRespostas({ questoes, respostas, marcadas, indice, onIr }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {questoes.map((q, i) => {
        const respondida = respostas[q.id] !== undefined
        const atual = i === indice
        const marcada = marcadas?.has(q.id)
        return (
          <button
            key={q.id}
            onClick={() => onIr(i)}
            className={`relative w-8 h-8 rounded-lg text-sm font-bold border transition ${
              atual
                ? 'bg-primaria text-white border-primaria'
                : respondida
                ? 'bg-primaria-clara text-primaria border-primaria-clara'
                : 'bg-cartao text-muted border-linha hover:border-primaria'
            }`}
          >
            {i + 1}
            {marcada && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-cartao" />}
          </button>
        )
      })}
    </div>
  )
}
