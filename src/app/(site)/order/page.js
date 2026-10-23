import OrderForm from './OrderForm'
import styles from './order.module.css'

export const metadata = {
  title: 'Place Your Order',
  description: "Order Pete's Meats for delivery – fresh, handcrafted meat products from Bentota. Cash on delivery available.",
  alternates: { canonical: '/order/' },
  robots: { index: false },
}

export default function OrderPage() {
  return (
    <section className={styles.page}>
      <div className="container">
        <div className={`heading text-center ${styles.heading}`}>
          <p className="eyebrow">Pete’s Meats</p>
          <h1 className="display h1">Place Your Order</h1>
          <p className="lead">
            Get your favourite meats delivered fresh to your doorstep. Fill in your details below and we’ll call to
            confirm your order and delivery.
          </p>
        </div>
        <OrderForm />
      </div>
    </section>
  )
}
