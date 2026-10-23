import Link from 'next/link'
import PageHero from '@/components/PageHero'
import Img from '@/components/Img'
import styles from './about.module.css'

export const metadata = {
  title: 'About Us',
  description:
    'The story of The Helsy Bentota: Peter and Helsy’s ancestral land in Bentota, our free-range farm and the origins of Pete’s Meats.',
  alternates: { canonical: '/about' },
}

const farm = [
  {
    img: '/images/images/hens.webp',
    alt: 'Hens near a basket',
    title: 'Happy, free-range hens',
    text: 'Our farm, a short distance from the restaurant, is home to a thriving flock of healthy, free-range hens. They roam freely in a natural, stress-free environment, pecking at fresh grass and foraging for insects, while receiving the best care possible.',
  },
  {
    img: '/images/images/chickenout.webp',
    alt: 'Hens in the field',
    title: 'Natural, organic diet',
    text: 'Quality begins with well-being. Our hens are fed a nutritious, organic diet without artificial additives or hormones, so every egg we serve is packed with flavour, nutrition and the goodness of happy, healthy hens.',
  },
  {
    img: '/images/images/eggs.webp',
    alt: 'Fresh eggs in a basket',
    title: 'Farm to table',
    text: 'By sourcing eggs directly from our farm, every dish at The Helsy Bentota is made with the freshest ingredients – part of our commitment to sustainability and farm-to-table dining.',
  },
]

export default function AboutPage() {
  return (
    <>
      <PageHero
        image="/images/banners/aboutus-banner.webp"
        eyebrow="Our Story"
        title="About Us"
        position="center 30%"
        text="Helsy’s Story – a blend of tradition, innovation, and memorable dining."
      />

      {/* Ancestral land */}
      <section className="section">
        <div className="container text-center">
          <div className="heading reveal">
            <p className="eyebrow">Bentota, Sri Lanka</p>
            <h2 className="display h2">My Ancestral Land</h2>
          </div>
          <div className={`media reveal ${styles.land}`}>
            <Img src="/images/images/land.webp" alt="Aerial view of the land in Bentota" sizes="(max-width: 1240px) 100vw, 1240px" />
          </div>
          <div className={`container-narrow prose reveal ${styles.landText}`}>
            <p>
              My ancestral land in Bentota is now home to <b>Bentota Artisan Meat Products</b> &amp;{' '}
              <b>The Helsy, Bentota</b>.
            </p>
            <p>
              We grow lots of vegetables, herbs, fruits and flowers on our four-acre land, and mornings are filled with
              the chirps of birds and so much joy. We have chickens for fresh eggs and a couple of cows, because Peter
              loves making his own cheese.
            </p>
          </div>
        </div>
      </section>

      {/* The Helsy */}
      <section className="section surface">
        <div className={`container ${styles.split}`}>
          <div className="reveal">
            <p className="eyebrow">The Restaurant</p>
            <h2 className="display h2">The Helsy Bentota</h2>
            <hr className="rule" />
            <div className="prose">
              <p>
                …is our newest addition: a brand-new, British-food themed restaurant that also provides jobs for the
                lovely local community.
              </p>
              <p>
                Today we welcome guests to our Self-Contained Upstairs Suite, overlooking the garden and pool, and we
                care for those who wish to stay with us for longer – through residential, dementia and respite care,
                with Ayurvedic medicine under consultant care – in our tropical paradise near the Indian Ocean, on my
                ancestral land.
              </p>
            </div>
          </div>
          <div className={`framed reveal ${styles.splitMedia}`}>
            <div className="media">
              <Img src="/images/images/aboutimg.webp" alt="Corridor at The Helsy" sizes="(max-width: 900px) 100vw, 520px" />
            </div>
          </div>
        </div>
      </section>

      {/* Farm */}
      <section className="section">
        <div className="container">
          <div className="heading text-center reveal">
            <p className="eyebrow">Our Farm</p>
            <h2 className="display h2">Fresh from our own hens</h2>
            <p className="lead">
              At The Helsy Bentota we take pride in offering the freshest, highest-quality eggs to our guests.
            </p>
          </div>
          <ul className={styles.farm}>
            {farm.map((f) => (
              <li key={f.img} className={`reveal ${styles.farmCard}`}>
                <div className="media">
                  <Img src={f.img} alt={f.alt} sizes="(max-width: 760px) 100vw, 400px" />
                </div>
                <h3 className="display h3">{f.title}</h3>
                <p>{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pete */}
      <section className="section surface">
        <div className={`container ${styles.split} ${styles.reverse}`}>
          <div className={`framed reveal ${styles.splitMedia}`}>
            <div className="media">
              <Img src="/images/images/pete.webp" alt="Peter" sizes="(max-width: 900px) 100vw, 520px" />
            </div>
          </div>
          <div className="reveal">
            <p className="eyebrow">The Founder</p>
            <h2 className="display h2">Pete’s Story</h2>
            <hr className="rule" />
            <div className="prose">
              <p>
                Pete’s Meats grew from Peter not being able to find the quality meat products he ate in England. With
                his farming background, and having made his own bacon and sausages in the UK, he carried on in Sri
                Lanka. Requests from friends for these prime meat products soon grew into a small business.
              </p>
              <p>
                Our sausages contain no offal, brain or spinal tissue – only quality pork meat and fat. Our meat pies
                use the animal’s rump with fascia and connective tissue removed, in pastry made with butter.
              </p>
            </div>
            <div className={`btn-row ${styles.actions}`}>
              <Link href="/petes-meats" className="btn btn-light">
                Pete’s Meats
              </Link>
              <Link href="/reservation" className="btn btn-outline">
                Book a Table
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
