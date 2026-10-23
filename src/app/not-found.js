import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <>
      <Header />
      <main
        id="main"
        className="container text-center"
        style={{ padding: 'calc(var(--header-h) + 120px) var(--gutter) 140px' }}
      >
        <p className="eyebrow">Error 404</p>
        <h1 className="display h1">Page not found</h1>
        <p className="lead" style={{ margin: '18px auto 36px' }}>
          The page you’re looking for has moved or doesn’t exist.
        </p>
        <div className="btn-row">
          <Link href="/" className="btn btn-light">
            Back to Home
          </Link>
          <Link href="/book" className="btn btn-outline">
            Book Your Stay
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
