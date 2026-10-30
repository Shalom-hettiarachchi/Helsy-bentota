import styles from './LegalPage.module.css'

// Shared layout for the terms, cancellation and privacy pages
export default function LegalPage({ eyebrow = 'Good to know', title, updated, intro, children }) {
  return (
    <section className={styles.page}>
      <div className={`container ${styles.narrow}`}>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display h1">{title}</h1>
        <p className={styles.updated}>Last updated {updated}</p>
        {intro && <p className="lead">{intro}</p>}
        <div className={`prose ${styles.body}`}>{children}</div>
      </div>
    </section>
  )
}
