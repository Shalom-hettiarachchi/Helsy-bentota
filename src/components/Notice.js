'use client'

import { useEffect, useRef } from 'react'
import styles from './Notice.module.css'

// Confirmation dialog shown after a form is sent.
export default function Notice({ title, message, onClose }) {
  const okRef = useRef(null)

  useEffect(() => {
    okRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="notice-title" onClick={onClose}>
      <div className={styles.box} onClick={(e) => e.stopPropagation()}>
        <div className={styles.icon} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 id="notice-title" className="display">
          {title}
        </h2>
        <p>{message}</p>
        <button ref={okRef} type="button" className="btn btn-light" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  )
}
