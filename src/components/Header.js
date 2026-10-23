'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiPhone } from 'react-icons/fi'
import Img from './Img'
import SocialLinks from './SocialLinks'
import { externalProps, helsy, mainNav } from '@/data/site'
import styles from './Header.module.css'

// Pages that open with a photo banner, where the header starts see-through
const HERO_PAGES = ['/', '/stay', '/care', '/reservation', '/menu', '/about', '/contact', '/products']

export default function Header() {
  // Pages are exported with a trailing slash (/stay/); compare without it
  const pathname = (usePathname() || '/').replace(/(.)\/$/, '$1')
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const firstLink = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the menu on navigation
  useEffect(() => setOpen(false), [pathname])

  // Lock page scroll, focus the menu and listen for Escape while open
  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', open)
    if (!open) return
    firstLink.current?.focus()
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.documentElement.classList.remove('menu-open')
    }
  }, [open])

  const solid = scrolled || !HERO_PAGES.includes(pathname)
  const isActive = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <>
      <header className={`${styles.header} ${solid ? styles.solid : ''} ${open ? styles.menuOpen : ''}`}>
        <div className={styles.inner}>
          <Link href="/" className={styles.logo} aria-label="The Helsy Bentota – home">
            <Img src="/images/logo/helsy-wordmark-white.png" alt="The Helsy" sizes="180px" preload />
          </Link>

          <nav className={styles.nav} aria-label="Main">
            {mainNav.map((l) => {
              const NavLink = l.external ? 'a' : Link
              return (
              <NavLink
                key={l.href}
                href={l.href}
                {...(l.external ? externalProps : {})}
                className={`${styles.navLink} ${isActive(l.href) ? styles.active : ''}`}
                aria-current={isActive(l.href) ? 'page' : undefined}
              >
                {l.label}
              </NavLink>
              )
            })}
          </nav>

          <div className={styles.actions}>
            <Link href="/book" className={`btn btn-outline ${styles.book}`}>
              Book Your Stay
            </Link>
            <button
              type="button"
              className={styles.toggle}
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div id="mobile-menu" className={`${styles.menu} ${open ? styles.menuVisible : ''}`} inert={!open}>
        <nav className={styles.menuNav} aria-label="Mobile">
          {mainNav.concat({ href: '/contact', label: 'Contact Us' }).map((l, i) => {
            const NavLink = l.external ? 'a' : Link
            return (
            <NavLink
              key={l.href}
              href={l.href}
              {...(l.external ? externalProps : {})}
              ref={i === 0 ? firstLink : undefined}
              className={`${styles.menuLink} ${isActive(l.href) ? styles.menuActive : ''}`}
              style={{ '--i': i }}
            >
              {l.label}
            </NavLink>
            )
          })}
        </nav>

        <div className={styles.menuFooter}>
          <div className={styles.menuButtons}>
            <Link href="/book" className="btn btn-light">
              Book a Stay
            </Link>
            <a href={helsy.phoneHref} className="btn btn-outline">
              <FiPhone /> Call Us
            </a>
          </div>
          <p className={styles.menuInfo}>
            {helsy.address}
            <br />
            Open daily {helsy.hours}
          </p>
          <SocialLinks />
        </div>
      </div>
    </>
  )
}
