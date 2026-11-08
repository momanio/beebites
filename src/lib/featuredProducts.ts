import type { Product } from '../types/menu'

export function getFeaturedProducts(products: Product[]): Product[] {
  const candidates = products
    .filter((product) => product.available && !product.comingSoon)
    .toSorted(
      (a, b) =>
        Number(Boolean(b.image?.asset?._ref)) -
        Number(Boolean(a.image?.asset?._ref)),
    )
  const first = candidates[0]
  if (!first) return []

  const otherCategory = candidates.find(
    (product) =>
      product.categoryId !== first.categoryId &&
      (product.image?.asset?._ref || !first.image?.asset?._ref),
  )

  return [
    first,
    ...(otherCategory ? [otherCategory] : []),
    ...candidates.filter(
      (product) =>
        product._id !== first._id && product._id !== otherCategory?._id,
    ),
  ].slice(0, 3)
}
