import Link from 'next/link'
import { FaWhatsapp } from 'react-icons/fa6'
import Img from '@/components/Img'
import ProductCard from '@/components/ProductCard'
import ContactCards from '@/components/ContactCards'
import SocialLinks from '@/components/SocialLinks'
import PetesHeader from './PetesHeader'
import { products } from '@/data/products'
import { mapEmbedUrl, petes } from '@/data/site'
import styles from './petes.module.css'

export const metadata = {
  title: "Pete's Meats – Bentota Artisan Meat Products",
  description:
    "Pete's Meats makes British-style sausages, bacon, ham and butter-pastry pies by hand in Bentota, Sri Lanka. Call or WhatsApp to order – we deliver.",
  alternates: { canonical: '/petes-meats' },
}

const showcase = products.filter((p) => p.onPetesPage !== false)

export default function PetesMeatsPage() {
  return (
    <div className={styles.page}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <PetesHeader />

      <main id="main">
        {/* Hero */}
        <section className={styles.hero}>
          <Img
            src="/images/banners/petes-landing-banner.webp"
            alt=""
            fill
            preload
            sizes="100vw"
            className={styles.heroBg}
          />
          <div className={styles.heroContent}>
            <Img
              src="/images/logo/petes-meats-logo-banner.png"
              alt="Pete's Meats – just like Mum makes"
              sizes="(max-width: 900px) 88vw, 760px"
              preload
              className={styles.heroLogo}
            />
            <div className={`btn-row ${styles.heroActions}`}>
              <Link href="/products" className="btn btn-light">
                Shop Online
              </Link>
              <a href={petes.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                <FaWhatsapp /> WhatsApp Order
              </a>
            </div>
          </div>
        </section>

        <ul className={styles.strip}>
          <li>Pete’s Meats – Just like Mum makes</li>
          <li>
            <a href={petes.phoneHref}>Call us now – [+94] 77 631 7411</a>
          </li>
          <li>Taste the difference – call &amp; order now!</li>
        </ul>

        {/* About */}
        <section id="about" className="section">
          <div className={`container ${styles.split}`}>
            <div className="reveal">
              <p className="eyebrow">About Us</p>
              <h2 className="display h2">Hello, I’m Pete</h2>
              <hr className="rule" />
              <div className="prose">
                <p>
                  I’m Pete from Pete’s Meats. I’m married to Helsy, a Sri Lankan, and we have six children. I used to
                  work as a dental surgeon in the UK but retired to Sri Lanka.
                </p>
                <p>
                  At first, I couldn’t find the quality meat products I was used to. With my farming background and a
                  passion for making sausages and bacon, I started making them again here, sourcing local ingredients. I
                  wanted my family to enjoy food I trusted – soon friends began asking for samples and supplies, and it
                  grew into a small business.
                </p>
                <p>
                  We focus on a limited range of high-quality products that I know best. The business is small: just
                  me and one employee, with family helping at events. Visit us at our farm in Bentota or at local fairs
                  to taste the difference – once you try, you’ll keep coming back.
                </p>
              </div>
            </div>
            <div className={`framed reveal ${styles.splitMedia}`}>
              <div className="media">
                <Img src="/images/images/petesmeats-about-img.jpg" alt="Pete at work" sizes="(max-width: 900px) 100vw, 560px" />
              </div>
            </div>
          </div>
        </section>

        {/* Products */}
        <section id="products" className="section surface">
          <div className="container">
            <div className="heading text-center reveal">
              <p className="eyebrow">Our Products</p>
              <h2 className="display h2">Honest ingredients, nothing hidden</h2>
              <div className={`lead ${styles.sourcing}`}>
                <p>
                  We source our pork and beef from government-approved suppliers, and our chicken from Maxies. We use
                  the whole dressed pig (excluding internal organs, brain, spinal column and skin).
                </p>
                <p>
                  Sausage casings are UK-sourced, made from pork or cellulose. Our pastry is made with high-quality
                  Clover flour from Prima and local dairy butter. Beef comes from our trusted local butcher, using only
                  loin, rump and kidney for pies – plus fresh eggs from our own free-range hens.
                </p>
              </div>
            </div>
            <div className={styles.grid}>
              {showcase.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>

        {/* Price list */}
        <section id="prices" className="section">
          <div className={`container ${styles.split} ${styles.prices}`}>
            <div className="reveal">
              <p className="eyebrow">Price List</p>
              <h2 className="display h2">Order fresh, we deliver</h2>
              <hr className="rule" />
              <p className="lead">
                Call us or send a message on WhatsApp to place your order – or order online in a few taps.
              </p>
              <div className={`btn-row ${styles.priceActions}`}>
                <Link href="/products" className="btn btn-light">
                  Order Online
                </Link>
                <a href={petes.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                  <FaWhatsapp /> WhatsApp
                </a>
              </div>
            </div>
            <a
              href="/images/images/pricelist.png"
              target="_blank"
              rel="noopener noreferrer"
              className={`reveal ${styles.priceList}`}
              aria-label="Open the full-size price list"
            >
              <Img src="/images/images/pricelist.png" alt="Pete's Meats price list" sizes="(max-width: 900px) 100vw, 520px" />
            </a>
          </div>
        </section>

        {/* Find us */}
        <section id="find-us" className="section surface">
          <div className={`container ${styles.find}`}>
            <div>
              <p className="eyebrow">How To Find Us</p>
              <h2 className="display h2">Visit the farm</h2>
              <hr className="rule" />
              <p className="lead">
                Get closer to Pete’s Meats – we’re just a message away from bringing you the taste you’ve been craving!
              </p>
              <div className={styles.cards}>
                <ContactCards info={petes} />
              </div>
              <SocialLinks links={petes.social} className={styles.social} />
            </div>
            <iframe
              className="map"
              title="Map to Helsy Eco Farm"
              src={mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </section>
      </main>

      <a href={petes.whatsapp} target="_blank" rel="noopener noreferrer" className={styles.whatsapp} aria-label="Chat on WhatsApp">
        <FaWhatsapp />
      </a>

      <footer className={styles.footer}>
        <Img src="/images/logo/petes-meats-logo.png" alt="Pete's Meats" sizes="140px" className={styles.footerLogo} />
        <p>
          A family business of <Link href="/">The Helsy Bentota</Link>
        </p>
        <p className={styles.footerSmall}>
          © {new Date().getFullYear()} The Helsy Bentota. All rights reserved · Powered by Curl
        </p>
      </footer>
    </div>
  )
}
