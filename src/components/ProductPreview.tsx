import { useEffect, useRef, useState } from 'react'
import type { Product } from '../types/menu'
import { imageUrl } from '../lib/sanity'
import { formatPrice } from '../lib/formatPrice'
import { Icon } from './Icon'

function PreviewPhoto({ product }: { product: Product }) {
  const source = imageUrl(product.image, 1280, 'max')
  const [failedSource, setFailedSource] = useState<string>()
  const [loadedSource, setLoadedSource] = useState<string>()
  const hasImage = Boolean(source && source !== failedSource)
  const loading = hasImage && loadedSource !== source

  return (
    <div className="product-preview-photo" aria-busy={loading}>
      <img
        src={hasImage ? source : '/product-placeholder.svg'}
        srcSet={
          hasImage
            ? `${imageUrl(product.image, 640, 'max')} 640w, ${source} 1280w`
            : undefined
        }
        sizes="(min-width: 700px) 440px, 90vw"
        alt={hasImage ? product.name : `صورة توضيحية مؤقتة — ${product.name}`}
        decoding="async"
        onLoad={() => setLoadedSource(source)}
        onError={() => setFailedSource(source)}
      />
      {loading && (
        <span className="product-preview-loading" role="status">
          <Icon name="wheat" size={28} />
          جارٍ تحميل الصورة…
        </span>
      )}
      {!hasImage && <span className="product-preview-placeholder">صورة المنتج قريباً</span>}
    </div>
  )
}

export function ProductPreview({
  product,
  onClose,
}: {
  product: Product | undefined
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const element = dialog.current
    if (product && !element?.open) element?.showModal()
    else if (!product && element?.open) element.close()
  }, [product])

  function close() {
    dialog.current?.close()
    onClose()
  }

  return (
    <dialog
      ref={dialog}
      className="product-preview"
      aria-labelledby="product-preview-title"
      aria-describedby="product-preview-description"
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      onClose={() => {
        if (!dialog.current?.open) onClose()
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button')
        const first = buttons[0]
        const last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (
          event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom
        ) close()
      }}
    >
      {product && (
        <>
          <div className="product-preview-header">
            <span className="product-preview-brand" lang="en">
              <Icon name="wheat" size={19} /> BeeBites
            </span>
            <button
              type="button"
              className="product-preview-close"
              aria-label="إغلاق تفاصيل المنتج"
              onClick={close}
            >
              <Icon name="close" size={20} />
            </button>
          </div>
          <div className="product-preview-layout">
            <div className="product-preview-art">
              <span className="product-preview-orbit" aria-hidden="true" />
              <PreviewPhoto key={product._id} product={product} />
              <span className="product-preview-seal" aria-hidden="true">
                <Icon name="heart" size={18} /> مخبوزة بحب
              </span>
            </div>
            <div className="product-preview-copy">
              <p className="eyebrow product-preview-eyebrow">
                <Icon name="sparkles" size={17} />
                {product.categoryTitle || 'من فرن بي بايتس'}
              </p>
              {product.comingSoon || product.badge ? (
                <span className="product-preview-badge">
                  {product.comingSoon ? 'قريباً… استنّونا' : product.badge}
                </span>
              ) : null}
              <h2 id="product-preview-title" dir="auto">
                {product.name}
              </h2>
              {product.subtitle && (
                <p className="product-preview-subtitle" dir="auto">{product.subtitle}</p>
              )}
              <div className="product-preview-divider" aria-hidden="true">
                <span />
                <Icon name="hexagon" size={16} />
                <span />
              </div>
              <p id="product-preview-description" className="product-preview-description" dir="auto">
                {product.description || 'تفاصيل هالنكهة بنشاركها معك قريباً.'}
              </p>
              <div className="product-preview-footer">
                <div className="product-preview-price">
                  <span>السعر</span>
                  <bdi>{formatPrice(product.price)}</bdi>
                </div>
                <button type="button" className="button button-chocolate" onClick={close}>
                  رجوع للقائمة <Icon name="arrow" size={18} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </dialog>
  )
}
