import Link from 'next/link'
import LegalPage from '@/components/LegalPage'
import { helsy } from '@/data/site'
import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta({
  title: 'Cancellation & Refund Policy',
  description: 'How payment, cancellations, changes and refunds work for stays at The Helsy Bentota.',
  path: '/cancellation-policy',
})

export default function CancellationPolicyPage() {
  return (
    <LegalPage
      title="Cancellation & Refund Policy"
      updated="30 October 2026"
      intro="Plans change – here is how payments, cancellations and refunds work for stays at The Helsy Bentota."
    >
      <h2>Booking and payment</h2>
      <p>
        A booking made on our website is a <b>request</b> until we confirm it by email. Nothing is charged when you send a request. Once your stay is
        confirmed, we email you a secure link to pay by card (through PayHere) or the details to pay by bank transfer.
      </p>
      <ul>
        <li>Payment of the full amount is due <b>14 days before your arrival</b>.</li>
        <li>For bookings made less than 14 days before arrival, payment is due within <b>2 days</b> of confirmation.</li>
        <li>If payment has not been received by the due date, we may cancel the booking and release the dates – we will always contact you first.</li>
      </ul>

      <h2>If you cancel</h2>
      <p>Please let us know by email or phone as soon as you can. We count days to your check-in date:</p>
      <table>
        <thead>
          <tr>
            <th>When you cancel</th>
            <th>Refund</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>14 days or more before check-in</td>
            <td>Full refund</td>
          </tr>
          <tr>
            <td>7 to 13 days before check-in</td>
            <td>50% refund</td>
          </tr>
          <tr>
            <td>Less than 7 days before check-in, or no-show</td>
            <td>No refund</td>
          </tr>
        </tbody>
      </table>
      <p>Leaving early does not entitle you to a refund for the nights you don&apos;t stay.</p>

      <h2>Changing your dates</h2>
      <p>
        We are happy to move your stay to other dates if the room is available. If the new dates cost more, for example because they fall in our
        season, the difference is payable; if they cost less, we refund the difference. Changes made less than 7 days before check-in are treated
        as a cancellation.
      </p>

      <h2>If we have to cancel</h2>
      <p>
        In the rare case that we cannot host you – for example because of damage to the property or circumstances beyond our control – we will
        offer you other dates or a <b>full refund</b> of everything you have paid.
      </p>

      <h2>How refunds are paid</h2>
      <ul>
        <li>Card payments are refunded to the same card through PayHere. Banks usually take 7 to 14 working days to show it.</li>
        <li>Bank transfers are refunded to the account you paid from. Any charges made by your bank are not covered.</li>
        <li>Refunds are made in Sri Lankan rupees (LKR), the currency of your booking; the amount in your own currency may differ slightly because of exchange rates.</li>
      </ul>

      <h2>Bookings through other websites</h2>
      <p>If you booked through another website, such as Booking.com, that website&apos;s cancellation terms apply.</p>

      <h2>Questions</h2>
      <p>
        Call us on <a href={helsy.phoneHref}>{helsy.phone}</a> or email <a href={`mailto:${helsy.email}`}>{helsy.email}</a>. See also our{' '}
        <Link href="/terms">Terms &amp; Conditions</Link>.
      </p>
    </LegalPage>
  )
}
