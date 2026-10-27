import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js'

// The site is exported as plain HTML/CSS/JS (`npm run build` -> /out) so it runs
// on Hostinger shared hosting. Bookings, the admin panel and forms talk to the
// PHP API in public/api. During `npm run dev`, /api is forwarded to the local
// PHP server started by `npm run api`.
export default function config(phase) {
  const dev = phase === PHASE_DEVELOPMENT_SERVER
  const apiOrigin = process.env.HELSY_API_ORIGIN || 'http://127.0.0.1:8787'

  return {
    trailingSlash: true,
    // Next 16 blocks dev scripts on 127.0.0.1 unless it is listed here, which
    // leaves pages (like /admin) stuck on "Loading…".
    allowedDevOrigins: ['127.0.0.1', 'localhost'],
    images: { unoptimized: true },
    ...(dev
      ? {
          // beforeFiles: the PHP files also sit in public/api, and Next would
          // otherwise serve their source code instead of forwarding to PHP.
          rewrites: async () => ({
            beforeFiles: [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }],
          }),
        }
      : { output: 'export' }),
  }
}
