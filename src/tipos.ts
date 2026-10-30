export type TipoQuestao = "multipla" | "certo_errado";
export type ModoSessao = "prova" | "estudo";
export type TipoPontuacao = "bruto" | "cebraspe";
export type OrigemProva = "embutida" | "usuario";
export type OrigemSessao = "prova" | "banco" | "refazer";
export type Tema = "claro" | "escuro";
export type Tela =
  | "inicio"
  | "provas"
  | "config"
  | "banco"
  | "resolvendo"
  | "resultado"
  | "historico"
  | "criar";

export type ValorResposta = number | boolean | null | undefined;
export type Respostas = Record<string, ValorResposta>;

export interface Questao {
  id: string;
  provaId: string;
  provaTitulo: string;
  tipo: TipoQuestao;
  materia: string;
  banca: string;
  ano?: number;
  orgao?: string;
  enunciado: string;
  alternativas?: string[];
  gabarito: number | boolean;
  comentario?: string;
}

export interface Prova {
  id: string;
  titulo: string;
  banca: string;
  orgao: string;
  ano: number | null;
  tempoMin: number;
  origem: OrigemProva;
  questoes: Questao[];
}

export interface QuestaoBruta {
  tipo?: string;
  materia?: string;
  banca?: string;
  ano?: number;
  orgao?: string;
  enunciado?: string;
  alternativas?: string[];
  gabarito?: number | boolean;
  comentario?: string;
}

export interface ProvaBruta {
  id?: string;
  titulo?: string;
  banca?: string;
  orgao?: string;
  ano?: number;
  tempoMin?: number;
  questoes?: QuestaoBruta[];
}

export interface Sessao {
  questoes: Questao[];
  duracaoSeg: number | null;
  modo: ModoSessao;
  pontuacao?: TipoPontuacao;
  titulo: string;
  provaId: string | null;
  origem: OrigemSessao;
}

export interface Destaque {
  id: string;
  inicio: number;
  fim: number;
}

export interface OffsetsSelecao {
  inicio: number;
  fim: number;
}

export type Riscadas = Record<string, Record<number, boolean>>;
export type DestaquesPorQuestao = Record<string, Destaque[]>;

export interface EstadoInicialResolvendo {
  indice?: number;
  segundos?: number;
  marcadas?: string[];
  reveladas?: string[];
  riscadas?: Riscadas;
  destaques?: DestaquesPorQuestao;
}

export interface EstadoResolvendo {
  indice: number;
  segundos: number;
  marcadas: string[];
  reveladas: string[];
  riscadas: Riscadas;
  destaques: DestaquesPorQuestao;
}

export interface ProgressoParaSalvar extends EstadoResolvendo {
  sessao: Sessao;
  respostas: Respostas;
  titulo: string;
  salvoEm?: number;
}

export interface ProgressoSalvo extends ProgressoParaSalvar {
  salvoEm: number;
}

export interface EstatisticaMateria {
  total: number;
  acertos: number;
  erros: number;
}

export interface ResultadoQuestao {
  questao: Questao;
  resposta: ValorResposta;
  certa: boolean;
}

export interface ResultadoCorrecao {
  acertos: number;
  erros: number;
  liquido: number;
  pontuacao: TipoPontuacao;
  total: number;
  percentual: number;
  porMateria: Record<string, EstatisticaMateria>;
  detalhe: ResultadoQuestao[];
}

export interface ResultadoHistorico {
  provaId: string;
  titulo: string;
  origem: string;
  acertos: number;
  total: number;
  percentual: number;
  data: string;
  // Correção completa (guardada a partir da versão com detalhes). Resultados
  // antigos do save podem não ter estes campos.
  pontuacao?: TipoPontuacao;
  erros?: number;
  liquido?: number;
  porMateria?: Record<string, EstatisticaMateria>;
  detalhe?: ResultadoQuestao[];
}

export interface ArquivoProvaLido {
  prova: ProvaBruta;
  avisos: string[];
}

export interface ErroSubidaProva {
  nome: string;
  erro: string;
}

export interface ResultadoSubidaPasta {
  adicionadas: number;
  erros: ErroSubidaProva[];
  total: number;
}

export interface ResultadoAdicionarProva {
  provaNormalizada: Prova;
  substituiu: boolean;
}
