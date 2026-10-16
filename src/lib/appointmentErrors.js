// Turns database errors from the appointments table into messages for people.
export function friendlyAppointmentError(error) {
  const text = String(error?.message ?? '')

  if (text.includes('slot_in_past')) return 'That time has already passed. Please pick a later time.'
  if (text.includes('meet_not_completed')) {
    return 'Your home visit unlocks after your meet and greet is done.'
  }
  if (text.includes('application_not_open')) {
    return 'Visits open once the shelter starts reviewing your application.'
  }
  if (text.includes('application_not_found')) return 'We could not find that application.'
  if (text.includes('appointments_slot_taken')) {
    return 'Someone just booked that time. Please pick another one.'
  }
  if (text.includes('appointments_one_per_kind')) return 'You already have this visit booked.'
  if (error?.code === '23505') return 'That time is no longer available. Please pick another one.'

  return 'We could not complete that. Please try again.'
}