'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  LuBookOpen,
  LuCalendarRange,
  LuExternalLink,
  LuHotel,
  LuInbox,
  LuKeyRound,
  LuLayoutDashboard,
  LuLogOut,
  LuSettings,
  LuUsers,
  LuUtensils,
} from 'react-icons/lu'
import { api, ApiError } from '@/lib/api'
import { refreshSiteData } from '@/hooks/useSiteData'
import { AdminContext } from './context'
import Dashboard from './Dashboard'
import Bookings from './Bookings'
import CalendarView from './CalendarView'
import RoomsEditor from './RoomsEditor'
import MenuEditor from './MenuEditor'
import Messages from './Messages'
import SettingsEditor from './SettingsEditor'
import AdminUsers from './AdminUsers'
import ChangePassword from './ChangePassword'
import { PasswordInput } from './ui'
import styles from './admin.module.css'

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', Icon: LuLayoutDashboard, Comp: Dashboard },
  { id: 'bookings', label: 'Bookings', Icon: LuBookOpen, Comp: Bookings },
  { id: 'calendar', label: 'Calendar', Icon: LuCalendarRange, Comp: CalendarView },
  { id: 'rooms', label: 'Rooms & Rates', Icon: LuHotel, Comp: RoomsEditor },
  { id: 'menu', label: 'Menu', Icon: LuUtensils, Comp: MenuEditor },
  { id: 'messages', label: 'Messages', Icon: LuInbox, Comp: Messages },
  { id: 'settings', label: 'Settings', Icon: LuSettings, Comp: SettingsEditor },
  { id: 'admins', label: 'Admins', Icon: LuUsers, Comp: AdminUsers },
  { id: 'password', label: 'Change password', Icon: LuKeyRound, Comp: ChangePassword },
]

function useHashSection() {
  const [section, setSection] = useState('dashboard')
  useEffect(() => {
    const read = () => {
      const id = window.location.hash.replace('#', '').split('/')[0]
      setSection(SECTIONS.some((s) => s.id === id) ? id : 'dashboard')
    }
    read()
    window.addEventListener('hashchange', read)
    return () => window.removeEventListener('hashchange', read)
  }, [])
  return section
}

export default function AdminApp() {
  const [me, setMe] = useState(null) // { admin, csrf, setupNeeded, setupNeedsKey }
  const [bootError, setBootError] = useState('')
  const [refs, setRefs] = useState({ rooms: [], seasons: [], settings: {}, loaded: false })
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const section = useHashSection()

  const loadMe = useCallback(async () => {
    try {
      setBootError('')
      setMe(await api('admin.php?action=me'))
    } catch (err) {
      setBootError(err.message)
    }
  }, [])

  useEffect(() => {
    loadMe()
  }, [loadMe])

  const notify = useCallback((message, kind = 'ok') => {
    clearTimeout(toastTimer.current)
    setToast({ message, kind })
    toastTimer.current = setTimeout(() => setToast(null), kind === 'error' ? 7000 : 3500)
  }, [])

  // Every admin request goes through here
  const call = useCallback(
    async (action, { body, query = '', method } = {}) => {
      try {
        return await api(`admin.php?action=${action}${query ? `&${query}` : ''}`, {
          method: method || (body !== undefined ? 'POST' : 'GET'),
          body,
          csrf: me?.csrf,
        })
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403) && me?.admin) {
          // Signed out or the session expired
          loadMe()
        }
        throw err
      }
    },
    [me, loadMe],
  )

  const loadRefs = useCallback(async () => {
    const [r, s, st] = await Promise.all([call('rooms'), call('seasons'), call('settings')])
    setRefs({ rooms: r.rooms, seasons: s.seasons, settings: st.settings, loaded: true })
    // The public pages in this tab should show the new values too
    refreshSiteData()
  }, [call])

  const signedIn = !!me?.admin
  useEffect(() => {
    if (signedIn) loadRefs().catch((err) => notify(err.message, 'error'))
  }, [signedIn, loadRefs, notify])

  async function logout() {
    try {
      await call('logout', { body: {} })
    } finally {
      loadMe()
    }
  }

  const ctx = useMemo(
    () => ({ admin: me?.admin, call, notify, ...refs, reloadRefs: loadRefs }),
    [me, call, notify, refs, loadRefs],
  )

  if (bootError) {
    return (
      <div className={styles.authPage}>
        <div className={`panel ${styles.authBox}`}>
          <h1 className="display h3">Admin panel unavailable</h1>
          <p className={styles.muted}>{bootError}</p>
          <p className={styles.muted}>
            The admin panel needs the PHP API in <code>/api</code>. Locally, run <code>npm run api</code> next to{' '}
            <code>npm run dev</code>.
          </p>
          <button type="button" className="btn btn-light" onClick={loadMe}>
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!me) return <div className={styles.authPage}>Loading…</div>
  if (!me.admin) return <AuthScreen me={me} onDone={setMe} />

  const current = SECTIONS.find((s) => s.id === section) || SECTIONS[0]
  const Section = current.Comp

  return (
    <AdminContext.Provider value={ctx}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <Link href="/" className={styles.brand}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo/helsy-wordmark-white.png" alt="The Helsy" />
            <span>Admin</span>
          </Link>
          <nav className={styles.nav} aria-label="Admin sections">
            {SECTIONS.map(({ id, label, Icon }) => (
              <a key={id} href={`#${id}`} className={id === current.id ? styles.navActive : ''} aria-current={id === current.id ? 'page' : undefined}>
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </a>
            ))}
          </nav>
          <div className={styles.sideFoot}>
            <p className={styles.muted}>
              Signed in as <strong>{me.admin.name}</strong>
            </p>
            <a href="/" target="_blank" rel="noopener noreferrer" className={styles.sideLink}>
              <LuExternalLink aria-hidden="true" /> View website
            </a>
            <button type="button" onClick={logout} className={styles.sideLink}>
              <LuLogOut aria-hidden="true" /> Sign out
            </button>
          </div>
        </aside>

        <main className={styles.main}>
          <h1 className={`display ${styles.pageTitle}`}>{current.label}</h1>
          {refs.loaded ? <Section key={current.id} /> : <p className={styles.empty}>Loading…</p>}
        </main>
      </div>

      {toast && (
        <div className={`${styles.toast} ${toast.kind === 'error' ? styles.toastError : ''}`} role="status">
          {toast.message}
        </div>
      )}
    </AdminContext.Provider>
  )
}

