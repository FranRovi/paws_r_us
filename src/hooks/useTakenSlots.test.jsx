import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTakenSlots } from './useTakenSlots'

const rpc = vi.hoisted(() => vi.fn())
vi.mock('../lib/supabase', () => ({ supabase: { rpc } }))

const FROM = '2026-10-16T00:00:00.000Z'
const TO = '2026-11-06T00:00:00.000Z'

describe('useTakenSlots', () => {
  beforeEach(() => {
    rpc.mockReset()
  })

  it('returns the taken times as ISO strings', async () => {
    rpc.mockResolvedValue({
      data: [{ starts_at: '2026-10-20T13:00:00+00:00' }],
      error: null,
    })
    const { result } = renderHook(() => useTakenSlots('s1', FROM, TO))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(rpc).toHaveBeenCalledWith('taken_slots', {
      p_shelter_id: 's1',
      p_from: FROM,
      p_to: TO,
    })
    expect(result.current.taken).toEqual(['2026-10-20T13:00:00+00:00'])
    expect(result.current.error).toBeNull()
  })

  it('reports an error and no times when the call fails', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } })
    const { result } = renderHook(() => useTakenSlots('s1', FROM, TO))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.taken).toEqual([])
    expect(result.current.error).toBe('We could not check which times are free.')
  })

  it('does nothing without a shelter', () => {
    const { result } = renderHook(() => useTakenSlots(null, FROM, TO))
    expect(rpc).not.toHaveBeenCalled()
    expect(result.current.taken).toEqual([])
  })
})