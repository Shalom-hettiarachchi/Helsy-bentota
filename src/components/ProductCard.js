import Link from 'next/link'
import Img from './Img'
import styles from './ProductCard.module.css'

// Pete's Meats product card. Hovering swaps to the packaged photo.
// `shop` adds the price and an Order button.
export default function ProductCard({ product, shop = false }) {
  const { id, name, description, price, image, packaged } = product
  const sizes = '(max-width: 519px) 40vw, (max-width: 900px) 50vw, 400px'

  return (
    <article className={`${styles.card} ${shop ? styles.shop : ''}`}>
      <div className={`${styles.media} ${packaged ? styles.hasAlt : ''}`}>
        <Img src={image} alt={name} sizes={sizes} className={styles.main} />
        {packaged && <Img src={packaged} alt="" sizes={sizes} className={styles.alt} />}
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{name}</h3>
        <p className={styles.desc}>{description}</p>
        {shop && (
          <div className={styles.buy}>
            <span className={styles.price}>{price}</span>
            <Link href={`/order?product=${id}`} className={styles.order} aria-label={`Order ${name}`}>
              Order
            </Link>
          </div>
        )}
      </div>
    </article>
  )
}
