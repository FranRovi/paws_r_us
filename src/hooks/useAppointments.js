import { useContext } from 'react'
import { AppointmentsContext } from '../context/AppointmentsContext'

export function useAppointments() {
  const context = useContext(AppointmentsContext)
  if (!context) {
    throw new Error('useAppointments must be used inside AppointmentsProvider')
  }
  return context
}