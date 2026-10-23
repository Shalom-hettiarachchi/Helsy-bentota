import Img from './Img'
import styles from './PageHero.module.css'

// Photo banner at the top of inner pages: darkened image, eyebrow, title,
// short intro and optional buttons.
export default function PageHero({ image, eyebrow, title, text, mask = 0.55, position = 'center', children }) {
  return (
    <section className={styles.hero} style={{ '--mask': mask }}>
      <Img
        src={image}
        alt=""
        fill
        preload
        sizes="100vw"
        className={styles.image}
        style={{ objectPosition: position }}
      />
      <div className={styles.content}>
        {eyebrow && <p className={`eyebrow ${styles.eyebrow}`}>{eyebrow}</p>}
        <h1 className={`display ${styles.title}`}>{title}</h1>
        {text && <p className={styles.text}>{text}</p>}
        {children && <div className={`btn-row ${styles.actions}`}>{children}</div>}
      </div>
    </section>
  )
}
