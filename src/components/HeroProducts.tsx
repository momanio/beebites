import { useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { getFeaturedProducts } from '../lib/featuredProducts'
import { imageUrl } from '../lib/sanity'
import type { Product } from '../types/menu'
import { Icon } from './Icon'

function HeroPhoto({ product }: { product: Product }) {
  const [failedSource, setFailedSource] = useState<string>()
  const source = imageUrl(product.image, 960, 'max')
  const hasImage = source && source !== failedSource

  return (
    <div className="hero-product-photo">
      <img
        src={hasImage ? source : '/product-placeholder.svg'}
        alt={hasImage ? product.name : `صورة توضيحية مؤقتة — ${product.name}`}
        width="960"
        height="960"
        fetchPriority="high"
        decoding="async"
        draggable={false}
        onError={() => {
          if (source) setFailedSource(source)
        }}
      />
      {!hasImage && <span className="placeholder-caption">صورة المنتج قريباً</span>}
    </div>
  )
}

export function HeroProducts({ products }: { products: Product[] }) {
  const [seed] = useState(() => Math.floor(Math.random() * 0x100000000))
  const featured = useMemo(() => getFeaturedProducts(products, seed), [products, seed])
  const [selection, setSelection] = useState({ id: '', direction: 0 })
  const showcase = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const activeIndex = Math.max(0, featured.findIndex((product) => product._id === selection.id))
  const product = featured[activeIndex]

  if (!product) return null

  function isRtl() {
    return showcase.current && getComputedStyle(showcase.current).direction === 'rtl'
  }

  function select(index: number) {
    const next = (index + featured.length) % featured.length
    setSelection({
      id: featured[next]._id,
      direction: (index > activeIndex ? 1 : -1) * (isRtl() ? -1 : 1),
    })
  }

  return (
    <div
      ref={showcase}
      className="hero-showcase"
      role="region"
      aria-roledescription="عارض منتجات"
      aria-label="منتجات بي بايتس المختارة"
      tabIndex={featured.length > 1 ? 0 : undefined}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
        event.preventDefault()
        const change = (event.key === 'ArrowLeft' ? -1 : 1) * (isRtl() ? -1 : 1)
        select(activeIndex + change)
      }}
    >
      <div className="hero-slide-viewport" aria-live="polite" aria-atomic="true">
        <motion.article
          key={product._id}
          className="hero-product-slide"
          role="group"
          aria-roledescription="شريحة"
          aria-label={`${activeIndex + 1} من ${featured.length}`}
          initial={reducedMotion ? false : { opacity: 0, x: selection.direction * 36 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.25 }}
          drag={featured.length > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          dragMomentum={false}
          onDragEnd={(_event, info) => {
            if (Math.abs(info.offset.x) < 45) return
            const change = (info.offset.x > 0 ? -1 : 1) * (isRtl() ? -1 : 1)
            select(activeIndex + change)
          }}
        >
          <div className="hero-photo-card">
            <HeroPhoto product={product} />
          </div>
          <div className="hero-product-caption">
            <p className="eyebrow">
              {product.heroHighlight === 'featured'
                ? 'من اختياراتنا'
                : product.heroHighlight === 'trend'
                  ? 'رائج هالأيام'
                  : 'من مخبوزاتنا'}
            </p>
            <h2 dir="auto">{product.name}</h2>
            {product.subtitle && product.description && (
              <p className="hero-product-subtitle" dir="auto">{product.subtitle}</p>
            )}
            <p className="hero-product-description" dir="auto">
              {product.description || product.subtitle || 'مخبوزة طازجة على طلبك، لتكمّل جمعتك.'}
            </p>
          </div>
        </motion.article>
      </div>
      {featured.length > 1 && (
        <div className="hero-carousel-controls">
          <button
            type="button"
            className="hero-carousel-arrow hero-carousel-previous"
            aria-label="المنتج السابق"
            onClick={() => select(activeIndex - 1)}
          >
            <Icon name="arrow" size={20} />
          </button>
          <div className="hero-carousel-dots" role="group" aria-label="اختر منتجاً">
            {featured.map((item, index) => (
              <button
                key={item._id}
                type="button"
                aria-label={`عرض ${item.name}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                onClick={() => select(index)}
              >
                <span />
              </button>
            ))}
          </div>
          <button
            type="button"
            className="hero-carousel-arrow hero-carousel-next"
            aria-label="المنتج التالي"
            onClick={() => select(activeIndex + 1)}
          >
            <Icon name="arrow" size={20} />
          </button>
        </div>
      )}
    </div>
  )
}
