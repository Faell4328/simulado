import { useEffect, useState } from 'react'
import Inicio from './components/Inicio.jsx'
import ListaProvas from './components/ListaProvas.jsx'
import ConfigProva from './components/ConfigProva.jsx'
import BancoPerguntas from './components/BancoPerguntas.jsx'
import Resolvendo from './components/Resolvendo.jsx'
import Resultado from './components/Resultado.jsx'
import Historico from './components/Historico.jsx'
import CriarProva from './components/CriarProva.jsx'
import { PROVAS_EMBUTIDAS, bancoDeQuestoes } from './data/conteudo.js'
import { getProvasUsuario, adicionarProvaUsuario, removerProvaUsuario, lerArquivoProva, subirPastaProvas } from './lib/provasUsuario.js'
import { corrigir } from './lib/correcao.js'
import { registrarResultado } from './lib/resultados.js'
import { salvarProgresso, getProgresso, limparProgresso } from './lib/progresso.js'
import { temaInicial, aplicarTema, salvarTema } from './lib/tema.js'
import { Moon, Sun } from '@phosphor-icons/react'

// Telas: inicio -> (provas -> config | banco | historico) -> resolvendo -> resultado.
export default function App() {
  const [tela, setTela] = useState('inicio')
  const [provasUsuario, setProvasUsuario] = useState([])
  const [progresso, setProgresso] = useState(null)
  const [provaSel, setProvaSel] = useState(null)
  const [sessao, setSessao] = useState(null)   // { questoes, duracaoSeg, modo, titulo, provaId, origem }
  const [respostas, setRespostas] = useState({})
  const [resultado, setResultado] = useState(null)
  const [inicialResolvendo, setInicialResolvendo] = useState(null)
  const [tema, setTema] = useState(temaInicial)

  useEffect(() => { setProvasUsuario(getProvasUsuario()); setProgresso(getProgresso()) }, [])
  useEffect(() => { aplicarTema(tema); salvarTema(tema) }, [tema])
  const provas = [...PROVAS_EMBUTIDAS, ...provasUsuario]

  const subirProva = async (file) => {
    const { avisos, prova } = await lerArquivoProva(file)
    const { substituiu } = adicionarProvaUsuario(prova)
    setProvasUsuario(getProvasUsuario())
    return substituiu ? ['substituiu uma prova de mesmo id', ...avisos] : avisos
  }
  const subirPasta = async (files) => {
    const r = await subirPastaProvas(files)
    setProvasUsuario(getProvasUsuario())
    return r
  }
  const removerProva = (id) => { removerProvaUsuario(id); setProvasUsuario(getProvasUsuario()) }

  const iniciarSessao = (config) => {
    setSessao(config)
    setRespostas({})
    setInicialResolvendo(null)
    setTela('resolvendo')
  }

  const responder = (id, valor) => setRespostas((r) => ({ ...r, [id]: valor }))

  const finalizar = () => {
    const res = corrigir(sessao.questoes, respostas, { pontuacao: sessao.pontuacao })
    setResultado(res)
    if (sessao.origem === 'prova') {
      registrarResultado({ provaId: sessao.provaId, titulo: sessao.titulo, origem: sessao.origem, acertos: res.acertos, total: res.total, percentual: res.percentual })
    }
    limparProgresso(sessao); setProgresso(getProgresso())
    setTela('resultado')
  }

  // Auto-save silencioso (chamado pelo Resolvendo a cada resposta/navegação).
  const autosalvar = (estadoResolvendo) => {
    salvarProgresso({ sessao, respostas, titulo: sessao.titulo, ...estadoResolvendo })
  }

  const pausar = (estadoResolvendo) => {
    salvarProgresso({ sessao, respostas, titulo: sessao.titulo, ...estadoResolvendo })
    setProgresso(getProgresso())
    setTela('inicio')
  }

  const retomar = () => {
    const p = getProgresso()
    if (!p) return
    setSessao(p.sessao)
    setRespostas(p.respostas || {})
    setInicialResolvendo({ indice: p.indice, segundos: p.segundos, marcadas: p.marcadas, reveladas: p.reveladas, riscadas: p.riscadas })
    setTela('resolvendo')
  }

  const refazerErradas = (erradas) => {
    iniciarSessao({ questoes: erradas, duracaoSeg: null, modo: 'estudo', titulo: 'Refazendo as erradas', provaId: null, origem: 'refazer' })
  }

  const voltarInicio = () => { setTela('inicio'); setResultado(null); setRespostas({}); setProgresso(getProgresso()) }

  const alternarTema = () => setTema((t) => (t === 'escuro' ? 'claro' : 'escuro'))

  return (
    <div className="min-h-screen">
      <button
        onClick={alternarTema}
        className="fixed bottom-4 right-4 z-30 grid place-items-center w-10 h-10 rounded-full bg-cartao border border-linha text-muted hover:text-primaria hover:border-primaria shadow-sm transition"
        aria-label={tema === 'escuro' ? 'tema claro' : 'tema escuro'}
        title={tema === 'escuro' ? 'tema claro' : 'tema escuro'}
      >
        {tema === 'escuro' ? <Sun size={18} weight="fill" /> : <Moon size={18} weight="fill" />}
      </button>

      {tela === 'inicio' && (
        <Inicio
          onProvas={() => setTela('provas')}
          onBanco={() => setTela('banco')}
          onHistorico={() => setTela('historico')}
          onCriar={() => setTela('criar')}
          onSubirPasta={subirPasta}
          progresso={progresso}
          onRetomar={retomar}
        />
      )}

      {tela === 'provas' && (
        <ListaProvas
          provas={provas}
          onSelecionar={(p) => { setProvaSel(p); setTela('config') }}
          onSubir={subirProva}
          onRemover={removerProva}
          onVoltar={voltarInicio}
        />
      )}

      {tela === 'config' && provaSel && (
        <ConfigProva prova={provaSel} onComecar={iniciarSessao} onVoltar={() => setTela('provas')} />
      )}

      {tela === 'banco' && (
        <BancoPerguntas questoes={bancoDeQuestoes(provas)} onComecar={iniciarSessao} onVoltar={voltarInicio} />
      )}

      {tela === 'resolvendo' && sessao && sessao.questoes.length > 0 && (
        <Resolvendo
          questoes={sessao.questoes}
          respostas={respostas}
          onResponder={responder}
          duracaoSeg={sessao.duracaoSeg}
          modo={sessao.modo}
          subtitulo={sessao.titulo}
          onFinalizar={finalizar}
          onPausar={pausar}
          onAutosave={autosalvar}
          inicial={inicialResolvendo}
        />
      )}

      {tela === 'resultado' && resultado && (
        <Resultado resultado={resultado} subtitulo={sessao?.titulo} onVoltar={voltarInicio} onRefazerErradas={refazerErradas} />
      )}

      {tela === 'historico' && (
        <Historico onVoltar={voltarInicio} />
      )}

      {tela === 'criar' && (
        <CriarProva
          onAdicionar={(prova) => { adicionarProvaUsuario(prova); setProvasUsuario(getProvasUsuario()) }}
          onVoltar={voltarInicio}
        />
      )}
    </div>
  )
}
