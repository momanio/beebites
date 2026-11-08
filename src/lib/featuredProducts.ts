import type { Product } from '../types/menu'

export function getFeaturedProducts(products: Product[], seed = 0): Product[] {
  const candidates = products
    .filter((product) => product.available && !product.comingSoon)
    .toSorted((a, b) => a._id.localeCompare(b._id))

  // A visit gets its own shuffle, which stays stable when Sanity refreshes.
  let state = seed >>> 0
  for (let index = candidates.length - 1; index > 0; index--) {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    const swapIndex = Math.floor((state / 0x100000000) * (index + 1))
    const current = candidates[index]
    candidates[index] = candidates[swapIndex]
    candidates[swapIndex] = current
  }

  return candidates.sort(
    (a, b) =>
      Number(Boolean(b.image?.asset?._ref)) -
      Number(Boolean(a.image?.asset?._ref)),
  )
}
