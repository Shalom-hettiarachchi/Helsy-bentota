import PageHero from '@/components/PageHero'
import SiteContactCards from '@/components/SiteContactCards'
import SocialLinks from '@/components/SocialLinks'
import ContactForm from './ContactForm'
import { mapEmbedUrl } from '@/data/site'
import styles from './contact.module.css'

export const metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with The Helsy Bentota about stays, care services or dining – address, phone, email, opening hours and a map to find us in Bentota.',
  alternates: { canonical: '/contact/' },
}

export default function ContactPage() {
  return (
    <>
      <PageHero
        image="/images/banners/contactus-banner.webp"
        eyebrow="Say Hello"
        title="Contact Us"
        mask={0.45}
        text="Questions about a stay, our care services or a table for dinner? We're here to help."
      />

      <section className="section">
        <div className={`container ${styles.layout}`}>
          <div>
            <p className="eyebrow">Get Closer</p>
            <h2 className="display h2">We’re just a message away</h2>
            <hr className="rule" />
            <p className="lead">Call, email or send us a message – we usually reply within a day.</p>
            <div className={styles.cards}>
              <SiteContactCards />
            </div>
            <div className={styles.social}>
              <span>Follow us</span>
              <SocialLinks />
            </div>
          </div>

          <div className="panel">
            <h3 className={`display ${styles.formTitle}`}>Send a message</h3>
            <ContactForm />
          </div>
        </div>
      </section>

      <section className={`container ${styles.mapWrap}`}>
        <iframe
          className="map"
          title="Map to The Helsy Bentota"
          src={mapEmbedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </section>
    </>
  )
}
