import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from 'motion/react'
import type { Product } from '../types/menu'
import { getFeaturedProducts } from '../lib/featuredProducts'
import { formatPrice } from '../lib/formatPrice'
import { imageUrl } from '../lib/sanity'
import { Icon } from './Icon'

function ProductPhoto({
  product,
  main = false,
}: {
  product: Product
  main?: boolean
}) {
  const source = imageUrl(product.image, main ? 960 : 320)
  const [failedSource, setFailedSource] = useState<string>()
  const hasImage = source && source !== failedSource

  return (
    <div className="hero-product-photo">
      <img
        src={hasImage ? source : '/product-placeholder.svg'}
        srcSet={
          hasImage && main
            ? `${imageUrl(product.image, 480)} 480w, ${source} 960w`
            : undefined
        }
        sizes={main ? '(min-width: 768px) 400px, 85vw' : '160px'}
        width={main ? 960 : 320}
        height={main ? 960 : 320}
        alt={hasImage ? product.name : `صورة توضيحية مؤقتة — ${product.name}`}
        loading={main ? 'eager' : 'lazy'}
        fetchPriority={main ? 'high' : 'auto'}
        decoding="async"
        onError={() => setFailedSource(source)}
      />
      {!hasImage && (
        <span className="hero-photo-placeholder">صورة المنتج قريباً</span>
      )}
    </div>
  )
}

