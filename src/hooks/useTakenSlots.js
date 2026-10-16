import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Times already booked at a shelter, as ISO strings. Feed them to daySlots().
export function useTakenSlots(shelterId, fromIso, toIso) {
  const [taken, setTaken] = useState([])
  const [loading, setLoading] = useState(Boolean(shelterId))
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    if (!shelterId) return undefined
    let ignore = false

    supabase
      .rpc('taken_slots', { p_shelter_id: shelterId, p_from: fromIso, p_to: toIso })
      .then(({ data, error: rpcError }) => {
        if (ignore) return
        if (rpcError) {
          setTaken([])
          setError('We could not check which times are free.')
        } else {
          setTaken((data ?? []).map((row) => row.starts_at))
          setError(null)
        }
        setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [shelterId, fromIso, toIso, version])

  return { taken, loading, error, reload }
}