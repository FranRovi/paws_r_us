import { describe, it, expect } from 'vitest'
import { friendlyAuthError } from './authErrors'

describe('friendlyAuthError', () => {
  it('explains a duplicate email', () => {
    expect(friendlyAuthError({ message: 'User already registered' })).toMatch(/already exists/i)
  })

  it('hints at a taken username on a database error', () => {
    expect(friendlyAuthError({ message: 'Database error saving new user' })).toMatch(/username/i)
  })

  it('falls back to a generic message', () => {
    expect(friendlyAuthError({ message: 'something unexpected' })).toMatch(/could not create/i)
  })
})