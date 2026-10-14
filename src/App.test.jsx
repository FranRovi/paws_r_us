import { render, screen } from "@testing-library/react";
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from "vitest";
import App from "./App";

// TEST 2 - ROUTES

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries = {[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App routing', () => {
  it('shows the welcome page at /', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { name: /welcome/i })).toBeInTheDocument()
  })

  it('shows the login page at /login', () => {
    renderAt('/login')
    expect(screen.getByRole('heading', { name: /log ?in/i })).toBeInTheDocument()
  })

  it('shows a not found page for unknown addresses', () => {
    renderAt('/nope')
    expect(screen.getByRole('heading', { name: /not found/i })).toBeInTheDocument()
  })
});