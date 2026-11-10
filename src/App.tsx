import { useRef, useState } from 'react'
import { MotionConfig } from 'motion/react'
import { About } from './components/About'
import { CartBar } from './components/CartBar'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { HowToOrder } from './components/HowToOrder'
import { Icon } from './components/Icon'
import { MenuSection, MenuSkeleton } from './components/MenuSection'
import { ProductPreview } from './components/ProductPreview'
import { Seo } from './components/Seo'
import { SocialSection } from './components/SocialSection'
import { WhatsAppFab } from './components/WhatsAppFab'
import { useCart } from './hooks/useCart'
import { useMenu } from './hooks/useMenu'
import { useSiteSettings } from './hooks/useSiteSettings'
import { rootCategories } from './lib/menu'
import './App.css'

function App() {
  const { categories, products, loading, ready, error, retry, retryKey } = useMenu()
  const settings = useSiteSettings(retryKey)
  const menuTitle = useRef<HTMLHeadingElement>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const previewProduct = products.find(
    (product) => product._id === previewId && product.available,
  )
  const cart = useCart(products, loading || !ready)
  const hasCart = ready && !loading && cart.count > 0
  const mainCategories = ready ? rootCategories(categories) : []

  function retryMenu() {
    menuTitle.current?.focus({ preventScroll: true })
    retry()
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className={`site-shell ${hasCart ? 'has-cart' : ''}`}>
        <Seo settings={settings} />
        <a className="skip-link" href="#main">
          انتقل إلى المحتوى
        </a>
        <Header settings={settings} count={loading || !ready ? 0 : cart.count} />
        {settings.announcement.enabled && settings.announcement.text && (
          <aside className="announcement" aria-label="إعلان بي بايتس">
            <Icon name="sparkles" size={17} />
            <p>{settings.announcement.text}</p>
            <Icon name="sparkles" size={17} />
          </aside>
        )}
        <main id="main">
          <Hero />
          <section
            id="menu"
            className="menu-section section-space"
            aria-labelledby="menu-title"
          >
            <div className="page-container menu-intro">
              <div>
                <p className="eyebrow">اختار حلا جمعتك</p>
                <h2 id="menu-title" ref={menuTitle} tabIndex={-1}>
                  قائمة بي بايتس
                </h2>
              </div>
              <p className="menu-helper">
                <Icon name="bag" size={20} />
                <span>شكّل صندوقك… والباقي علينا</span>
              </p>
            </div>
            {error && (
              <div className="page-container">
                <div className="menu-notice" role="status">
                  <p>
                    {ready
                      ? 'ما قدرنا نحدّث القائمة الآن. آخر قائمة محمّلة ما زالت معروضة.'
                      : 'ما قدرنا نحمّل القائمة الآن. صندوقك محفوظ؛ جرّب مرة ثانية.'}
                  </p>
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={retryMenu}
                  >
                    حاول مرة ثانية
                  </button>
                </div>
              </div>
            )}
            <nav
              className="category-nav"
              aria-label="أقسام القائمة"
              hidden={!ready}
            >
              <div className="page-container category-nav-inner">
                {mainCategories.map((category) => (
                  <a
                    key={category._id}
                    href={`#category-${category._id}`}
                    className="category-chip"
                  >
                    <Icon name="hexagon" size={16} />
                    {category.title}
                  </a>
                ))}
                <span className="category-nav-end ms-auto">
                  لقمة صغيرة، سعادة كبيرة <Icon name="heart" size={14} />
                </span>
              </div>
            </nav>
            <div className="page-container menu-content" aria-busy={loading}>
              {loading ? (
                <MenuSkeleton />
              ) : !ready ? null : categories.length ? (
                mainCategories.map((category) => (
                  <MenuSection
                    key={category._id}
                    category={category}
                    categories={categories}
                    products={products}
                    quantities={cart.quantities}
                    onQuantityChange={cart.changeQuantity}
                    onPreview={setPreviewId}
                  />
                ))
              ) : (
                <p className="empty-category">
                  قائمتنا الجديدة بالطريق… ترقّبونا!
                </p>
              )}
            </div>
            <p className="menu-ending page-container">
              <Icon name="heart" size={16} />
              كل خلية إلها حكاية… أي حكاية بتختار؟
            </p>
          </section>
          <About />
          <HowToOrder note={settings.orderNote} />
          <SocialSection settings={settings} />
        </main>
        <Footer settings={settings} />
        <ProductPreview
          product={previewProduct}
          quantity={cart.lines.find((line) => line.product._id === previewId)?.quantity ?? 0}
          lines={cart.lines}
          settings={settings}
          orderingDisabled={loading || !ready}
          onQuantityChange={cart.changeQuantity}
          onClose={() => setPreviewId(null)}
        />
        <WhatsAppFab settings={settings} hasCart={hasCart} />
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {!ready || loading
            ? ''
            : cart.count > 0
              ? `${cart.count} قطع في الصندوق، المجموع ${cart.total} دينار أردني`
              : 'الصندوق فارغ'}
        </div>
        {hasCart && (
          <CartBar
            lines={cart.lines}
            count={cart.count}
            total={cart.total}
            settings={settings}
            onQuantityChange={cart.changeQuantity}
            onClear={cart.clearCart}
          />
        )}
      </div>
    </MotionConfig>
  )
}

export default App
