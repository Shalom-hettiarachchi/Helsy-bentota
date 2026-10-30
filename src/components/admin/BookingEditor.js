'use client'

import { useMemo, useState } from 'react'
import { formatLong, formatMoney, isValidISO, nightsBetween } from '@/lib/dates'
import { quoteStay } from '@/lib/pricing'
import { STATUS_LABELS, useAdmin } from './context'
import { Modal } from './ui'
import styles from './admin.module.css'

const EMPTY = {
  roomId: null,
  checkIn: '',
  checkOut: '',
  adults: 2,
  children: 0,
  extraBeds: 0,
  name: '',
  email: '',
  phone: '',
  country: '',
  arrivalTime: '',
  notes: '',
  adminNote: '',
  status: 'confirmed',
  total: 0,
}

// Create or edit a booking. `booking` without an id = new booking.
export default function BookingEditor({ booking, onClose, onSaved }) {
  const { call, notify, rooms, seasons, settings } = useAdmin()
  const isNew = !booking.id
  const [f, setF] = useState(() => ({ ...EMPTY, roomId: rooms[0]?.id ?? null, ...booking }))
  const [autoTotal, setAutoTotal] = useState(isNew)
  const [notifyGuest, setNotifyGuest] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [conflicts, setConflicts] = useState(null)
  const currency = settings.currency || 'LKR'

  const room = rooms.find((r) => r.id === Number(f.roomId))
  const datesOk = isValidISO(f.checkIn) && isValidISO(f.checkOut) && f.checkOut > f.checkIn
  const quote = useMemo(
    () => (room && datesOk ? quoteStay(room, seasons, f.checkIn, f.checkOut, Number(f.extraBeds) || 0) : null),
    [room, seasons, f.checkIn, f.checkOut, f.extraBeds, datesOk],
  )
  const total = autoTotal && quote ? quote.total : Number(f.total) || 0

  const set = (key, priceAffecting = false) => (e) => {
    const { value } = e.target
    setF((prev) => ({ ...prev, [key]: value }))
    if (priceAffecting) setAutoTotal(true)
  }

  const statusChanged = isNew || booking.status !== f.status
  const willEmail = f.email && statusChanged && (f.status === 'confirmed' || f.status === 'cancelled')

  async function save(force = false) {
    setSaving(true)
    setError('')
    try {
      const res = await call('booking_save', {
        body: {
          ...f,
          roomId: Number(f.roomId),
          adults: Number(f.adults),
          children: Number(f.children),
          extraBeds: Number(f.extraBeds),
          total,
          notifyGuest: willEmail && notifyGuest,
          force,
        },
      })
      notify(`Booking ${res.booking.ref} saved${res.emailed ? ' – guest emailed' : ''}`)
      onSaved(res.booking)
    } catch (err) {
      if (err.data?.code === 'conflict') setConflicts(err.data.conflicts)
      else setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!window.confirm(`Delete booking ${booking.ref} permanently? Cancelling keeps a record instead.`)) return
    try {
      await call('booking_delete', { body: { id: booking.id } })
      notify(`Booking ${booking.ref} deleted`)
      onSaved(null)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Modal title={isNew ? 'New booking' : `Booking ${booking.ref}`} onClose={onClose} wide>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault()
          save(false)
        }}
      >
        {!isNew && (
          <p className={styles.muted}>
            Received {booking.createdAt} · {booking.source === 'website' ? 'Website' : 'Added by admin'}
          </p>
        )}

        <fieldset className={styles.fieldset}>
          <legend>Stay</legend>
          <div className={styles.grid3}>
            {rooms.length > 1 && (
              <label className="field">
                <span className="field-label">Room</span>
                <select className="input" value={f.roomId ?? ''} onChange={set('roomId', true)}>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="field">
              <span className="field-label">Check-in</span>
              <input className="input" type="date" required value={f.checkIn} onChange={set('checkIn', true)} />
            </label>
            <label className="field">
              <span className="field-label">Check-out</span>
              <input className="input" type="date" required min={f.checkIn || undefined} value={f.checkOut} onChange={set('checkOut', true)} />
            </label>
            <label className="field">
              <span className="field-label">Status</span>
              <select className="input" value={f.status} onChange={set('status')}>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Adults</span>
              <input className="input" type="number" min="1" max="50" required value={f.adults} onChange={set('adults')} />
            </label>
            <label className="field">
              <span className="field-label">Children</span>
              <input className="input" type="number" min="0" max="50" value={f.children} onChange={set('children')} />
            </label>
            <label className="field">
              <span className="field-label">Extra beds</span>
              <input className="input" type="number" min="0" max="20" value={f.extraBeds} onChange={set('extraBeds', true)} />
            </label>
          </div>
          {datesOk && (
            <p className={styles.muted}>
              {formatLong(f.checkIn)} → {formatLong(f.checkOut)} · {nightsBetween(f.checkIn, f.checkOut)} nights
              {room && Number(f.adults) + Number(f.children) > room.maxGuests + Number(f.extraBeds) && (
                <strong className={styles.warn}> · More guests than the room sleeps</strong>
              )}
            </p>
          )}
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend>Price</legend>
          {quote && (
            <ul className={styles.priceLines}>
              {quote.lines.map((l) => (
                <li key={l.kind}>
                  {l.label}: {l.nights} × {formatMoney(l.rate, currency)} = {formatMoney(l.subtotal, currency)}
                </li>
              ))}
              {quote.extraTotal > 0 && <li>Extra beds: {formatMoney(quote.extraTotal, currency)}</li>}
            </ul>
          )}
          <div className={styles.inline}>
            <label className="field">
              <span className="field-label">Total ({currency})</span>
              <input
                className="input"
                type="number"
                min="0"
                step="1"
                value={total}
                onChange={(e) => {
                  setAutoTotal(false)
                  setF((p) => ({ ...p, total: e.target.value }))
                }}
              />
            </label>
            {!autoTotal && quote && quote.total !== total && (
              <button type="button" className={styles.linkBtn} onClick={() => setAutoTotal(true)}>
                Use current rates ({formatMoney(quote.total, currency)})
              </button>
            )}
          </div>
        </fieldset>

        {!isNew && <PaymentSection booking={booking} onSaved={onSaved} />}

        <fieldset className={styles.fieldset}>
          <legend>Guest</legend>
          <div className={styles.grid2}>
            <label className="field">
              <span className="field-label">Name</span>
              <input className="input" required value={f.name} onChange={set('name')} />
            </label>
            <label className="field">
              <span className="field-label">Email</span>
              <input className="input" type="email" value={f.email} onChange={set('email')} />
            </label>
            <label className="field">
              <span className="field-label">Phone</span>
              <input className="input" value={f.phone} onChange={set('phone')} />
            </label>
            <label className="field">
              <span className="field-label">Country</span>
              <input className="input" value={f.country} onChange={set('country')} />
            </label>
            <label className="field">
              <span className="field-label">Arrival time</span>
              <input className="input" value={f.arrivalTime} onChange={set('arrivalTime')} />
            </label>
          </div>
          <label className="field">
            <span className="field-label">Guest’s message</span>
            <textarea className="input" rows={3} value={f.notes} onChange={set('notes')} />
          </label>
          <label className="field">
            <span className="field-label">Private note (only admins see this)</span>
            <textarea className="input" rows={2} value={f.adminNote} onChange={set('adminNote')} />
          </label>
        </fieldset>

        {willEmail && (
          <label className="checkbox">
            <input type="checkbox" checked={notifyGuest} onChange={(e) => setNotifyGuest(e.target.checked)} />
            Email the guest that this booking is {f.status === 'confirmed' ? 'confirmed' : 'cancelled'}
          </label>
        )}

        {conflicts && (
          <div className={styles.conflict} role="alert">
            <p>
              <strong>These dates overlap with:</strong>
            </p>
            <ul>
              {conflicts.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <div className={styles.inline}>
              <button type="button" className={`btn btn-outline ${styles.btnSm}`} onClick={() => setConflicts(null)}>
                Change dates
              </button>
              <button type="button" className={`btn btn-light ${styles.btnSm}`} disabled={saving} onClick={() => save(true)}>
                Save anyway
              </button>
            </div>
          </div>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className={styles.modalActions}>
          {!isNew && (
            <button type="button" className={styles.dangerBtn} onClick={remove}>
              Delete
            </button>
          )}
          <span className={styles.spacer} />
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          <button type="submit" className="btn btn-light" disabled={saving}>
            {saving ? 'Saving…' : 'Save booking'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// Paid or not, mark a bank transfer as paid, and the guest's payment link
function PaymentSection({ booking, onSaved }) {
  const { call, notify } = useAdmin()
  const [busy, setBusy] = useState(false)
  const paid = booking.paidAmount > 0 && booking.paidAmount >= booking.total
  const how = booking.paymentMethod === 'card' ? 'by card (PayHere)' : 'by bank transfer'

  async function setPaid(value) {
    if (!value && !window.confirm(`Mark ${booking.ref} as not paid?`)) return
    setBusy(true)
    try {
      const res = await call('booking_payment', { body: { id: booking.id, paid: value } })
      notify(value ? `${booking.ref} marked as paid` : `${booking.ref} marked as not paid`)
      onSaved(res.booking)
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function copyLink() {
    setBusy(true)
    try {
      const { url } = await call('booking_pay_link', { body: { id: booking.id } })
      await navigator.clipboard.writeText(url)
      notify('Payment link copied – paste it into WhatsApp or an email')
    } catch (err) {
      notify(err.message || 'Could not copy the link', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <fieldset className={styles.fieldset}>
      <legend>Payment</legend>
      {paid ? (
        <p>
          <strong className={styles.paidText}>Paid</strong> {formatMoney(booking.paidAmount, booking.currency)} {how}
          {booking.paidAt && ` on ${booking.paidAt.slice(0, 10)}`}
          {booking.paymentRef && <span className={styles.muted}> · ref {booking.paymentRef}</span>}
        </p>
      ) : (
        <p>
          <strong>Not paid</strong>
          {booking.status === 'confirmed' && booking.paymentDue && ` · due by ${formatLong(booking.paymentDue)}`}
          {booking.status === 'pending' && <span className={styles.muted}> · the guest gets payment details once you confirm</span>}
        </p>
      )}
      <div className={styles.inline}>
        {paid ? (
          <button type="button" className={`btn btn-outline ${styles.btnSm}`} disabled={busy} onClick={() => setPaid(false)}>
            Mark as not paid
          </button>
        ) : (
          <button type="button" className={`btn btn-outline ${styles.btnSm}`} disabled={busy} onClick={() => setPaid(true)}>
            Mark as paid (bank transfer)
          </button>
        )}
        {!paid && booking.status === 'confirmed' && (
          <button type="button" className={`btn btn-outline ${styles.btnSm}`} disabled={busy} onClick={copyLink}>
            Copy payment link
          </button>
        )}
      </div>
    </fieldset>
  )
}
