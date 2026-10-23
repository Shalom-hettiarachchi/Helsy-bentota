import Image from 'next/image'
import dims from '@/data/image-sizes.json'

// next/image with the real width/height filled in from image-sizes.json,
// so every image gets responsive sizes, modern formats and no layout shift.
// Use `fill` for images that cover their parent (banners, backgrounds).
export default function Img({ src, alt, sizes = '100vw', fill = false, ...rest }) {
  if (fill) return <Image src={src} alt={alt} fill sizes={sizes} {...rest} />

  const size = dims[src]
  if (!size) throw new Error(`Img: no size recorded for ${src}. Re-run the image-sizes script.`)
  return <Image src={src} alt={alt} width={size[0]} height={size[1]} sizes={sizes} {...rest} />
}
