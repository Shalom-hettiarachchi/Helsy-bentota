'use client'

import { useCallback, useEffect, useState } from 'react'
import { LuTrash2, LuUserPlus } from 'react-icons/lu'
import { useAdmin } from './context'
import styles from './admin.module.css'

const lines = (list) => (Array.isArray(list) ? list.join('\n') : '')
const toList = (text) => text.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)

export default function SettingsEditor() {
  return (
    <div className={styles.stack}>
      <GeneralSettings />
      <PasswordForm />
      <AdminUsers />
    </div>
  )
}

function GeneralSettings() {
  const { settings, call, notify, reloadRefs } = useAdmin()
  const [f, setF] = useState(() => ({
    ...settings,
    publicEmailsText: lines(settings.publicEmails),
    notifyEmailsText: lines(settings.notifyEmails),
  }))
  const [saving, setSaving] = useState(false)
  const set = (key) => (e) => setF({ ...f, [key]: e.target.value })

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { publicEmailsText, notifyEmailsText, ...rest } = f
      await call('settings_save', {
        body: { settings: { ...rest, publicEmails: toList(publicEmailsText), notifyEmails: toList(notifyEmailsText), minNights: Number(f.minNights) } },
      })
      await reloadRefs()
      notify('Settings saved')
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className={styles.card} onSubmit={save}>
      <h2 className={styles.cardTitle}>Contact & booking</h2>

      <fieldset className={styles.fieldset}>
        <legend>Booking contact</legend>
        <div className={styles.grid2}>
          <label className="field">
            <span className="field-label">Contact person (shown next to the phone number)</span>
            <input className="input" value={f.bookingContactName || ''} maxLength={120} placeholder="e.g. Helsy" onChange={set('bookingContactName')} />
          </label>
          <label className="field">
            <span className="field-label">Booking phone number</span>
            <input className="input" required value={f.bookingPhone || ''} maxLength={60} placeholder="+94 77 690 9169" onChange={set('bookingPhone')} />
          </label>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Email addresses (one per line)</legend>
        <div className={styles.grid2}>
          <label className="field">
            <span className="field-label">Shown on the website</span>
            <textarea className="input" rows={3} value={f.publicEmailsText} onChange={set('publicEmailsText')} />
          </label>
          <label className="field">
            <span className="field-label">Receive booking requests and messages</span>
            <textarea className="input" rows={3} required value={f.notifyEmailsText} onChange={set('notifyEmailsText')} />
          </label>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Stay details</legend>
        <label className="field">
          <span className="field-label">Breakfast notice (shown with every price)</span>
          <input className="input" value={f.breakfastNotice || ''} maxLength={200} onChange={set('breakfastNotice')} />
        </label>
        <div className={styles.grid3}>
          <label className="field">
            <span className="field-label">Check-in time</span>
            <input className="input" required value={f.checkIn || ''} maxLength={40} onChange={set('checkIn')} />
          </label>
          <label className="field">
            <span className="field-label">Check-out time</span>
            <input className="input" required value={f.checkOut || ''} maxLength={40} onChange={set('checkOut')} />
          </label>
          <label className="field">
            <span className="field-label">Minimum nights</span>
            <input className="input" type="number" min="1" max="60" required value={f.minNights ?? 1} onChange={set('minNights')} />
          </label>
        </div>
        <label className="field">
          <span className="field-label">Note shown before a guest sends a booking request</span>
          <textarea className="input" rows={2} maxLength={600} value={f.bookingNote || ''} onChange={set('bookingNote')} />
        </label>
        <label className="field">
          <span className="field-label">Currency</span>
          <input className={`input ${styles.selectSm}`} required value={f.currency || 'LKR'} maxLength={5} onChange={set('currency')} />
        </label>
      </fieldset>

      <div className={styles.saveBar}>
        <button type="submit" className="btn btn-light" disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </form>
  )
}

function PasswordForm() {
  const { call, notify } = useAdmin()
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    const form = e.currentTarget
    const d = Object.fromEntries(new FormData(form).entries())
    if (d.password !== d.password2) return notify('The new passwords don’t match', 'error')
    setBusy(true)
    try {
      await call('password_change', { body: { current: d.current, password: d.password } })
      form.reset()
      notify('Password changed')
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className={styles.card} onSubmit={submit}>
      <h2 className={styles.cardTitle}>Change your password</h2>
      <div className={styles.grid3}>
        <label className="field">
          <span className="field-label">Current password</span>
          <input className="input" name="current" type="password" required autoComplete="current-password" />
        </label>
        <label className="field">
          <span className="field-label">New password (10+ characters)</span>
          <input className="input" name="password" type="password" required minLength={10} autoComplete="new-password" />
        </label>
        <label className="field">
          <span className="field-label">Repeat new password</span>
          <input className="input" name="password2" type="password" required minLength={10} autoComplete="new-password" />
        </label>
      </div>
      <div className={styles.saveBar}>
        <button type="submit" className="btn btn-outline" disabled={busy}>
          Change password
        </button>
      </div>
    </form>
  )
}

function AdminUsers() {
  const { call, notify } = useAdmin()
  const [list, setList] = useState([])
  const [adding, setAdding] = useState(false)

  const load = useCallback(() => {
    call('admins')
      .then((d) => setList(d.admins))
      .catch((err) => notify(err.message, 'error'))
  }, [call, notify])
  useEffect(load, [load])

  async function add(e) {
    e.preventDefault()
    const form = e.currentTarget
    try {
      const d = await call('admin_add', { body: Object.fromEntries(new FormData(form).entries()) })
      setList(d.admins)
      setAdding(false)
      notify('Admin added – share the password with them privately')
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  async function remove(a) {
    if (!window.confirm(`Remove ${a.name} (${a.email}) as an admin?`)) return
    try {
      const d = await call('admin_delete', { body: { id: a.id } })
      setList(d.admins)
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>People who can sign in</h2>
      <ul className={styles.rows}>
        {list.map((a) => (
          <li key={a.id} className={styles.row}>
            <div className={styles.rowMain}>
              <strong>
                {a.name}
                {a.isYou ? ' (you)' : ''}
              </strong>
              <span className={styles.muted}>
                {a.email} · last sign-in {a.lastLogin ? a.lastLogin.slice(0, 16) : 'never'}
              </span>
            </div>
            {!a.isYou && (
              <button type="button" className={styles.iconBtn} onClick={() => remove(a)} aria-label={`Remove ${a.name}`}>
                <LuTrash2 />
              </button>
            )}
          </li>
        ))}
      </ul>
      {adding ? (
        <form className={styles.form} onSubmit={add}>
          <div className={styles.grid3}>
            <label className="field">
              <span className="field-label">Name</span>
              <input className="input" name="name" required />
            </label>
            <label className="field">
              <span className="field-label">Email</span>
              <input className="input" name="email" type="email" required />
            </label>
            <label className="field">
              <span className="field-label">Password (10+ characters)</span>
              <input className="input" name="password" type="password" minLength={10} required autoComplete="new-password" />
            </label>
          </div>
          <div className={styles.saveBar}>
            <button type="button" className="btn btn-outline" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-light">
              Add admin
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className={styles.linkBtn} onClick={() => setAdding(true)}>
          <LuUserPlus aria-hidden="true" /> Add another admin
        </button>
      )}
    </section>
  )
}
