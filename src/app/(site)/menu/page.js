import Link from 'next/link'
import PageHero from '@/components/PageHero'
import MenuList from './MenuList'
import styles from './menu.module.css'
import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta({
  title: 'Menu',
  description:
    'The menu at The Helsy Bentota: homemade British classics, curries, grills and puddings, made with our own sausages, bacon and farm-fresh produce.',
  path: '/menu',
  image: { url: '/images/banners/menu-banner.webp', width: 2560, height: 900, alt: 'Food at The Helsy Bentota' },
})

export default function MenuPage() {
  return (
    <>
      <PageHero
        image="/images/banners/menu-banner.webp"
        eyebrow="Food & Drink"
        title="Our Menu"
        mask={0.6}
        text="Homemade British specials, cooked fresh with produce from our own farm."
      />

      <section className="section">
        <div className={`container ${styles.wrap}`}>
          <MenuList />

          <div className={`text-center ${styles.cta}`}>
            <h2 className="display h3">Ready to dine with us?</h2>
            <div className="btn-row">
              <Link href="/reservation" className="btn btn-light">
                Book a Table
              </Link>
              <Link href="/contact" className="btn btn-outline">
                Ask About Dietary Needs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
