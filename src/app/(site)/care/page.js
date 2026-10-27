import PageHero from '@/components/PageHero'
import Img from '@/components/Img'
import ContactForm from '../contact/ContactForm'
import { BookingContact } from '@/components/booking/BookingBits'
import { careServices } from '@/data/care'
import styles from './care.module.css'
import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta({
  title: 'Care Services – Residential, Dementia & Respite Care',
  description:
    'Residential care, dementia care, respite care and Ayurvedic medicine under consultant care at The Helsy Bentota, in a homely garden setting in Sri Lanka.',
  path: '/care',
  image: { url: '/images/images/cs1.webp', width: 2560, height: 1707, alt: 'Care at The Helsy Bentota' },
})

const reasons = [
  'A small, homely setting – never a big institution',
  'Fresh, home-cooked meals using produce from our own farm',
  'Four acres of tropical garden to enjoy every day',
  'A friendly team who get to know each resident personally',
]

export default function CarePage() {
  return (
    <>
      <PageHero
        image="/images/banners/aboutus-banner.webp"
        eyebrow="Care at The Helsy"
        title="Care Services"
        position="center 30%"
        text="Caring for your loved ones in a peaceful, homely setting in Bentota."
      >
        <a href="#enquire" className="btn btn-light">
          Make an Enquiry
        </a>
      </PageHero>

      <section className="section">
        <div className="container">
          <div className="heading text-center">
            <p className="eyebrow">What We Offer</p>
            <h2 className="display h2">Our care services</h2>
            <p className="lead">
              Whether it’s a long stay, specialist dementia support or a short break for family carers, we provide
              personal, compassionate care in a warm home surrounded by nature.
            </p>
          </div>

          <ul className={styles.services}>
            {careServices.map(({ id, Icon, title, text }) => (
              <li key={id} id={id} className={`reveal ${styles.service}`}>
                <span className={styles.icon}>
                  <Icon aria-hidden="true" />
                </span>
                <h3 className="display h3">{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section surface">
        <div className={`container ${styles.split}`}>
          <div className={`framed ${styles.media}`}>
            <div className="media">
              <Img src="/images/images/land.webp" alt="The Helsy's garden from above" sizes="(max-width: 900px) 100vw, 560px" />
            </div>
          </div>
          <div>
            <p className="eyebrow">Why Families Choose Us</p>
            <h2 className="display h2">A home, not a hospital</h2>
            <hr className="rule" />
            <ul className={styles.reasons}>
              {reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="enquire" className={`section ${styles.enquire}`}>
        <div className={`container ${styles.formLayout}`}>
          <div>
            <p className="eyebrow">Talk To Us</p>
            <h2 className="display h2">Make an enquiry</h2>
            <hr className="rule" />
            <p className="lead">
              Tell us a little about your loved one and the care they need. We’ll get back to you to talk it through,
              answer your questions and arrange a visit.
            </p>
            <BookingContact className={styles.contact} label="Prefer to talk it through?" />
          </div>
          <div className="panel">
            <ContactForm
              type="care"
              subjectOptions={['Residential Care', 'Dementia Care', 'Respite Care', 'Ayurvedic medicine', 'General care enquiry']}
            />
          </div>
        </div>
      </section>
    </>
  )
}
