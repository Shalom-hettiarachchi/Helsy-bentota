import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js'

// The site is exported as plain HTML/CSS/JS (`npm run build` -> /out) so it runs
// on Hostinger shared hosting. Bookings, the admin panel and forms talk to the
// PHP API in public/api. During `npm run dev`, /api is forwarded to the local
// PHP server started by `npm run api`.
export default function config(phase) {
  const dev = phase === PHASE_DEVELOPMENT_SERVER
  const apiOrigin = process.env.HELSY_API_ORIGIN || 'http://127.0.0.1:8000'

  return {
    trailingSlash: true,
    images: { unoptimized: true },
    ...(dev
      ? { rewrites: async () => [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }] }
      : { output: 'export' }),
  }
}
