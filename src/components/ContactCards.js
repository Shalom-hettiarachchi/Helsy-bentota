import { FiClock, FiMail, FiMapPin, FiPhone } from 'react-icons/fi'
import styles from './ContactCards.module.css'

// Location / email / phone / hours as tappable cards.
// `info.emails` (several addresses) takes priority over `info.email`.
export default function ContactCards({ info }) {
  const emails = info.emails?.length ? info.emails : [info.email]
  const items = [
    { Icon: FiMapPin, label: 'Location', value: info.address, href: info.mapsUrl, external: true },
    emails.length > 1
      ? { Icon: FiMail, label: 'Email', links: emails.map((e) => ({ value: e, href: `mailto:${e}` })) }
      : { Icon: FiMail, label: 'Email', value: emails[0], href: `mailto:${emails[0]}` },
    { Icon: FiPhone, label: info.phoneLabel || 'Phone', value: info.phone, href: info.phoneHref },
    { Icon: FiClock, label: 'Open Hours', value: `Daily · ${info.hours}` },
  ]

  return (
    <ul className={styles.grid}>
      {items.map(({ Icon, label, value, href, external, links }) => {
        const body = (
          <>
            <span className={styles.icon}>
              <Icon aria-hidden="true" />
            </span>
            <span>
              <span className={styles.label}>{label}</span>
              {links ? (
                links.map((l) => (
                  <a key={l.href} className={`${styles.value} ${styles.link}`} href={l.href}>
                    {l.value}
                  </a>
                ))
              ) : (
                <span className={styles.value}>{value}</span>
              )}
            </span>
          </>
        )
        return (
          <li key={label}>
            {href ? (
              <a
                className={styles.card}
                href={href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {body}
              </a>
            ) : (
              <div className={styles.card}>{body}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
