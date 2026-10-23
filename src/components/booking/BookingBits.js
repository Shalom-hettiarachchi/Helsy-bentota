'use client'

import { LuCoffee } from 'react-icons/lu'
import { FiMinus, FiPhone, FiPlus } from 'react-icons/fi'
import useSiteData from '@/hooks/useSiteData'
import { telHref } from '@/data/site'
import { formatMoney } from '@/lib/dates'
import styles from './BookingBits.module.css'

// "All rates include breakfast" – shown wherever prices appear
export function BreakfastNotice({ compact = false, className = '' }) {
  const { settings } = useSiteData()
  const text = settings.breakfastNotice || 'All rates include breakfast.'
  return (
    <p className={`${styles.breakfast} ${compact ? styles.compact : ''} ${className}`}>
      <LuCoffee aria-hidden="true" />
      <span>{text}</span>
    </p>
  )
}

// "Prefer to book by phone? Call <contact person> on <number>"
export function BookingContact({ className = '', label = 'Prefer to book by phone?' }) {
  const { settings } = useSiteData()
  const phone = settings.bookingPhone
  const person = settings.bookingContactName
  return (
    <div className={`${styles.contact} ${className}`}>
      <span className={styles.contactIcon}>
        <FiPhone aria-hidden="true" />
      </span>
      <div>
        <p className={styles.contactLabel}>{label}</p>
        <p className={styles.contactLine}>
          {person ? <>Call {person} on </> : 'Call us on '}
          <a href={telHref(phone)}>{phone}</a>
        </p>
      </div>
    </div>
  )
}

// The booking phone number from the admin panel, as a tap-to-call link
export function LivePhone({ className }) {
  const { settings } = useSiteData()
  return (
    <a href={telHref(settings.bookingPhone)} className={className}>
      {settings.bookingPhone}
    </a>
  )
}

// "From LKR 50,000 per night" – lowest nightly rate of all rooms
export function FromPrice({ className }) {
  const { rooms, settings } = useSiteData()
  const rates = rooms.flatMap((r) => [r.offRate, r.peakRate]).filter((n) => n > 0)
  if (!rates.length) return null
  return (
    <p className={className}>
      From <strong>{formatMoney(Math.min(...rates), settings.currency || 'LKR')}</strong> per night
    </p>
  )
}

export function Stepper({ label, hint, value, min = 0, max = 20, onChange, name }) {
  return (
    <div className={styles.stepper}>
      <div>
        <p className={styles.stepLabel} id={`${name}-label`}>
          {label}
        </p>
        {hint && <p className={styles.stepHint}>{hint}</p>}
      </div>
      <div className={styles.stepControls} role="group" aria-labelledby={`${name}-label`}>
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Fewer ${label.toLowerCase()}`}>
          <FiMinus />
        </button>
        <output aria-live="polite">{value}</output>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`More ${label.toLowerCase()}`}>
          <FiPlus />
        </button>
      </div>
    </div>
  )
}
