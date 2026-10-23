import Link from 'next/link'
import { FiClock, FiMapPin, FiPhone } from 'react-icons/fi'
import PageHero from '@/components/PageHero'
import Img from '@/components/Img'
import ReservationForm from './ReservationForm'
import { helsy } from '@/data/site'
import styles from './reservation.module.css'
import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta({
  title: 'Reservations',
  description:
    'Book a table at The Helsy Bentota for an authentic British dining experience in Bentota, Sri Lanka.',
  path: '/reservation',
  image: { url: '/images/banners/reservation-banner.webp', width: 2560, height: 830, alt: 'Dining at The Helsy Bentota' },
})

const photos = [
  { src: '/images/images/single1.webp', alt: 'Chef preparing food' },
  { src: '/images/images/single2.webp', alt: 'Cooking on the stove' },
  { src: '/images/images/single3.webp', alt: 'Peter making sausages' },
]

export default function ReservationPage() {
  return (
    <>
      <PageHero
        image="/images/banners/reservation-banner.webp"
        eyebrow="Dine With Us"
        title="Reservation"
        text="Reserve your table at Helsy and enjoy an exceptional dining experience with us."
      />

      <section className="section">
        <div className={`container ${styles.layout}`}>
          <div className={styles.intro}>
            <p className="eyebrow">Reservations</p>
            <h2 className="display h2">Book A Table</h2>
            <hr className="rule" />
            <p className="lead">
              Reserve your spot and enjoy an unforgettable dining experience. Book your table now for a taste of our
              culinary delights.
            </p>

            <ul className={styles.details}>
              <li>
                <FiPhone aria-hidden="true" />
                <span>
                  Booking requests
                  <a href={helsy.phoneHref}>{helsy.phone}</a>
                </span>
              </li>
              <li>
                <FiClock aria-hidden="true" />
                <span>
                  Open every day
                  <strong>{helsy.hours}</strong>
                </span>
              </li>
              <li>
                <FiMapPin aria-hidden="true" />
                <span>
                  Find us
                  <a href={helsy.mapsUrl} target="_blank" rel="noopener noreferrer">
                    {helsy.address}
                  </a>
                </span>
              </li>
            </ul>

            <Link href="/menu" className="link-arrow">
              View the menu before reserving →
            </Link>
          </div>

          <div className="panel">
            <h3 className={`display ${styles.formTitle}`}>Your details</h3>
            <ReservationForm />
          </div>
        </div>
        <p className={`display ${styles.thanks}`}>Thank you for choosing us</p>
      </section>

      <section className={styles.photos} aria-label="In the kitchen">
        {photos.map((p) => (
          <div key={p.src} className={`media ${styles.photo}`}>
            <Img src={p.src} alt={p.alt} sizes="(max-width: 768px) 80vw, 33vw" />
          </div>
        ))}
      </section>
    </>
  )
}
