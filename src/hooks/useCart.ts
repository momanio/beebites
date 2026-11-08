import { useEffect, useState } from 'react'
import {
  CART_STORAGE_KEY,
  getCartLines,
  MAX_QUANTITY,
  parseCart,
} from '../lib/cart'
import { roundMoney } from '../lib/formatPrice'
import type { Product } from '../types/menu'

function readCart() {
  try {
    return parseCart(localStorage.getItem(CART_STORAGE_KEY))
  } catch {
    return {}
  }
}

export function useCart(products: Product[], loading: boolean) {
  const [quantities, setQuantities] = useState(readCart)
  const lines = getCartLines(quantities, products)
  const count = lines.reduce((sum, line) => sum + line.quantity, 0)
  const total = roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0))
  const serialized = JSON.stringify(
    Object.fromEntries(lines.map((line) => [line.product._id, line.quantity])),
  )

  useEffect(() => {
    if (loading) return
    try {
      localStorage.setItem(CART_STORAGE_KEY, serialized)
    } catch {
      /* Shopping still works when storage is disabled or full. */
    }
  }, [loading, serialized])

  function changeQuantity(productId: string, change: number) {
    const product = products.find((item) => item._id === productId)
    if (!product?.available || product.comingSoon || loading) return
    setQuantities((previous) => {
      const current = Object.fromEntries(
        getCartLines(previous, products).map((line) => [
          line.product._id,
          line.quantity,
        ]),
      )
      return {
        ...current,
        [productId]: Math.min(
          MAX_QUANTITY,
          Math.max(0, (current[productId] ?? 0) + change),
        ),
      }
    })
  }

  return {
    quantities,
    lines,
    count,
    total,
    changeQuantity,
    clearCart: () => setQuantities({}),
  }
}
