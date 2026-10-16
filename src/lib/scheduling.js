// Scheduling rules for visits. Pure functions, no React and no Supabase.
// Times are built in the browser's local time zone.

const SLOT_TIMES = [
  [9, 0],
  [10, 30],
  [12, 0],
  [14, 0],
  [15, 30],
  [17, 0],
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const VISIT_LABEL = { meet: 'Meet and greet', home: 'Home visit' }

// Same statuses the database accepts for booking.
const OPEN_FOR_VISITS = ['in_review', 'accepted']
// A visit that still counts (cancelled ones do not).
const LIVE_STATUSES = ['scheduled', 'completed']

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

// The shelter is closed on Sundays.
export function isOpenDay(day) {
  return day.getDay() !== 0
}

export function generateSlots(day) {
  return SLOT_TIMES.map(
    ([hour, minute]) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute),
  )
}

function sameInstant(a, b) {
  return new Date(a).getTime() === new Date(b).getTime()
}

// takenSlots: array of ISO strings or Dates (the starts_at values from taken_slots).
export function daySlots(day, takenSlots = [], now = new Date()) {
  if (!isOpenDay(day)) return []
  return generateSlots(day).map((start) => {
    const taken = takenSlots.some((t) => sameInstant(t, start))
    const past = start.getTime() <= now.getTime()
    return { start, taken, past, available: !taken && !past }
  })
}

// The next open days that still have at least one time left.
export function bookableDays(now = new Date(), count = 14) {
  const first = startOfDay(now)
  const days = []
  for (let i = 0; days.length < count && i < count * 3; i += 1) {
    const day = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i)
    if (isOpenDay(day) && daySlots(day, [], now).some((slot) => !slot.past)) {
      days.push(day)
    }
  }
  return days
}

export function formatSlotTime(date) {
  const hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const suffix = hours < 12 ? 'AM' : 'PM'
  return `${hours % 12 || 12}:${minutes} ${suffix}`
}

export function formatVisitDate(value) {
  const date = new Date(value)
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`
}

// "Oct 14, 11:30 AM at Heart Shelter"
export function visitSummary(appointment, shelterName) {
  const date = new Date(appointment.starts_at)
  const when = `${formatVisitDate(date)}, ${formatSlotTime(date)}`
  return shelterName ? `${when} at ${shelterName}` : when
}

// The visit of this kind that still counts, or null.
export function liveVisit(appointments, kind) {
  return appointments.find((a) => a.kind === kind && LIVE_STATUSES.includes(a.status)) ?? null
}

function meetDone(appointments) {
  return liveVisit(appointments, 'meet')?.status === 'completed'
}

// The two tabs of the schedule page. Home visit stays locked until the meet is done.
export function visitTabs(appointments) {
  const unlocked = meetDone(appointments)
  return [
    { kind: 'meet', label: '1. Meet and greet', locked: false, note: null },
    {
      kind: 'home',
      label: unlocked ? '2. Home visit' : '2. Home visit (locked)',
      locked: !unlocked,
      note: unlocked ? null : 'The home visit unlocks after your meet and greet is done.',
    },
  ]
}

export function defaultKind(appointments) {
  return meetDone(appointments) ? 'home' : 'meet'
}

// Why a visit cannot be booked right now: 'not_open' | 'already' | 'meet_first' | null.
export function bookBlockReason(application, appointments, kind) {
  if (!OPEN_FOR_VISITS.includes(application.status)) return 'not_open'
  if (liveVisit(appointments, kind)) return 'already'
  if (kind === 'home' && !meetDone(appointments)) return 'meet_first'
  return null
}

export function blockMessage(reason) {
  if (reason === 'not_open') return 'Visits open once the shelter starts reviewing your application.'
  if (reason === 'already') return 'You already have this visit booked.'
  if (reason === 'meet_first') return 'The home visit unlocks after your meet and greet is done.'
  return null
}

// Upcoming (soonest first) and past (latest first).
export function groupVisits(appointments, now = new Date()) {
  const time = (a) => new Date(a.starts_at).getTime()
  const upcoming = appointments
    .filter((a) => a.status === 'scheduled' && time(a) > now.getTime())
    .sort((a, b) => time(a) - time(b))
  const past = appointments
    .filter((a) => !(a.status === 'scheduled' && time(a) > now.getTime()))
    .sort((a, b) => time(b) - time(a))
  return { upcoming, past }
}