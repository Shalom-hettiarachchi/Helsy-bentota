'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FaWhatsapp } from 'react-icons/fa6'
import Img from '@/components/Img'
import Notice from '@/components/Notice'
import useFormSubmit from '@/hooks/useFormSubmit'
import { findProduct, products } from '@/data/products'
import { petes } from '@/data/site'
import styles from './order.module.css'

export default function OrderForm() {
  const [productId, setProductId] = useState('')

  // /order?product=<id> preselects a product
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('product')
    if (findProduct(id)) setProductId(id)
  }, [])
  const product = findProduct(productId)
  const { sending, sent, error, handleSubmit, closeNotice, formProps, fieldError } = useFormSubmit('order')

  return (
    <div className={styles.layout}>
      {/* Order summary (shown first on phones) */}
      <aside className={`panel ${styles.summary}`} aria-label="Your order">
        <p className="eyebrow">Your Order</p>
        {product ? (
          <div className={styles.item}>
            <div className={`media ${styles.thumb}`}>
              <Img src={product.image} alt="" sizes="120px" />
            </div>
            <div>
              <h2 className={styles.itemName}>{product.name}</h2>
              <p className={styles.itemPrice}>{product.price}</p>
            </div>
          </div>
        ) : (
          <p className={styles.empty}>Choose a product from the list, or browse the shop.</p>
        )}
        <ul className={styles.perks}>
          <li>Freshly made in Bentota</li>
          <li>Cash on delivery available</li>
          <li>We call to confirm every order</li>
        </ul>
        <div className={styles.summaryLinks}>
          <Link href="/products" className="link-arrow">
            ← Back to shop
          </Link>
          <a href={petes.whatsapp} target="_blank" rel="noopener noreferrer" className="link-arrow">
            <FaWhatsapp /> WhatsApp us
          </a>
        </div>
      </aside>

      <div className="panel">
        <form
          {...formProps}
          className="form-grid cols-2"
          onSubmit={(e) => handleSubmit(e, () => setProductId(''))}
        >
          <label className="field span-2">
            <span className="field-label">
              Product <span className="req">*</span>
            </span>
            <select
              className="input"
              name="product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              data-required="Please choose a product"
            >
              <option value="" disabled>
                Choose a product
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} – {p.price}
                </option>
              ))}
            </select>
            {fieldError('product')}
          </label>
          <input type="hidden" name="productName" value={product ? `${product.name} (${product.price})` : ''} />
          <label className="field span-2">
            <span className="field-label">
              Quantity <span className="req">*</span>
            </span>
            <input className="input" name="quantity" type="text" placeholder="e.g. 2 packs or 1kg" required data-required="Please tell us how much you would like" />
            {fieldError('quantity')}
          </label>
          <label className="field">
            <span className="field-label">
              First Name <span className="req">*</span>
            </span>
            <input className="input" name="firstName" type="text" placeholder="First name" autoComplete="given-name" required />
            {fieldError('firstName')}
          </label>
          <label className="field">
            <span className="field-label">
              Last Name <span className="req">*</span>
            </span>
            <input className="input" name="lastName" type="text" placeholder="Last name" autoComplete="family-name" required />
            {fieldError('lastName')}
          </label>
          <label className="field">
            <span className="field-label">
              Email <span className="req">*</span>
            </span>
            <input className="input" name="email" type="email" placeholder="example@email.com" autoComplete="email" required />
            {fieldError('email')}
          </label>
          <label className="field">
            <span className="field-label">
              Phone Number <span className="req">*</span>
            </span>
            <input className="input" name="phone" type="tel" inputMode="tel" placeholder="Mobile" autoComplete="tel" required />
            {fieldError('phone')}
          </label>
          <label className="field span-2">
            <span className="field-label">
              Street Address <span className="req">*</span>
            </span>
            <input className="input" name="address" type="text" placeholder="House number and street" autoComplete="street-address" required />
            {fieldError('address')}
          </label>
          <label className="field">
            <span className="field-label">
              City <span className="req">*</span>
            </span>
            <input className="input" name="city" type="text" placeholder="City" autoComplete="address-level2" required />
            {fieldError('city')}
          </label>
          <label className="field">
            <span className="field-label">Postal Code</span>
            <input className="input" name="postalCode" type="text" inputMode="numeric" placeholder="e.g. 80500" autoComplete="postal-code" />
            {fieldError('postalCode')}
          </label>
          <label className="checkbox span-2">
            <input type="checkbox" name="cashOnDelivery" value="yes" defaultChecked />
            Cash on Delivery
          </label>
          <div className="span-2">
            <button className="btn btn-light btn-block" type="submit" disabled={sending}>
              {sending ? 'Sending…' : 'Place Order'}
            </button>
          </div>
          {error && <p className="form-error span-2">{error}</p>}
        </form>
      </div>

      {sent && (
        <Notice
          title="Order sent"
          message="Thank you! Pete's Meats will call you to confirm your order and delivery."
          onClose={closeNotice}
        />
      )}
    </div>
  )
}
