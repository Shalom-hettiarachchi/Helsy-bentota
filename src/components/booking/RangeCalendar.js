'use client'

import { useEffect, useMemo, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { addDays, addMonths, formatLong, formatMonth, parseISO } from '@/lib/dates'
import { peakSeasonFor } from '@/lib/pricing'
import styles from './RangeCalendar.module.css'

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function useMonthsShown() {
  const [n, setN] = useState(2)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 760px)')
    const update = () => setN(mq.matches ? 2 : 1)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return n
}

// Month grid cells for the month starting at `first` ('YYYY-MM-01'), Monday first
function monthCells(first) {
  const start = parseISO(first)
  const lead = (start.getUTCDay() + 6) % 7
  const days = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate()
  const cells = Array(lead).fill(null)
  for (let i = 0; i < days; i++) cells.push(addDays(first, i))
  return cells
}

/**
 * Pick check-in and check-out dates.
 * `unavailable` is a Set of nights ('YYYY-MM-DD') that can't be booked; a guest
 * can still check OUT on such a date (the next guest arrives that day).
 */
export default function RangeCalendar({ checkIn, checkOut, onChange, unavailable, seasons = [], minDate, maxDate }) {
  const shown = useMonthsShown()
  const [view, setView] = useState(() => (checkIn || minDate).slice(0, 8) + '01')
  const [hover, setHover] = useState(null)

  const firstMonth = minDate.slice(0, 8) + '01'
  const lastMonth = maxDate.slice(0, 8) + '01'

  // While choosing check-out: the furthest date allowed (first booked night after check-in)
  const limit = useMemo(() => {
    if (!checkIn || checkOut) return null
    for (let d = checkIn; d < maxDate; d = addDays(d, 1)) {
      if (unavailable.has(d)) return d
    }
    return maxDate
  }, [checkIn, checkOut, unavailable, maxDate])

  function pick(d) {
    if (checkIn && !checkOut && d > checkIn && d <= limit) {
      onChange({ checkIn, checkOut: d })
      setHover(null)
      return
    }
    if (unavailable.has(d)) return
    onChange({ checkIn: d, checkOut: null })
  }

  const rangeEnd = checkOut || (checkIn && hover && hover > checkIn && hover <= limit ? hover : null)
  const months = Array.from({ length: shown }, (_, i) => addMonths(view, i))
  const canPrev = view > firstMonth
  const canNext = addMonths(view, shown - 1) < lastMonth

  return (
    <div className={styles.calendar}>
      <div className={styles.nav}>
        <button type="button" onClick={() => setView(addMonths(view, -1))} disabled={!canPrev} aria-label="Previous month">
          <FiChevronLeft />
        </button>
        <p className={styles.hint} aria-live="polite">
          {!checkIn || checkOut ? 'Select your check-in date' : 'Now select your check-out date'}
        </p>
        <button type="button" onClick={() => setView(addMonths(view, 1))} disabled={!canNext} aria-label="Next month">
          <FiChevronRight />
        </button>
      </div>

      <div className={styles.months} onMouseLeave={() => setHover(null)}>
        {months.map((m) => (
          <div key={m} className={styles.month}>
            <h3 className={styles.monthTitle}>{formatMonth(m)}</h3>
            <div className={styles.grid} role="grid" aria-label={formatMonth(m)}>
              {WEEKDAYS.map((w) => (
                <span key={w} className={styles.weekday} aria-hidden="true">
                  {w}
                </span>
              ))}
              {monthCells(m).map((d, i) => {
                if (!d) return <span key={`x${i}`} />
                const past = d < minDate || d > maxDate
                const booked = unavailable.has(d)
                const choosingOut = checkIn && !checkOut
                const allowedOut = choosingOut && d > checkIn && d <= limit
                // Booked nights can't start a stay, but can end one
                const disabled = past || (booked && !allowedOut)
                const peak = !!peakSeasonFor(d, seasons)
                const isStart = d === checkIn
                const isEnd = d === rangeEnd
                const inRange = checkIn && rangeEnd && d > checkIn && d < rangeEnd
                const cls = [
                  styles.day,
                  booked && !allowedOut ? styles.booked : '',
                  isStart ? styles.start : '',
                  isEnd ? styles.end : '',
                  inRange ? styles.inRange : '',
                  peak && !past ? styles.peak : '',
                ].join(' ')
                const label = `${formatLong(d)}${peak ? ', peak season' : ''}${booked ? ', not available' : ''}${isStart ? ', check-in' : ''}${isEnd ? ', check-out' : ''}`
                return (
                  <button
                    key={d}
                    type="button"
                    className={cls}
                    disabled={disabled}
                    onClick={() => pick(d)}
                    onMouseEnter={() => choosingOut && setHover(d)}
                    aria-label={label}
                    aria-pressed={isStart || isEnd}
                  >
                    {Number(d.slice(8))}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <ul className={styles.legend}>
        <li>
          <span className={`${styles.swatch} ${styles.swatchPeak}`} /> Peak season
        </li>
        <li>
          <span className={`${styles.swatch} ${styles.swatchBooked}`} /> Not available
        </li>
        <li>
          <span className={`${styles.swatch} ${styles.swatchSelected}`} /> Your stay
        </li>
      </ul>
    </div>
  )
}
