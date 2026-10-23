'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import Img from './Img'
import styles from './Gallery.module.css'

// Swipeable photo strip with snap scrolling, plus arrow buttons on larger screens.
export default function Gallery({ images, label = 'Photo gallery' }) {
  const track = useRef(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const update = useCallback(() => {
    const el = track.current
    if (!el) return
    setAtStart(el.scrollLeft < 8)
    setAtEnd(el.scrollLeft + el.clientWidth > el.scrollWidth - 8)
  }, [])

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update])

  const scrollBy = (dir) => {
    const el = track.current
    el?.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <div className={styles.wrap} role="region" aria-label={label}>
      <div className={styles.track} ref={track} onScroll={update} tabIndex={0}>
        {images.map((img) => (
          <figure key={img.src} className={styles.item}>
            <Img src={img.src} alt={img.alt} sizes="(max-width: 768px) 85vw, 50vw" />
          </figure>
        ))}
      </div>
      <div className={styles.controls}>
        <button type="button" onClick={() => scrollBy(-1)} disabled={atStart} aria-label="Previous photos">
          <FiArrowLeft />
        </button>
        <button type="button" onClick={() => scrollBy(1)} disabled={atEnd} aria-label="Next photos">
          <FiArrowRight />
        </button>
      </div>
    </div>
  )
}
