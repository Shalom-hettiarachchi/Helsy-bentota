'use client'

import useSiteData from '@/hooks/useSiteData'
import { helsy, telHref } from '@/data/site'

// Phone, contact person and emails in the footer (live from the admin panel)
export default function FooterContact() {
  const { settings } = useSiteData()
  const emails = settings.publicEmails?.length ? settings.publicEmails : helsy.emails
  return (
    <>
      <p>
        {settings.bookingContactName && <>{settings.bookingContactName}: </>}
        <a href={telHref(settings.bookingPhone)}>{settings.bookingPhone || helsy.phone}</a>
      </p>
      {emails.map((e) => (
        <p key={e}>
          <a href={`mailto:${e}`}>{e}</a>
        </p>
      ))}
    </>
  )
}
