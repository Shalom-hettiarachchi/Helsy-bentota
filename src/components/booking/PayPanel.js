'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { FiCheckCircle, FiCreditCard, FiLock } from 'react-icons/fi'
import { api } from '@/lib/api'
import { formatLong, formatMoney } from '@/lib/dates'
import styles from '@/app/(site)/pay/pay.module.css'

// The guest's payment page: booking summary, then pay by card (PayHere) or
// bank transfer. Reached from the private link in the "confirmed" email.
export default function PayPanel() {
  const params = useSearchParams()
  const ref = params.get('ref') || ''
  const token = params.get('t') || ''
  const returned = params.has('done')
  const cancelled = params.has('cancelled')

  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const [waited, setWaited] = useState(false)

  const query = `ref=${encodeURIComponent(ref)}&t=${encodeURIComponent(token)}`
  const load = useCallback(
    () =>
      api(`pay.php?${query}`)
        .then((d) => {
          setData(d)
          return d
        })
        .catch((err) => setError(err.message)),
    [query],
  )

  useEffect(() => {
    if (!ref || !token) {
      setError('This payment link is not complete. Please use the link in your confirmation email, or contact us.')
      return
    }
    load()
  }, [ref, token, load])

  // Back from PayHere: their confirmation reaches our server a moment later, so check again for a while
  useEffect(() => {
    if (!returned || !data || data.booking.paid) return
    let tries = 0
    const timer = setInterval(async () => {
      tries++
      const d = await load()
      if (d?.booking?.paid || tries >= 12) {
        clearInterval(timer)
        setWaited(true)
      }
    }, 3000)
    return () => clearInterval(timer)
  }, [returned, data?.booking?.paid, load]) // eslint-disable-line react-hooks/exhaustive-deps

  async function payByCard() {
    setStarting(true)
    setError('')
    try {
      const { action, fields } = await api('pay.php?action=checkout', { method: 'POST', body: { ref, t: token } })
      // PayHere's checkout takes a normal form post
      const form = document.createElement('form')
      form.method = 'post'
      form.action = action
      for (const [name, value] of Object.entries(fields)) {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = name
        input.value = value
        form.appendChild(input)
      }
      document.body.appendChild(form)
      form.submit()
    } catch (err) {
      setError(err.message)
      setStarting(false)
    }
  }

  if (error && !data) {
    return (
      <div className={`${styles.notice} ${styles.warn}`} role="alert">
        <p>{error}</p>
      </div>
    )
  }
  if (!data) return <p className={styles.muted}>Loading your booking…</p>

  const b = data.booking
  const guests = `${b.adults} adult${b.adults === 1 ? '' : 's'}${b.children ? `, ${b.children} child${b.children === 1 ? '' : 'ren'}` : ''}`
  const canPay = b.status === 'confirmed' && !b.paid

  return (
    <>
      {b.paid && (
        <div className={`${styles.notice} ${styles.ok}`} role="status">
          <p>
            <FiCheckCircle aria-hidden="true" /> <strong>Paid – thank you!</strong> Your stay is all set. A receipt has been sent to your email.
          </p>
        </div>
      )}
      {returned && !b.paid && (
        <div className={`${styles.notice} ${styles.warn}`} role="status">
          {waited ? (
            <p>
              We haven&apos;t received the confirmation of your payment yet. If money was taken from your card, there&apos;s nothing more to do –
              we&apos;ll email you as soon as it comes through. Questions? Call us on {data.phone}.
            </p>
          ) : (
            <p>Checking your payment… this usually takes a few seconds.</p>
          )}
        </div>
      )}
      {cancelled && !b.paid && (
        <div className={`${styles.notice} ${styles.warn}`} role="status">
          <p>The card payment was cancelled and nothing was charged. You can try again below.</p>
        </div>
      )}
      {b.status === 'pending' && (
        <div className={`${styles.notice} ${styles.warn}`} role="status">
          <p>We&apos;re still checking availability for this booking. Once it&apos;s confirmed we&apos;ll email you how to pay.</p>
        </div>
      )}
      {b.status === 'cancelled' && (
        <div className={`${styles.notice} ${styles.warn}`} role="status">
          <p>This booking has been cancelled, so there is nothing to pay. Questions? Call us on {data.phone}.</p>
        </div>
      )}

      <div className={styles.card}>
        <h2>Booking {b.ref}</h2>
        <dl className={styles.summary}>
          <dt>Name</dt>
          <dd>{b.name}</dd>
          <dt>Room</dt>
          <dd>{b.room}</dd>
          <dt>Check-in</dt>
          <dd>{formatLong(b.checkIn)}</dd>
          <dt>Check-out</dt>
          <dd>{formatLong(b.checkOut)}</dd>
          <dt>Stay</dt>
          <dd>
            {b.nights} night{b.nights === 1 ? '' : 's'} · {guests}
          </dd>
        </dl>
        <div className={styles.total}>
          <span>Total, breakfast included</span>
          <strong>{formatMoney(b.total, b.currency)}</strong>
        </div>
      </div>

      {canPay && (
        <div className={styles.card}>
          <h2>How to pay</h2>
          <p className={styles.due}>
            Please pay <strong>{formatMoney(b.total, b.currency)}</strong> by <strong>{formatLong(b.due)}</strong>.
          </p>

          {data.card && (
            <>
              <button type="button" className={`btn btn-light ${styles.payBtn}`} onClick={payByCard} disabled={starting}>
                <FiCreditCard aria-hidden="true" /> {starting ? 'Opening secure payment…' : `Pay ${formatMoney(b.total, b.currency)} by card`}
              </button>
              <p className={styles.small}>
                <FiLock aria-hidden="true" /> Secure payment by PayHere – Visa, Mastercard and more. Your card details never reach us.
                {data.sandbox && ' (Test mode: no real money is taken.)'}
              </p>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
            </>
          )}

          {data.bankDetails && (
            <>
              {data.card && <p className={styles.or}>or</p>}
              <p>Pay by bank transfer to:</p>
              <p className={styles.bank}>{data.bankDetails}</p>
              <p>
                Please use <strong>{b.ref}</strong> as the payment reference, so we can match your payment.
              </p>
            </>
          )}

          {!data.card && !data.bankDetails && (
            <p>Please call us on {data.phone} and we&apos;ll help you pay.</p>
          )}

          <p className={styles.small}>
            Cancellations and refunds: see our <Link href="/cancellation-policy">Cancellation &amp; Refund Policy</Link>.
          </p>
          <p className={styles.small}>
            Our bank details will never change by email. If you receive a message saying otherwise, please call us on {data.phone} before paying.
          </p>
        </div>
      )}
    </>
  )
}
