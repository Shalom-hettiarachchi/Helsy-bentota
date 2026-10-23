'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { LuChevronLeft, LuChevronRight, LuLock, LuPlus, LuTrash2 } from 'react-icons/lu'
import { addDays, addMonths, formatLong, formatMonth, formatShort, parseISO, todayISO } from '@/lib/dates'
import { peakSeasonFor } from '@/lib/pricing'
import { useAdmin } from './context'
import { Modal } from './ui'
import BookingEditor from './BookingEditor'
import styles from './admin.module.css'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function monthCells(first) {
  const start = parseISO(first)
  const lead = (start.getUTCDay() + 6) % 7
  const days = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate()
  const cells = Array(lead).fill(null)
  for (let i = 0; i < days; i++) cells.push(addDays(first, i))
  while (cells.length % 7) cells.push(null)
  return cells
}

export default function CalendarView() {
  const { call, notify, rooms, seasons } = useAdmin()
  const [roomId, setRoomId] = useState(null)
  const [month, setMonth] = useState(() => todayISO().slice(0, 8) + '01')
  const [data, setData] = useState({ bookings: [], blocks: [] })
  const [editing, setEditing] = useState(null)
  const [picked, setPicked] = useState(null) // empty day clicked
  const [blockForm, setBlockForm] = useState(null)
  const today = todayISO()
  const room = roomId ?? rooms[0]?.id

  const load = useCallback(() => {
    if (!room) return () => {}
    let current = true
    const from = addDays(month, -7)
    const to = addDays(addMonths(month, 1), 7)
    call('calendar', { query: `room=${room}&from=${from}&to=${to}` })
      // Ignore answers for a month the admin has already moved away from
      .then((d) => current && setData(d))
      .catch((err) => notify(err.message, 'error'))
    return () => {
      current = false
    }
  }, [call, notify, room, month])

  useEffect(load, [load])

  // What is on each night
  const nights = useMemo(() => {
    const map = {}
    for (const b of data.bookings) {
      for (let d = b.checkIn; d < b.checkOut; d = addDays(d, 1)) map[d] = { kind: 'booking', item: b, first: d === b.checkIn }
    }
    for (const bl of data.blocks) {
      for (let d = bl.start; d < bl.end; d = addDays(d, 1)) map[d] ??= { kind: 'block', item: bl, first: d === bl.start }
    }
    return map
  }, [data])

  function clickDay(d) {
    const n = nights[d]
    if (n?.kind === 'booking') setEditing(n.item)
    else if (n?.kind === 'block') setPicked({ date: d, block: n.item })
    else setPicked({ date: d })
  }

  async function removeBlock(bl) {
    if (!window.confirm(`Unblock ${formatShort(bl.start)} → ${formatShort(bl.end)}?`)) return
    try {
      await call('block_delete', { body: { id: bl.id } })
      notify('Dates unblocked')
      setPicked(null)
      load()
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  async function saveBlock(e) {
    e.preventDefault()
    try {
      await call('block_save', { body: { roomId: room, ...blockForm } })
      notify('Dates blocked')
      setBlockForm(null)
      load()
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  const nextMonth = addMonths(month, 1)
  const monthBlocks = data.blocks.filter((b) => b.start < nextMonth && b.end > month)

  return (
    <div className={styles.stack}>
      <div className={styles.toolbar}>
        {rooms.length > 1 && (
          <select className={`input ${styles.selectSm}`} value={room ?? ''} onChange={(e) => setRoomId(Number(e.target.value))} aria-label="Room">
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        )}
        <div className={styles.monthNav}>
          <button type="button" className={styles.iconBtn} onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month">
            <LuChevronLeft />
          </button>
          <h2 className="display">{formatMonth(month)}</h2>
          <button type="button" className={styles.iconBtn} onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month">
            <LuChevronRight />
          </button>
          <button type="button" className={styles.linkBtn} onClick={() => setMonth(today.slice(0, 8) + '01')}>
            Today
          </button>
        </div>
        <button type="button" className={`btn btn-outline ${styles.btnSm}`} onClick={() => setBlockForm({ start: today, end: addDays(today, 1), reason: '' })}>
          <LuLock /> Block dates
        </button>
      </div>

      <div className={styles.cal}>
        {WEEKDAYS.map((w) => (
          <span key={w} className={styles.calHead}>
            {w}
          </span>
        ))}
        {monthCells(month).map((d, i) => {
          if (!d) return <span key={`x${i}`} className={styles.calBlank} />
          const n = nights[d]
          const peak = !!peakSeasonFor(d, seasons)
          const cls = [
            styles.calDay,
            d === today ? styles.calToday : '',
            d < today ? styles.calPast : '',
            n?.kind === 'booking' ? styles[`cal_${n.item.status}`] : '',
            n?.kind === 'block' ? styles.calBlocked : '',
          ].join(' ')
          const showLabel = n && (n.first || (parseISO(d).getUTCDay() === 1) || d.endsWith('-01'))
          return (
            <button key={d} type="button" className={cls} onClick={() => clickDay(d)} aria-label={`${formatLong(d)}${n ? (n.kind === 'booking' ? `, ${n.item.name}` : ', blocked') : ', free'}`}>
              <span className={styles.calNum}>
                {Number(d.slice(8))}
                {peak && <i className={styles.calPeak} title="Peak season" />}
              </span>
              {showLabel && <span className={styles.calLabel}>{n.kind === 'booking' ? n.item.name : n.item.reason || 'Blocked'}</span>}
            </button>
          )
        })}
      </div>

      <ul className={styles.calLegend}>
        <li>
          <i className={styles.cal_confirmed} /> Confirmed
        </li>
        <li>
          <i className={styles.cal_pending} /> Request (pending)
        </li>
        <li>
          <i className={styles.cal_completed} /> Completed
        </li>
        <li>
          <i className={styles.calBlocked} /> Blocked
        </li>
        <li>
          <i className={styles.calPeakSwatch} /> Peak season
        </li>
      </ul>
      <p className={styles.muted}>Each square is a night. Click a free night to add a booking or block it; click a booking to open it.</p>

      {monthBlocks.length > 0 && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Blocked dates this month</h2>
          <ul className={styles.rows}>
            {monthBlocks.map((bl) => (
              <li key={bl.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <strong>
                    {formatShort(bl.start)} → {formatShort(bl.end)}
                  </strong>
                  <span className={styles.muted}>{bl.reason || 'No reason given'}</span>
                </div>
                <button type="button" className={styles.iconBtn} onClick={() => removeBlock(bl)} aria-label="Unblock">
                  <LuTrash2 />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {picked && (
        <Modal title={formatLong(picked.date)} onClose={() => setPicked(null)}>
          {picked.block ? (
            <div className={styles.form}>
              <p>
                Blocked {formatShort(picked.block.start)} → {formatShort(picked.block.end)}
                {picked.block.reason ? ` (${picked.block.reason})` : ''}.
              </p>
              <button type="button" className="btn btn-outline" onClick={() => removeBlock(picked.block)}>
                <LuTrash2 /> Unblock these dates
              </button>
            </div>
          ) : (
            <div className={styles.form}>
              <p>This night is free.</p>
              <div className={styles.inline}>
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => {
                    setEditing({ roomId: room, checkIn: picked.date, checkOut: addDays(picked.date, 1) })
                    setPicked(null)
                  }}
                >
                  <LuPlus /> Add a booking
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setBlockForm({ start: picked.date, end: addDays(picked.date, 1), reason: '' })
                    setPicked(null)
                  }}
                >
                  <LuLock /> Block
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {blockForm && (
        <Modal title="Block dates" onClose={() => setBlockForm(null)}>
          <form className={styles.form} onSubmit={saveBlock}>
            <p className={styles.muted}>Blocked nights can’t be booked on the website – for maintenance, private use or bookings taken elsewhere.</p>
            <div className={styles.grid2}>
              <label className="field">
                <span className="field-label">First blocked night</span>
                <input className="input" type="date" required value={blockForm.start} onChange={(e) => setBlockForm({ ...blockForm, start: e.target.value })} />
              </label>
              <label className="field">
                <span className="field-label">Free again on</span>
                <input className="input" type="date" required min={blockForm.start} value={blockForm.end} onChange={(e) => setBlockForm({ ...blockForm, end: e.target.value })} />
              </label>
            </div>
            <label className="field">
              <span className="field-label">Reason (only admins see this)</span>
              <input className="input" value={blockForm.reason} maxLength={200} placeholder="e.g. Booking.com guest, maintenance" onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })} />
            </label>
            <div className={styles.modalActions}>
              <span className={styles.spacer} />
              <button type="button" className="btn btn-outline" onClick={() => setBlockForm(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-light">
                Block dates
              </button>
            </div>
          </form>
        </Modal>
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
