import Link from 'next/link'
import PageHero from '@/components/PageHero'
import StayContent from './StayContent'

export const metadata = {
  title: 'Accommodation – Self-Contained Upstairs Suite',
  description:
    'Stay in our Self-Contained Upstairs Suite in Bentota: 2 bedrooms, 2 bathrooms, kitchen and living room overlooking the garden and swimming pool. All rates include breakfast.',
  alternates: { canonical: '/stay/' },
}

export default function StayPage() {
  return (
    <>
      <PageHero
        image="/images/images/land.webp"
        eyebrow="Accommodation"
        title="Stay With Us"
        mask={0.5}
        text="A private suite on our four-acre garden in Bentota – room for the whole family, with breakfast included."
      >
        <Link href="/book/" className="btn btn-light">
          Check Availability
        </Link>
      </PageHero>
      <StayContent />
    </>
  )
}
