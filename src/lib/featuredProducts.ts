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

  const selected = candidates
    .filter((product) =>
      product.heroHighlight === 'featured' || product.heroHighlight === 'trend',
    )
    .sort((a, b) => a.order - b.order || a._id.localeCompare(b._id))
  const selectedIds = new Set(selected.map((product) => product._id))

  return [
    ...selected,
    ...candidates.filter((product) => !selectedIds.has(product._id)),
  ].slice(0, 5)
}
