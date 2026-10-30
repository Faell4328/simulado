import { useEffect, useState } from "react";
import Inicio from "./components/Inicio";
import ListaProvas from "./components/ListaProvas";
import ConfigProva from "./components/ConfigProva";
import BancoPerguntas from "./components/BancoPerguntas";
import Resolvendo from "./components/Resolvendo";
import Resultado from "./components/Resultado";
import Historico from "./components/Historico";
import CriarProva from "./components/CriarProva";
import { PROVAS_EMBUTIDAS, bancoDeQuestoes } from "./data/conteudo";
import {
  getProvasUsuario,
  adicionarProvaUsuario,
  removerProvaUsuario,
  lerArquivoProva,
  subirPastaProvas,
} from "./lib/provasUsuario";
import { corrigir } from "./lib/correcao";
import {
  registrarResultado,
  correcaoDoHistorico,
} from "./lib/resultados";
import {
  salvarProgresso,
  getProgresso,
  limparProgresso,
} from "./lib/progresso";
import { temaInicial, aplicarTema, salvarTema } from "./lib/tema";
import { Moon, Sun } from "@phosphor-icons/react";
import type {
  EstadoInicialResolvendo,
  EstadoResolvendo,
  Prova,
  ProvaBruta,
  Questao,
  Respostas,
  ResultadoCorrecao,
  ResultadoHistorico,
  ResultadoSubidaPasta,
  Sessao,
  Tela,
  Tema,
} from "./tipos";

