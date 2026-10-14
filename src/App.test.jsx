import { render, screen } from "@testing-library/react";
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

describe('App routing', () => {
  it('shows the registration form at /register', () => {
    renderAt('/register')
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })
});