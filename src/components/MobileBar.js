'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiPhone } from 'react-icons/fi'
import useSiteData from '@/hooks/useSiteData'
import { telHref } from '@/data/site'
import styles from './MobileBar.module.css'

// Sticky "Call / Book a Stay" bar on phones. Hidden on pages that are
// already forms, where it would only get in the way of the keyboard.
const HIDDEN_ON = ['/book', '/reservation', '/order', '/contact']

export default function MobileBar() {
  const pathname = (usePathname() || '/').replace(/(.)\/$/, '$1')
  const { settings } = useSiteData()
  if (HIDDEN_ON.includes(pathname)) return null

  return (
    <>
      <div className={styles.spacer} aria-hidden="true" />
      <div className={styles.bar}>
        <a href={telHref(settings.bookingPhone)} className="btn btn-outline">
          <FiPhone /> Call
        </a>
        <Link href="/book" className="btn btn-light">
          Book a Stay
        </Link>
      </div>
    </>
  )
}
