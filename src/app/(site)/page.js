import Link from 'next/link'
import { FiClock, FiMapPin, FiPhone } from 'react-icons/fi'
import { LuBedDouble, LuHeartHandshake, LuSprout } from 'react-icons/lu'
import Img from '@/components/Img'
import Gallery from '@/components/Gallery'
import { BreakfastNotice, FromPrice, LivePhone } from '@/components/booking/BookingBits'
import { careServices } from '@/data/care'
import { externalProps, helsy, petesSiteUrl, siteUrl } from '@/data/site'
import { pageMeta } from '@/lib/seo'
import styles from './home.module.css'

export const metadata = pageMeta({
  title: { absolute: 'The Helsy Bentota – Stay, Care & British Dining in Bentota' },
  description:
    'A self-contained two-bedroom suite with garden and pool views, residential, dementia and respite care, and homemade British food on our family farm in Bentota, Sri Lanka.',
  path: '/',
})

const gallery = [
  { src: '/images/images/image-gal3.webp', alt: 'Double bedroom in the upstairs suite' },
  { src: '/images/images/image-gal2.webp', alt: 'Second bedroom with wooden bed' },
  { src: '/images/images/image-gal4.webp', alt: 'Bedroom with wardrobe and kitchenette' },
  { src: '/images/images/gal5.webp', alt: 'The suite’s kitchen' },
  { src: '/images/images/image-gal1.webp', alt: 'Veranda dining area' },
]

const highlights = [
  {
    Icon: LuBedDouble,
    title: 'Stay a while',
    text: 'A self-contained two-bedroom suite overlooking the garden and pool – breakfast included.',
  },
  {
    Icon: LuHeartHandshake,
    title: 'Care with heart',
    text: 'Residential, dementia and respite care, plus Ayurvedic medicine under consultant care.',
  },
  {
    Icon: LuSprout,
    title: 'From our own farm',
    text: 'Vegetables, fruit, herbs and free-range eggs from our four-acre land, cooked fresh every day.',
  },
]

