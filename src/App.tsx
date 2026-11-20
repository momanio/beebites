import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import { MotionConfig } from 'motion/react'
import { About } from './components/About'
import { CartBar } from './components/CartBar'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { HowToOrder } from './components/HowToOrder'
import { Icon } from './components/Icon'
import { MenuSection, MenuSkeleton, ProductGrid } from './components/MenuSection'
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

const allItemsPath = '/menu/'

function isAllItemsPath(pathname: string) {
  return pathname === allItemsPath || `${pathname}/` === allItemsPath
}

function App() {
  const { language, t } = useLanguage()
  const [allItemsPage, setAllItemsPage] = useState(() => isAllItemsPath(window.location.pathname))
  const { categories: originalCategories, products: originalProducts, loading, ready, error, retry, retryKey } = useMenu()
  const { categories, products } = useMemo(
    () => localizeMenu({ categories: originalCategories, products: originalProducts }, language),
    [originalCategories, originalProducts, language],
  )
  const originalSettings = useSiteSettings(retryKey)
  const settings = localizeSettings(originalSettings, language)
  const menuTitle = useRef<HTMLHeadingElement>(null)
  const allItemsLink = useRef<HTMLAnchorElement>(null)
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
  const mainCategories = ready ? rootCategories(categories) : []
  const { activeCategoryId, selectCategory } = useActiveCategory(categories, !allItemsPage && ready && !loading)
  const activeCategory = categories.find((category) => category._id === activeCategoryId)
  const activeMainCategoryId = activeCategory?.parentId || activeCategory?._id || mainCategories[0]?._id
  const MenuHeading = allItemsPage ? 'h1' : 'h2'
  const allItemsTitle = t('كل المنتجات')

  useEffect(() => {
    function restorePage() {
      const nextPage = isAllItemsPath(window.location.pathname)
      if (nextPage === allItemsPage) return
      // Render the destination before the browser restores its scroll position.
      flushSync(() => {
        setAllItemsPage(nextPage)
        setPreviewSelection(null)
      })
      if (nextPage) menuTitle.current?.focus({ preventScroll: true })
      else allItemsLink.current?.focus({ preventScroll: true })
    }

    window.addEventListener('popstate', restorePage)
    return () => window.removeEventListener('popstate', restorePage)
  }, [allItemsPage])

  function navigateMenuPage(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return

    event.preventDefault()
    const destination = new URL(event.currentTarget.href)
    window.history.pushState(null, '', destination)
    flushSync(() => setAllItemsPage(isAllItemsPath(destination.pathname)))

    const section = document.getElementById(destination.hash.slice(1))
    if (section) section.scrollIntoView({ behavior: 'instant' })
    else window.scrollTo({ top: 0, behavior: 'instant' })
    if (!section || section.id === 'menu') {
      menuTitle.current?.focus({ preventScroll: true })
    } else {
      section.tabIndex = -1
      section.focus({ preventScroll: true })
    }
  }

  function previewMenuProduct(productId: string, categoryId: string) {
    setPreviewSelection({ productId, categoryId })
  }

  function retryMenu() {
    menuTitle.current?.focus({ preventScroll: true })
    retry()
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className={`site-shell ${hasCart ? 'has-cart' : ''}`}>
        <Seo settings={settings} pageTitle={allItemsPage ? allItemsTitle : undefined} />
        <a className="skip-link" href="#main">
          {t('انتقل إلى المحتوى')}
        </a>
        <Header
          settings={settings}
          count={loading || !ready ? 0 : cart.count}
          onHomeNavigate={allItemsPage ? navigateMenuPage : undefined}
        />
        {settings.announcement.enabled && settings.announcement.text && (
          <aside className="announcement" aria-label={t('إعلان بي بايتس')}>
            <Icon name="sparkles" size={17} />
            <p>{settings.announcement.text}</p>
            <Icon name="sparkles" size={17} />
          </aside>
        )}
        <main id="main">
          {!allItemsPage && <Hero products={ready ? products : []} />}
          <section
            id="menu"
            className="menu-section section-space"
            aria-labelledby="menu-title"
          >
            <div className={`page-container menu-intro${allItemsPage ? ' all-items-intro' : ''}`}>
              <div>
                {!allItemsPage && <p className="eyebrow">{t('اختار حلا جمعتك')}</p>}
                <MenuHeading id="menu-title" ref={menuTitle} tabIndex={-1}>
                  {allItemsPage ? allItemsTitle : t('قائمة بيي بايتس')}
                </MenuHeading>
              </div>
              {allItemsPage && (
                <a className="button button-outline" href="/#menu" onClick={navigateMenuPage}>
                  {t('الرجوع للأقسام')}
                </a>
              )}
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
            {!allItemsPage && (
              <nav className="category-nav" aria-label={t('أقسام القائمة')} hidden={!ready}>
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
                  {hasMenuContent && (
                    <a ref={allItemsLink} className="category-chip" href={allItemsPath} onClick={navigateMenuPage}>
                      <Icon name="hexagon" size={16} />
                      {t('الكل')}
                    </a>
                  )}
                  <span className="category-nav-end ms-auto">
                    {t('لقمة صغيرة، سعادة كبيرة')} <Icon name="heart" size={14} />
                  </span>
                </div>
              </nav>
            )}
            <div className="page-container menu-content" aria-busy={loading}>
              {loading ? (
                <MenuSkeleton />
              ) : !ready ? null : allItemsPage && products.length > 0 ? (
                <ProductGrid
                  products={products}
                  categoryId={ALL_CATEGORY_ID}
                  quantities={cart.quantities}
                  onQuantityChange={cart.changeQuantity}
                  onPreview={previewMenuProduct}
                />
              ) : !allItemsPage && hasMenuContent ? (
                mainCategories.map((category) => (
                  <MenuSection
                    key={category._id}
                    category={category}
                    categories={categories}
                    products={products}
                    activeCategoryId={activeCategoryId}
                    onCategorySelect={selectCategory}
                    quantities={cart.quantities}
                    onQuantityChange={cart.changeQuantity}
                    onPreview={previewMenuProduct}
                  />
                ))
              ) : (
                <p className="empty-category">
                  {t('قائمتنا الجديدة بالطريق… ترقّبونا!')}
                </p>
              )}
            </div>
            {!allItemsPage && (
              <p className="menu-ending page-container">
                <Icon name="heart" size={16} />
                {t('كل خلية إلها حكاية… أي حكاية بتختار؟')}
              </p>
            )}
          </section>
          {!allItemsPage && (
            <>
              <About />
              <HowToOrder note={settings.orderNote} />
              <SocialSection settings={settings} />
            </>
          )}
        </main>
        <Footer settings={settings} backToTopHref={allItemsPage ? '#main' : '#home'} />
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