/* ------------------------------------------------------------------
   Sign in / first-time setup
------------------------------------------------------------------- */
function AuthScreen({ me, onDone }) {
  const setup = me.setupNeeded
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget).entries())
    if (setup && data.password !== data.password2) {
      setError('The two passwords don’t match.')
      return
    }
    setSending(true)
    setError('')
    try {
      const res = await api(`admin.php?action=${setup ? 'setup' : 'login'}`, { method: 'POST', body: data, csrf: me.csrf })
      onDone({ ...me, admin: res.admin, csrf: res.csrf, setupNeeded: false })
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={styles.authPage}>
      <form className={`panel ${styles.authBox}`} onSubmit={submit}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo/helsy-wordmark-white.png" alt="The Helsy" className={styles.authLogo} />
        <h1 className="display h3">{setup ? 'Create the admin account' : 'Admin sign in'}</h1>
        {setup && <p className={styles.muted}>This is the first time the admin panel is opened. Create your account to get started.</p>}

        {setup && (
          <label className="field">
            <span className="field-label">Your name</span>
            <input className="input" name="name" required autoComplete="name" />
          </label>
        )}
        <label className="field">
          <span className="field-label">Email</span>
          <input className="input" name="email" type="email" required autoComplete="username" />
        </label>
        <label className="field">
          <span className="field-label">Password{setup ? ' (at least 10 characters)' : ''}</span>
          <PasswordInput name="password" required minLength={setup ? 10 : undefined} autoComplete={setup ? 'new-password' : 'current-password'} />
        </label>
        {setup && (
          <label className="field">
            <span className="field-label">Repeat password</span>
            <PasswordInput name="password2" required autoComplete="new-password" />
          </label>
        )}
        {me.setupNeedsKey && (
          <label className="field">
            <span className="field-label">Setup key (from helsy-config.php on the server)</span>
            <PasswordInput name="setupKey" required autoComplete="off" />
          </label>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-light btn-block" disabled={sending}>
          {sending ? 'Please wait…' : setup ? 'Create account' : 'Sign in'}
        </button>
        <Link href="/" className="link-arrow">
          ← Back to the website
        </Link>
      </form>
    </div>
  )
}
