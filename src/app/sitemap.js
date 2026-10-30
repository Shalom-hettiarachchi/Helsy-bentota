import { siteUrl } from '@/data/site'

export const dynamic = 'force-static'

export default function sitemap() {
  const pages = [
    { path: '/', priority: 1 },
    { path: '/stay/', priority: 0.9 },
    { path: '/book/', priority: 0.9 },
    { path: '/care/', priority: 0.9 },
    { path: '/menu/', priority: 0.8 },
    { path: '/reservation/', priority: 0.7 },
    { path: '/about/', priority: 0.7 },
    { path: '/contact/', priority: 0.7 },
    { path: '/petes-meats/', priority: 0.7 },
    { path: '/products/', priority: 0.7 },
    { path: '/terms/', priority: 0.3 },
    { path: '/cancellation-policy/', priority: 0.3 },
    { path: '/privacy/', priority: 0.3 },
  ]
  return pages.map(({ path, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority,
  }))
}
