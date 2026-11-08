import { useEffect, useState } from 'react'
import {
  CART_STORAGE_KEY,
  getCartLines,
  MAX_QUANTITY,
  parseCart,
  type Quantities,
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
  const [cart, setCart] = useState<{
    quantities: Quantities
    catalog: Product[] | null
  }>(() => ({ quantities: readCart(), catalog: null }))
  const lines = getCartLines(cart.quantities, products)
  const count = lines.reduce((sum, line) => sum + line.quantity, 0)
  const total = roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0))
  const currentQuantities = Object.fromEntries(
    lines.map((line) => [line.product._id, line.quantity]),
  )
  const serialized = JSON.stringify(currentQuantities)

  // Accept a successfully loaded catalog before rendering the cart. Removing
  // unavailable items from state also prevents them returning on a later refresh.
  if (!loading && cart.catalog !== products)
    setCart({ quantities: currentQuantities, catalog: products })

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
    setCart((previous) => {
      const current = Object.fromEntries(
        getCartLines(previous.quantities, products).map((line) => [
          line.product._id,
          line.quantity,
        ]),
      )
      return {
        ...previous,
        quantities: {
          ...current,
          [productId]: Math.min(
            MAX_QUANTITY,
            Math.max(0, (current[productId] ?? 0) + change),
          ),
        },
      }
    })
  }

  return {
    quantities: cart.quantities,
    lines,
    count,
    total,
    changeQuantity,
    clearCart: () =>
      setCart((previous) => ({ ...previous, quantities: {} })),
  }
}
