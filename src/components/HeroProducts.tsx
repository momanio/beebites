import { useState } from 'react'
import type { Product } from '../types/menu'
import { getFeaturedProducts } from '../lib/featuredProducts'
import { formatPrice } from '../lib/formatPrice'
import { imageUrl } from '../lib/sanity'
import { Icon } from './Icon'
import { PriceTag } from './PriceTag'

function HeroProduct({
  product,
  main,
}: {
  product: Product
  main: boolean
}) {
  const source = imageUrl(product.image, main ? 960 : 480)
  const [failedSource, setFailedSource] = useState<string>()
  const hasImage = source && source !== failedSource

  return (
    <a
      className="hero-product"
      href={`#menu-product-${product._id}`}
      aria-label={`${product.name}، ${formatPrice(product.price)}، اختره من القائمة`}
    >
      <div className="hero-product-photo">
        <img
          src={hasImage ? source : '/product-placeholder.svg'}
          srcSet={
            hasImage
              ? `${imageUrl(product.image, 320)} 320w, ${source} ${main ? 960 : 480}w`
              : undefined
          }
          sizes={
            main
              ? '(min-width: 768px) 420px, 55vw'
              : '(min-width: 768px) 240px, 40vw'
          }
          width={main ? 960 : 480}
          height={main ? 960 : 480}
          alt={hasImage ? product.name : `صورة توضيحية مؤقتة — ${product.name}`}
          loading={main ? 'eager' : 'lazy'}
          fetchPriority={main ? 'high' : 'auto'}
          decoding="async"
          onError={() => setFailedSource(source)}
        />
        {!hasImage && (
          <span className="hero-photo-placeholder">صورة المنتج قريباً</span>
        )}
        {product.badge && (
          <span className="hero-product-badge">{product.badge}</span>
        )}
      </div>
      <div className="hero-product-caption">
        <span className="hero-product-name" dir="auto">
          {product.name}
        </span>
        <span className="hero-product-meta">
          <PriceTag price={product.price} />
          <Icon name="arrow" size={18} />
        </span>
      </div>
    </a>
  )
}

export function HeroProducts({
  products,
  loading,
}: {
  products: Product[]
  loading: boolean
}) {
  const featured = getFeaturedProducts(products)

  return (
    <div
      className="hero-showcase"
      role="group"
      aria-label="من قائمة بي بايتس"
      aria-busy={loading}
    >
      <div className="hero-showcase-heading">
        <span>
          <Icon name="heart" size={15} /> من الفرن… لجمعتكم
        </span>
        <span className="hero-showcase-note">حلو ومالح، على ذوقك</span>
      </div>
      {loading ? (
        <div
          className="hero-product-grid hero-product-loading"
          data-count="3"
          role="status"
        >
          <span className="sr-only">جارٍ تحميل المنتجات</span>
          {[0, 1, 2].map((index) => (
            <div
              className="hero-product skeleton-card"
              key={index}
              aria-hidden="true"
            >
              <div className="hero-product-photo" />
              <div className="hero-product-caption">
                <span className="skeleton-line" />
              </div>
            </div>
          ))}
        </div>
      ) : featured.length ? (
        <div className="hero-product-grid" data-count={featured.length}>
          {featured.map((product, index) => (
            <HeroProduct key={product._id} product={product} main={index === 0} />
          ))}
        </div>
      ) : (
        <div className="hero-products-empty">
          <Icon name="wheat" size={72} />
          <p>خلية حلوة أو مالحة… لكل جمعة نكهتها</p>
          <a className="button button-outline" href="#menu">
            اكتشف القائمة <Icon name="arrow" size={18} />
          </a>
        </div>
      )}
      {(loading || featured.length > 0) && (
        <p className="hero-showcase-hint">
          <Icon name="bag" size={15} /> اضغط على أي خلية لتختارها من القائمة
        </p>
      )}
    </div>
  )
}
