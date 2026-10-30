'use client'

import { useRef, useState } from 'react'
import { LuArrowDown, LuArrowUp, LuImagePlus, LuPlus, LuTrash2 } from 'react-icons/lu'
import { formatMonthDay } from '@/lib/dates'
import { useAdmin } from './context'
import styles from './admin.module.css'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function move(list, i, dir) {
  const next = [...list]
  const j = i + dir
  if (j < 0 || j >= next.length) return list
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

// Starting values for a room added in the admin. It stays off the website
// until "Bookable on the website" is ticked.
const NEW_ROOM = {
  id: null,
  name: '',
  summary: '',
  description: '',
  features: ['Breakfast included'],
  capacityNote: '',
  maxGuests: 2,
  maxExtraBeds: 0,
  extraBedPrice: 0,
  offRate: '',
  peakRate: '',
  images: [],
  active: false,
}

export default function RoomsEditor() {
  const { rooms } = useAdmin()
  const [adding, setAdding] = useState(false)
  return (
    <div className={styles.stack}>
      {rooms.map((r) => (
        <RoomForm key={r.id} room={r} />
      ))}
      {adding ? (
        <RoomForm room={{ ...NEW_ROOM, position: rooms.length }} onDone={() => setAdding(false)} />
      ) : (
        <button type="button" className={`btn btn-outline ${styles.btnSm}`} onClick={() => setAdding(true)}>
          <LuPlus /> Add room
        </button>
      )}
      <SeasonsForm />
    </div>
  )
}

function RoomForm({ room, onDone }) {
  const { call, notify, reloadRefs, settings } = useAdmin()
  const [f, setF] = useState(() => ({ ...room, featuresText: room.features.join('\n') }))
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef(null)
  const currency = settings.currency || 'LKR'

  const set = (key) => (e) => setF({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const setImages = (images) => setF((p) => ({ ...p, images }))

  async function upload(e) {
    const files = [...e.target.files]
    e.target.value = ''
    if (!files.length) return
    setUploading(true)
    try {
      const added = []
      for (const file of files) {
        const body = new FormData()
        body.append('file', file)
        const res = await call('upload', { body })
        added.push({ src: res.url, alt: f.name })
      }
      setImages([...f.images, ...added])
      notify(`${added.length} photo${added.length > 1 ? 's' : ''} added – remember to save`)
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { featuresText, ...rest } = f
      await call('room_save', {
        body: {
          room: {
            ...rest,
            features: featuresText.split('\n').map((s) => s.trim()).filter(Boolean),
            maxGuests: Number(f.maxGuests),
            maxExtraBeds: Number(f.maxExtraBeds),
            extraBedPrice: Number(f.extraBedPrice),
            offRate: Number(f.offRate),
            peakRate: Number(f.peakRate),
          },
        },
      })
      await reloadRefs()
      if (!room.id) {
        notify(f.active ? 'Room added – it is on the website now' : 'Room added – tick "Bookable on the website" when it is ready')
        onDone?.()
        return
      }
      notify('Room saved – the website shows the changes now')
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className={styles.card} onSubmit={save}>
      <h2 className={styles.cardTitle}>{room.id ? room.name : 'New room'}</h2>

      <fieldset className={styles.fieldset}>
        <legend>Rates per night ({currency})</legend>
        <div className={styles.grid3}>
          <label className="field">
            <span className="field-label">Off-season rate</span>
            <input className="input" type="number" min="0" step="100" required value={f.offRate} onChange={set('offRate')} />
          </label>
          <label className="field">
            <span className="field-label">Peak season rate</span>
            <input className="input" type="number" min="0" step="100" required value={f.peakRate} onChange={set('peakRate')} />
          </label>
          <label className="field">
            <span className="field-label">Extra bed, per night (0 = free)</span>
            <input className="input" type="number" min="0" step="100" value={f.extraBedPrice} onChange={set('extraBedPrice')} />
          </label>
        </div>
        <p className={styles.muted}>All rates include breakfast. The breakfast notice text is in Settings.</p>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Guests</legend>
        <div className={styles.grid3}>
          <label className="field">
            <span className="field-label">Sleeps (without extra beds)</span>
            <input className="input" type="number" min="1" max="50" required value={f.maxGuests} onChange={set('maxGuests')} />
          </label>
          <label className="field">
            <span className="field-label">Extra beds available</span>
            <input className="input" type="number" min="0" max="20" value={f.maxExtraBeds} onChange={set('maxExtraBeds')} />
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={!!f.active} onChange={set('active')} />
            Bookable on the website
          </label>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Description</legend>
        <label className="field">
          <span className="field-label">Name</span>
          <input className="input" required maxLength={160} value={f.name} onChange={set('name')} />
        </label>
        <label className="field">
          <span className="field-label">Short summary (booking page)</span>
          <input className="input" maxLength={400} value={f.summary} onChange={set('summary')} />
        </label>
        <label className="field">
          <span className="field-label">Full description (Stay page)</span>
          <textarea className="input" rows={4} maxLength={4000} value={f.description} onChange={set('description')} />
        </label>
        <div className={styles.grid2}>
          <label className="field">
            <span className="field-label">Features – one per line</span>
            <textarea className="input" rows={6} value={f.featuresText} onChange={set('featuresText')} />
          </label>
          <label className="field">
            <span className="field-label">Who it suits</span>
            <textarea className="input" rows={6} maxLength={400} value={f.capacityNote} onChange={set('capacityNote')} />
          </label>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Photos (the first one is the main photo)</legend>
        <ul className={styles.photos}>
          {f.images.map((img, i) => (
            <li key={img.src + i} className={styles.photoItem}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt="" />
              <input
                className="input"
                value={img.alt}
                placeholder="Describe the photo"
                aria-label="Photo description"
                onChange={(e) => setImages(f.images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
              />
              <div className={styles.photoActions}>
                <button type="button" className={styles.iconBtn} onClick={() => setImages(move(f.images, i, -1))} disabled={i === 0} aria-label="Move earlier">
                  <LuArrowUp />
                </button>
                <button type="button" className={styles.iconBtn} onClick={() => setImages(move(f.images, i, 1))} disabled={i === f.images.length - 1} aria-label="Move later">
                  <LuArrowDown />
                </button>
                <button type="button" className={styles.iconBtn} onClick={() => setImages(f.images.filter((_, j) => j !== i))} aria-label="Remove photo">
                  <LuTrash2 />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={upload} />
        <button type="button" className={`btn btn-outline ${styles.btnSm}`} onClick={() => fileInput.current?.click()} disabled={uploading}>
          <LuImagePlus /> {uploading ? 'Uploading…' : 'Add photos'}
        </button>
      </fieldset>

      <div className={styles.saveBar}>
        <button type="submit" className="btn btn-light" disabled={saving || uploading}>
          {saving ? 'Saving…' : room.id ? 'Save room' : 'Add room'}
        </button>
        {!room.id && (
          <button type="button" className="btn btn-outline" onClick={onDone} disabled={saving}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

function MonthDay({ value, onChange, label }) {
  const [m, d] = value.split('-')
  const days = new Date(Date.UTC(2024, Number(m), 0)).getUTCDate()
  return (
    <div className={styles.inline} role="group" aria-label={label}>
      <select className={`input ${styles.selectSm}`} value={d} onChange={(e) => onChange(`${m}-${e.target.value}`)} aria-label={`${label} day`}>
        {Array.from({ length: days }, (_, i) => String(i + 1).padStart(2, '0')).map((x) => (
          <option key={x} value={x}>
            {Number(x)}
          </option>
        ))}
      </select>
      <select
        className={`input ${styles.selectSm}`}
        value={m}
        onChange={(e) => {
          const max = new Date(Date.UTC(2024, Number(e.target.value), 0)).getUTCDate()
          onChange(`${e.target.value}-${String(Math.min(Number(d), max)).padStart(2, '0')}`)
        }}
        aria-label={`${label} month`}
      >
        {MONTHS.map((name, i) => (
          <option key={name} value={String(i + 1).padStart(2, '0')}>
            {name}
          </option>
        ))}
      </select>
    </div>
  )
}

function SeasonsForm() {
  const { seasons, call, notify, reloadRefs } = useAdmin()
  const [list, setList] = useState(() => seasons.map(({ name, start, end }) => ({ name, start, end })))
  const [saving, setSaving] = useState(false)
  const update = (i, key, value) => setList(list.map((s, j) => (j === i ? { ...s, [key]: value } : s)))

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await call('seasons_save', { body: { seasons: list } })
      await reloadRefs()
      notify('Seasons saved')
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className={styles.card} onSubmit={save}>
      <h2 className={styles.cardTitle}>Peak season dates</h2>
      <p className={styles.muted}>
        Nights in these periods use the peak season rate; all other nights use the off-season rate. The dates repeat every
        year and both the first and last day are included.
      </p>
      <ul className={styles.seasonList}>
        {list.map((s, i) => (
          <li key={i} className={styles.seasonRow}>
            <label className="field">
              <span className="field-label">Name</span>
              <input className="input" required value={s.name} onChange={(e) => update(i, 'name', e.target.value)} />
            </label>
            <div className="field">
              <span className="field-label">From</span>
              <MonthDay label="From" value={s.start} onChange={(v) => update(i, 'start', v)} />
            </div>
            <div className="field">
              <span className="field-label">To (included)</span>
              <MonthDay label="To" value={s.end} onChange={(v) => update(i, 'end', v)} />
            </div>
            <button type="button" className={styles.iconBtn} onClick={() => setList(list.filter((_, j) => j !== i))} aria-label="Remove period">
              <LuTrash2 />
            </button>
            <p className={`${styles.muted} ${styles.seasonText}`}>
              {formatMonthDay(s.start)} – {formatMonthDay(s.end)}
            </p>
          </li>
        ))}
      </ul>
      <div className={styles.saveBar}>
        <button type="button" className={`btn btn-outline ${styles.btnSm}`} onClick={() => setList([...list, { name: 'Peak season', start: '12-20', end: '01-05' }])}>
          <LuPlus /> Add period
        </button>
        <span className={styles.spacer} />
        <button type="submit" className="btn btn-light" disabled={saving}>
          {saving ? 'Saving…' : 'Save seasons'}
        </button>
      </div>
    </form>
  )
}
