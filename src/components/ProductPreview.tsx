import { useLanguage } from '../hooks/useLanguage'
import { useEffect, useRef, useState } from 'react'
import type { CartLine, Product, SiteSettings } from '../types/menu'
import { MAX_QUANTITY } from '../lib/cart'
import { imageUrl } from '../lib/sanity'
import { formatPrice } from '../lib/formatPrice'
import { buildOrderMessage } from '../lib/whatsapp'
import { Icon } from './Icon'
import { WhatsAppLink } from './WhatsAppLink'

function PreviewPhoto({ product }: { product: Product }) {
  const { t } = useLanguage()
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
        alt={hasImage ? product.name : t('صورة توضيحية مؤقتة — {name}', { name: product.name })}
        decoding="async"
        onLoad={() => setLoadedSource(source)}
        onError={() => setFailedSource(source)}
      />
      {loading && (
        <span className="product-preview-loading" role="status">
          <Icon name="wheat" size={28} />
          {t('جارٍ تحميل الصورة…')}
        </span>
      )}
      {!hasImage && <span className="product-preview-placeholder">{t('صورة المنتج قريباً')}</span>}
    </div>
  )
}

export function ProductPreview({
  product,
  quantity,
  lines,
  settings,
  orderingDisabled,
  onQuantityChange,
  onClose,
}: {
  product: Product | undefined
  quantity: number
  lines: CartLine[]
  settings: SiteSettings
  orderingDisabled: boolean
  onQuantityChange: (id: string, change: number) => void
  onClose: () => void
}) {
  const { t, language } = useLanguage()
  const dialog = useRef<HTMLDialogElement>(null)
  const increase = useRef<HTMLButtonElement>(null)

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
        const controls = event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href]',
        )
        const first = controls[0]
        const last = controls[controls.length - 1]
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
              aria-label={t('إغلاق تفاصيل المنتج')}
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
                <Icon name="heart" size={18} /> {t('مخبوزة بحب')}
              </span>
            </div>
            <div className="product-preview-copy">
              <p className="eyebrow product-preview-eyebrow">
                <Icon name="sparkles" size={17} />
                {product.categoryTitle || t('من فرن بي بايتس')}
              </p>
              {product.comingSoon || product.badge ? (
                <span className="product-preview-badge">
                  {product.comingSoon ? t('قريباً… استنّونا') : product.badge}
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
                {product.description || t('تفاصيل هالنكهة بنشاركها معك قريباً.')}
              </p>
              <div className="product-preview-footer">
                <div className="product-preview-price">
                  <span>{t('السعر')}</span>
                  <bdi>{formatPrice(product.price)}</bdi>
                </div>
                {!product.comingSoon && (
                  <div
                    className="quantity-control product-preview-quantity"
                    role="group"
                    aria-label={t('كمية {name} في الصندوق', { name: product.name })}
                  >
                    <button
                      ref={increase}
                      type="button"
                      disabled={orderingDisabled || quantity >= MAX_QUANTITY}
                      aria-label={t('زيادة كمية {name} في التفاصيل', { name: product.name })}
                      onClick={() => onQuantityChange(product._id, 1)}
                    >
                      <Icon name="plus" size={18} />
                    </button>
                    <output aria-live="polite" aria-atomic="true">
                      {quantity}
                      <span className="sr-only">{t(' في الصندوق')}</span>
                    </output>
                    <button
                      type="button"
                      disabled={orderingDisabled || quantity === 0}
                      aria-label={t('تقليل كمية {name} في التفاصيل', { name: product.name })}
                      onClick={() => onQuantityChange(product._id, -1)}
                    >
                      <Icon name="minus" size={18} />
                    </button>
                  </div>
                )}
                {!product.comingSoon && quantity > 0 && (
                  <p className="product-preview-line-total">
                    <span>{t('{count} في صندوقك · مجموع الصنف', { count: quantity })}</span>
                    <bdi>{formatPrice(product.price * quantity)}</bdi>
                  </p>
                )}
                <div className="product-preview-actions">
                  {product.comingSoon ? (
                    <button type="button" className="button button-chocolate" disabled>
                      {t('قريباً… استنّونا')}
                    </button>
                  ) : quantity > 0 ? (
                    <WhatsAppLink
                      settings={settings}
                      message={buildOrderMessage(lines, language)}
                      className="button button-chocolate product-preview-send"
                    >
                      <Icon name="whatsapp" size={18} />
                      {t('أرسل الطلب عبر واتساب')}
                    </WhatsAppLink>
                  ) : (
                    <button
                      type="button"
                      className="button button-chocolate product-preview-add"
                      disabled={orderingDisabled}
                      onClick={() => {
                        onQuantityChange(product._id, 1)
                        increase.current?.focus()
                      }}
                    >
                      <Icon name="bag" size={18} />
                      {t('أضف إلى الصندوق')}
                    </button>
                  )}
                  <button type="button" className="button button-outline" onClick={close}>
                    {t('رجوع للقائمة')} <Icon name="arrow" size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </dialog>
  )
}
