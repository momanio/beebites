import type { CartLine } from '../types/menu'
import { formatPrice, roundMoney } from './formatPrice.ts'

export function whatsappUrl(number: string, message: string): string | null {
  // Reject placeholders and malformed numbers instead of sending to the wrong contact.
  const digits = number.replace(/[\s()+-]/g, '')
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function buildOrderMessage(lines: CartLine[]): string {
  const total = roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0))
  const items = lines.map(
    ({ product, quantity, lineTotal }) =>
      `• ${product.name}${product.subtitle ? ` ${product.subtitle}` : ''}\n  ${quantity} × ${formatPrice(product.price)} = ${formatPrice(lineTotal)}`,
  )
  return [
    'طلبي من BeeBites 🐝',
    ...items,
    '',
    `المجموع: ${formatPrice(total)}`,
    '',
    'ممكن تأكيد توفر الطلب وموعد الاستلام؟',
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
