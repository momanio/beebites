import { useId, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { getFeaturedProducts } from '../lib/featuredProducts'
import { imageUrl } from '../lib/sanity'
import type { Product } from '../types/menu'
import { Icon } from './Icon'
import { useLanguage } from '../hooks/useLanguage'

type CarouselLanguage = 'ar' | 'en'

const translations = {
  ar: {
    previous: 'السابق',
    next: 'التالي',
    region: 'منتجات بي بايتس المختارة',
    carousel: 'عارض منتجات',
    slide: 'شريحة',
    of: 'من',
    choose: 'اختر منتجاً',
    view: 'عرض',
    hint: 'اسحب الصورة أو استخدم الأسهم',
    featured: 'من اختياراتنا',
    trend: 'رائج هالأيام',
    bakery: 'من مخبوزاتنا',
    description: 'مخبوزة طازجة على طلبك، لتكمّل جمعتك.',
    placeholder: 'صورة توضيحية مؤقتة',
    photoSoon: 'صورة المنتج قريباً',
  },
  en: {
    previous: 'Previous',
    next: 'Next',
    region: 'Selected BeeBites products',
    carousel: 'carousel',
    slide: 'slide',
    of: 'of',
    choose: 'Choose a product',
    view: 'View',
    hint: 'Swipe or use the arrows',
    featured: 'Our picks',
    trend: 'Trending now',
    bakery: 'From our bakery',
    description: 'Freshly baked to order, made for sharing.',
    placeholder: 'Temporary illustration',
    photoSoon: 'Product photo coming soon',
  },
} as const

function HeroPhoto({ product, language }: { product: Product; language: CarouselLanguage }) {
  const [failedSource, setFailedSource] = useState<string>()
  const source = imageUrl(product.image, 960, 'max')
  const hasImage = source && source !== failedSource
  const labels = translations[language]

  return (
    <div className="hero-product-photo">
      <img
        src={hasImage ? source : '/product-placeholder.svg'}
        alt={hasImage ? product.name : `${labels.placeholder} — ${product.name}`}
        width="960"
        height="960"
        fetchPriority="high"
        decoding="async"
        draggable={false}
        onError={() => {
          if (source) setFailedSource(source)
        }}
      />
      {!hasImage && <span className="placeholder-caption">{labels.photoSoon}</span>}
    </div>
  )
}

const arrowClasses = 'hero-carousel-arrow group relative isolate grid size-11 shrink-0 place-items-center rounded-full bg-transparent p-0 text-chocolate outline-none md:size-11 lg:size-12 hover:text-white focus-visible:text-white focus-visible:outline-2! focus-visible:outline-offset-3! focus-visible:outline-[#c98b28]! focus-visible:rounded-full! disabled:pointer-events-none disabled:opacity-40 motion-safe:transition-[transform,color] motion-safe:duration-200 motion-safe:hover:scale-[1.04] motion-safe:focus-visible:scale-[1.04] motion-safe:active:scale-[0.96]'
const arrowSurfaceClasses = 'pointer-events-none absolute inset-1 -z-10 rounded-full border border-[#d5a04b]/60 bg-[#fffaf0]/75 shadow-[0_2px_8px_#7a4a2512] backdrop-blur-md transition-colors duration-200 group-hover:border-[#bd842b] group-hover:bg-[#bd842b] group-focus-visible:border-[#bd842b] group-focus-visible:bg-[#bd842b] md:inset-0'

export function HeroProducts({ products }: { products: Product[] }) {
  const [seed] = useState(() => Math.floor(Math.random() * 0x100000000))
  const featured = useMemo(() => getFeaturedProducts(products, seed), [products, seed])
  const [selection, setSelection] = useState({ id: '', direction: 0 })
  const [hasInteracted, setHasInteracted] = useState(false)
  const showcase = useRef<HTMLDivElement>(null)
  const slideId = useId()
  const reducedMotion = useReducedMotion()
  const { language } = useLanguage()
  const labels = translations[language]
  const activeIndex = Math.max(0, featured.findIndex((product) => product._id === selection.id))
  const product = featured[activeIndex]

  if (!product) return null

  function isRtl() {
    return showcase.current && getComputedStyle(showcase.current).direction === 'rtl'
  }

  function select(index: number) {
    const next = (index + featured.length) % featured.length
    setHasInteracted(true)
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
      aria-roledescription={labels.carousel}
      aria-label={labels.region}
      tabIndex={featured.length > 1 ? 0 : undefined}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
        event.preventDefault()
        const change = (event.key === 'ArrowLeft' ? -1 : 1) * (isRtl() ? -1 : 1)
        select(activeIndex + change)
      }}
    >
      <div className="hero-slide-viewport">
        <article
          id={slideId}
          className="hero-product-slide"
          role="group"
          aria-roledescription={labels.slide}
          aria-label={`${activeIndex + 1} ${labels.of} ${featured.length}`}
        >
          <div className="hero-product-media">
            <div className="hero-image-row flex items-center gap-1 md:gap-3">
              {featured.length > 1 && (
                <button
                  type="button"
                  className={`${arrowClasses} hero-carousel-previous`}
                  aria-label={labels.previous}
                  aria-controls={slideId}
                  title={`${labels.previous}: ${featured[(activeIndex - 1 + featured.length) % featured.length].name}`}
                  onClick={() => select(activeIndex - 1)}
                >
                  <span className={arrowSurfaceClasses} />
                  <Icon name="chevron" size={20} className="[&:dir(rtl)]:rotate-180" />
                </button>
              )}
              <div className="hero-photo-card min-w-0 flex-1 overflow-hidden">
                <motion.div
                  key={product._id}
                  className="h-full w-full"
                  initial={{ opacity: 0, x: reducedMotion ? 0 : selection.direction * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: reducedMotion ? 0.15 : 0.25 }}
                  drag={featured.length > 1 ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={reducedMotion ? 0 : 0.15}
                  dragMomentum={false}
                  onPointerDown={() => setHasInteracted(true)}
                  onDragStart={() => setHasInteracted(true)}
                  onDragEnd={(_event, info) => {
                    if (Math.abs(info.offset.x) < 45) return
                    const change = (info.offset.x > 0 ? -1 : 1) * (isRtl() ? -1 : 1)
                    select(activeIndex + change)
                  }}
                >
                  <HeroPhoto product={product} language={language} />
                </motion.div>
              </div>
              {featured.length > 1 && (
                <button
                  type="button"
                  className={`${arrowClasses} hero-carousel-next`}
                  aria-label={labels.next}
                  aria-controls={slideId}
                  title={`${labels.next}: ${featured[(activeIndex + 1) % featured.length].name}`}
                  onClick={() => select(activeIndex + 1)}
                >
                  <span className={arrowSurfaceClasses} />
                  <Icon name="chevron" size={20} className="[&:dir(ltr)]:rotate-180" />
                </button>
              )}
            </div>
            {featured.length > 1 && (
              <div className="hero-carousel-controls mt-1 flex flex-col items-center">
                <div className="hero-carousel-dots flex" role="group" aria-label={labels.choose}>
                  {featured.map((item, index) => (
                    <button
                      key={item._id}
                      type="button"
                      className="group grid h-11 w-7 place-items-center rounded-full focus-visible:rounded-full! focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-[#c98b28]! md:w-8"
                      aria-label={`${labels.view} ${item.name}`}
                      aria-controls={slideId}
                      aria-current={index === activeIndex ? 'true' : undefined}
                      onClick={() => select(index)}
                    >
                      <span className={`h-1.5 rounded-full transition-[width,background-color] duration-200 ${index === activeIndex ? 'w-5 bg-[#9b6222]' : 'w-1.5 bg-[#a77b42]/35 group-hover:bg-[#9b6222]/70'}`} />
                    </button>
                  ))}
                </div>
                <motion.p
                  className="hero-carousel-hint pointer-events-none flex items-center gap-1.5 text-[10px] leading-3 text-[#8a7055]"
                  initial={false}
                  animate={{ opacity: hasInteracted ? 0 : 1 }}
                  transition={{ duration: 0.2 }}
                  aria-hidden={hasInteracted}
                >
                  <Icon name="hexagon" size={10} className="text-[#b68237]/60" />
                  {labels.hint}
                </motion.p>
              </div>
            )}
          </div>
          <div className="hero-product-caption" aria-live="polite" aria-atomic="true">
            <span className="sr-only">{activeIndex + 1} {labels.of} {featured.length}</span>
            <p className="eyebrow">
              {product.heroHighlight === 'featured'
                ? labels.featured
                : product.heroHighlight === 'trend'
                  ? labels.trend
                  : labels.bakery}
            </p>
            <h2 dir="auto">{product.name}</h2>
            {product.subtitle && product.description && (
              <p className="hero-product-subtitle" dir="auto">{product.subtitle}</p>
            )}
            <p className="hero-product-description" dir="auto">
              {product.description || product.subtitle || labels.description}
            </p>
          </div>
        </article>
      </div>
    </div>
  )
}
