'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FiPhone } from 'react-icons/fi'
import { FaFacebookF, FaInstagram } from 'react-icons/fa6'
import Img from '@/components/Img'
import { petes } from '@/data/site'
import styles from './petes.module.css'

const sections = [
  { href: '#about', label: 'About' },
  { href: '#products', label: 'Products' },
  { href: '#prices', label: 'Price List' },
  { href: '#find-us', label: 'Find Us' },
]

export default function PetesHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerSolid : ''}`}>
      <div className={styles.headerInner}>
        <Link href="/petes-meats" aria-label="Pete's Meats – top of page" className={styles.logo}>
          <Img src="/images/logo/petes-meats-logo.png" alt="Pete's Meats" sizes="160px" preload />
        </Link>

        <nav className={styles.nav} aria-label="Pete's Meats sections">
          {sections.map((s) => (
            <a key={s.href} href={s.href}>
              {s.label}
            </a>
          ))}
        </nav>

        <div className={styles.headerActions}>
          <a href={petes.phoneHref} className={styles.phone}>
            <FiPhone aria-hidden="true" />
            <span>[+94] 77 631 7411</span>
          </a>
          <a href={petes.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={styles.iconLink}>
            <FaFacebookF />
          </a>
          <a href={petes.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={styles.iconLink}>
            <FaInstagram />
          </a>
          <Link href="/products" className={`btn btn-light ${styles.orderBtn}`}>
            Order
          </Link>
        </div>
      </div>
    </header>
  )
}
