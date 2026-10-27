import Link from 'next/link'
import ExternalMark from './ExternalMark'
import Img from './Img'
import SocialLinks from './SocialLinks'
import FooterContact from './FooterContact'
import { externalProps, footerNav, helsy } from '@/data/site'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brand}>
          <Link href="/" aria-label="The Helsy Bentota – home">
            <Img src="/images/logo/helsy-wordmark-white.png" alt="The Helsy" sizes="200px" className={styles.logo} />
          </Link>
          <p>A homely place to stay, caring residential services and British dining with farm-fresh produce, in the heart of Bentota.</p>
          <SocialLinks />
        </div>

        <div>
          <h2 className={styles.title}>Explore</h2>
          <ul className={styles.links}>
            {footerNav.map((l) => (
              <li key={l.label}>
                {l.external ? (
                  <a href={l.href} {...externalProps}>
                    {l.label}
                    <ExternalMark />
                  </a>
                ) : (
                  <Link href={l.href}>{l.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={styles.title}>Visit</h2>
          <p>{helsy.address}</p>
          <p className={styles.muted}>Open daily · {helsy.hours}</p>
          <a className="link-arrow" href={helsy.mapsUrl} target="_blank" rel="noopener noreferrer">
            Get directions →
          </a>
        </div>

        <div>
          <h2 className={styles.title}>Contact</h2>
          <FooterContact />
          <Link href="/book" className={`btn btn-outline ${styles.cta}`}>
            Book Your Stay
          </Link>
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <p>© {new Date().getFullYear()} The Helsy Bentota. All rights reserved.</p>
        <p>Terms &amp; Conditions · Privacy Policy · Powered by Curl</p>
      </div>
    </footer>
  )
}
