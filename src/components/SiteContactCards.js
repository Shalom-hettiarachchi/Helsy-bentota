'use client'

import ContactCards from './ContactCards'
import useSiteData from '@/hooks/useSiteData'
import { helsy, telHref } from '@/data/site'

// The Helsy's contact cards, with the phone, contact person and emails
// from the admin panel (Settings).
export default function SiteContactCards() {
  const { settings } = useSiteData()
  const person = settings.bookingContactName
  return (
    <ContactCards
      info={{
        ...helsy,
        phone: settings.bookingPhone || helsy.phone,
        phoneHref: telHref(settings.bookingPhone),
        phoneLabel: person ? `Phone · ${person}` : 'Phone',
        emails: settings.publicEmails?.length ? settings.publicEmails : helsy.emails,
      }}
    />
  )
}
