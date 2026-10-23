'use client'

import { useCallback, useEffect, useState } from 'react'
import { LuTrash2, LuUserPlus } from 'react-icons/lu'
import { useAdmin } from './context'
import { PasswordInput } from './ui'
import styles from './admin.module.css'

export default function AdminUsers() {
  return (
    <div className={styles.stack}>
      <AddAdmin />
    </div>
  )
}

function AddAdmin() {
  const { call, notify } = useAdmin()
  const [list, setList] = useState([])
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    call('admins')
      .then((d) => setList(d.admins))
      .catch((err) => notify(err.message, 'error'))
  }, [call, notify])
  useEffect(load, [load])

  async function add(e) {
    e.preventDefault()
    const form = e.currentTarget
    const d = Object.fromEntries(new FormData(form).entries())
    if (d.password !== d.password2) return notify('The two passwords don’t match', 'error')
    setBusy(true)
    try {
      const res = await call('admin_add', { body: { name: d.name, email: d.email, password: d.password } })
      setList(res.admins)
      form.reset()
      notify(`${d.name} can now sign in – share the password with them privately`)
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function remove(a) {
    if (!window.confirm(`Remove ${a.name} (${a.email}) as an admin?`)) return
    try {
      const res = await call('admin_delete', { body: { id: a.id } })
      setList(res.admins)
      notify(`${a.name} removed`)
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  return (
    <>
      <form className={styles.card} onSubmit={add}>
        <h2 className={styles.cardTitle}>Create a new admin</h2>
        <p className={styles.muted}>They can sign in at /admin with this email and password, and can change the password themselves.</p>
        <div className={styles.grid2}>
          <label className="field">
            <span className="field-label">Name</span>
            <input className="input" name="name" required maxLength={120} autoComplete="off" />
          </label>
          <label className="field">
            <span className="field-label">Email</span>
            <input className="input" name="email" type="email" required autoComplete="off" />
          </label>
          <label className="field">
            <span className="field-label">Password (10+ characters)</span>
            <PasswordInput name="password" minLength={10} required autoComplete="new-password" />
          </label>
          <label className="field">
            <span className="field-label">Repeat password</span>
            <PasswordInput name="password2" minLength={10} required autoComplete="new-password" />
          </label>
        </div>
        <div className={styles.saveBar}>
          <button type="submit" className="btn btn-light" disabled={busy}>
            <LuUserPlus aria-hidden="true" /> {busy ? 'Creating…' : 'Create admin'}
          </button>
        </div>
      </form>

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
      </section>
    </>
  )
}
