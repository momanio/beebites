import type { CartLine, Product } from '../types/menu'
import { roundMoney } from './formatPrice.ts'

export const CART_STORAGE_KEY = 'beebites-cart-v1'
export const MAX_QUANTITY = 99
export type Quantities = Record<string, number>

export function parseCart(value: string | null): Quantities {
  if (!value) return {}
  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      return {}
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([id, quantity]) =>
          /^[a-zA-Z0-9_.-]+$/.test(id) &&
          id !== '__proto__' &&
          id !== 'constructor' &&
          typeof quantity === 'number' &&
          Number.isInteger(quantity) &&
          quantity > 0 &&
          quantity <= MAX_QUANTITY,
      ),
    )
  } catch {
    return {}
  }
}

export function getCartLines(
  quantities: Quantities,
  products: Product[],
): CartLine[] {
  return products.flatMap((product) => {
    const quantity = quantities[product._id]
    if (
      !product.available ||
      product.comingSoon ||
      !Number.isFinite(product.price) ||
      product.price < 0 ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QUANTITY
    )
      return []
    return [
      { product, quantity, lineTotal: roundMoney(product.price * quantity) },
    ]
  })
}
