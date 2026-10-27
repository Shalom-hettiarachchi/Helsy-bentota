import BookingEngine from '@/components/booking/BookingEngine'
import styles from './book.module.css'
import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta({
  title: 'Book Your Stay',
  description:
    'Check availability and book the Self-Contained Upstairs Suite at The Helsy Bentota – two bedrooms, garden and pool views, breakfast included.',
  path: '/book',
  image: { url: '/images/images/image-gal3.webp', width: 407, height: 543, alt: 'Bedroom in the Self-Contained Upstairs Suite' },
})

export default function BookPage() {
  return (
    <section className={styles.page}>
      <div className="container">
        <div className={styles.heading}>
          <p className="eyebrow">Stay With Us</p>
          <h1 className="display h1">Book Your Stay</h1>
          <p className="lead">Choose your dates to see the price for your stay. All rates include breakfast.</p>
        </div>
        <BookingEngine />
      </div>
    </section>
  )
}
