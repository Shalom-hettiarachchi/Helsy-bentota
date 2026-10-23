import { FaWhatsapp } from 'react-icons/fa6'
import PageHero from '@/components/PageHero'
import ProductBrowser from './ProductBrowser'
import { petes } from '@/data/site'
import styles from './products.module.css'
import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta({
  title: "Shop Pete's Meats",
  description:
    "Order Pete's Meats online: Cumberland sausages, smoked bacon, butter-pastry pies, burgers and more, handmade in Bentota.",
  path: '/products',
  image: { url: '/images/banners/petesmeat-banner.webp', width: 2560, height: 811, alt: "Pete's Meats products" },
})

export default function ProductsPage() {
  return (
    <>
      <PageHero
        image="/images/banners/petesmeat-banner.webp"
        eyebrow="Bentota Artisan Meat Products"
        title="Pete's Meats"
        mask={0.4}
        text="Just like Mum makes!"
      />

      <section className="section">
        <div className="container">
          <div className="heading text-center">
            <p className="eyebrow">Shop Online</p>
            <h2 className="display h2">Welcome to Pete’s Meats</h2>
            <p className="lead">
              Savour the taste of locally sourced, premium-quality meats from Bentota. Whether you’re cooking up a feast
              or planning a cosy dinner, we’ve got the finest cuts to elevate your meals.
            </p>
          </div>

          <ProductBrowser />

          <div className={styles.help}>
            <p>Prefer to order by message?</p>
            <a href={petes.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
              <FaWhatsapp /> Order on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
