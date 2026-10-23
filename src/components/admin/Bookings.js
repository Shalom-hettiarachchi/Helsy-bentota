'use client'

import { useCallback, useEffect, useState } from 'react'
import { LuDownload, LuPlus, LuSearch } from 'react-icons/lu'
import { formatMoney, formatShort } from '@/lib/dates'
import { useAdmin } from './context'
import { Empty, Loading, StatusBadge } from './ui'
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

function toCsv(rows) {
  const cols = ['ref', 'status', 'checkIn', 'checkOut', 'nights', 'adults', 'children', 'extraBeds', 'name', 'email', 'phone', 'country', 'total', 'currency', 'source', 'createdAt', 'notes', 'adminNote']
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n')
}

export default function Bookings() {
  const { call, notify } = useAdmin()
  const [filter, setFilter] = useState('upcoming')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [list, setList] = useState(null)
  const [editing, setEditing] = useState(null)

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

  function download() {
    const blob = new Blob([toCsv(list || [])], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `helsy-bookings-${filter}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
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
                      <StatusBadge status={b.status} />
                    </td>
                    <td data-label="Ref" className={styles.muted}>
                      {b.ref}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className={styles.linkBtn} onClick={download}>
            <LuDownload aria-hidden="true" /> Download this list (CSV for Excel)
          </button>
        </>
      )}

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
