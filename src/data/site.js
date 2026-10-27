// Contact details and links used across the site, kept in one place.
// The booking phone, contact person and emails can also be changed in the
// admin panel (Settings); pages that show them use the live values.

export const siteUrl = 'https://www.thehelsybentota.com'

// Pete's Meats has its own website; nav links open it in a new tab
export const petesSiteUrl = 'https://petesmeats.lk/'

// Extra props for links that leave the site
export const externalProps = { target: '_blank', rel: 'noopener noreferrer' }

export const helsy = {
  name: 'The Helsy Bentota',
  phone: '(+94) 77 690 9169',
  phoneHref: 'tel:+94776909169',
  email: 'helsyofbentota@gmail.com',
  emails: ['helsyofbentota@gmail.com', 'pgrahamlanka@yahoo.com'],
  address: '2km Post, Circular road, Kommalta, Bentota 80500',
  hours: '08.00 am - 09.00 pm',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=The+Helsy+Bentota',
  bookingUrl: 'https://www.booking.com/hotel/lk/the-helsy-bentota-bentota1.en-gb.html',
  social: {
    facebook: 'https://www.facebook.com/thehelsybentota/',
    instagram: 'https://www.instagram.com/thehelsyofbentota/',
    tripadvisor:
      'https://www.tripadvisor.com/Hotel_Review-g297895-d27123664-Reviews-The_Helsy_Bentota-Bentota_Galle_District_Southern_Province.html',
  },
}

export const petes = {
  name: "Pete's Meats",
  phone: '(+94) 77 631 7411',
  phoneHref: 'tel:+94776317411',
  whatsapp: 'https://wa.me/94776317411',
  email: 'pgrahamlanka@yahoo.com',
  address: 'Helsy Eco Farm, 2km Post, Raja Mw, Kommalta, Bentota',
  hours: '08.00 am - 09.00 pm',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=The+Helsy+Bentota',
  social: {
    facebook: 'https://www.facebook.com/share/1C7Ly88LDm/',
    instagram: 'https://www.instagram.com/petes_meatslk',
  },
}

export const mapEmbedUrl =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.7117847697236!2d80.00992107499216!3d6.431058593560056!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae22f9a812176d9%3A0x8738e4cc25491877!2sThe%20Helsy%20Bentota!5e0!3m2!1sen!2slk!4v1734984661402!5m2!1sen!2slk'

export const mainNav = [
  { href: '/', label: 'Home' },
  { href: '/stay', label: 'Stay' },
  { href: '/care', label: 'Care' },
  { href: '/menu', label: 'Menu' },
  { href: '/about', label: 'About Us' },
  { href: petesSiteUrl, label: "Pete's Meats", external: true },
]

export const footerNav = [
  { href: '/', label: 'Home' },
  { href: '/stay', label: 'Accommodation' },
  { href: '/book', label: 'Book Your Stay' },
  { href: '/care', label: 'Care Services' },
  { href: '/menu', label: 'Menu' },
  { href: '/reservation', label: 'Book a Table' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact Us' },
  { href: petesSiteUrl, label: "Pete's Meats", external: true },
  { href: petesSiteUrl, label: 'Shop Online', external: true },
]

// "+94 77 690 9169" -> "tel:+94776909169"
export function telHref(phone = '') {
  const digits = phone.replace(/[^\d+]/g, '')
  return digits ? `tel:${digits}` : helsy.phoneHref
}
