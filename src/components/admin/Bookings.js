'use client'

import { useCallback, useEffect, useState } from 'react'
import { LuEye, LuFileSpreadsheet, LuPlus, LuSearch } from 'react-icons/lu'
import { formatMoney, formatShort } from '@/lib/dates'
import { STATUS_LABELS, useAdmin } from './context'
import { Empty, Loading, Modal } from './ui'
import { downloadBookingsExcel } from './exportExcel'
import BookingEditor from './BookingEditor'
import styles from './admin.module.css'

const FILTERS = [
  ['upcoming', 'Upcoming'],
  ['pending', 'Requests'],
  ['confirmed', 'Confirmed'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
  ['all', 'All'],
]

export default function Bookings() {
  const { call, notify } = useAdmin()
  const [filter, setFilter] = useState('upcoming')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [list, setList] = useState(null)
  const [editing, setEditing] = useState(null)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(() => {
    setList(null)
    call('bookings', { query: `status=${filter}&q=${encodeURIComponent(search)}` })
      .then((d) => setList(d.bookings))
      .catch((err) => {
        notify(err.message, 'error')
        setList([])
      })
  }, [call, notify, filter, search])

  useEffect(load, [load])

  // Keep the row if it still belongs on this tab, otherwise it moves off the list
  function statusChanged(updated) {
    const stays =
      filter === 'all' || filter === updated.status || (filter === 'upcoming' && ['pending', 'confirmed'].includes(updated.status))
    setList((prev) => (stays ? prev.map((b) => (b.id === updated.id ? updated : b)) : prev.filter((b) => b.id !== updated.id)))
  }

  return (
    <div className={styles.stack}>
      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist">
          {FILTERS.map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={filter === id} className={filter === id ? styles.tabActive : ''} onClick={() => setFilter(id)}>
              {label}
            </button>
          ))}
        </div>
        <form
          className={styles.search}
          onSubmit={(e) => {
            e.preventDefault()
            setSearch(q.trim())
          }}
        >
          <LuSearch aria-hidden="true" />
          <input className="input" type="search" placeholder="Name, email, phone or ref" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search bookings" />
        </form>
        <button type="button" className={`btn btn-outline ${styles.btnSm}`} onClick={() => setExporting(true)}>
          <LuFileSpreadsheet /> Export to Excel
        </button>
        <button type="button" className={`btn btn-light ${styles.btnSm}`} onClick={() => setEditing({})}>
          <LuPlus /> New booking
        </button>
      </div>

      {!list ? (
        <Loading />
      ) : list.length === 0 ? (
        <Empty>No bookings here.</Empty>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Dates</th>
                  <th>Guest</th>
                  <th>Guests</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Ref</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {list.map((b) => (
                  <tr key={b.id} onClick={() => setEditing(b)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setEditing(b)}>
                    <td data-label="Dates">
                      <strong>
                        {formatShort(b.checkIn)} → {formatShort(b.checkOut)}
                      </strong>
                      <span className={styles.muted}> {b.nights} nights</span>
                    </td>
                    <td data-label="Guest">
                      {b.name}
                      <span className={styles.subline}>{b.phone || b.email}</span>
                    </td>
                    <td data-label="Guests">
                      {b.adults + b.children}
                      {b.extraBeds ? ` (+${b.extraBeds} bed${b.extraBeds > 1 ? 's' : ''})` : ''}
                    </td>
                    <td data-label="Total">{formatMoney(b.total, b.currency)}</td>
                    <td data-label="Status">
                      <StatusSelect booking={b} onChanged={statusChanged} />
                      {b.paidAmount > 0 && b.paidAmount >= b.total && <span className={`${styles.badge} ${styles.badge_paid}`}>Paid</span>}
                    </td>
                    <td data-label="Ref" className={styles.muted}>
                      {b.ref}
                    </td>
                    <td className={styles.actionsCell}>
                      <button
                        type="button"
                        className={`btn btn-outline ${styles.btnSm}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditing(b)
                        }}
                      >
                        <LuEye aria-hidden="true" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {exporting && <ExportDialog initialFilter={filter} onClose={() => setExporting(false)} />}

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

// Change a booking's status from the list. Confirming or cancelling emails the
// guest, so those two ask first.
function StatusSelect({ booking, onChanged }) {
  const { call, notify } = useAdmin()
  const [busy, setBusy] = useState(false)

  async function change(status) {
    if (status === 'confirmed' || status === 'cancelled') {
      const verb = status === 'confirmed' ? 'Confirm' : 'Cancel'
      const email = booking.email ? ` ${booking.email} will be emailed.` : ' This guest has no email address, so nobody will be emailed.'
      if (!window.confirm(`${verb} booking ${booking.ref} for ${booking.name}?${email}`)) return
    }
    setBusy(true)
    try {
      const res = await call('booking_save', { body: { ...booking, status, notifyGuest: true } })
      const failed = booking.email && (status === 'confirmed' || status === 'cancelled') && !res.emailed
      notify(
        failed
          ? `${booking.ref} is ${STATUS_LABELS[status].toLowerCase()}, but the email to the guest could not be sent`
          : `${booking.ref} is now ${STATUS_LABELS[status].toLowerCase()}${res.emailed ? ' – guest emailed' : ''}`,
        failed ? 'error' : 'ok',
      )
      onChanged(res.booking)
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <select
      className={`${styles.badge} ${styles[`badge_${booking.status}`] || ''} ${styles.statusSelect}`}
      value={booking.status}
      disabled={busy}
      aria-label={`Status of booking ${booking.ref}`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onChange={(e) => change(e.target.value)}
    >
      {Object.entries(STATUS_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  )
}

function ExportDialog({ initialFilter, onClose }) {
  const { call, notify, rooms } = useAdmin()
  const [status, setStatus] = useState(initialFilter === 'upcoming' ? 'all' : initialFilter)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (from && to && to < from) return notify('The “to” date is before the “from” date', 'error')
    setBusy(true)
    try {
      const query = new URLSearchParams({ status, from, to, export: '1' }).toString()
      const { bookings } = await call('bookings', { query })
      if (!bookings.length) return notify('No bookings match – nothing to export', 'error')
      // Oldest first reads best as a history
      bookings.sort((a, b) => a.checkIn.localeCompare(b.checkIn) || a.id - b.id)
      const range = from || to ? `-${from || 'start'}-to-${to || 'now'}` : ''
      await downloadBookingsExcel(bookings, rooms, `helsy-bookings-${status}${range}.xlsx`)
      notify(`Exported ${bookings.length} booking${bookings.length === 1 ? '' : 's'}`)
      onClose()
    } catch (err) {
      notify(err.message || 'The export failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Export bookings to Excel" onClose={onClose}>
      <form className={styles.form} onSubmit={submit}>
        <p className={styles.muted}>
          Downloads an Excel file (.xlsx) with every booking’s details, plus a second sheet with totals per month.
        </p>
        <label className="field">
          <span className="field-label">Which bookings</span>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All bookings (full history)</option>
            <option value="upcoming">Upcoming</option>
            <option value="pending">Requests</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <div className={styles.grid2}>
          <label className="field">
            <span className="field-label">Check-in from (optional)</span>
            <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">Check-in to (optional)</span>
            <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
        <div className={styles.saveBar}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-light" disabled={busy}>
            <LuFileSpreadsheet aria-hidden="true" /> {busy ? 'Preparing…' : 'Download Excel file'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
