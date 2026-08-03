# Prompt: transformar uma prova em JSON do simulado

Cole **tudo o que está abaixo** numa LLM (ChatGPT, Claude, Gemini...) junto com a
prova (texto colado, PDF, foto das questões) e ela devolve o arquivo `.json`
pronto pra subir no simulado.

---

## INÍCIO DO PROMPT

Você vai converter uma prova de concurso/vestibular em um arquivo JSON no formato
do app "simulado". Siga as regras à risca.

### Saída

- Responda **apenas com o JSON**, sem texto antes ou depois, sem ``` e sem comentários.
- JSON válido, UTF-8, em português do Brasil, com os acentos corretos.
- Se a prova tiver muitas questões, inclua **todas** as que eu enviei.

### Estrutura do arquivo

```json
{
  "titulo": "TJ-SP — Escrevente",
  "banca": "FGV",
  "orgao": "TJ-SP",
  "ano": 2023,
  "tempoMin": 180,
  "questoes": []
}
```

| Campo | Obrigatório | Descrição |
|---|---|---|
| `titulo` | sim | Nome exibido da prova |
| `banca` | recomendado | FGV, Cebraspe, VUNESP, FCC... |
| `orgao` | recomendado | TJ-SP, PF, INSS... (ou a instituição do vestibular) |
| `ano` | recomendado | Número, ex.: `2023` |
| `tempoMin` | recomendado | Tempo oficial em minutos (padrão 60) |
| `questoes` | sim | Lista de questões (formatos abaixo) |
| `id` | opcional | Se omitido, vira o nome do arquivo |

### Questão de múltipla escolha

```json
{
  "materia": "Português",
  "tipo": "multipla",
  "enunciado": "Assinale a alternativa correta.",
  "alternativas": ["Opção A", "Opção B", "Opção C", "Opção D", "Opção E"],
  "gabarito": 2,
  "comentario": "Explicação opcional, mostrada na correção."
}
```

- `gabarito` é o **índice** da alternativa correta, começando em **0**
  (`0` = A, `1` = B, `2` = C, `3` = D, `4` = E). **Não** use a letra.
- `alternativas`: no mínimo 2 itens (normalmente 4 ou 5), **sem** as letras
  "A)", "B)" no início do texto — o app já numera sozinho.

### Questão certo/errado (estilo Cebraspe)

```json
{
  "materia": "Direito Constitucional",
  "tipo": "certo_errado",
  "enunciado": "Afirmação a ser julgada.",
  "gabarito": true,
  "comentario": "Explicação opcional."
}
```

- Aqui `gabarito` é **booleano**: `true` = Certo, `false` = Errado.
- Nunca inclua `alternativas` neste tipo.

### Campos opcionais de qualquer questão

- `materia`: matéria da questão (usada nas estatísticas). Se não souber, use `"Geral"`.
- `textoApoio`: texto de apoio/base exibido **antes** do enunciado.
- `imagem`: figura da questão — veja a seção de imagens abaixo antes de usar.
- `fonte`: crédito/legenda exibida abaixo da imagem
  (ex.: "MORGAN, J. Disponível em: ... Acesso em: 5 maio 2024.").
- `comentario`: explicação do gabarito, exibida na correção.
- `banca`, `orgao`, `ano`: só se a questão diferir da prova (senão herda).

### Questões com imagem (charge, gráfico, mapa, tabela)

O campo `imagem` aceita **três** formas — e só uma delas serve pra você:

| Valor de `imagem` | Quando usar | Você (IA) pode gerar? |
|---|---|---|
| `"data:image/jpeg;base64,/9j/4AA..."` | **Ideal.** Data URI embute a imagem no próprio JSON, então a prova fica 100% portátil (não depende de servidor nem de link vivo). | **Só se você puder executar código** — veja abaixo. |
| `"https://site.com/charge.png"` | URL remota. O formato aceita, mas **evite**: o link morre com o tempo e quem abrir a prova entrega o IP pro servidor da imagem (rastreio). | Não — não invente URLs. |
| `"PENDENTE"` (ou `"precisaImagem": true`) | Marca que a imagem falta e será colada depois, dentro do app. | **Sim** — é o seu plano B. |

#### Se você PODE executar código (Python) e recebeu o PDF/arquivo da prova

Esse é o melhor caminho — extraia as imagens de verdade, não descreva nem invente:

1. Abra o arquivo e **extraia as imagens embutidas** de cada questão
   (ex.: `PyMuPDF`/`fitz`, `pdfplumber`, `pdfimages`).
2. **Redimensione para no máximo 1200px de largura** e salve como **JPEG
   qualidade ~85%** — é exatamente o que o app faz quando alguém cola uma imagem,
   e mantém o arquivo num tamanho utilizável.
3. Converta para base64 e escreva em `imagem` como
   `"data:image/jpeg;base64,<base64>"`.
4. Cuide do **tamanho total**: o app guarda as provas no navegador
   (localStorage, ~5 MB no total). Uma prova inteira do ENEM com dezenas de
   imagens em alta resolução **não cabe** — por isso o passo 2 não é opcional.
   Se mesmo assim passar de ~4 MB, faça um dos dois:
   - baixe para ~900px / qualidade 75%; ou
   - **divida em mais de um arquivo** (ex.: "ENEM 2023 — dia 1" e "dia 2"),
     que é como a prova já é aplicada. O app aceita subir vários `.json`.

#### Se você SÓ gera texto (sem execução de código)

**Nunca escreva base64 "de cabeça"** — o resultado é uma imagem quebrada que
falha silenciosamente. E não use URL. Marque como pendente:

```json
{
  "materia": "Espanhol",
  "tipo": "multipla",
  "enunciado": "Na charge, a diversidade linguística está representada pelo uso de",
  "precisaImagem": true,
  "alternativas": ["...", "...", "...", "...", "..."],
  "gabarito": 3
}
```

`"precisaImagem": true` e `"imagem": "PENDENTE"` são equivalentes — use um dos dois.

No app, essas questões aparecem **marcadas em amarelo ("falta imagem")** e a
pessoa cola o print com **Ctrl+V** — aí vira data URI e fica embutida no arquivo.

### Regras importantes

1. **Nunca invente o gabarito.** Se a prova não trouxer a resposta e você não
   tiver certeza, resolva a questão e escreva sua justificativa em `comentario`.
2. Transcreva o enunciado **fiel ao original** (não resuma nem reescreva).
3. Se a questão foi **anulada** na prova original, pule ela.
4. Texto de apoio compartilhado por várias questões: repita em `textoApoio` de cada uma.
5. Fórmulas/símbolos: use texto simples (ex.: `x²`, `√2`, `≤`). Não use LaTeX.
6. Em `imagem`: **nunca** URL remota e **nunca** base64 inventado. Se puder
   executar código, extraia a imagem real do arquivo (redimensionada, ver acima);
   senão, `"precisaImagem": true`.
7. **Não coloque `id` nas questões**: o app gera sozinho (`<idProva>-1`, `-2`, ...).
   O `id` só existe no nível da prova, e mesmo lá é opcional.

### Exemplo completo e válido

```json
{
  "titulo": "TJ-SP — Escrevente",
  "banca": "FGV",
  "orgao": "TJ-SP",
  "ano": 2023,
  "tempoMin": 180,
  "questoes": [
    {
      "materia": "Português",
      "tipo": "multipla",
      "enunciado": "Assinale a alternativa em que a concordância verbal está correta.",
      "alternativas": [
        "Fazem cinco anos que ele partiu.",
        "Faz cinco anos que ele partiu.",
        "Fazem-se cinco anos que ele partiu.",
        "Fizeram cinco anos que ele partiu."
      ],
      "gabarito": 1,
      "comentario": "O verbo 'fazer' indicando tempo decorrido é impessoal: fica sempre na 3ª pessoa do singular."
    },
    {
      "materia": "Direito Constitucional",
      "tipo": "certo_errado",
      "enunciado": "Os direitos e garantias fundamentais previstos na Constituição são de aplicação imediata.",
      "gabarito": true,
      "comentario": "Art. 5º, §1º, da CF/88."
    }
  ]
}
```

Agora converta a prova a seguir nesse formato:

## FIM DO PROMPT

---

## Como importar no simulado

1. Salve a resposta da LLM num arquivo com extensão **`.json`**
   (ex.: `tjsp-2023.json`).
2. Abra o simulado e vá em **Provas → subir prova**, escolha o arquivo.
   - Ou em **Criar prova → carregar JSON**, se quiser revisar/editar antes.
   - Ou **carregar pasta**, na tela inicial, pra subir vários `.json` de uma vez.
3. Se houver questões marcadas com `"precisaImagem": true`, elas aparecem em
   **amarelo** no criador: clique na área da imagem e **cole (Ctrl+V)** o print,
   ou escolha o arquivo. A imagem é embutida na prova.
4. Salve com **"adicionar às minhas provas"** — ela passa a aparecer na lista
   marcada como **"sua"** e as questões entram no banco de perguntas.

Tudo fica salvo **só no seu navegador** (localStorage), sem servidor e sem login.
Use **baixar .json** pra levar a prova pra outro computador ou compartilhar.
