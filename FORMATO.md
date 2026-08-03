# Formato de provas e questões

> Quer que uma IA monte a prova pra você? Use o [PROMPT-PROVA.md](./PROMPT-PROVA.md)
> — é este mesmo formato embalado como prompt. No app ele está em
> **Criar prova → "formato / prompt p/ IA"** (com botões de copiar e baixar).

Cada **prova** é um arquivo JSON autocontido em `src/data/provas/`. Para adicionar
uma prova, **basta soltar um `.json` novo nessa pasta** — o app carrega
automaticamente (via `import.meta.glob`), sem precisar mexer em código nem manter
lista/manifesto. As questões vão **inline** dentro da prova.

O nome do arquivo vira o `id` da prova se você não informar um `"id"`.

## Estrutura da prova

```json
{
  "id": "tjsp-2023",            // opcional (default: nome do arquivo)
  "titulo": "TJ-SP — Escrevente",
  "banca": "FGV",
  "orgao": "TJ-SP",
  "ano": 2023,
  "tempoMin": 180,               // tempo oficial da prova, em minutos
  "questoes": [ /* ... */ ]
}
```

## Questão de múltipla escolha

```json
{
  "materia": "Português",
  "tipo": "multipla",
  "enunciado": "Assinale a alternativa correta.",
  "alternativas": ["Opção A", "Opção B", "Opção C", "Opção D", "Opção E"],
  "gabarito": 2,                 // ÍNDICE da alternativa certa (0 = A, 1 = B, ...)
  "comentario": "Explicação opcional, mostrada na correção."
}
```

## Questão com imagem / texto de apoio (ENEM etc.)

Charges, gráficos, mapas e textos de apoio são campos **opcionais** em qualquer
questão:

```json
{
  "materia": "Espanhol",
  "tipo": "multipla",
  "textoApoio": "Texto de apoio opcional, exibido antes do enunciado.",
  "imagem": "https://.../charge.png",
  "fonte": "MORGAN, J. Disponível em: ... Acesso em: 5 maio 2024.",
  "enunciado": "Na charge, a diversidade linguística está representada pelo uso de",
  "alternativas": ["...", "...", "...", "...", "..."],
  "gabarito": 3
}
```

- `imagem`: uma **URL** (remota) **ou** um **data URI base64** (`data:image/png;base64,...`).
  O data URI embute a imagem no próprio JSON — a prova fica 100% portátil (ideal
  pro upload de arquivo/pasta, já que não há servidor pra hospedar imagem).
- `fonte`: crédito/legenda exibido abaixo da imagem.
- `textoApoio`: texto exibido num bloco antes do enunciado.

### Marcar questões que precisam de imagem (fluxo do criador)

Se você quer escrever só o **texto** das questões num JSON e colar as imagens
depois, marque as que precisam com `"precisaImagem": true` (ou `"imagem": "PENDENTE"`):

```json
{ "tipo": "multipla", "enunciado": "Sobre a charge...", "precisaImagem": true, "alternativas": ["..."], "gabarito": 0 }
```

No app, em **criar prova → carregar JSON**, essas questões aparecem **marcadas em
amarelo ("falta imagem")**. Aí é só clicar na área da imagem e **colar (Ctrl+V)**
um print, ou escolher o arquivo — a imagem é embutida e a marca some. Ao jogar,
o marcador `PENDENTE` é ignorado (não vira imagem quebrada).

## Questão certo/errado (estilo Cebraspe)

```json
{
  "materia": "Direito Constitucional",
  "tipo": "certo_errado",
  "enunciado": "Afirmação a ser julgada.",
  "gabarito": true,             // true = Certo, false = Errado
  "comentario": "Explicação opcional."
}
```

## Referência dos campos

| Campo (prova) | Obrigatório | Descrição |
|---|---|---|
| `titulo` | sim | Nome exibido da prova |
| `banca`, `orgao`, `ano` | recomendado | Metadados (também usados nos filtros) |
| `tempoMin` | recomendado | Tempo oficial em minutos (default 60) |
| `questoes` | sim | Lista de questões |

| Campo (questão) | Obrigatório | Descrição |
|---|---|---|
| `tipo` | sim | `"multipla"` ou `"certo_errado"` |
| `enunciado` | sim | Texto da questão |
| `materia` | recomendado | Usada nas estatísticas por matéria |
| `alternativas` | múltipla | Array de textos (2+) |
| `gabarito` | sim | Múltipla: índice (número). Certo/errado: boolean |
| `comentario` | opcional | Explicação mostrada na correção |

`banca`, `orgao` e `ano` podem ser definidos por questão (herdam da prova se
omitidos). O `id` de cada questão é gerado automaticamente (`<idProva>-<n>`).

Cada questão, ao ser carregada, passa a carregar automaticamente a prova de
origem (`provaId`, `provaTitulo`) e a `banca` — então na maratona (questões
aleatórias de várias provas) dá pra ver de onde cada uma veio.

Ao carregar, provas malformadas geram avisos no console (campo faltando, gabarito
no tipo errado, etc.) sem quebrar o app — útil pra validar o que você subiu.

## Subir uma prova do seu PC

Na tela **Provas**, o botão **"subir prova"** abre um seletor de arquivo: escolha
um `.json` no mesmo formato acima. A prova é validada, salva no seu navegador
(localStorage, sem servidor) e aparece na lista marcada como **"sua"** — e as
questões dela entram na maratona. Dá pra remover pela lixeira a qualquer momento.

Assim qualquer pessoa monta os próprios simulados: escreve o JSON da prova,
sobe pelo navegador e joga — o conteúdo fica só no computador dela.
