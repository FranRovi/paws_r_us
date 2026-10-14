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
  it('shows the logo heading at /', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { name: /paws r us/i })).toBeInTheDocument()
  })

  it('links to the login and register pages from the welcome page', () => {
    renderAt('/')
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: /create account/i })).toHaveAttribute('href', '/register',
    )
  })
});