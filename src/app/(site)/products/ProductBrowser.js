'use client'

import { useState } from 'react'
import ProductCard from '@/components/ProductCard'
import { categories, products } from '@/data/products'
import styles from './products.module.css'

// Category chips + product grid for the shop.
export default function ProductBrowser() {
  const [active, setActive] = useState('all')
  const shown = active === 'all' ? products : products.filter((p) => p.category === active)
  const chips = [{ id: 'all', label: 'All' }, ...categories]

  return (
    <>
      <div className={styles.chips} role="group" aria-label="Filter products">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`${styles.chip} ${active === c.id ? styles.chipActive : ''}`}
            aria-pressed={active === c.id}
            onClick={() => setActive(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <p className={styles.count} aria-live="polite">
        {shown.length} {shown.length === 1 ? 'product' : 'products'}
      </p>

      <div className={styles.grid}>
        {shown.map((p) => (
          <ProductCard key={p.id} product={p} shop />
        ))}
      </div>
    </>
  )
}
