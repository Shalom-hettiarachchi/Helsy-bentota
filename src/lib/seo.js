// Page metadata in one place, so every page gets the same SEO basics:
// a canonical address (with the trailing slash the site uses), and Open Graph /
// Twitter tags so links shared on WhatsApp, Facebook etc. show the right
// title, text and photo.
import { helsy } from '@/data/site'

export const defaultImage = {
  url: '/images/banners/home-banner.webp',
  width: 2560,
  height: 1278,
  alt: 'Dining room at The Helsy Bentota',
}

export function pageMeta({ title, description, path, image = defaultImage, noindex = false }) {
  const url = path === '/' ? '/' : `/${path.replace(/^\/|\/$/g, '')}/`
  const plainTitle = typeof title === 'string' ? title : title?.absolute
  const shareTitle = plainTitle && !plainTitle.includes(helsy.name) ? `${plainTitle} | ${helsy.name}` : plainTitle
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      siteName: helsy.name,
      locale: 'en_GB',
      url,
      title: shareTitle,
      description,
      images: [image],
    },
    twitter: { card: 'summary_large_image', title: shareTitle, description, images: [image] },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  }
}
