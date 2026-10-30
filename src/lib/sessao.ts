// Monta a lista de questões de uma sessão a partir das opções escolhidas na
// tela de configuração (embaralhar, sortear N).
import type { Questao } from "../tipos";

export function embaralharArray<T>(lista: T[]): T[] {
  const embaralhada = [...lista];
  for (let i = embaralhada.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [embaralhada[i], embaralhada[j]] = [embaralhada[j], embaralhada[i]];
  }
  return embaralhada;
}

// Embaralha as alternativas de uma questão múltipla, remapeando o gabarito pro
// novo índice. Certo/errado não tem alternativas — devolve igual.
export function embaralharAlternativas(questao: Questao): Questao {
  if (questao.tipo !== "multipla" || !Array.isArray(questao.alternativas))
    return questao;
  const ordem = questao.alternativas.map((_, indice) => indice);
  for (let i = ordem.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
  }
  return {
    ...questao,
    alternativas: ordem.map((indice) => questao.alternativas![indice]),
    gabarito: ordem.indexOf(questao.gabarito as number),
  };
}

export function montarQuestoes(
  questoes: Questao[],
  {
    embaralhar = false,
    sortearN = null,
    embaralharAlt = false,
  }: {
    embaralhar?: boolean;
    sortearN?: number | null;
    embaralharAlt?: boolean;
  } = {},
): Questao[] {
  let questoesSelecionadas = questoes;
  if (sortearN && sortearN < questoesSelecionadas.length)
    questoesSelecionadas = embaralharArray(questoesSelecionadas).slice(
      0,
      sortearN,
    );
  else if (embaralhar)
    questoesSelecionadas = embaralharArray(questoesSelecionadas);
  if (embaralharAlt)
    questoesSelecionadas = questoesSelecionadas.map(embaralharAlternativas);
  return questoesSelecionadas;
}
