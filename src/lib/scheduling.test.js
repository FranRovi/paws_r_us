import { describe, expect, it } from 'vitest'
import {
  blockMessage,
  bookableDays,
  bookBlockReason,
  daySlots,
  defaultKind,
  formatSlotTime,
  formatVisitDate,
  generateSlots,
  groupVisits,
  isOpenDay,
  liveVisit,
  visitSummary,
  visitTabs,
} from './scheduling'
import { friendlyAppointmentError } from './appointmentErrors'

const now = new Date(2026, 9, 16, 12, 0) // Fri Oct 16, 2026, noon
const monday = new Date(2026, 9, 19)
const sunday = new Date(2026, 9, 18)

const visit = (kind, status, when = new Date(2026, 9, 20, 10, 30)) => ({
  id: `${kind}-${status}`,
  kind,
  status,
  starts_at: when.toISOString(),
})

describe('slots', () => {
  it('generates six times from 9:00 AM to 5:00 PM on the same day', () => {
    const slots = generateSlots(monday)
    expect(slots).toHaveLength(6)
    expect(formatSlotTime(slots[0])).toBe('9:00 AM')
    expect(formatSlotTime(slots[5])).toBe('5:00 PM')
    expect(slots.every((s) => s.getDate() === 19)).toBe(true)
  })

  it('treats Sunday as closed', () => {
    expect(isOpenDay(sunday)).toBe(false)
    expect(isOpenDay(monday)).toBe(true)
    expect(daySlots(sunday, [], now)).toEqual([])
  })

  it('marks a taken time as unavailable', () => {
    const taken = [new Date(2026, 9, 19, 10, 30).toISOString()]
    const slots = daySlots(monday, taken, now)
    expect(slots[1].taken).toBe(true)
    expect(slots[1].available).toBe(false)
    expect(slots.filter((s) => s.available)).toHaveLength(5)
  })

  it('marks times that already passed today', () => {
    const slots = daySlots(new Date(2026, 9, 16), [], now)
    expect(slots.filter((s) => s.past)).toHaveLength(3) // 9:00, 10:30, 12:00
    expect(slots.filter((s) => s.available)).toHaveLength(3)
  })
})

describe('bookableDays', () => {
  it('returns 14 open days starting today and skips Sundays', () => {
    const days = bookableDays(now, 14)
    expect(days).toHaveLength(14)
    expect(days[0].getDate()).toBe(16)
    expect(days.some((d) => d.getDay() === 0)).toBe(false)
  })

  it('skips today when no times are left', () => {
    const evening = new Date(2026, 9, 16, 18, 0)
    expect(bookableDays(evening, 3)[0].getDate()).toBe(17)
  })
})

describe('formatting', () => {
  it('formats times in 12-hour style', () => {
    expect(formatSlotTime(new Date(2026, 9, 16, 9, 0))).toBe('9:00 AM')
    expect(formatSlotTime(new Date(2026, 9, 16, 12, 0))).toBe('12:00 PM')
    expect(formatSlotTime(new Date(2026, 9, 16, 0, 5))).toBe('12:05 AM')
    expect(formatSlotTime(new Date(2026, 9, 16, 15, 30))).toBe('3:30 PM')
  })

  it('formats a date', () => {
    expect(formatVisitDate(new Date(2026, 9, 14, 11, 30).toISOString())).toBe('Oct 14')
  })

  it('summarizes a visit with and without a shelter', () => {
    const a = visit('meet', 'scheduled', new Date(2026, 9, 14, 11, 30))
    expect(visitSummary(a, 'Heart Shelter')).toBe('Oct 14, 11:30 AM at Heart Shelter')
    expect(visitSummary(a)).toBe('Oct 14, 11:30 AM')
  })
})

