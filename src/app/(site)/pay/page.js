import { Suspense } from 'react'
import PayPanel from '@/components/booking/PayPanel'
import styles from './pay.module.css'
import { pageMeta } from '@/lib/seo'

// Private page reached from the "confirmed" email – kept out of search engines
export const metadata = pageMeta({
  title: 'Pay for your stay',
  description: 'Pay for your confirmed booking at The Helsy Bentota.',
  path: '/pay',
  noindex: true,
})

export default function PayPage() {
  return (
    <section className={styles.page}>
      <div className={`container ${styles.narrow}`}>
        <div className={styles.heading}>
          <p className="eyebrow">Your booking</p>
          <h1 className="display h1">Pay for your stay</h1>
        </div>
        <Suspense fallback={<p className={styles.muted}>Loading your booking…</p>}>
          <PayPanel />
        </Suspense>
      </div>
    </section>
  )
}
