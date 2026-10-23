'use client'

import useSiteData from '@/hooks/useSiteData'
import styles from './menu.module.css'

// The menu as simple text, edited in the admin panel (Menu).
export default function MenuList() {
  const { menu, settings } = useSiteData()
  const currency = settings.currency || 'LKR'
  const sections = menu.filter((c) => c.items.length)

  return (
    <>
      <nav className={styles.jump} aria-label="Menu sections">
        {sections.map((c) => (
          <a key={c.id} href={`#menu-${c.id}`}>
            {c.name}
          </a>
        ))}
      </nav>

      <div className={styles.sections}>
        {sections.map((c) => (
          <section key={c.id} id={`menu-${c.id}`} className={styles.section}>
            <h2 className={`display ${styles.title}`}>{c.name}</h2>
            {c.note && <p className={styles.note}>{c.note}</p>}
            <ul className={styles.items}>
              {c.items.map((item) => (
                <li key={item.id ?? item.name} className={styles.item}>
                  <div className={styles.row}>
                    <span className={styles.name}>{item.name}</span>
                    <span className={styles.dots} aria-hidden="true" />
                    {item.price && (
                      <span className={styles.price}>
                        {/^\d/.test(item.price) ? `${currency} ${item.price}` : item.price}
                      </span>
                    )}
                  </div>
                  {item.description && <p className={styles.desc}>{item.description}</p>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className={styles.footnote}>Prices in Sri Lankan rupees. Please tell us about any allergies when you order.</p>
    </>
  )
}
