import type { Category, Product } from '../types/menu'
import type { Quantities } from '../lib/cart'
import { ProductCard } from './ProductCard'
import { Reveal } from './Reveal'
import { SectionTitle } from './SectionTitle'

export function MenuSection({
  category,
  products,
  quantities,
  onQuantityChange,
}: {
  category: Category
  products: Product[]
  quantities: Quantities
  onQuantityChange: (id: string, change: number) => void
}) {
  return (
    <section
      id={`category-${category._id}`}
      className="category-section"
      aria-labelledby={`title-${category._id}`}
    >
      <SectionTitle title={category.title} id={`title-${category._id}`} />
      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-6 xl:grid-cols-5">
          {products.map((product, index) => (
            <Reveal key={product._id} delay={(index % 5) * 0.04}>
              <ProductCard
                product={product}
                quantity={quantities[product._id] ?? 0}
                onQuantityChange={onQuantityChange}
              />
            </Reveal>
          ))}
        </div>
      ) : (
        <p className="empty-category">مذاقات جديدة بالطريق… ترقّبوا جديدنا!</p>
      )}
    </section>
  )
}

export function MenuSkeleton() {
  return (
    <div role="status" aria-label="جارٍ تحميل القائمة">
      <span className="sr-only">جارٍ تحميل القائمة</span>
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
