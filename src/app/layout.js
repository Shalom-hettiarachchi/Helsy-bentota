import { Maname, Poppins } from 'next/font/google'
import { helsy, siteUrl } from '@/data/site'
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
    'Welcome to The Helsy Bentota, a British-themed restaurant offering authentic meats, private dining, and luxury homestay experiences in Sri Lanka.',
  keywords: ['Helsy', 'Helsy Bentota', 'British Restaurant', 'Private Dining', "Pete's Meats", 'Homestay', 'Bentota', 'Sri Lanka'],
  icons: { icon: '/images/logo/helsy-icon.svg' },
  openGraph: {
    type: 'website',
    siteName: helsy.name,
    locale: 'en_GB',
    images: [{ url: '/images/banners/home-banner.webp', width: 2560, height: 1278, alt: 'Dining room at The Helsy Bentota' }],
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
