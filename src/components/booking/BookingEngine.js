'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { FiAlertCircle, FiArrowLeft, FiCalendar, FiCheck, FiUsers } from 'react-icons/fi'
import { LuBedDouble } from 'react-icons/lu'
import useSiteData from '@/hooks/useSiteData'
import { api } from '@/lib/api'
import { addDays, formatLong, formatMoney, formatShort, isValidISO, nightsBetween, todayISO } from '@/lib/dates'
import { quoteStay } from '@/lib/pricing'
import RangeCalendar from './RangeCalendar'
import { BookingContact, BreakfastNotice, Stepper } from './BookingBits'
import styles from './BookingEngine.module.css'

const BOOKING_WINDOW_DAYS = 540
const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`

export default function BookingEngine() {
  const { settings, rooms, seasons, live } = useSiteData()
  const currency = settings.currency || 'LKR'

  // "Today" is only known in the browser (the page itself is pre-built)
  const [today, setToday] = useState(null)
  const [stay, setStay] = useState({ checkIn: null, checkOut: null })
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [beds, setBeds] = useState({})
  const [calendarOpen, setCalendarOpen] = useState(true)
  const [step, setStep] = useState('search')
  const [roomId, setRoomId] = useState(null)
  const [availability, setAvailability] = useState(null)
  const [availError, setAvailError] = useState('')
  const [notice, setNotice] = useState('')
  const [result, setResult] = useState(null)
  const resultsRef = useRef(null)
  const topRef = useRef(null)

  const maxDate = today ? addDays(today, BOOKING_WINDOW_DAYS) : null
  const { checkIn, checkOut } = stay
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0
  const guests = adults + children
  const minNights = Math.max(1, Number(settings.minNights) || 1)

  // Start from ?checkIn=…&checkOut=…&adults=…&children=… if given
  useEffect(() => {
    const t = todayISO()
    setToday(t)
    const q = new URLSearchParams(window.location.search)
    const ci = q.get('checkIn')
    const co = q.get('checkOut')
    if (isValidISO(ci) && ci >= t) {
      const validOut = isValidISO(co) && co > ci
      setStay({ checkIn: ci, checkOut: validOut ? co : null })
      if (validOut) setCalendarOpen(false)
    }
    const a = parseInt(q.get('adults'), 10)
    const c = parseInt(q.get('children'), 10)
    if (a >= 1 && a <= 20) setAdults(a)
    if (c >= 0 && c <= 20) setChildren(c)
  }, [])

  // Keep the address bar in step, so a search can be shared or bookmarked
  useEffect(() => {
    if (!today) return
    const q = new URLSearchParams()
    if (checkIn) q.set('checkIn', checkIn)
    if (checkOut) q.set('checkOut', checkOut)
    q.set('adults', adults)
    if (children) q.set('children', children)
    window.history.replaceState(null, '', `${window.location.pathname}?${q}`)
  }, [today, checkIn, checkOut, adults, children])

  const roomKey = rooms.map((r) => r.id).join(',')
  const loadAvailability = useCallback(async () => {
    if (!today) return
    setAvailError('')
    try {
      const to = addDays(today, BOOKING_WINDOW_DAYS + 1)
      const lists = await Promise.all(
        rooms.map((r) => api(`availability.php?room=${r.id}&from=${today}&to=${to}`).then((d) => [r.id, new Set(d.unavailable)])),
      )
      setAvailability(Object.fromEntries(lists))
    } catch {
      setAvailError('Online booking is not available right now. Please call or email us and we’ll book for you.')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, roomKey])

  useEffect(() => {
    // Wait for the live room list so ids match the database
    if (live) loadAvailability()
  }, [live, loadAvailability])

  // Fall back to trying with the built-in room list if the live data never arrives
  useEffect(() => {
    if (!today || live) return
    const t = setTimeout(() => !availability && loadAvailability(), 4000)
    return () => clearTimeout(t)
  }, [today, live, availability, loadAvailability])

  // Calendar greys out a night only when no room is free that night
  const unavailableAll = useMemo(() => {
    if (!availability) return new Set()
    const sets = rooms.map((r) => availability[r.id] || new Set())
    if (!sets.length) return new Set()
    return new Set([...sets[0]].filter((d) => sets.every((s) => s.has(d))))
  }, [availability, rooms])

  function onDates(next) {
    setStay(next)
    setNotice('')
    if (next.checkOut) {
      setCalendarOpen(false)
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
  }

  const options = useMemo(() => {
    if (!checkIn || !checkOut) return []
    return rooms.map((room) => {
      const taken = availability?.[room.id]
      let available = !!availability
      for (let d = checkIn; available && d < checkOut; d = addDays(d, 1)) {
        if (taken?.has(d)) available = false
      }
      const needed = Math.max(0, guests - room.maxGuests)
      const fits = needed <= room.maxExtraBeds
      const extraBeds = Math.min(room.maxExtraBeds, Math.max(needed, beds[room.id] ?? 0))
      const quote = quoteStay(room, seasons, checkIn, checkOut, extraBeds)
      return { room, available, fits, needed, extraBeds, quote }
    })
  }, [rooms, seasons, availability, checkIn, checkOut, guests, beds])

  const selected = options.find((o) => o.room.id === roomId)

  function reserve(id) {
    setRoomId(id)
    setStep('details')
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function backToSearch(message = '') {
    setStep('search')
    setNotice(message)
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  if (!today) {
    return <div className={`panel ${styles.loading}`}>Loading availability…</div>
  }

  return (
    <div ref={topRef} className={styles.engine}>
      <ol className={styles.steps} aria-label="Booking steps">
        {['Dates & room', 'Your details', 'Request sent'].map((label, i) => {
          const current = ['search', 'details', 'done'].indexOf(step)
          return (
            <li key={label} className={i === current ? styles.stepCurrent : i < current ? styles.stepDone : ''} aria-current={i === current ? 'step' : undefined}>
              <span>{i < current ? <FiCheck aria-hidden="true" /> : i + 1}</span>
              {label}
            </li>
          )
        })}
      </ol>

      {step === 'search' && (
        <>
          {/* Search: dates + guests */}
          <section className={`panel ${styles.search}`} aria-label="Choose your dates and guests">
            <div className={styles.bar}>
              <button type="button" className={styles.barField} onClick={() => setCalendarOpen(true)} aria-expanded={calendarOpen}>
                <FiCalendar aria-hidden="true" />
                <span>
                  <span className={styles.barLabel}>Check-in</span>
                  <span className={styles.barValue}>{checkIn ? formatShort(checkIn) : 'Add date'}</span>
                </span>
              </button>
              <button type="button" className={styles.barField} onClick={() => setCalendarOpen(true)} aria-expanded={calendarOpen}>
                <FiCalendar aria-hidden="true" />
                <span>
                  <span className={styles.barLabel}>Check-out</span>
                  <span className={styles.barValue}>{checkOut ? formatShort(checkOut) : 'Add date'}</span>
                </span>
              </button>
              <div className={styles.barField}>
                <FiUsers aria-hidden="true" />
                <span>
                  <span className={styles.barLabel}>Guests</span>
                  <span className={styles.barValue}>
                    {plural(adults, 'adult')}
                    {children ? `, ${plural(children, 'child', 'children')}` : ''}
                  </span>
                </span>
              </div>
            </div>

            <div className={`${styles.searchBody} ${calendarOpen ? '' : styles.collapsed}`}>
              {calendarOpen && (
                <div className={styles.calendarWrap}>
                  <RangeCalendar
                    checkIn={checkIn}
                    checkOut={checkOut}
                    onChange={onDates}
                    unavailable={unavailableAll}
                    seasons={seasons}
                    minDate={today}
                    maxDate={maxDate}
                  />
                </div>
              )}
              <div className={styles.guests}>
                <p className={styles.sideTitle}>Who’s coming?</p>
                <Stepper name="adults" label="Adults" value={adults} min={1} max={12} onChange={setAdults} />
                <Stepper name="children" label="Children" hint="Under 12" value={children} min={0} max={10} onChange={setChildren} />
                {!calendarOpen && (
                  <button type="button" className={`btn btn-outline btn-block ${styles.changeDates}`} onClick={() => setCalendarOpen(true)}>
                    <FiCalendar /> Change dates
                  </button>
                )}
              </div>
            </div>
          </section>

          {availError && (
            <p className={styles.alert} role="alert">
              <FiAlertCircle aria-hidden="true" /> {availError}
            </p>
          )}
          {notice && (
            <p className={styles.alert} role="alert">
              <FiAlertCircle aria-hidden="true" /> {notice}
            </p>
          )}

          {/* Results */}
          <section ref={resultsRef} className={styles.results} aria-live="polite">
            {!checkOut ? (
              <div className={styles.empty}>
                <LuBedDouble aria-hidden="true" />
                <p>Select your check-in and check-out dates to see prices for your stay.</p>
              </div>
            ) : (
              <>
                <div className={styles.resultsHead}>
                  <h2 className="display h3">
                    {formatShort(checkIn)} – {formatShort(checkOut)}
                  </h2>
                  <p>
                    {plural(nights, 'night')} · {plural(guests, 'guest')}
                  </p>
                </div>
                {nights < minNights && (
                  <p className={styles.alert} role="alert">
                    <FiAlertCircle aria-hidden="true" /> The minimum stay is {plural(minNights, 'night')}. Please choose a later check-out date.
                  </p>
                )}
                {options.map((o) => (
                  <RoomCard
                    key={o.room.id}
                    option={o}
                    currency={currency}
                    loading={!availability && !availError}
                    canBook={nights >= minNights && !availError}
                    onBeds={(n) => setBeds((b) => ({ ...b, [o.room.id]: n }))}
                    onReserve={() => reserve(o.room.id)}
                  />
                ))}
              </>
            )}
          </section>

          <BookingContact className={styles.contactBox} />
        </>
      )}

      {step === 'details' && selected && (
        <DetailsStep
          option={selected}
          stay={stay}
          adults={adults}
          kids={children}
          currency={currency}
          settings={settings}
          onBack={() => backToSearch()}
          onConflict={() => {
            loadAvailability()
            backToSearch('Sorry – some of those nights have just been booked. Please choose other dates.')
          }}
          onDone={(r) => {
            setResult(r)
            setStep('done')
            requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
          }}
        />
      )}

      {step === 'done' && result && selected && (
        <Confirmation result={result} option={selected} stay={stay} currency={currency} settings={settings} />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function RoomImage({ image, className }) {
  if (!image) return <div className={`${styles.photo} ${className || ''}`} />
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={image.src} alt={image.alt || ''} className={`${styles.photo} ${className || ''}`} loading="lazy" />
}

function PriceLines({ quote, currency }) {
  return (
    <ul className={styles.lines}>
      {quote.lines.map((l) => (
        <li key={l.kind}>
          <span>
            {l.label}: {plural(l.nights, 'night')} × {formatMoney(l.rate, currency)}
          </span>
          <span>{formatMoney(l.subtotal, currency)}</span>
        </li>
      ))}
      {quote.extraBeds > 0 && (
        <li>
          <span>{plural(quote.extraBeds, 'extra bed')}</span>
          <span>{quote.extraTotal ? formatMoney(quote.extraTotal, currency) : 'Free'}</span>
        </li>
      )}
    </ul>
  )
}

function RoomCard({ option, currency, loading, canBook, onBeds, onReserve }) {
  const { room, available, fits, needed, extraBeds, quote } = option
  const [main, ...thumbs] = room.images
  const perNight = Math.round(quote.total / Math.max(1, quote.nights))
  const blocked = !loading && !available

  return (
    <article className={`${styles.room} ${blocked ? styles.roomOff : ''}`}>
      <div className={styles.gallery}>
        <RoomImage image={main} className={styles.mainPhoto} />
        {thumbs.length > 0 && (
          <div className={styles.thumbs}>
            {thumbs.slice(0, 3).map((img) => (
              <RoomImage key={img.src} image={img} />
            ))}
          </div>
        )}
      </div>

      <div className={styles.roomBody}>
        <h3 className="display">{room.name}</h3>
        <p className={styles.summary}>{room.summary}</p>
        <ul className={styles.features}>
          {room.features.map((f) => (
            <li key={f}>
              <FiCheck aria-hidden="true" /> {f}
            </li>
          ))}
        </ul>
        {room.capacityNote && <p className={styles.capacity}>{room.capacityNote}</p>}
        <BreakfastNotice compact />

        {room.maxExtraBeds > 0 && (
          <div className={styles.beds}>
            <Stepper
              name={`beds-${room.id}`}
              label="Extra beds"
              hint={
                (room.extraBedPrice ? `${formatMoney(room.extraBedPrice, currency)} per bed per night` : 'No extra charge') +
                (needed ? ` · ${plural(needed, 'bed')} needed for your group` : '')
              }
              value={extraBeds}
              min={needed}
              max={room.maxExtraBeds}
              onChange={onBeds}
            />
          </div>
        )}
      </div>

      <div className={styles.priceCol}>
        {loading ? (
          <p className={styles.checking}>Checking availability…</p>
        ) : blocked ? (
          <p className={styles.unavailable}>Not available for these dates</p>
        ) : !fits ? (
          <p className={styles.unavailable}>
            Sleeps up to {room.maxGuests + room.maxExtraBeds} guests. Please contact us for larger groups.
          </p>
        ) : (
          <>
            <p className={styles.total}>{formatMoney(quote.total, currency)}</p>
            <p className={styles.totalNote}>
              Total for {plural(quote.nights, 'night')} · avg. {formatMoney(perNight, currency)} / night
            </p>
            <PriceLines quote={quote} currency={currency} />
            <button type="button" className="btn btn-light btn-block" onClick={onReserve} disabled={!canBook}>
              Reserve
            </button>
            <p className={styles.small}>No payment needed now</p>
          </>
        )}
      </div>
    </article>
  )
}

function StaySummary({ option, stay, adults, kids, currency, settings }) {
  const { room, quote } = option
  return (
    <aside className={`panel ${styles.summaryCard}`} aria-label="Your stay">
      <p className="eyebrow">Your stay</p>
      <div className={styles.summaryRoom}>
        <RoomImage image={room.images[0]} className={styles.summaryPhoto} />
        <h3 className="display">{room.name}</h3>
      </div>
      <dl className={styles.facts}>
        <div>
          <dt>Check-in</dt>
          <dd>
            {formatLong(stay.checkIn)}
            <small>from {settings.checkIn}</small>
          </dd>
        </div>
        <div>
          <dt>Check-out</dt>
          <dd>
            {formatLong(stay.checkOut)}
            <small>by {settings.checkOut}</small>
          </dd>
        </div>
        <div>
          <dt>Guests</dt>
          <dd>
            {plural(adults, 'adult')}
            {kids ? `, ${plural(kids, 'child', 'children')}` : ''}
          </dd>
        </div>
      </dl>
      <PriceLines quote={quote} currency={currency} />
      <p className={styles.summaryTotal}>
        <span>Total</span>
        <strong>{formatMoney(quote.total, currency)}</strong>
      </p>
      <BreakfastNotice compact />
    </aside>
  )
}

function DetailsStep({ option, stay, adults, kids, currency, settings, onBack, onConflict, onDone }) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget).entries())
    setSending(true)
    setError('')
    try {
      const res = await api('book.php', {
        method: 'POST',
        body: {
          ...data,
          roomId: option.room.id,
          checkIn: stay.checkIn,
          checkOut: stay.checkOut,
          adults,
          children: kids,
          extraBeds: option.extraBeds,
        },
      })
      onDone(res)
    } catch (err) {
      if (err.data?.code === 'unavailable') onConflict()
      else setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={styles.detailsLayout}>
      <div className="panel">
        <button type="button" className={`link-arrow ${styles.back}`} onClick={onBack}>
          <FiArrowLeft /> Change dates or room
        </button>
        <h2 className={`display h3 ${styles.formTitle}`}>Your details</h2>
        <form className="form-grid cols-2" onSubmit={submit}>
          <label className="field span-2">
            <span className="field-label">
              Full name <span className="req">*</span>
            </span>
            <input className="input" name="name" autoComplete="name" required maxLength={160} />
          </label>
          <label className="field">
            <span className="field-label">
              Email <span className="req">*</span>
            </span>
            <input className="input" name="email" type="email" autoComplete="email" required maxLength={190} placeholder="example@email.com" />
          </label>
          <label className="field">
            <span className="field-label">
              Phone / WhatsApp <span className="req">*</span>
            </span>
            <input className="input" name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={60} placeholder="+44 …" />
          </label>
          <label className="field">
            <span className="field-label">Country</span>
            <input className="input" name="country" autoComplete="country-name" maxLength={80} />
          </label>
          <label className="field">
            <span className="field-label">Estimated arrival time</span>
            <select className="input" name="arrivalTime" defaultValue="">
              <option value="">I don’t know yet</option>
              {['Morning (before 12 pm)', '12 – 3 pm', '3 – 6 pm', '6 – 9 pm', 'After 9 pm'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="field span-2">
            <span className="field-label">Special requests</span>
            <textarea className="input" name="notes" maxLength={2000} placeholder="Airport transfer, dietary needs, cot for a baby…" />
          </label>
          {/* Spam trap – hidden from people */}
          <label className="sr-only" aria-hidden="true">
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
          {settings.bookingNote && <p className="form-note span-2">{settings.bookingNote}</p>}
          <div className="span-2">
            <button className="btn btn-light btn-block" type="submit" disabled={sending}>
              {sending ? 'Sending…' : 'Send booking request'}
            </button>
          </div>
          {error && (
            <p className="form-error span-2" role="alert">
              {error}
            </p>
          )}
        </form>
      </div>

      <div className={styles.detailsSide}>
        <StaySummary option={option} stay={stay} adults={adults} kids={kids} currency={currency} settings={settings} />
        <BookingContact />
      </div>
    </div>
  )
}

function Confirmation({ result, option, stay, currency, settings }) {
  const total = result.quote?.total ?? option.quote.total
  return (
    <section className={`panel ${styles.done}`}>
      <div className={styles.doneIcon} aria-hidden="true">
        <FiCheck />
      </div>
      <h2 className="display h2">Booking request sent</h2>
      <p className="lead">
        Thank you! Your reference is <strong className={styles.ref}>{result.ref}</strong>
      </p>
      <p className={styles.doneText}>
        We’ve received your request for the {option.room.name}, {formatLong(stay.checkIn)} – {formatLong(stay.checkOut)}, total{' '}
        {formatMoney(total, currency)}. We’ll confirm by email or phone, usually within 24 hours
        {result.emailSent ? ' – a copy of your request is on its way to your inbox.' : '.'}
      </p>
      <BreakfastNotice compact className={styles.doneBreakfast} />
      <BookingContact className={styles.doneContact} />
      <div className="btn-row">
        <Link href="/stay" className="btn btn-outline">
          Back to the suite
        </Link>
        <Link href="/menu" className="btn btn-light">
          See our menu
        </Link>
      </div>
      {settings.bookingNote && <p className={styles.small}>{settings.bookingNote}</p>}
    </section>
  )
}
