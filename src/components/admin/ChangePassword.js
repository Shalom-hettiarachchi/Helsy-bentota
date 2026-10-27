'use client'

import { useState } from 'react'
import { useAdmin } from './context'
import { PasswordInput } from './ui'
import styles from './admin.module.css'

export default function ChangePassword() {
  const { admin, call, notify } = useAdmin()
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
      <p className={styles.muted}>
        Signed in as <strong>{admin.name}</strong> ({admin.email}).
      </p>
      {/* Lets password managers link the new password to this account */}
      <input type="hidden" name="username" autoComplete="username" value={admin.email} readOnly />
      <div className={styles.grid3}>
        <label className="field">
          <span className="field-label">Current password</span>
          <PasswordInput name="current" required autoComplete="current-password" />
        </label>
        <label className="field">
          <span className="field-label">New password (10+ characters)</span>
          <PasswordInput name="password" required minLength={10} autoComplete="new-password" />
        </label>
        <label className="field">
          <span className="field-label">Repeat new password</span>
          <PasswordInput name="password2" required minLength={10} autoComplete="new-password" />
        </label>
      </div>
      <div className={styles.saveBar}>
        <button type="submit" className="btn btn-light" disabled={busy}>
          {busy ? 'Saving…' : 'Change password'}
        </button>
      </div>
    </form>
  )
}
