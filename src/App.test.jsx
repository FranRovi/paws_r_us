import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from "vitest";
import App from "./App";


function renderAt(path) {
  return render(
    <MemoryRouter initialEntries = {[path]}>
      <App />
    </MemoryRouter>,
  )
}

vi.mock('./hooks/useAuth', () => ({
  useAuth: () => ({ user: null, loading: false, signUp: vi.fn() }),
}))

describe('App routing', () => {
  it('shows the registration form at /register', () => {
    renderAt('/register')
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('shows validation errors when submitting an empty registration form', () => {
    renderAt('/register')
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(screen.getByText('Enter your first name.')).toBeInTheDocument()
    expect(screen.getByText('You need to accept the terms to continue.')).toBeInTheDocument()
  })
  

});