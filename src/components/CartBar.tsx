import { useLanguage } from '../hooks/useLanguage'
import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { CartLine, Product, SiteSettings } from '../types/menu'
import { MAX_QUANTITY, ORDER_NOTE_MAX_LENGTH } from '../lib/cart'
import { formatPrice } from '../lib/formatPrice'
import { imageUrl } from '../lib/sanity'
import { buildOrderMessage, whatsappUrl } from '../lib/whatsapp'
import { Icon } from './Icon'
import { WhatsAppLink } from './WhatsAppLink'

function CartLinePhoto({ product }: { product: Product }) {
  const [failedSource, setFailedSource] = useState<string>()
  const source = imageUrl(product.image, 160)
  return (
    <img
      className="cart-line-photo"
      src={source && source !== failedSource ? source : '/product-placeholder.svg'}
      alt=""
      width="64"
      height="64"
      loading="lazy"
      decoding="async"
      onError={() => {
        if (source) setFailedSource(source)
      }}
    />
  )
}

interface CartBarProps {
  lines: CartLine[]
  orderNote: string
  onOrderNoteChange: (value: string) => void
  count: number
  total: number
  settings: SiteSettings
  onQuantityChange: (id: string, change: number) => void
  onClear: () => void
}

export function CartBar({
  lines,
  orderNote,
  onOrderNoteChange,
  count,
  total,
  settings,
  onQuantityChange,
  onClear,
}: CartBarProps) {
  const { t, language } = useLanguage()
  const dialog = useRef<HTMLDialogElement>(null)
  const reducedMotion = useReducedMotion()
  const orderMessage = buildOrderMessage(lines, language, orderNote)
  const canOrder = Boolean(whatsappUrl(settings.whatsappNumber, orderMessage))
  const itemCountLabel = language === 'ar' && lines.length === 1
    ? 'صنف واحد في السلة'
    : language === 'ar' && lines.length === 2
      ? 'صنفان في السلة'
      : t('{count} أصناف في السلة', { count: lines.length })

  return (
    <>
      <motion.aside
        id="cart"
        className="cart-bar"
        aria-label={t('صندوقك')}
        initial={reducedMotion ? false : { y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.3 }}
      >
        <div className="cart-bar-inner page-container">
          <button
            className="cart-summary"
            type="button"
            aria-haspopup="dialog"
            onClick={() => dialog.current?.showModal()}
          >
            <span className="cart-icon">
              <Icon name="bag" />
              <span>{count}</span>
            </span>
            <span>
              <strong>{t('صندوقك الحلو')}</strong>
              <span className="cart-summary-detail">
                {t('{count} قطع', { count })} · <bdi>{formatPrice(total)}</bdi>
                <span className="cart-review-label">{t(' · مراجعة الطلب')}</span>
              </span>
            </span>
          </button>
          <WhatsAppLink
            settings={settings}
            message={orderMessage}
            className="button button-honey cart-send"
          >
            <Icon name="whatsapp" size={20} />
            <span>{t('أرسل الطلب عبر واتساب')}</span>
            <Icon name="arrow" size={18} />
          </WhatsAppLink>
        </div>
      </motion.aside>
      <dialog
        id="cart-dialog"
        className="cart-dialog"
        ref={dialog}
        aria-labelledby="cart-dialog-title"
        aria-describedby="cart-dialog-count"
        onClick={(event) => {
          if (event.target !== event.currentTarget) return
          const bounds = event.currentTarget.getBoundingClientRect()
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            dialog.current?.close()
        }}
      >
        <div className="cart-dialog-header">
          <span className="cart-dialog-handle" aria-hidden="true" />
          <div>
            <h2 id="cart-dialog-title">{t('مراجعة الطلب')}</h2>
            <p id="cart-dialog-count">{itemCountLabel}</p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label={t('إغلاق تفاصيل الطلب')}
            onClick={() => dialog.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="cart-dialog-body">
          <ul className="cart-line-list">
            {lines.map(({ product, quantity, lineTotal }) => (
              <li key={product._id}>
                <CartLinePhoto product={product} />
                <div className="cart-line-info">
                  <h3>{product.name}</h3>
                  {product.subtitle && <p>{product.subtitle}</p>}
                  <bdi>{formatPrice(lineTotal)}</bdi>
                </div>
                <div
                  className="quantity-control"
                  role="group"
                  aria-label={t('كمية {name} في الصندوق', { name: product.name })}
                >
                  <button
                    type="button"
                    disabled={quantity >= MAX_QUANTITY}
                    aria-label={t('زيادة كمية {name} في الصندوق', { name: product.name })}
                    onClick={() => onQuantityChange(product._id, 1)}
                  >
                    <Icon name="plus" size={16} />
                  </button>
                  <span>{quantity}</span>
                  <button
                    type="button"
                    aria-label={t('تقليل كمية {name} في الصندوق', { name: product.name })}
                    onClick={() => {
                      if (count === 1) dialog.current?.close()
                      onQuantityChange(product._id, -1)
                    }}
                  >
                    <Icon name="minus" size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <aside className="cart-preorder">
            <span className="cart-preorder-icon" aria-hidden="true"><Icon name="clock" size={21} /></span>
            <div>
              <strong>{t('طلب مسبق')}</strong>
              <p>{t('الطلب قبل الموعد بيوم على الأقل.')}</p>
            </div>
          </aside>
          <div className="cart-order-note">
            <label htmlFor="cart-order-note">
              {t('ملاحظات الطلب')} <span>{t('اختياري')}</span>
            </label>
            <textarea
              id="cart-order-note"
              value={orderNote}
              onChange={(event) => onOrderNoteChange(event.target.value)}
              placeholder={t('مثلاً، موعد الاستلام المفضّل')}
              maxLength={ORDER_NOTE_MAX_LENGTH}
              rows={3}
            />
          </div>
          <button
            type="button"
            className="clear-cart"
            onClick={() => {
              dialog.current?.close()
              onClear()
            }}
          >
            {t('إفراغ الصندوق')}
          </button>
        </div>
        <div className="cart-dialog-footer">
          <div className="cart-dialog-total">
            <strong>{t('الإجمالي')}</strong>
            <bdi>{formatPrice(total)}</bdi>
          </div>
          <WhatsAppLink
            settings={settings}
            message={orderMessage}
            className="button cart-dialog-send"
          >
            <Icon name="whatsapp" size={20} />
            <span>{t('أرسل الطلب عبر واتساب')}</span>
            <Icon name="arrow" size={17} />
          </WhatsAppLink>
          <p className="cart-note">
            {canOrder
              ? t('بنأكد معك التوفر، موعد الاستلام وأي تفاصيل إضافية على واتساب.')
              : t('الطلب عبر واتساب متاح قريباً.')}
          </p>
        </div>
      </dialog>
    </>
  )
}
