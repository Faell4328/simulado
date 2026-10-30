// Provas que o usuário sobe do próprio PC. Ficam salvas no localStorage (sem
// login, sem servidor) e aparecem na lista junto com as embutidas.
import { normalizarProva, validarProva } from "../data/conteudo";
import type {
  ArquivoProvaLido,
  Prova,
  ProvaBruta,
  ResultadoAdicionarProva,
  ResultadoSubidaPasta,
} from "../tipos";

const CHAVE_ARMAZENAMENTO = "simulado_provas_usuario";

export function getProvasUsuario(): Prova[] {
  try {
    const provasSalvas = JSON.parse(
      localStorage.getItem(CHAVE_ARMAZENAMENTO) || "[]",
    ) as ProvaBruta[];
    return provasSalvas.map((prova) => normalizarProva(prova, "", "usuario"));
  } catch {
    return [];
  }
}

function salvarProvas(provas: ProvaBruta[]): void {
  try {
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(provas));
  } catch {
    // Cota do navegador estourada (~5MB) — provavelmente imagens grandes.
    throw new Error(
      "não coube no navegador (armazenamento cheio). Remova provas antigas ou use imagens menores.",
    );
  }
}

function lerProvasSalvas(): ProvaBruta[] {
  try {
    return JSON.parse(
      localStorage.getItem(CHAVE_ARMAZENAMENTO) || "[]",
    ) as ProvaBruta[];
  } catch {
    return [];
  }
}

// Adiciona (ou substitui, se o id já existir) uma prova já validada.
// Retorna { provaNormalizada, substituiu } pra avisar quando troca uma prova de mesmo id.
export function adicionarProvaUsuario(
  provaCrua: ProvaBruta,
): ResultadoAdicionarProva {
  const provaNormalizada = normalizarProva(provaCrua, "", "usuario");
  const provasAtuais = lerProvasSalvas();
  const substituiu = provasAtuais.some(
    (prova) => (prova.id || "") === provaNormalizada.id,
  );
  const provasRestantes = provasAtuais.filter(
    (prova) => (prova.id || "") !== provaNormalizada.id,
  );
  provasRestantes.push({ ...provaCrua, id: provaNormalizada.id });
  salvarProvas(provasRestantes);
  return { provaNormalizada, substituiu };
}

export function removerProvaUsuario(id: string): void {
  salvarProvas(lerProvasSalvas().filter((prova) => (prova.id || "") !== id));
}

// Lê um arquivo (File) escolhido pelo usuário e devolve { prova, avisos } ou
// lança erro se o JSON for inválido.
export function lerArquivoProva(arquivo: File): Promise<ArquivoProvaLido> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => {
      try {
        if (typeof leitor.result !== "string")
          throw new Error("não deu pra ler o arquivo");
        const prova = JSON.parse(leitor.result) as ProvaBruta;
        resolve({ prova, avisos: validarProva(prova) });
      } catch {
        reject(new Error("arquivo não é um JSON válido"));
      }
    };
    leitor.onerror = () => reject(new Error("não deu pra ler o arquivo"));
    leitor.readAsText(arquivo);
  });
}

// Lê uma pasta inteira (FileList do input com webkitdirectory): pega todos os
// .json e adiciona os válidos. Retorna { adicionadas, erros: [{nome, erro}] }.
export async function subirPastaProvas(
  listaArquivos: FileList,
): Promise<ResultadoSubidaPasta> {
  const arquivosJson = Array.from(listaArquivos).filter((arquivo) =>
    arquivo.name.toLowerCase().endsWith(".json"),
  );
  let quantidadeAdicionadas = 0;
  const erros: ResultadoSubidaPasta["erros"] = [];
  for (const arquivo of arquivosJson) {
    try {
      const { prova } = await lerArquivoProva(arquivo);
      adicionarProvaUsuario(prova);
      quantidadeAdicionadas++;
    } catch (erro) {
      erros.push({
        nome: arquivo.name,
        erro: erro instanceof Error ? erro.message : "erro desconhecido",
      });
    }
  }
  return {
    adicionadas: quantidadeAdicionadas,
    erros,
    total: arquivosJson.length,
  };
}
