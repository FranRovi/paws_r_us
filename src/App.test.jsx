import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('shows the Paws R Us logo text', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /paws/i })).toBeInTheDocument()
  })
})