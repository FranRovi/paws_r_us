import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth' // same import as ApplicationsProvider
import { friendlyAppointmentError } from '../lib/appointmentErrors'
import { AppointmentsContext } from './AppointmentsContext'

const COLUMNS = 'id, application_id, shelter_id, kind, starts_at, status'
const byStart = (a, b) => new Date(a.starts_at) - new Date(b.starts_at)

const toVisit = (row) => ({
  id: row.id,
  application_id: row.application_id,
  shelter_id: row.shelter_id,
  kind: row.kind,
  starts_at: row.starts_at,
  status: row.status,
});


export function AppointmentsProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!userId) {
      setAppointments([])
      setLoading(false)
      return
    }
    const { data, error: loadError } = await supabase
      .from('appointments')
      .select(COLUMNS)
      .order('starts_at', { ascending: true })
    if (loadError) {
      setError('We could not load your visits.')
    } else {
      setAppointments(data ?? [])
      setError(null)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  // Every action returns {} on success or { error: 'message for people' }.
  const book = useCallback(
    async (applicationId, kind, startsAt) => {
      const { data, error: bookError } = await supabase
        .from('appointments')
        .insert({
          application_id: applicationId,
          user_id: userId,
          kind,
          starts_at: new Date(startsAt).toISOString(),
        })
        .select(COLUMNS)
        .single()
      if (bookError) return { error: friendlyAppointmentError(bookError) }
      setAppointments((current) => [...current, data].sort(byStart))
      return {}
    },
    [userId],
  )

  const reschedule = useCallback(async (id, startsAt) => {
    const { data, error: moveError } = await supabase
      .from('appointments')
      .update({ starts_at: new Date(startsAt).toISOString() })
      .eq('id', id)
      .select(COLUMNS)
      .single()
    if (moveError) return { error: friendlyAppointmentError(moveError) }
    setAppointments((current) => current.map((a) => (a.id === id ? data : a)).sort(byStart))
    return {}
  }, [])

  const cancel = useCallback(async (id) => {
    const { data, error: cancelError } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select(COLUMNS)
      .single()
    if (cancelError) return { error: friendlyAppointmentError(cancelError) }
    setAppointments((current) => current.map((a) => (a.id === id ? data : a)))
    return {}
  }, [])

  const demoSetVisitStatus = useCallback(async (id, status) => {
    const { data, error: demoError } = await supabase.rpc('demo_set_visit_status', {
      p_appointment_id: id,
      p_status: status,
    })
    if (demoError) return { error: friendlyAppointmentError(demoError) }
    setAppointments((current) => current.map((a) => (a.id === id ? toVisit(data) : a)))
    return {}
  }, [])


  const visitsFor = useCallback(
    (applicationId) => appointments.filter((a) => a.application_id === applicationId),
    [appointments],
  )

  const value = useMemo(
    () => ({ appointments, loading, error, book, reschedule, cancel, demoSetVisitStatus, visitsFor, reload: load }),
    [appointments, loading, error, book, reschedule, cancel, demoSetVisitStatus, visitsFor, load],
  )

  return <AppointmentsContext.Provider value={value}>{children}</AppointmentsContext.Provider>
}