import { describe, expect, it } from 'vitest'
import {
  blockMessage,
  bookableDays,
  bookBlockReason,
  daySlots,
  defaultKind,
  firstBookableMonth,
  formatSlotTime,
  formatVisitDate,
  generateSlots,
  groupVisits,
  isBookableDay,
  isOpenDay,
  liveVisit,
  maxMonthOffset,
  monthCells,
  monthTitle,
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
  describe('calendar', () => {
    it('knows which days can be booked', () => {
      expect(isBookableDay(new Date(2026, 9, 16), now)).toBe(true) // today, times left
      expect(isBookableDay(new Date(2026, 9, 16), new Date(2026, 9, 16, 18, 0))).toBe(false)
      expect(isBookableDay(new Date(2026, 9, 18), now)).toBe(false) // Sunday
      expect(isBookableDay(new Date(2026, 11, 15), now)).toBe(true) // last day of the window
      expect(isBookableDay(new Date(2026, 11, 16), now)).toBe(false) // beyond 60 days
    })

    it('lets the calendar go two months ahead', () => {
      expect(maxMonthOffset(now)).toBe(2) // October -> December
    })

    it('builds the current month in whole weeks', () => {
      const cells = monthCells(now, 0)
      expect(cells).toHaveLength(35)
      expect(cells[0].inMonth).toBe(false) // Sun Sep 27
      expect(cells.filter((c) => c.inMonth)).toHaveLength(31)
      expect(cells.filter((c) => c.enabled)).toHaveLength(14)
      const oct12 = cells.find((c) => c.inMonth && c.date.getDate() === 12)
      expect(oct12.enabled).toBe(false) // past
    })

    it('enables the open days of next month and stops at the window end', () => {
      expect(monthCells(now, 1).filter((c) => c.enabled)).toHaveLength(25) // November, no Sundays
      expect(monthCells(now, 2).filter((c) => c.enabled)).toHaveLength(13) // Dec 1-15, no Sundays
    })

    it('titles each month', () => {
      expect(monthTitle(now, 0)).toBe('October 2026')
      expect(monthTitle(now, 1)).toBe('November 2026')
    })

    it('opens on the first month that still has days', () => {
      expect(firstBookableMonth(now)).toBe(0)
      expect(firstBookableMonth(new Date(2026, 9, 31, 18, 0))).toBe(1)
    })
  })
})