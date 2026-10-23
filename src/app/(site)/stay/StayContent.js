'use client'

import Link from 'next/link'
import { LuBath, LuBedDouble, LuCheck, LuCoffee, LuCookingPot, LuSofa, LuTrees, LuUsers, LuWaves } from 'react-icons/lu'
import useSiteData from '@/hooks/useSiteData'
import { formatMoney, formatMonthDay } from '@/lib/dates'
import { BookingContact, BreakfastNotice } from '@/components/booking/BookingBits'
import styles from './stay.module.css'

function featureIcon(text) {
  const t = text.toLowerCase()
  if (t.includes('bedroom') || t.includes('bed')) return LuBedDouble
  if (t.includes('bath')) return LuBath
  if (t.includes('kitchen')) return LuCookingPot
  if (t.includes('living')) return LuSofa
  if (t.includes('pool')) return LuWaves
  if (t.includes('garden')) return LuTrees
  if (t.includes('breakfast')) return LuCoffee
  return LuCheck
}

function Photo({ image, className = '' }) {
  // Plain <img>: photos can be uploaded in the admin panel, so sizes vary
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={image.src} alt={image.alt || ''} className={`${styles.photo} ${className}`} loading="lazy" />
}

export default function StayContent() {
  const { rooms, seasons, settings } = useSiteData()
  const currency = settings.currency || 'LKR'

  return (
    <>
      {rooms.map((room, i) => (
        <section key={room.id} className={`section ${i % 2 ? 'surface' : ''}`} id={room.slug}>
          <div className={`container ${styles.split}`}>
            <div>
              <p className="eyebrow">The Suite</p>
              <h2 className="display h2">{room.name}</h2>
              <hr className="rule" />
              <p className="lead">{room.description}</p>

              <ul className={styles.features}>
                {room.features.map((f) => {
                  const Icon = featureIcon(f)
                  return (
                    <li key={f}>
                      <Icon aria-hidden="true" />
                      {f}
                    </li>
                  )
                })}
              </ul>

              {room.capacityNote && (
                <p className={styles.capacity}>
                  <LuUsers aria-hidden="true" />
                  <span>{room.capacityNote}</span>
                </p>
              )}
              <BreakfastNotice className={styles.breakfast} />

              <div className={`btn-row ${styles.actions}`}>
                <Link href="/book" className="btn btn-light">
                  Check Availability
                </Link>
                <a href="#rates" className="btn btn-outline">
                  See Rates
                </a>
              </div>
            </div>

            {room.images.length > 0 && (
              <div className={styles.collage}>
                {room.images.slice(0, 4).map((img, n) => (
                  <Photo key={img.src} image={img} className={n === 0 ? styles.big : ''} />
                ))}
              </div>
            )}
          </div>
        </section>
      ))}

      {/* Rates and seasons */}
      <section id="rates" className="section surface">
        <div className="container container-narrow">
          <div className="heading text-center">
            <p className="eyebrow">Rates</p>
            <h2 className="display h2">Prices per night</h2>
          </div>

          <BreakfastNotice className={styles.ratesNotice} />

          <div className={styles.tableWrap}>
            <table className={styles.rates}>
              <thead>
                <tr>
                  <th scope="col">Room</th>
                  <th scope="col">Off-season</th>
                  <th scope="col">Peak season</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((r) => (
                  <tr key={r.id}>
                    <th scope="row">{r.name}</th>
                    <td data-label="Off-season">{formatMoney(r.offRate, currency)}</td>
                    <td data-label="Peak season">{formatMoney(r.peakRate, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.seasons}>
            <div>
              <h3 className="display h3">Peak season</h3>
              <ul>
                {seasons.map((s) => (
                  <li key={`${s.start}-${s.end}`}>
                    {formatMonthDay(s.start)} – {formatMonthDay(s.end)}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="display h3">Off-season</h3>
              <ul>
                <li>All other dates of the year</li>
              </ul>
            </div>
          </div>

          <ul className={styles.facts}>
            <li>
              <span>Check-in</span> from {settings.checkIn}
            </li>
            <li>
              <span>Check-out</span> by {settings.checkOut}
            </li>
            {rooms.some((r) => r.maxExtraBeds > 0) && (
              <li>
                <span>Extra beds</span>
                {rooms[0].extraBedPrice ? `${formatMoney(rooms[0].extraBedPrice, currency)} per night` : 'Free of charge'}
              </li>
            )}
          </ul>

          <div className={`text-center ${styles.cta}`}>
            <div className="btn-row">
              <Link href="/book" className="btn btn-light">
                Book Your Stay
              </Link>
              <Link href="/contact" className="btn btn-outline">
                Ask a Question
              </Link>
            </div>
            <BookingContact className={styles.contact} />
          </div>
        </div>
      </section>
    </>
  )
}
