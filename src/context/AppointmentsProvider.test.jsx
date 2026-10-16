import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppointmentsProvider } from './AppointmentsProvider'
import { useAppointments } from '../hooks/useAppointments'

const db = vi.hoisted(() => {
  const state = {
    read: { data: [], error: null },
    write: { data: null, error: null },
    inserted: null,
    updated: null,
  }
  const from = vi.fn(() => {
    let kind = 'read'
    const query = {
      select: vi.fn(() => query),
      order: vi.fn(() => query),
      eq: vi.fn(() => query),
      single: vi.fn(() => query),
      insert: vi.fn((row) => {
        kind = 'write'
        state.inserted = row
        return query
      }),
      update: vi.fn((row) => {
        kind = 'write'
        state.updated = row
        return query
      }),
      then: (resolve, reject) => Promise.resolve(state[kind]).then(resolve, reject),
    }
    return query
  })
  return { state, from }
})

vi.mock('../lib/supabase', () => ({ supabase: { from: db.from } }))
// Same path as the import inside AppointmentsProvider.jsx
vi.mock('../hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }))

const row = (id, applicationId, kind, startsAt, status = 'scheduled') => ({
  id,
  application_id: applicationId,
  shelter_id: 's1',
  kind,
  starts_at: startsAt,
  status,
})

const rows = [
  row('a1', 'app1', 'meet', '2026-10-20T13:00:00.000Z'),
  row('a2', 'app2', 'meet', '2026-10-21T13:00:00.000Z'),
]

const wrapper = ({ children }) => <AppointmentsProvider>{children}</AppointmentsProvider>

async function setup() {
  const view = renderHook(() => useAppointments(), { wrapper })
  await waitFor(() => expect(view.result.current.loading).toBe(false))
  return view
}

describe('AppointmentsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    db.state.read = { data: rows, error: null }
    db.state.write = { data: null, error: null }
    db.state.inserted = null
    db.state.updated = null
  })

  it('loads the visits of the signed-in user', async () => {
    const { result } = await setup()
    expect(result.current.appointments).toHaveLength(2)
    expect(result.current.visitsFor('app2')).toHaveLength(1)
    expect(result.current.visitsFor('nope')).toEqual([])
  })

  it('shows an error message when loading fails', async () => {
    db.state.read = { data: null, error: { message: 'boom' } }
    const { result } = await setup()
    expect(result.current.error).toBe('We could not load your visits.')
    expect(result.current.appointments).toEqual([])
  })

  it('books a visit and adds it to the list in time order', async () => {
    const { result } = await setup()
    db.state.write = {
      data: row('a3', 'app3', 'meet', '2026-10-19T13:00:00.000Z'),
      error: null,
    }

    let outcome
    await act(async () => {
      outcome = await result.current.book('app3', 'meet', new Date('2026-10-19T13:00:00.000Z'))
    })

    expect(outcome).toEqual({})
    expect(db.state.inserted).toEqual({
      application_id: 'app3',
      user_id: 'u1',
      kind: 'meet',
      starts_at: '2026-10-19T13:00:00.000Z',
    })
    expect(result.current.appointments.map((a) => a.id)).toEqual(['a3', 'a1', 'a2'])
  })

  it('returns a friendly error when booking fails', async () => {
    const { result } = await setup()
    db.state.write = { data: null, error: { message: 'slot_in_past' } }

    let outcome
    await act(async () => {
      outcome = await result.current.book('app3', 'meet', new Date('2026-10-01T13:00:00.000Z'))
    })

    expect(outcome.error).toMatch(/already passed/)
    expect(result.current.appointments).toHaveLength(2)
  })

  it('reschedules a visit', async () => {
    const { result } = await setup()
    db.state.write = {
      data: row('a1', 'app1', 'meet', '2026-10-25T13:00:00.000Z'),
      error: null,
    }

    await act(async () => {
      await result.current.reschedule('a1', new Date('2026-10-25T13:00:00.000Z'))
    })

    expect(db.state.updated).toEqual({ starts_at: '2026-10-25T13:00:00.000Z' })
    expect(result.current.appointments.map((a) => a.id)).toEqual(['a2', 'a1'])
  })

  it('cancels a visit', async () => {
    const { result } = await setup()
    db.state.write = {
      data: row('a1', 'app1', 'meet', '2026-10-20T13:00:00.000Z', 'cancelled'),
      error: null,
    }

    let outcome
    await act(async () => {
      outcome = await result.current.cancel('a1')
    })

    expect(outcome).toEqual({})
    expect(db.state.updated).toEqual({ status: 'cancelled' })
    expect(result.current.appointments.find((a) => a.id === 'a1').status).toBe('cancelled')
  })
})