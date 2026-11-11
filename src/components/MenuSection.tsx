import { useLanguage } from '../hooks/useLanguage'
import type { Category, Product } from '../types/menu'
import type { Quantities } from '../lib/cart'
import { ProductCard } from './ProductCard'
import { Reveal } from './Reveal'
import { SectionTitle } from './SectionTitle'

export function MenuSection({
  category,
  categories,
  products,
  activeCategoryId,
  onCategorySelect,
  quantities,
  onQuantityChange,
  onPreview,
  subcategory = false,
}: {
  category: Category
  categories: Category[]
  products: Product[]
  activeCategoryId: string | null
  onCategorySelect: (id: string) => void
  quantities: Quantities
  onQuantityChange: (id: string, change: number) => void
  onPreview: (id: string) => void
  subcategory?: boolean
}) {
  const { t } = useLanguage()
  const children = subcategory
    ? []
    : categories.filter((item) => item.parentId === category._id)
  const categoryProducts = products.filter(
    (product) => product.categoryId === category._id,
  )
  return (
    <section
      id={`category-${category._id}`}
      className={`category-section${subcategory ? ' subcategory-section' : ''}`}
      aria-labelledby={`title-${category._id}`}
    >
      {subcategory ? (
        <h3 className="subcategory-title" id={`title-${category._id}`}>
          <span />
          {category.title}
          <span />
        </h3>
      ) : (
        <SectionTitle title={category.title} id={`title-${category._id}`} />
      )}
      {children.length > 0 && (
        <nav className="subcategory-nav" aria-label={t('أقسام {name}', { name: category.title })}>
          {children.map((child) => (
            <a
              className="category-chip"
              key={child._id}
              href={`#category-${child._id}`}
              aria-current={child._id === activeCategoryId ? 'location' : undefined}
              onClick={() => onCategorySelect(child._id)}
            >
              {child.title}
            </a>
          ))}
        </nav>
      )}
      {categoryProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-6 xl:grid-cols-5">
          {categoryProducts.map((product, index) => (
            <Reveal key={product._id} delay={(index % 5) * 0.04}>
              <ProductCard
                product={product}
                quantity={quantities[product._id] ?? 0}
                onQuantityChange={onQuantityChange}
                onPreview={onPreview}
              />
            </Reveal>
          ))}
        </div>
      ) : children.length === 0 ? (
        <p className="empty-category">{t('مذاقات جديدة بالطريق… ترقّبوا جديدنا!')}</p>
      ) : null}
      {children.map((child) => (
        <MenuSection
          key={child._id}
          category={child}
          categories={categories}
          products={products}
          activeCategoryId={activeCategoryId}
          onCategorySelect={onCategorySelect}
          quantities={quantities}
          onQuantityChange={onQuantityChange}
          onPreview={onPreview}
          subcategory
        />
      ))}
    </section>
  )
}

export function MenuSkeleton() {
  const { t } = useLanguage()
  return (
    <div role="status" aria-label={t('جارٍ تحميل القائمة')}>
      <span className="sr-only">{t('جارٍ تحميل القائمة')}</span>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, index) => (
          <div className="skeleton-card" key={index} aria-hidden="true">
            <div className="skeleton-image" />
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        ))}
      </div>
    </div>
  )
}
