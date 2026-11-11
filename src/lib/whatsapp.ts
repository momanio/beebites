import type { CartLine } from '../types/menu'
import type { Language } from './i18n.ts'
import { formatPrice, roundMoney } from './formatPrice.ts'

export function whatsappUrl(number: string, message: string): string | null {
  // Reject placeholders and malformed numbers instead of sending to the wrong contact.
  const digits = number.replace(/[\s()+-]/g, '')
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function buildOrderMessage(lines: CartLine[], language: Language = 'ar'): string {
  const total = roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0))
  const items = lines.map(
    ({ product, quantity, lineTotal }) =>
      `• ${product.name}${product.subtitle ? ` ${product.subtitle}` : ''}\n  ${quantity} × ${formatPrice(product.price)} = ${formatPrice(lineTotal)}`,
  )
  return [
    language === 'en' ? 'My BeeBites order 🐝' : 'طلبي من BeeBites 🐝',
    ...items,
    '',
    `${language === 'en' ? 'Total' : 'المجموع'}: ${formatPrice(total)}`,
    '',
    language === 'en' ? 'Could you confirm availability and pickup time?' : 'ممكن تأكيد توفر الطلب وموعد الاستلام؟',
  ].join('\n')
}

export function safeSocialUrl(value: string): string | undefined {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.href : undefined
  } catch {
    return undefined
  }
}
