import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

beforeEach(() => localStorage.clear())

test('início mostra os destinos', () => {
  render(<App />)
  expect(screen.getByAltText('simulado')).toBeInTheDocument()
  expect(screen.getByText('Banco de perguntas')).toBeInTheDocument()
  expect(screen.getByText(/carregar pasta/i)).toBeInTheDocument()
})

test('provas leva à lista de provas', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /provas completas/i }))
  expect(screen.getByRole('heading', { name: /^provas$/i })).toBeInTheDocument()
})

test('banco de perguntas inicia mostrando uma questão', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /banco de perguntas/i }))
  fireEvent.click(screen.getByRole('button', { name: /começar/i }))
  expect(screen.getByText(/questão 1/i)).toBeInTheDocument()
})

test('clicar numa alternativa registra a resposta', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /provas completas/i }))
  fireEvent.click(screen.getByRole('button', { name: /Escrevente/i }))
  fireEvent.click(screen.getByRole('button', { name: /começar/i }))
  expect(screen.getByText(/0\/3 respondidas/)).toBeInTheDocument()
  fireEvent.click(screen.getByText('Faz cinco anos que ele partiu.'))
  expect(screen.getByText(/1\/3 respondidas/)).toBeInTheDocument()
})