describe('visit rules', () => {
  it('ignores cancelled visits', () => {
    expect(liveVisit([visit('meet', 'cancelled')], 'meet')).toBeNull()
    expect(liveVisit([visit('meet', 'scheduled')], 'meet')).not.toBeNull()
  })

  it('keeps the home visit locked until the meet is completed', () => {
    const locked = visitTabs([visit('meet', 'scheduled')])
    expect(locked[1].locked).toBe(true)
    expect(locked[1].label).toBe('2. Home visit (locked)')
    expect(locked[1].note).toMatch(/unlocks/)

    const open = visitTabs([visit('meet', 'completed')])
    expect(open[1].locked).toBe(false)
    expect(open[1].label).toBe('2. Home visit')
  })

  it('opens on the meet tab, then on the home tab once the meet is done', () => {
    expect(defaultKind([])).toBe('meet')
    expect(defaultKind([visit('meet', 'scheduled')])).toBe('meet')
    expect(defaultKind([visit('meet', 'completed')])).toBe('home')
  })

  it('explains why a visit cannot be booked', () => {
    const pending = { status: 'pending' }
    const open = { status: 'in_review' }
    expect(bookBlockReason(pending, [], 'meet')).toBe('not_open')
    expect(bookBlockReason(open, [], 'meet')).toBeNull()
    expect(bookBlockReason(open, [visit('meet', 'scheduled')], 'meet')).toBe('already')
    expect(bookBlockReason(open, [], 'home')).toBe('meet_first')
    expect(bookBlockReason({ status: 'accepted' }, [visit('meet', 'completed')], 'home')).toBeNull()
  })

  it('has a message for each reason and none for null', () => {
    expect(blockMessage('not_open')).toMatch(/Visits open/)
    expect(blockMessage('already')).toMatch(/already/)
    expect(blockMessage('meet_first')).toMatch(/unlocks/)
    expect(blockMessage(null)).toBeNull()
  })
})

describe('groupVisits', () => {
  it('splits upcoming (soonest first) from past (latest first)', () => {
    const soon = visit('meet', 'scheduled', new Date(2026, 9, 20, 9, 0))
    const later = visit('home', 'scheduled', new Date(2026, 9, 25, 9, 0))
    const done = visit('meet', 'completed', new Date(2026, 9, 10, 9, 0))
    const cancelled = visit('home', 'cancelled', new Date(2026, 9, 22, 9, 0))
    const { upcoming, past } = groupVisits([later, done, cancelled, soon], now)
    expect(upcoming).toEqual([soon, later])
    expect(past).toEqual([cancelled, done])
  })

  it('moves a scheduled visit whose time passed into the past list', () => {
    const missed = visit('meet', 'scheduled', new Date(2026, 9, 15, 9, 0))
    const { upcoming, past } = groupVisits([missed], now)
    expect(upcoming).toEqual([])
    expect(past).toEqual([missed])
  })
})

describe('friendlyAppointmentError', () => {
  it('translates the database messages', () => {
    expect(friendlyAppointmentError({ message: 'slot_in_past' })).toMatch(/already passed/)
    expect(friendlyAppointmentError({ message: 'meet_not_completed' })).toMatch(/unlocks/)
    expect(friendlyAppointmentError({ message: 'application_not_open' })).toMatch(/Visits open/)
    expect(friendlyAppointmentError({ message: 'application_not_found' })).toMatch(/could not find/)
  })

  it('tells the two unique violations apart', () => {
    const slot = { code: '23505', message: 'duplicate key ... "appointments_slot_taken"' }
    const kind = { code: '23505', message: 'duplicate key ... "appointments_one_per_kind"' }
    expect(friendlyAppointmentError(slot)).toMatch(/Someone just booked/)
    expect(friendlyAppointmentError(kind)).toMatch(/already have this visit/)
  })

  it('falls back to a generic message', () => {
    expect(friendlyAppointmentError({ code: '23505', message: 'other' })).toMatch(/no longer available/)
    expect(friendlyAppointmentError(null)).toBe('We could not complete that. Please try again.')
    expect(friendlyAppointmentError({ message: 'boom' })).toBe(
      'We could not complete that. Please try again.',
    )
  })
})