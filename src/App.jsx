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
  const [telaAtual, setTelaAtual] = useState('inicio')
  const [provasUsuario, setProvasUsuario] = useState([])
  const [progresso, setProgresso] = useState(null)
  const [provaSelecionada, setProvaSelecionada] = useState(null)
  const [sessao, setSessao] = useState(null)   // { questoes, duracaoSeg, modo, titulo, provaId, origem }
  const [respostas, setRespostas] = useState({})
  const [resultado, setResultado] = useState(null)
  const [estadoInicialResolvendo, setEstadoInicialResolvendo] = useState(null)
  const [tema, setTema] = useState(temaInicial)

  useEffect(() => { setProvasUsuario(getProvasUsuario()); setProgresso(getProgresso()) }, [])
  useEffect(() => { aplicarTema(tema); salvarTema(tema) }, [tema])
  const todasAsProvas = [...PROVAS_EMBUTIDAS, ...provasUsuario]

  const enviarProva = async (arquivo) => {
    const { avisos, prova } = await lerArquivoProva(arquivo)
    const { substituiu } = adicionarProvaUsuario(prova)
    setProvasUsuario(getProvasUsuario())
    return substituiu ? ['substituiu uma prova de mesmo id', ...avisos] : avisos
  }
  const enviarPasta = async (arquivos) => {
    const resultadoUpload = await subirPastaProvas(arquivos)
    setProvasUsuario(getProvasUsuario())
    return resultadoUpload
  }
  const removerProva = (id) => { removerProvaUsuario(id); setProvasUsuario(getProvasUsuario()) }

  const iniciarSessao = (configuracaoSessao) => {
    setSessao(configuracaoSessao)
    setRespostas({})
    setEstadoInicialResolvendo(null)
    setTelaAtual('resolvendo')
  }

  const responderQuestao = (idQuestao, respostaEscolhida) =>
    setRespostas((respostasAtuais) => ({ ...respostasAtuais, [idQuestao]: respostaEscolhida }))

  const finalizarSimulado = () => {
    const resultadoCorrecao = corrigir(sessao.questoes, respostas, { pontuacao: sessao.pontuacao })
    setResultado(resultadoCorrecao)
    if (sessao.origem === 'prova') {
      registrarResultado({
        provaId: sessao.provaId,
        titulo: sessao.titulo,
        origem: sessao.origem,
        acertos: resultadoCorrecao.acertos,
        total: resultadoCorrecao.total,
        percentual: resultadoCorrecao.percentual,
      })
    }
    limparProgresso(sessao); setProgresso(getProgresso())
    setTelaAtual('resultado')
  }

  // Auto-save silencioso (chamado pelo Resolvendo a cada resposta/navegação).
  const salvarAutomaticamente = (estadoResolvendo) => {
    salvarProgresso({ sessao, respostas, titulo: sessao.titulo, ...estadoResolvendo })
  }

  const pausar = (estadoResolvendo) => {
    salvarProgresso({ sessao, respostas, titulo: sessao.titulo, ...estadoResolvendo })
    setProgresso(getProgresso())
    setTelaAtual('inicio')
  }

  const retomar = () => {
    const progressoSalvo = getProgresso()
    if (!progressoSalvo) return
    setSessao(progressoSalvo.sessao)
    setRespostas(progressoSalvo.respostas || {})
    setEstadoInicialResolvendo({
      indice: progressoSalvo.indice,
      segundos: progressoSalvo.segundos,
      marcadas: progressoSalvo.marcadas,
      reveladas: progressoSalvo.reveladas,
      riscadas: progressoSalvo.riscadas,
      destaques: progressoSalvo.destaques,
    })
    setTelaAtual('resolvendo')
  }

  const refazerErradas = (questoesErradas) => {
    iniciarSessao({ questoes: questoesErradas, duracaoSeg: null, modo: 'estudo', titulo: 'Refazendo as erradas', provaId: null, origem: 'refazer' })
  }

  const voltarInicio = () => { setTelaAtual('inicio'); setResultado(null); setRespostas({}); setProgresso(getProgresso()) }

  const alternarTema = () => setTema((temaAtual) => (temaAtual === 'escuro' ? 'claro' : 'escuro'))

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

      {telaAtual === 'inicio' && (
        <Inicio
          onProvas={() => setTelaAtual('provas')}
          onBanco={() => setTelaAtual('banco')}
          onHistorico={() => setTelaAtual('historico')}
          onCriar={() => setTelaAtual('criar')}
          onSubirPasta={enviarPasta}
          progresso={progresso}
          onRetomar={retomar}
        />
      )}

      {telaAtual === 'provas' && (
        <ListaProvas
          provas={todasAsProvas}
          onSelecionar={(prova) => { setProvaSelecionada(prova); setTelaAtual('config') }}
          onSubir={enviarProva}
          onRemover={removerProva}
          onVoltar={voltarInicio}
        />
      )}

      {telaAtual === 'config' && provaSelecionada && (
        <ConfigProva prova={provaSelecionada} onComecar={iniciarSessao} onVoltar={() => setTelaAtual('provas')} />
      )}

      {telaAtual === 'banco' && (
        <BancoPerguntas questoes={bancoDeQuestoes(todasAsProvas)} onComecar={iniciarSessao} onVoltar={voltarInicio} />
      )}

      {telaAtual === 'resolvendo' && sessao && sessao.questoes.length > 0 && (
        <Resolvendo
          questoes={sessao.questoes}
          respostas={respostas}
          onResponder={responderQuestao}
          duracaoSeg={sessao.duracaoSeg}
          modo={sessao.modo}
          subtitulo={sessao.titulo}
          onFinalizar={finalizarSimulado}
          onPausar={pausar}
          onAutosave={salvarAutomaticamente}
          inicial={estadoInicialResolvendo}
        />
      )}

      {telaAtual === 'resultado' && resultado && (
        <Resultado resultado={resultado} subtitulo={sessao?.titulo} onVoltar={voltarInicio} onRefazerErradas={refazerErradas} />
      )}

      {telaAtual === 'historico' && (
        <Historico onVoltar={voltarInicio} />
      )}

      {telaAtual === 'criar' && (
        <CriarProva
          onAdicionar={(prova) => { adicionarProvaUsuario(prova); setProvasUsuario(getProvasUsuario()) }}
          onVoltar={voltarInicio}
        />
      )}
    </div>
  )
}
