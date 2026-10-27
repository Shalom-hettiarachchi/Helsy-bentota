'use client'

import { useEffect, useRef, useState } from 'react'
import { LuEye, LuEyeOff, LuX } from 'react-icons/lu'
import { STATUS_LABELS } from './context'
import styles from './admin.module.css'

export function StatusBadge({ status }) {
  return <span className={`${styles.badge} ${styles[`badge_${status}`] || ''}`}>{STATUS_LABELS[status] || status}</span>
}

// Side panel / dialog used for editing
export function Modal({ title, onClose, children, wide = false }) {
  const box = useRef(null)
  useEffect(() => {
    const prev = document.activeElement
    box.current?.querySelector('input, select, textarea, button')?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.documentElement.classList.add('menu-open')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.documentElement.classList.remove('menu-open')
      prev?.focus?.()
    }
  }, [onClose])

  return (
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} className={`${styles.modal} ${wide ? styles.modalWide : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.modalHead}>
          <h2 className="display">{title}</h2>
          <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Close">
            <LuX />
          </button>
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  )
}

export function Empty({ children }) {
  return <p className={styles.empty}>{children}</p>
}

export function Loading() {
  return <p className={styles.empty}>Loading…</p>
}

// Password box with an eye button to show / hide what is typed
export function PasswordInput({ className = '', ...props }) {
  const [show, setShow] = useState(false)
  return (
    <span className={styles.passwordWrap}>
      <input {...props} type={show ? 'text' : 'password'} className={`input ${className}`} />
      <button
        type="button"
        className={styles.passwordEye}
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        title={show ? 'Hide password' : 'Show password'}
      >
        {show ? <LuEyeOff aria-hidden="true" /> : <LuEye aria-hidden="true" />}
      </button>
    </span>
  )
}
