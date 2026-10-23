import { Maname, Poppins } from 'next/font/google'
import { googleSiteVerification, helsy, siteUrl } from '@/data/site'
import { defaultImage } from '@/lib/seo'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-poppins',
  display: 'swap',
})

const maname = Maname({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-maname',
  display: 'swap',
})

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'The Helsy Bentota – British Restaurant & Homestay',
    template: '%s | The Helsy Bentota',
  },
  description:
    'The Helsy Bentota: a self-contained holiday suite, residential, dementia and respite care, and homemade British food on our family farm in Bentota, Sri Lanka.',
  applicationName: helsy.name,
  ...(googleSiteVerification ? { verification: { google: googleSiteVerification } } : {}),
  icons: { icon: '/images/logo/helsy-icon.svg' },
  openGraph: {
    type: 'website',
    siteName: helsy.name,
    locale: 'en_GB',
    images: [defaultImage],
  },
  twitter: { card: 'summary_large_image' },
}

export const viewport = {
  themeColor: '#0f1010',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${poppins.variable} ${maname.variable}`}>
      <body>{children}</body>
    </html>
  )
}
