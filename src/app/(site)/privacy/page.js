import Link from 'next/link'
import LegalPage from '@/components/LegalPage'
import { helsy } from '@/data/site'
import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta({
  title: 'Privacy Policy',
  description: 'What personal information The Helsy Bentota collects, why, and how it is kept safe.',
  path: '/privacy',
})

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="30 October 2026"
      intro="We only ask for the information we need to look after your booking, and we never sell it."
    >
      <h2>Who looks after your information</h2>
      <p>
        The Helsy Bentota, {helsy.address}, Sri Lanka. For anything about your personal information, email{' '}
        <a href={`mailto:${helsy.email}`}>{helsy.email}</a> or call <a href={helsy.phoneHref}>{helsy.phone}</a>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <b>Room bookings:</b> your name, email, phone number, country, dates, number of guests, expected arrival time and any message you send.
        </li>
        <li>
          <b>Table reservations, care enquiries and contact messages:</b> your name, contact details and what you tell us.
        </li>
        <li>
          <b>Payments:</b> whether and when you paid, the amount and the payment reference. Card payments are made on PayHere&apos;s secure page –
          your card details go to PayHere and the card networks, never to us.
        </li>
        <li>
          <b>Technical information:</b> your IP address is recorded with bookings and messages to protect the website against spam and misuse.
        </li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To check availability, confirm and manage your booking, and take payment.</li>
        <li>To contact you about your stay, reservation or enquiry, and to answer your questions.</li>
        <li>To keep the records a business must keep, such as bookings and payments.</li>
        <li>To keep the website secure.</li>
      </ul>
      <p>We do not use your information for advertising and we do not send newsletters unless you ask for them.</p>

      <h2>Who we share it with</h2>
      <ul>
        <li>
          <b>PayHere</b>, if you pay by card – to process the payment.
        </li>
        <li>
          <b>Our website and email providers</b> (Hostinger, which hosts this website and its database, and Google, which delivers our emails) –
          only to run the service.
        </li>
        <li>The authorities, if the law requires it.</li>
      </ul>
      <p>We never sell or rent your personal information.</p>

      <h2>How long we keep it</h2>
      <p>
        We keep booking and payment records for as long as we need them for your stay and for our business and tax records, and then delete them.
        Messages that did not lead to a booking are deleted when they are no longer needed.
      </p>

      <h2>Keeping it safe</h2>
      <p>
        This website uses an encrypted connection (HTTPS). Booking information is stored on our server outside the public part of the website, and
        only our staff can see it, through a password-protected admin area.
      </p>

      <h2>Cookies</h2>
      <p>
        This website does not use advertising or tracking cookies. A cookie is only set when our staff sign in to the admin area.
      </p>

      <h2>Your choices</h2>
      <p>
        You can ask us for a copy of the information we hold about you, to correct it, or to delete it when we no longer need to keep it. Just email
        or call us using the details above.
      </p>

      <h2>Changes</h2>
      <p>
        If we change this policy we will update the date at the top of this page. See also our <Link href="/terms">Terms &amp; Conditions</Link> and{' '}
        <Link href="/cancellation-policy">Cancellation &amp; Refund Policy</Link>.
      </p>
    </LegalPage>
  )
}
