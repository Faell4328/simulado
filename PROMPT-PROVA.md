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
- As questões e alternativas suportam **Markdown**, **HTML** e **LaTeX** (renderizados com `react-markdown`, `remark-math`, `remark-gfm`, `remark-breaks`, `rehype-mathjax` e `rehype-raw`).

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
- `comentario`: explicação do gabarito, exibida na correção.
- `banca`, `orgao`, `ano`: só se a questão diferir da prova (senão herda).

### Regras importantes

1. **Nunca invente o gabarito.** Se a prova não trouxer a resposta e você não
   tiver certeza, resolva a questão e escreva sua justificativa em `comentario`.
2. Transcreva o enunciado **fiel ao original** (não resuma nem reescreva).
3. Se a questão foi **anulada** na prova original, pule ela.
4. **Não coloque `id` nas questões**: o app gera sozinho (`<idProva>-1`, `-2`, ...). O `id` só existe no nível da prova, e mesmo lá é opcional.
5. Não existe campo de imagem: se uma imagem vier como URL "solta", converta para a sintaxe Markdown (`![descrição](URL)`) dentro do `enunciado` — vale tanto para URL local quanto da internet.
6. Preserve a formatação LaTeX, incluindo os delimitadores `$...$` e `$$...$$`, e o Markdown.
7. Mantenha a quebra de linha nos textos, tabelas e etc. Dentro da tabela do markdown, use `<br>` para separar os elementos na mesma célula. Já fora da tabela, use quebra de linha real (no JSON, representada por `\n`).
8. Caso a prova coloque um texto ou uma imagem usada em várias perguntas, ela deve ser repetida individualmente para cada questão.
9. Não altere nada que não foi solicitado diretamente, por exemplo: nunca remova o "\displaystyle".

### Exemplo completo e válido

```json
{
  "id": "markdown-exemplo",
  "titulo": "Markdown + LaTeX (exemplo)",
  "banca": "Exemplo",
  "orgao": "Demo",
  "ano": 2024,
  "tempoMin": 5,
  "questoes": [
    {
      "materia": "Matemática",
      "tipo": "multipla",
      "enunciado": "No **triângulo retângulo** abaixo, os catetos medem $a$ e $b$, e a hipotenusa mede $c$.\n\n![triângulo retângulo](https://upload.wikimedia.org/wikipedia/commons/6/65/Triangle-right-abchpq.svg)\n\nPelo **Teorema de Pitágoras**:\n\n$$a^2 + b^2 = c^2$$\n\nSabendo que $a = 3$ e $b = 4$, qual é o valor de $c$?",
      "alternativas": ["$c = 5$", "$c = 6$", "$c = 7$", "$c = 12$", "$c = 25$"],
      "gabarito": 0,
      "comentario": "Substituindo na fórmula: $c^2 = 3^2 + 4^2 = 9 + 16 = 25$, logo $c = 5$."
    },
    {
      "materia": "Matemática",
      "tipo": "multipla",
      "enunciado": "A **fórmula de Bhaskara** resolve equações do 2º grau da forma $ax^2 + bx + c = 0$.\n\nDefinimos o *discriminante* como:\n\n$$\\Delta = b^2 - 4ac$$\n\ne as raízes são dadas por:\n\n$$x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$$\n\nPara $a = 1$, $b = -5$ e $c = 6$, quais são as raízes da equação?",
      "alternativas": [
        "$x_1 = 2$ e $x_2 = 3$",
        "$x_1 = -2$ e $x_2 = -3$",
        "$x_1 = 1$ e $x_2 = 6$",
        "$x_1 = -1$ e $x_2 = 6$",
        "A equação não possui raízes reais."
      ],
      "gabarito": 0,
      "comentario": "$\\Delta = (-5)^2 - 4 \\cdot 1 \\cdot 6 = 25 - 24 = 1$. Então $x = \\frac{5 \\pm 1}{2}$, ou seja, $x_1 = 3$ e $x_2 = 2$."
    },
    {
      "materia": "Matemática",
      "tipo": "certo_errado",
      "enunciado": "Em um triângulo euclidiano, a soma dos ângulos internos é sempre igual a $180^\\circ$.",
      "gabarito": true,
      "comentario": "Correto: $\\alpha + \\beta + \\gamma = 180^\\circ$ para qualquer triângulo no plano."
    },
    {
      "materia": "Português",
      "tipo": "multipla",
      "enunciado": "## Interpretação de texto\n\nLeia o trecho a seguir:\n\n> A leitura é uma viagem que não custa passagem.\n\nSobre o período acima, considere as afirmações:\n\n1. Trata-se de uma **metáfora**.\n2. O termo *viagem* é empregado em sentido **denotativo**.\n3. A oração *que não custa passagem* é uma **oração subordinada adjetiva restritiva**.\n\n---\n\nQual das alternativas apresenta **apenas** as afirmações corretas?\n\n*Dica: analise o sentido figurado e a função sintática.*",
      "alternativas": [
        "Apenas 1.",
        "Apenas 1 e 3.",
        "Apenas 2 e 3.",
        "Apenas 3.",
        "1, 2 e 3."
      ],
      "gabarito": 1,
      "comentario": "A afirmação 2 está incorreta porque *viagem* é usada em sentido **conotativo** (figurado)."
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
3. Salve com **"adicionar às minhas provas"** — ela passa a aparecer na lista
   marcada como **"sua"** e as questões entram no banco de perguntas.

Tudo fica salvo **só no seu navegador** (localStorage), sem servidor e sem login.
Use **baixar .json** pra levar a prova pra outro computador ou compartilhar.
