import { useMemo, useRef, useState } from 'react'
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
import { useActiveCategory } from './hooks/useActiveCategory'
import { useLanguage } from './hooks/useLanguage'
import { localizeMenu, localizeSettings } from './lib/localization'
import { useCart } from './hooks/useCart'
import { useMenu } from './hooks/useMenu'
import { useOrderNote } from './hooks/useOrderNote'
import { useSiteSettings } from './hooks/useSiteSettings'
import { ALL_CATEGORY_ID, rootCategories } from './lib/menu'
import './App.css'

function App() {
  const { language, t } = useLanguage()
  const { categories: originalCategories, products: originalProducts, loading, ready, error, retry, retryKey } = useMenu()
  const { categories, products } = useMemo(
    () => localizeMenu({ categories: originalCategories, products: originalProducts }, language),
    [originalCategories, originalProducts, language],
  )
  const allCategory = useMemo(() => ({
    _id: ALL_CATEGORY_ID,
    title: language === 'ar' ? 'الكل' : 'All',
    slug: 'all',
    order: 0,
    parentId: null,
  }), [language])
  const displayCategories = useMemo(
    () => [allCategory, ...categories],
    [allCategory, categories],
  )
  const originalSettings = useSiteSettings(retryKey)
  const settings = localizeSettings(originalSettings, language)
  const menuTitle = useRef<HTMLHeadingElement>(null)
  const [previewSelection, setPreviewSelection] = useState<{ productId: string; categoryId: string } | null>(null)
  const previewId = previewSelection?.productId
  const previewProduct = products.find(
    (product) => product._id === previewId && product.available,
  )
  const previewCategory = categories.find(
    (category) => category._id === previewSelection?.categoryId,
  ) ?? categories.find(
    (category) => category._id === previewProduct?.categoryId,
  )
  const cart = useCart(products, loading || !ready)
  const { orderNote, setOrderNote } = useOrderNote(cart.count, ready && !loading)
  const hasCart = ready && !loading && cart.count > 0
  const hasMenuContent = categories.length > 0 || products.length > 0
  const mainCategories = ready && hasMenuContent ? [allCategory, ...rootCategories(categories)] : []
  const { activeCategoryId, selectCategory } = useActiveCategory(displayCategories, ready && !loading)
  const activeCategory = displayCategories.find((category) => category._id === activeCategoryId)
  const activeMainCategoryId = activeCategory?.parentId || activeCategory?._id || mainCategories[0]?._id

  function retryMenu() {
    menuTitle.current?.focus({ preventScroll: true })
    retry()
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className={`site-shell ${hasCart ? 'has-cart' : ''}`}>
        <Seo settings={settings} />
        <a className="skip-link" href="#main">
          {t('انتقل إلى المحتوى')}
        </a>
        <Header settings={settings} count={loading || !ready ? 0 : cart.count} />
        {settings.announcement.enabled && settings.announcement.text && (
          <aside className="announcement" aria-label={t('إعلان بي بايتس')}>
            <Icon name="sparkles" size={17} />
            <p>{settings.announcement.text}</p>
            <Icon name="sparkles" size={17} />
          </aside>
        )}
        <main id="main">
          <Hero products={ready ? products : []} />
          <section
            id="menu"
            className="menu-section section-space"
            aria-labelledby="menu-title"
          >
            <div className="page-container menu-intro">
              <div>
                <p className="eyebrow">{t('اختار حلا جمعتك')}</p>
                <h2 id="menu-title" ref={menuTitle} tabIndex={-1}>
                  {t('قائمة بيي بايتس')}
                </h2>
              </div>
            </div>
            {error && (
              <div className="page-container">
                <div className="menu-notice" role="status">
                  <p>
                    {ready
                      ? t('ما قدرنا نحدّث القائمة الآن. آخر قائمة محمّلة ما زالت معروضة.')
                      : t('ما قدرنا نحمّل القائمة الآن. صندوقك محفوظ؛ جرّب مرة ثانية.')}
                  </p>
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={retryMenu}
                  >
                    {t('حاول مرة ثانية')}
                  </button>
                </div>
              </div>
            )}
            <nav
              className="category-nav"
              aria-label={t('أقسام القائمة')}
              hidden={!ready}
            >
              <div className="page-container category-nav-inner">
                {mainCategories.map((category) => (
                  <a
                    key={category._id}
                    href={`#category-${category._id}`}
                    className="category-chip"
                    aria-current={category._id === activeMainCategoryId ? 'location' : undefined}
                    onClick={() => selectCategory(category._id)}
                  >
                    <Icon name="hexagon" size={16} />
                    {category.title}
                  </a>
                ))}
                <span className="category-nav-end ms-auto">
                  {t('لقمة صغيرة، سعادة كبيرة')} <Icon name="heart" size={14} />
                </span>
              </div>
            </nav>
            <div className="page-container menu-content" aria-busy={loading}>
              {loading ? (
                <MenuSkeleton />
              ) : !ready ? null : hasMenuContent ? (
                mainCategories.map((category) => (
                  <MenuSection
                    key={category._id}
                    category={category}
                    categories={displayCategories}
                    products={products}
                    activeCategoryId={activeCategoryId}
                    onCategorySelect={selectCategory}
                    quantities={cart.quantities}
                    onQuantityChange={cart.changeQuantity}
                    onPreview={(productId, categoryId) => setPreviewSelection({ productId, categoryId })}
                  />
                ))
              ) : (
                <p className="empty-category">
                  {t('قائمتنا الجديدة بالطريق… ترقّبونا!')}
                </p>
              )}
            </div>
            <p className="menu-ending page-container">
              <Icon name="heart" size={16} />
              {t('كل خلية إلها حكاية… أي حكاية بتختار؟')}
            </p>
          </section>
          <About />
          <HowToOrder note={settings.orderNote} />
          <SocialSection settings={settings} />
        </main>
        <Footer settings={settings} />
        <ProductPreview
          product={previewProduct}
          category={previewCategory}
          quantity={cart.lines.find((line) => line.product._id === previewId)?.quantity ?? 0}
          lines={cart.lines}
          orderNote={orderNote}
          settings={settings}
          orderingDisabled={loading || !ready}
          onQuantityChange={cart.changeQuantity}
          onClose={() => setPreviewSelection(null)}
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
              ? t('{count} قطع في الصندوق، المجموع {total} دينار أردني', { count: cart.count, total: cart.total })
              : t('الصندوق فارغ')}
        </div>
        {hasCart && (
          <CartBar
            lines={cart.lines}
            orderNote={orderNote}
            onOrderNoteChange={setOrderNote}
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
