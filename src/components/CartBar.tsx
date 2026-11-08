import { useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { CartLine, SiteSettings } from '../types/menu'
import { MAX_QUANTITY } from '../lib/cart'
import { formatPrice } from '../lib/formatPrice'
import { buildOrderMessage, whatsappUrl } from '../lib/whatsapp'
import { Icon } from './Icon'
import { WhatsAppLink } from './WhatsAppLink'

interface CartBarProps {
  lines: CartLine[]
  count: number
  total: number
  settings: SiteSettings
  onQuantityChange: (id: string, change: number) => void
  onClear: () => void
}

export function CartBar({
  lines,
  count,
  total,
  settings,
  onQuantityChange,
  onClear,
}: CartBarProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const reducedMotion = useReducedMotion()
  const orderMessage = buildOrderMessage(lines)
  const canOrder = Boolean(whatsappUrl(settings.whatsappNumber, orderMessage))

  return (
    <>
      <motion.aside
        id="cart"
        className="cart-bar"
        aria-label="صندوقك"
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
              <strong>صندوقك الحلو</strong>
              <span className="cart-summary-detail">
                {count} قطع · <bdi>{formatPrice(total)}</bdi>
                <span className="cart-review-label"> · مراجعة الطلب</span>
              </span>
            </span>
          </button>
          <WhatsAppLink
            settings={settings}
            message={orderMessage}
            className="button button-honey cart-send"
          >
            <Icon name="whatsapp" size={20} />
            <span>أرسل الطلب عبر واتساب</span>
            <Icon name="arrow" size={18} />
          </WhatsAppLink>
        </div>
      </motion.aside>
      <dialog
        className="cart-dialog"
        ref={dialog}
        aria-labelledby="cart-dialog-title"
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
          <div>
            <p className="eyebrow">كل قطعة على ذوقك</p>
            <h2 id="cart-dialog-title">صندوقك الحلو</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="إغلاق تفاصيل الطلب"
            onClick={() => dialog.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        <ul className="cart-line-list">
          {lines.map(({ product, quantity, lineTotal }) => (
            <li key={product._id}>
              <div className="cart-line-info">
                <h3>{product.name}</h3>
                {product.subtitle && <p>{product.subtitle}</p>}
                <bdi>{formatPrice(lineTotal)}</bdi>
              </div>
              <div
                className="quantity-control"
                role="group"
                aria-label={`كمية ${product.name} في الصندوق`}
              >
                <button
                  type="button"
                  disabled={quantity >= MAX_QUANTITY}
                  aria-label={`زيادة كمية ${product.name} في الصندوق`}
                  onClick={() => onQuantityChange(product._id, 1)}
                >
                  <Icon name="plus" size={16} />
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  aria-label={`تقليل كمية ${product.name} في الصندوق`}
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
        <div className="cart-dialog-total">
          <strong>المجموع</strong>
          <bdi>{formatPrice(total)}</bdi>
        </div>
        <p className="cart-note">
          بنأكد معك التوفر، موعد الاستلام وأي تفاصيل إضافية على واتساب.
        </p>
        {!canOrder && (
          <p className="cart-note">الطلب عبر واتساب متاح قريباً.</p>
        )}
        <WhatsAppLink
          settings={settings}
          message={orderMessage}
          className="button button-chocolate cart-dialog-send"
        >
          <Icon name="whatsapp" size={20} />
          أرسل الطلب عبر واتساب
        </WhatsAppLink>
        <button
          type="button"
          className="clear-cart"
          onClick={() => {
            dialog.current?.close()
            onClear()
          }}
        >
          إفراغ الصندوق
        </button>
      </dialog>
    </>
  )
}
