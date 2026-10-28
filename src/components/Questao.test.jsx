import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import Resolvendo from './Resolvendo.jsx'

const questao = {
  id: 'q1',
  materia: 'Português',
  banca: 'FCC',
  ano: 2023,
  tipo: 'multipla',
  enunciado: 'Assinale a alternativa em que a concordância verbal está correta.',
  alternativas: ['A', 'B', 'C', 'D', 'E'],
  gabarito: 0,
}

const esperar = () => new Promise((r) => setTimeout(r, 0))

function renderizar() {
  return render(
    <Resolvendo
      questoes={[questao]}
      respostas={{}}
      onResponder={() => {}}
      duracaoSeg={null}
      modo="prova"
      subtitulo="teste"
      onFinalizar={() => {}}
      onPausar={() => {}}
    />,
  )
}

function selecionar(no, inicio, fim) {
  const range = document.createRange()
  range.setStart(no, inicio)
  range.setEnd(no, fim)
  const selecao = window.getSelection()
  selecao.removeAllRanges()
  selecao.addRange(range)
}

test('grifa a seleção e remove pelo botão remover grifo ou remover tudo', async () => {
  renderizar()
  fireEvent.click(screen.getByRole('button', { name: /marca texto/i }))

  const paragrafo = screen.getByText(questao.enunciado)
  selecionar(paragrafo.firstChild, 0, 8)
  fireEvent.mouseUp(paragrafo)
  await esperar()

  expect(document.querySelector('mark[data-marca-texto]')).toHaveTextContent('Assinale')

  fireEvent.click(document.querySelector('mark[data-marca-texto]'))
  expect(document.querySelector('mark[data-marca-texto]')).toHaveTextContent('Assinale')

  fireEvent.click(screen.getByRole('button', { name: /remover grifo/i }))
  fireEvent.click(document.querySelector('mark[data-marca-texto]'))
  expect(document.querySelector('mark[data-marca-texto]')).toBeNull()

  fireEvent.click(screen.getByRole('button', { name: /marca texto/i }))
  selecionar(paragrafo.firstChild, 11, 22)
  fireEvent.mouseUp(paragrafo)
  await esperar()
  expect(document.querySelector('mark[data-marca-texto]')).toHaveTextContent('alternativa')

  const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true)
  fireEvent.click(screen.getByRole('button', { name: /remover tudo/i }))
  expect(confirmar).toHaveBeenCalledWith('Remover todos os grifos desta questão?')
  expect(document.querySelector('mark[data-marca-texto]')).toBeNull()
  confirmar.mockRestore()
})
