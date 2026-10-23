'use client'

import { useCallback, useEffect, useState } from 'react'
import { LuBan, LuCheck } from 'react-icons/lu'
import { formatMoney, formatShort } from '@/lib/dates'
import { bookingPayload, useAdmin } from './context'
import { Empty, Loading, StatusBadge } from './ui'
import BookingEditor from './BookingEditor'
import styles from './admin.module.css'

export default function Dashboard() {
  const { call, notify } = useAdmin()
  const [data, setData] = useState(null)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(0)

  const load = useCallback(() => {
    call('dashboard')
      .then(setData)
      .catch((err) => notify(err.message, 'error'))
  }, [call, notify])

  useEffect(load, [load])

  async function quick(b, status) {
    const verb = status === 'confirmed' ? 'Confirm' : 'Decline'
    if (!window.confirm(`${verb} booking ${b.ref} for ${b.name}?${b.email ? ' The guest will be emailed.' : ''}`)) return
    setBusy(b.id)
    try {
      const res = await call('booking_save', { body: bookingPayload(b, { status, notifyGuest: true }) })
      notify(`${b.ref} ${status === 'confirmed' ? 'confirmed' : 'declined'}${res.emailed ? ' – guest emailed' : ''}`)
      load()
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setBusy(0)
    }
  }

  if (!data) return <Loading />
  const c = data.counts

  return (
    <div className={styles.stack}>
      <ul className={styles.stats}>
        <li>
          <a href="#bookings">
            <strong>{c.pending}</strong>
            <span>New requests</span>
          </a>
        </li>
        <li>
          <strong>{c.upcoming}</strong>
          <span>Upcoming stays</span>
        </li>
        <li>
          <strong>{c.inHouse}</strong>
          <span>Staying now</span>
        </li>
        <li>
          <strong>{c.occupancy}%</strong>
          <span>Booked this month</span>
        </li>
        <li>
          <a href="#messages">
            <strong>{c.newMessages}</strong>
            <span>New messages</span>
          </a>
        </li>
      </ul>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Booking requests waiting for you</h2>
        {data.pending.length === 0 ? (
          <Empty>No new requests. Nice!</Empty>
        ) : (
          <ul className={styles.rows}>
            {data.pending.map((b) => (
              <li key={b.id} className={styles.row}>
                <button type="button" className={styles.rowMain} onClick={() => setEditing(b)}>
                  <strong>{b.name}</strong>
                  <span>
                    {formatShort(b.checkIn)} → {formatShort(b.checkOut)} · {b.nights} nights · {b.adults + b.children} guests ·{' '}
                    {formatMoney(b.total, b.currency)}
                  </span>
                  <span className={styles.muted}>{[b.ref, b.phone, b.email].filter(Boolean).join(' · ')}</span>
                </button>
                <div className={styles.rowActions}>
                  <button type="button" className={`btn btn-light ${styles.btnSm}`} disabled={busy === b.id} onClick={() => quick(b, 'confirmed')}>
                    <LuCheck /> Confirm
                  </button>
                  <button type="button" className={`btn btn-outline ${styles.btnSm}`} disabled={busy === b.id} onClick={() => quick(b, 'cancelled')}>
                    <LuBan /> Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Upcoming stays</h2>
        {data.arrivals.length === 0 ? (
          <Empty>No confirmed stays coming up.</Empty>
        ) : (
          <ul className={styles.rows}>
            {data.arrivals.map((b) => (
              <li key={b.id} className={styles.row}>
                <button type="button" className={styles.rowMain} onClick={() => setEditing(b)}>
                  <strong>
                    {formatShort(b.checkIn)} → {formatShort(b.checkOut)}
                  </strong>
                  <span>{[b.name, `${b.adults + b.children} guests`, b.phone].filter(Boolean).join(' · ')}</span>
                </button>
                <StatusBadge status={b.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {editing && (
        <BookingEditor
          booking={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}
    </div>
  )
}
