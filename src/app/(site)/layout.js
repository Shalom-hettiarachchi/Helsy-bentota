import Header from '@/components/Header'
import Footer from '@/components/Footer'
import MobileBar from '@/components/MobileBar'

export default function SiteLayout({ children }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <MobileBar />
    </>
  )
}
