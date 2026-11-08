import { useState } from 'react'
import type { Product } from '../types/menu'
import { imageUrl } from '../lib/sanity'
import { MAX_QUANTITY } from '../lib/cart'
import { Icon } from './Icon'
import { PriceTag } from './PriceTag'

interface ProductCardProps {
  product: Product
  quantity: number
  onQuantityChange: (id: string, change: number) => void
}

export function ProductCard({
  product,
  quantity,
  onQuantityChange,
}: ProductCardProps) {
  const [failedSource, setFailedSource] = useState<string>()
  const source = imageUrl(product.image, 640)
  const hasImage = source && source !== failedSource
  const titleId = `product-${product._id}`
  return (
    <article
      className={`product-card ${product.comingSoon ? 'product-coming-soon' : ''} ${quantity > 0 ? 'product-selected' : ''}`}
      aria-labelledby={titleId}
    >
      <div className="product-image-wrap">
        <div className="product-hex-glow" aria-hidden="true" />
        <img
          src={hasImage ? source : '/product-placeholder.svg'}
          srcSet={
            hasImage
              ? `${imageUrl(product.image, 320)} 320w, ${source} 640w`
              : undefined
          }
          sizes="(min-width: 1200px) 220px, (min-width: 768px) 30vw, 46vw"
          alt={hasImage ? product.name : `صورة توضيحية مؤقتة — ${product.name}`}
          width="640"
          height="640"
          loading="lazy"
          decoding="async"
          onError={() => {
            if (source) setFailedSource(source)
          }}
        />
        {!hasImage && (
          <span className="placeholder-caption">صورة المنتج قريباً</span>
        )}
        {(product.badge || product.comingSoon) && (
          <span className="product-badge">{product.badge || 'قريباً'}</span>
        )}
        {quantity > 0 && (
          <span className="selected-count" aria-label={`${quantity} في سلتك`}>
            {quantity}
          </span>
        )}
        <span className="card-honey-drip" aria-hidden="true" />
      </div>
      <div className="product-copy">
        <h3 id={titleId} dir="auto">
          {product.name}
        </h3>
        <p className="product-subtitle">{product.subtitle || '\u00a0'}</p>
        {product.description && (
          <p className="product-description">{product.description}</p>
        )}
        <PriceTag price={product.price} />
        {product.comingSoon ? (
          <button className="coming-soon-button" disabled type="button">
            قريباً… استنّونا
          </button>
        ) : (
          <div
            className="quantity-control"
            role="group"
            aria-label={`كمية ${product.name}`}
          >
            <button
              type="button"
              disabled={quantity >= MAX_QUANTITY}
              aria-label={`زيادة كمية ${product.name}`}
              onClick={() => onQuantityChange(product._id, 1)}
            >
              <Icon name="plus" size={16} />
            </button>
            <button
              type="button"
              className="quantity-label"
              disabled={quantity >= MAX_QUANTITY}
              aria-label={`اطلب ${product.name}، الكمية الحالية ${quantity}`}
              onClick={() => onQuantityChange(product._id, 1)}
            >
              {quantity > 0 ? (
                <>
                  <span>{quantity}</span>
                  <span className="sr-only">في السلة</span>
                </>
              ) : (
                <>
                  اطلب
                  <Icon name="bag" size={14} />
                </>
              )}
            </button>
            <button
              type="button"
              disabled={quantity === 0}
              aria-label={`تقليل كمية ${product.name}`}
              onClick={() => onQuantityChange(product._id, -1)}
            >
              <Icon name="minus" size={16} />
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
