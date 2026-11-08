import { MotionConfig } from 'motion/react'
import { About } from './components/About'
import { CartBar } from './components/CartBar'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { HighlightRibbon } from './components/HighlightRibbon'
import { HowToOrder } from './components/HowToOrder'
import { Icon } from './components/Icon'
import { MenuSection, MenuSkeleton } from './components/MenuSection'
import { Seo } from './components/Seo'
import { SocialSection } from './components/SocialSection'
import { WhatsAppFab } from './components/WhatsAppFab'
import { useCart } from './hooks/useCart'
import { useMenu } from './hooks/useMenu'
import { useSiteSettings } from './hooks/useSiteSettings'
import './App.css'

function App() {
  const { categories, products, loading } = useMenu()
  const settings = useSiteSettings()
  const cart = useCart(products, loading)
  const hasCart = !loading && cart.count > 0

  return (
    <MotionConfig reducedMotion="user">
      <div className={`site-shell ${hasCart ? 'has-cart' : ''}`}>
        <Seo settings={settings} />
        <a className="skip-link" href="#main">
          انتقل إلى المحتوى
        </a>
        <Header settings={settings} count={loading ? 0 : cart.count} />
        {settings.announcement.enabled && settings.announcement.text && (
          <aside className="announcement" aria-label="إعلان بي بايتس">
            <Icon name="sparkles" size={17} />
            <p>{settings.announcement.text}</p>
            <Icon name="sparkles" size={17} />
          </aside>
        )}
        <main id="main">
          <Hero settings={settings} products={products} loading={loading} />
          <HighlightRibbon settings={settings} />
          <section
            id="menu"
            className="menu-section section-space"
            aria-labelledby="menu-title"
          >
            <div className="page-container menu-intro">
              <div>
                <p className="eyebrow">اختار حلا جمعتك</p>
                <h2 id="menu-title">قائمة بي بايتس</h2>
              </div>
              <p className="menu-helper">
                <Icon name="bag" size={20} />
                <span>شكّل صندوقك… والباقي علينا</span>
              </p>
            </div>
            <nav className="category-nav" aria-label="أقسام القائمة">
              <div className="page-container category-nav-inner">
                <span className="category-nav-label me-3">على ذوقك</span>
                {categories.map((category) => (
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
              ) : categories.length ? (
                categories.map((category) => (
                  <MenuSection
                    key={category._id}
                    category={category}
                    products={products.filter(
                      (product) => product.categoryId === category._id,
                    )}
                    quantities={cart.quantities}
                    onQuantityChange={cart.changeQuantity}
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
        <WhatsAppFab settings={settings} hasCart={hasCart} />
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {cart.count > 0
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
