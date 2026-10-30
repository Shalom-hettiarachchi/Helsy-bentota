import Link from 'next/link'
import LegalPage from '@/components/LegalPage'
import { helsy } from '@/data/site'
import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta({
  title: 'Terms & Conditions',
  description: 'The terms for booking a stay, care services and dining at The Helsy Bentota.',
  path: '/terms',
})

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      updated="30 October 2026"
      intro="These terms apply when you book a stay, care services or a table with The Helsy Bentota, or use this website."
    >
      <h2>Who we are</h2>
      <p>
        The Helsy Bentota is a guest house, care service and British restaurant at {helsy.address}, Sri Lanka. You can reach us on{' '}
        <a href={helsy.phoneHref}>{helsy.phone}</a> or at <a href={`mailto:${helsy.email}`}>{helsy.email}</a>.
      </p>

      <h2>Booking a stay</h2>
      <ul>
        <li>A booking sent through our website is a request. It becomes a contract between you and us when we confirm it by email.</li>
        <li>Please check the dates, room and number of guests in your confirmation and tell us straight away if anything is wrong.</li>
        <li>The person making the booking must be at least 18 years old and is responsible for everyone in their group.</li>
      </ul>

      <h2>Prices and payment</h2>
      <ul>
        <li>Prices are per room, per night, in Sri Lankan rupees (LKR), and include breakfast.</li>
        <li>Nights in our season (12 December – 11 April, and July and August) are charged at the season rate; other nights at the standard rate.</li>
        <li>
          The price shown when you book is the price you pay. Payment is due as described in our{' '}
          <Link href="/cancellation-policy">Cancellation &amp; Refund Policy</Link>.
        </li>
        <li>
          Card payments are handled securely by PayHere. We never see or store your card details. Meals, drinks and extras during your stay are paid
          separately.
        </li>
      </ul>

      <h2>Your stay</h2>
      <ul>
        <li>Check-in is from 2:00 pm and check-out is by 11:00 am, unless we agree other times with you.</li>
        <li>Rooms may only be used by the number of guests in the booking. Extra beds must be arranged in advance.</li>
        <li>Children must be supervised at all times, including around the swimming pool. The pool has no lifeguard and is used at your own risk.</li>
        <li>Please treat the property, our staff and other guests with respect. We may ask anyone who causes serious disturbance or danger to leave, without a refund.</li>
        <li>You are responsible for any damage caused by you or your group, beyond normal wear and tear.</li>
        <li>Please look after your belongings; we are not responsible for valuables left unattended in rooms or shared areas.</li>
      </ul>

      <h2>Care services</h2>
      <p>
        Care services are arranged with you individually – what is provided, when, and the price are agreed before they start. Our care is
        personal and practical support; it does not replace a doctor, hospital or emergency service. In an emergency we will call for medical help
        and contact the people you have named.
      </p>

      <h2>Restaurant and table reservations</h2>
      <p>
        Table reservations are requests until we confirm them. Please let us know about allergies or dietary needs when you book. Menu items and
        prices can change, and some dishes may sell out.
      </p>

      <h2>Cancellations</h2>
      <p>
        Cancellations, changes and refunds for stays are covered by our <Link href="/cancellation-policy">Cancellation &amp; Refund Policy</Link>.
      </p>

      <h2>Our responsibility</h2>
      <p>
        We take care to provide everything as described. We are not responsible for losses we could not reasonably foresee, or for events beyond
        our control such as severe weather, power or water cuts from the public supply, or government restrictions. Nothing in these terms limits
        rights you have under Sri Lankan law.
      </p>

      <h2>This website</h2>
      <p>
        We keep the information on this website as accurate as we can, but photos are a guide and details may change. Your personal information
        is handled as described in our <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>Law</h2>
      <p>These terms are governed by the laws of Sri Lanka. If something goes wrong, please talk to us first – we will do our best to put it right.</p>
    </LegalPage>
  )
}
