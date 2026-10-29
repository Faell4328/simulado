// Grade de navegação: mostra respondidas, a atual e as marcadas para revisão.
export default function FolhaRespostas({ questoes, respostas, marcadas, indice, onIr }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {questoes.map((questao, indiceQuestao) => {
        const foiRespondida = respostas[questao.id] !== undefined
        const ehAtual = indiceQuestao === indice
        const foiMarcada = marcadas?.has(questao.id)
        return (
          <button
            key={questao.id}
            onClick={() => onIr(indiceQuestao)}
            className={`relative w-8 h-8 rounded-lg text-sm font-bold border transition ${
              ehAtual
                ? 'bg-primaria text-white border-primaria'
                : foiRespondida
                ? 'bg-primaria-clara text-primaria border-primaria-clara'
                : 'bg-cartao text-muted border-linha hover:border-primaria'
            }`}
          >
            {indiceQuestao + 1}
            {foiMarcada && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-cartao" />}
          </button>
        )
      })}
    </div>
  )
}