export function HeroProducts({
  products,
  loading,
  unavailable,
  onRetry,
}: {
  products: Product[]
  loading: boolean
  unavailable: boolean
  onRetry: () => void
}) {
  const [seed] = useState(() => Math.floor(Math.random() * 0x100000000))
  const featured = useMemo(
    () => (loading ? [] : getFeaturedProducts(products, seed)),
    [products, loading, seed],
  )
  const [activeId, setActiveId] = useState<string | null>(null)
  const [direction, setDirection] = useState(1)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [pageVisible, setPageVisible] = useState(() => !document.hidden)
  const root = useRef<HTMLDivElement>(null)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const inView = useInView(root, { amount: 0.3 })
  const reducedMotion = useReducedMotion()
  const activeIndex = Math.max(
    0,
    featured.findIndex((product) => product._id === activeId),
  )
  const active = featured[activeIndex]
  const slideIds = featured.map((product) => product._id).join(',')
  const canRotate =
    featured.length > 1 &&
    !reducedMotion &&
    !paused &&
    !hovered &&
    !focused &&
    inView &&
    pageVisible

  useEffect(() => {
    const onVisibilityChange = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  useEffect(() => {
    if (!canRotate) return
    const ids = slideIds.split(',')
    const currentIndex = Math.max(0, ids.indexOf(activeId ?? ids[0]))
    const timer = window.setTimeout(() => {
      setDirection(1)
      setActiveId(ids[(currentIndex + 1) % ids.length])
    }, 5500)
    return () => window.clearTimeout(timer)
  }, [activeId, slideIds, canRotate])

  function move(step: number) {
    if (featured.length < 2) return
    setDirection(step)
    setActiveId(
      featured[(activeIndex + step + featured.length) % featured.length]._id,
    )
  }

  return (
    <div
      ref={root}
      className="hero-showcase"
      role="region"
      aria-roledescription="عارض منتجات"
      aria-label="اختار خلية على ذوقك"
      aria-busy={loading}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setHovered(true)
      }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false)
      }}
      onKeyDown={(event) => {
        if (featured.length < 2) return
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
        event.preventDefault()
        const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
        const step = (event.key === 'ArrowLeft') === rtl ? 1 : -1
        move(step)
      }}
    >
      <div className="hero-showcase-heading">
        <span>
          <Icon name="sparkles" size={18} /> شو نفسك اليوم؟
        </span>
        <span className="hero-showcase-note">كل لفّة… نكهة بتحبّها</span>
      </div>
      {loading ? (
        <div
          className="hero-carousel-stage hero-carousel-loading"
          role="status"
        >
          <span className="sr-only">جارٍ تحميل المنتجات</span>
          <div className="hero-product-main skeleton-card" aria-hidden="true">
            <div className="hero-product-photo" />
            <div className="hero-product-caption">
              <span className="skeleton-line" />
              <span className="skeleton-line" />
            </div>
          </div>
        </div>
      ) : active ? (
        <>
          <div
            className="hero-carousel-stage"
            onPointerDown={(event) => {
              if (event.pointerType === 'mouse') return
              touch.current = { x: event.clientX, y: event.clientY }
            }}
            onPointerCancel={() => {
              touch.current = null
            }}
            onPointerUp={(event) => {
              const start = touch.current
              touch.current = null
              if (!start) return
              const deltaX = event.clientX - start.x
              const deltaY = event.clientY - start.y
              if (
                Math.abs(deltaX) < 45 ||
                Math.abs(deltaX) < Math.abs(deltaY) * 1.4
              )
                return
              const rtl =
                getComputedStyle(event.currentTarget).direction === 'rtl'
              move(deltaX > 0 === rtl ? 1 : -1)
            }}
          >
            <span className="hero-carousel-stamp" aria-hidden="true">
              <Icon name="wheat" size={23} />
              <span>
                مخبوزة
                <br />
                على طلبك
              </span>
            </span>
            {featured.length > 1 &&
              [-1, 1].map((step) => {
                const product =
                  featured[
                    (activeIndex + step + featured.length) % featured.length
                  ]
                // With two products, one neighboring card is enough.
                if (featured.length === 2 && step === -1) return null
                return (
                  <div
                    key={step}
                    className={`hero-peek ${step === -1 ? 'hero-peek-previous' : 'hero-peek-next'}`}
                  >
                    <ProductPhoto key={product._id} product={product} />
                    <span className="hero-peek-name" dir="auto">
                      {product.name}
                    </span>
                  </div>
                )
              })}
            <AnimatePresence initial={false} mode="wait" custom={direction}>
              <motion.article
                key={active._id}
                className="hero-product-main"
                role="group"
                aria-roledescription="شريحة"
                aria-label={`${activeIndex + 1} من ${featured.length}`}
                custom={direction}
                variants={{
                  enter: (step: number) => ({
                    opacity: 0,
                    x: step * 28,
                    rotate: step * 2,
                    scale: 0.97,
                  }),
                  center: { opacity: 1, x: 0, rotate: 0, scale: 1 },
                  exit: (step: number) => ({
                    opacity: 0,
                    x: step * -20,
                    rotate: step * -2,
                    scale: 0.97,
                  }),
                }}
                initial={reducedMotion ? false : 'enter'}
                animate="center"
                exit={reducedMotion ? undefined : 'exit'}
                transition={{
                  duration: reducedMotion ? 0 : 0.24,
                  ease: 'easeOut',
                }}
              >
                <div className="hero-product-image">
                  <ProductPhoto product={active} main />
                  <span className="hero-product-flavor">
                    <Icon name="heart" size={13} />{' '}
                    {active.categoryTitle || 'على ذوقك'}
                  </span>
                  {active.badge && (
                    <span className="hero-product-badge">{active.badge}</span>
                  )}
                </div>
                <div className="hero-product-caption">
                  <div
                    className="hero-product-title-row"
                    aria-live={canRotate ? 'off' : 'polite'}
                  >
                    <span
                      className="hero-product-name"
                      dir="auto"
                    >
                      {active.name}
                    </span>
                    <span className="hero-product-price" dir="ltr">
                      {formatPrice(active.price)}
                    </span>
                  </div>
                  <p className="hero-product-subtitle">
                    {active.subtitle || 'خلية صغيرة… سعادة كبيرة'}
                  </p>
                </div>
              </motion.article>
            </AnimatePresence>
          </div>
          {featured.length > 1 && (
            <div className="hero-carousel-controls">
              <button
                type="button"
                className="hero-carousel-arrow hero-carousel-previous"
                onClick={() => move(-1)}
                aria-label="المنتج السابق"
              >
                <Icon name="arrow" size={19} />
              </button>
              <span className="hero-carousel-count" dir="ltr" aria-live="off">
                <b>{String(activeIndex + 1).padStart(2, '0')}</b>
                <span> / {String(featured.length).padStart(2, '0')}</span>
              </span>
              <div className="hero-carousel-progress" aria-hidden="true">
                <span
                  style={{
                    width: `${((activeIndex + 1) / featured.length) * 100}%`,
                  }}
                />
              </div>
              {!reducedMotion && (
                <button
                  type="button"
                  className="hero-carousel-play"
                  onClick={() => setPaused(!paused)}
                  aria-label={
                    paused ? 'تشغيل عرض المنتجات' : 'إيقاف عرض المنتجات مؤقتاً'
                  }
                  aria-pressed={paused}
                >
                  <Icon name={paused ? 'play' : 'pause'} size={15} />
                </button>
              )}
              <button
                type="button"
                className="hero-carousel-arrow"
                onClick={() => move(1)}
                aria-label="المنتج التالي"
              >
                <Icon name="arrow" size={19} />
              </button>
            </div>
          )}
          <p className="hero-showcase-hint">
            <Icon name="heart" size={13} /> اختار اللي بتحبّه… وإحنا نخبزه إلك
          </p>
        </>
      ) : (
        <div className="hero-products-empty">
          <Icon name="wheat" size={72} />
          <p>
            {unavailable
              ? 'ما قدرنا نحمّل المنتجات حالياً.'
              : 'خلية حلوة أو مالحة… لكل جمعة نكهتها'}
          </p>
          {unavailable ? (
            <button
              className="button button-outline"
              type="button"
              onClick={onRetry}
            >
              حاول مرة ثانية
            </button>
          ) : (
            <a className="button button-outline" href="#menu">
              اكتشف القائمة <Icon name="arrow" size={18} />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