// Tells Google what The Helsy is, with address, location, hours and contact details
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': ['LodgingBusiness', 'Restaurant'],
  '@id': `${siteUrl}/#business`,
  name: helsy.name,
  description:
    'Family-run homestay, care home and British restaurant in Bentota, Sri Lanka, with a self-contained two-bedroom suite overlooking the garden and swimming pool.',
  url: `${siteUrl}/`,
  image: [
    `${siteUrl}/images/banners/home-banner.webp`,
    `${siteUrl}/images/images/image-gal3.webp`,
    `${siteUrl}/images/images/gal5.webp`,
  ],
  logo: `${siteUrl}/images/logo/helsy-logo-white.png`,
  telephone: '+94776909169',
  email: helsy.email,
  servesCuisine: ['British', 'Sri Lankan'],
  hasMenu: `${siteUrl}/menu/`,
  priceRange: '$$',
  acceptsReservations: true,
  checkinTime: '14:00',
  checkoutTime: '11:00',
  numberOfRooms: 1,
  amenityFeature: ['Swimming pool', 'Garden', 'Breakfast included', 'Kitchen'].map((name) => ({
    '@type': 'LocationFeatureSpecification',
    name,
    value: true,
  })),
  address: {
    '@type': 'PostalAddress',
    streetAddress: '2km Post, Circular road, Kommalta',
    addressLocality: 'Bentota',
    postalCode: '80500',
    addressRegion: 'Southern Province',
    addressCountry: 'LK',
  },
  geo: { '@type': 'GeoCoordinates', latitude: 6.431059, longitude: 80.009921 },
  hasMap: helsy.mapsUrl,
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '08:00',
      closes: '21:00',
    },
  ],
  sameAs: [...Object.values(helsy.social), helsy.bookingUrl],
}

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className={styles.hero}>
        <Img
          src="/images/banners/home-banner.webp"
          alt=""
          fill
          preload
          sizes="100vw"
          className={styles.heroImg}
        />
        <div className={styles.heroContent}>
          {/* The page's main heading: the logo, plus words for search engines and screen readers */}
          <h1 className={styles.heroHeading}>
            <Img
              src="/images/logo/helsy-logo-white.png"
              alt="The Helsy Bentota"
              sizes="(max-width: 600px) 72vw, 440px"
              preload
              className={styles.heroLogo}
            />
            <span className="sr-only"> – stay, care and British dining in Bentota, Sri Lanka</span>
          </h1>
          <p className={styles.heroTag}>Stay · Care · British dining · Bentota</p>
          <div className={`btn-row ${styles.heroActions}`}>
            <Link href="/book" className="btn btn-light">
              Book Your Stay
            </Link>
            <Link href="/care" className="btn btn-outline">
              Care Services
            </Link>
          </div>
        </div>
        <a href="#story" className={styles.scrollCue} aria-label="Scroll to our story">
          <span />
        </a>
      </section>

      {/* Our story */}
      <section id="story" className="section">
        <div className={`container ${styles.split}`}>
          <div className="reveal">
            <p className="eyebrow">Our Story</p>
            <h2 className="display h2">Where tradition meets tropical paradise</h2>
            <hr className="rule" />
            <div className="prose">
              <p>
                Welcome to The Helsy Bentota. Nestled on our family’s ancestral land in the heart of Sri Lanka, The
                Helsy is a warm, homely place to stay, to be cared for and to enjoy good food.
              </p>
              <p>
                Peter’s passion for authentic, farm-fresh British food – inspired by his English roots – runs through
                everything we do. From homemade sausages and bacon to hearty classics, every dish celebrates flavour
                and craftsmanship, using ingredients from our very own farm. More than a business, we are a
                community-driven venture that supports local livelihoods.
              </p>
            </div>
            <Link href="/about" className={`link-arrow ${styles.more}`}>
              Read more about us →
            </Link>
          </div>
          <div className={`framed reveal ${styles.storyMedia}`}>
            <div className="media">
              <Img
                src="/images/images/ourstory-img.webp"
                alt="Peter cooking in The Helsy kitchen"
                sizes="(max-width: 900px) 100vw, 560px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className={styles.highlights} aria-label="Why guests love The Helsy">
        <ul className={`container ${styles.highlightGrid}`}>
          {highlights.map(({ Icon, title, text }) => (
            <li key={title} className={`reveal ${styles.highlight}`}>
              <span className={styles.highlightIcon}>
                <Icon aria-hidden="true" />
              </span>
              <h3 className="display h3">{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Accommodation */}
      <section className="section surface">
        <div className="container container-narrow text-center reveal">
          <div className="heading">
            <p className="eyebrow">Stay With Us</p>
            <h2 className="display h2">Self-Contained Upstairs Suite</h2>
            <p className="lead">
              Two bedrooms, two bathrooms, a kitchen and a living room, overlooking the garden and swimming pool.
              Perfect for a large family or two couples – with an extra bed in each bedroom if you need it.
            </p>
            <FromPrice className={styles.fromPrice} />
          </div>
          <BreakfastNotice compact className={styles.breakfast} />
          <div className="btn-row">
            <Link href="/book" className="btn btn-light">
              Check Availability
            </Link>
            <Link href="/stay" className="btn btn-outline">
              View the Suite
            </Link>
          </div>
        </div>
        <div className={styles.gallery}>
          <Gallery images={gallery} label="Photos of the suite" />
        </div>
      </section>

      {/* Care */}
      <section className="section">
        <div className={`container ${styles.split}`}>
          <div className="reveal">
            <p className="eyebrow">Care Services</p>
            <h2 className="display h2">Caring for your loved ones</h2>
            <hr className="rule" />
            <p className="lead">
              Personal, compassionate care in a peaceful garden setting, with home-cooked meals and a team who treat
              every resident like family.
            </p>
            <ul className={styles.careList}>
              {careServices.map((s) => (
                <li key={s.id}>
                  <Link href={`/care#${s.id}`}>
                    <s.Icon aria-hidden="true" />
                    <span>{s.title === 'Ayurvedic Medicine' ? 'Ayurvedic medicine under consultant care' : s.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/care" className="btn btn-light">
              Our Care Services
            </Link>
          </div>
          <div className={`framed reveal ${styles.storyMedia}`}>
            <div className="media">
              <Img src="/images/banners/aboutus-banner.webp" alt="Peter with members of The Helsy team" sizes="(max-width: 900px) 100vw, 560px" />
            </div>
          </div>
        </div>
      </section>

      {/* "Just like Mum makes" */}
      <section className={styles.menu}>
        <div className={styles.menuMedia}>
          <Img src="/images/images/ribs.webp" alt="" fill sizes="100vw" className={styles.menuImg} />
        </div>
        <div className={`reveal ${styles.menuCard}`}>
          <p className={`eyebrow ${styles.menuEyebrow}`}>The Menu</p>
          <h2 className="display">“…just like Mum makes”</h2>
          <p>
            Food from our menu is cooked using the finest and freshest ingredients, like milk and butter sourced
            locally. Most of our meat products – ham, bacon, sausages, cheese and steaks – are made fresh daily in our
            bakery. Vegetables, fruits and herbs come from our own garden; what we can’t grow, we buy from local
            vendors.
          </p>
          <div className={`btn-row ${styles.menuActions}`}>
            <Link href="/menu" className="btn btn-dark">
              View Menu
            </Link>
            <Link href="/reservation" className={`btn ${styles.btnDarkOutline}`}>
              Book a Table
            </Link>
          </div>
        </div>
      </section>

      {/* Visit */}
      <section className={`surface ${styles.visit}`}>
        <div className={`container ${styles.visitGrid}`}>
          <div className={styles.visitItem}>
            <FiMapPin aria-hidden="true" />
            <h3>Find us</h3>
            <p>{helsy.address}</p>
            <a className="link-arrow" href={helsy.mapsUrl} target="_blank" rel="noopener noreferrer">
              Get directions →
            </a>
          </div>
          <div className={styles.visitItem}>
            <FiClock aria-hidden="true" />
            <h3>Restaurant hours</h3>
            <p>Open every day</p>
            <p>{helsy.hours}</p>
          </div>
          <div className={styles.visitItem}>
            <FiPhone aria-hidden="true" />
            <h3>Bookings</h3>
            <p>
              <LivePhone />
            </p>
            <Link className="link-arrow" href="/book">
              Book online →
            </Link>
          </div>
        </div>
      </section>

      {/* Pete's Meats */}
      <section className="section">
        <div className={`container ${styles.split} ${styles.petes}`}>
          <div className={`framed reveal ${styles.storyMedia}`}>
            <div className="media">
              <Img
                src="/images/images/petesmeats-about-img.jpg"
                alt="Pete preparing his homemade meat products"
                sizes="(max-width: 900px) 100vw, 560px"
              />
            </div>
          </div>
          <div className="reveal">
            <p className="eyebrow">From Our Farm Kitchen</p>
            <h2 className="display h2">Pete’s Meats</h2>
            <hr className="rule" />
            <p className="lead">
              Homemade sausages, smoked bacon and butter-pastry pies, made in Bentota by Peter himself. Order for
              delivery or pick up from the farm.
            </p>
            <div className={`btn-row ${styles.petesActions}`}>
              <Link href="/products" className="btn btn-light">
                Shop Online
              </Link>
              <a href={petesSiteUrl} {...externalProps} className="btn btn-outline">
                Discover Pete’s Meats
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