// Telas: inicio -> (provas -> config | banco | historico) -> resolvendo -> resultado.
export default function App() {
  const [telaAtual, setTelaAtual] = useState<Tela>("inicio");
  const [provasUsuario, setProvasUsuario] = useState<Prova[]>([]);
  const [progresso, setProgresso] =
    useState<ReturnType<typeof getProgresso>>(null);
  const [provaSelecionada, setProvaSelecionada] = useState<Prova | null>(null);
  const [sessao, setSessao] = useState<Sessao | null>(null); // { questoes, duracaoSeg, modo, titulo, provaId, origem }
  const [respostas, setRespostas] = useState<Respostas>({});
  const [resultado, setResultado] = useState<ResultadoCorrecao | null>(null);
  const [tituloResultado, setTituloResultado] = useState<string | null>(null);
  const [resultadoVeioDoHistorico, setResultadoVeioDoHistorico] =
    useState(false);
  const [estadoInicialResolvendo, setEstadoInicialResolvendo] =
    useState<EstadoInicialResolvendo | null>(null);
  const [tema, setTema] = useState<Tema>(temaInicial);

  useEffect(() => {
    setProvasUsuario(getProvasUsuario());
    setProgresso(getProgresso());
  }, []);
  useEffect(() => {
    aplicarTema(tema);
    salvarTema(tema);
  }, [tema]);
  const todasAsProvas: Prova[] = [...PROVAS_EMBUTIDAS, ...provasUsuario];

  const enviarProva = async (arquivo: File): Promise<string[]> => {
    const { avisos, prova } = await lerArquivoProva(arquivo);
    const { substituiu } = adicionarProvaUsuario(prova);
    setProvasUsuario(getProvasUsuario());
    return substituiu
      ? ["substituiu uma prova de mesmo id", ...avisos]
      : avisos;
  };
  const enviarPasta = async (
    arquivos: FileList,
  ): Promise<ResultadoSubidaPasta> => {
    const resultadoUpload = await subirPastaProvas(arquivos);
    setProvasUsuario(getProvasUsuario());
    return resultadoUpload;
  };
  const removerProva = (id: string) => {
    removerProvaUsuario(id);
    setProvasUsuario(getProvasUsuario());
  };

  const iniciarSessao = (configuracaoSessao: Sessao) => {
    setSessao(configuracaoSessao);
    setRespostas({});
    setEstadoInicialResolvendo(null);
    setTelaAtual("resolvendo");
  };

  const responderQuestao = (
    idQuestao: string,
    respostaEscolhida: number | boolean,
  ) =>
    setRespostas((respostasAtuais) => ({
      ...respostasAtuais,
      [idQuestao]: respostaEscolhida,
    }));

  const finalizarSimulado = () => {
    if (!sessao) return;
    const resultadoCorrecao = corrigir(sessao.questoes, respostas, {
      pontuacao: sessao.pontuacao,
    });
    setResultado(resultadoCorrecao);
    setTituloResultado(sessao.titulo);
    setResultadoVeioDoHistorico(false);
    if (sessao.origem === "prova" && sessao.provaId) {
      registrarResultado({
        provaId: sessao.provaId,
        titulo: sessao.titulo,
        origem: sessao.origem,
        acertos: resultadoCorrecao.acertos,
        total: resultadoCorrecao.total,
        percentual: resultadoCorrecao.percentual,
        pontuacao: resultadoCorrecao.pontuacao,
        erros: resultadoCorrecao.erros,
        liquido: resultadoCorrecao.liquido,
        porMateria: resultadoCorrecao.porMateria,
        detalhe: resultadoCorrecao.detalhe,
      });
    }
    limparProgresso(sessao);
    setProgresso(getProgresso());
    setTelaAtual("resultado");
  };

  // Abre a tela de Resultado de um item do histórico. Retorna false quando o
  // save é antigo e não guardou a correção completa.
  const abrirResultadoDoHistorico = (
    registro: ResultadoHistorico,
  ): boolean => {
    const correcao = correcaoDoHistorico(registro);
    if (!correcao) return false;
    setResultado(correcao);
    setTituloResultado(registro.titulo);
    setResultadoVeioDoHistorico(true);
    setTelaAtual("resultado");
    return true;
  };

  const voltarDoResultado = () => {
    if (resultadoVeioDoHistorico) {
      setTelaAtual("historico");
      return;
    }
    voltarInicio();
  };

  // Auto-save silencioso (chamado pelo Resolvendo a cada resposta/navegação).
  const salvarAutomaticamente = (estadoResolvendo: EstadoResolvendo) => {
    if (!sessao) return;
    salvarProgresso({
      sessao,
      respostas,
      titulo: sessao.titulo,
      ...estadoResolvendo,
    });
  };

  const pausar = (estadoResolvendo: EstadoResolvendo) => {
    if (!sessao) return;
    salvarProgresso({
      sessao,
      respostas,
      titulo: sessao.titulo,
      ...estadoResolvendo,
    });
    setProgresso(getProgresso());
    setTelaAtual("inicio");
  };

  const retomar = () => {
    const progressoSalvo = getProgresso();
    if (!progressoSalvo) return;
    setSessao(progressoSalvo.sessao);
    setRespostas(progressoSalvo.respostas || {});
    setEstadoInicialResolvendo({
      indice: progressoSalvo.indice,
      segundos: progressoSalvo.segundos,
      marcadas: progressoSalvo.marcadas,
      reveladas: progressoSalvo.reveladas,
      riscadas: progressoSalvo.riscadas,
      destaques: progressoSalvo.destaques,
    });
    setTelaAtual("resolvendo");
  };

  const refazerErradas = (questoesErradas: Questao[]) => {
    iniciarSessao({
      questoes: questoesErradas,
      duracaoSeg: null,
      modo: "estudo",
      titulo: "Refazendo as erradas",
      provaId: null,
      origem: "refazer",
    });
  };

  const voltarInicio = () => {
    setTelaAtual("inicio");
    setResultado(null);
    setRespostas({});
    setProgresso(getProgresso());
  };

  const alternarTema = () =>
    setTema((temaAtual) => (temaAtual === "escuro" ? "claro" : "escuro"));

  return (
    <div className="min-h-screen">
      <button
        onClick={alternarTema}
        className="fixed bottom-4 right-4 z-30 grid place-items-center w-10 h-10 rounded-full bg-cartao border border-linha text-muted hover:text-primaria hover:border-primaria shadow-sm transition"
        aria-label={tema === "escuro" ? "tema claro" : "tema escuro"}
        title={tema === "escuro" ? "tema claro" : "tema escuro"}
      >
        {tema === "escuro" ? (
          <Sun size={18} weight="fill" />
        ) : (
          <Moon size={18} weight="fill" />
        )}
      </button>

      {telaAtual === "inicio" && (
        <Inicio
          onProvas={() => setTelaAtual("provas")}
          onBanco={() => setTelaAtual("banco")}
          onHistorico={() => setTelaAtual("historico")}
          onCriar={() => setTelaAtual("criar")}
          onSubirPasta={enviarPasta}
          progresso={progresso}
          onRetomar={retomar}
        />
      )}

      {telaAtual === "provas" && (
        <ListaProvas
          provas={todasAsProvas}
          onSelecionar={(prova: Prova) => {
            setProvaSelecionada(prova);
            setTelaAtual("config");
          }}
          onSubir={enviarProva}
          onRemover={removerProva}
          onVoltar={voltarInicio}
        />
      )}

      {telaAtual === "config" && provaSelecionada && (
        <ConfigProva
          prova={provaSelecionada}
          onComecar={iniciarSessao}
          onVoltar={() => setTelaAtual("provas")}
        />
      )}

      {telaAtual === "banco" && (
        <BancoPerguntas
          questoes={bancoDeQuestoes(todasAsProvas)}
          onComecar={iniciarSessao}
          onVoltar={voltarInicio}
        />
      )}

      {telaAtual === "resolvendo" && sessao && sessao.questoes.length > 0 && (
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

      {telaAtual === "resultado" && resultado && (
        <Resultado
          resultado={resultado}
          subtitulo={tituloResultado}
          voltandoDoHistorico={resultadoVeioDoHistorico}
          onVoltar={voltarDoResultado}
          onRefazerErradas={refazerErradas}
        />
      )}

      {telaAtual === "historico" && (
        <Historico
          onVoltar={voltarInicio}
          onAbrirResultado={abrirResultadoDoHistorico}
        />
      )}

      {telaAtual === "criar" && (
        <CriarProva
          onAdicionar={(prova: ProvaBruta) => {
            adicionarProvaUsuario(prova);
            setProvasUsuario(getProvasUsuario());
          }}
          onVoltar={voltarInicio}
        />
      )}
    </div>
  );
}
