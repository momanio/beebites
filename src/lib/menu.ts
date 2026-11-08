import { menuCategories } from '../data/menuCategories.ts'
import type { Category, MenuData } from '../types/menu'

function isNewArrivalsCategory(category: Category): boolean {
  return category._id === 'category-new' || category.slug === 'new'
}

export function rootCategories(categories: Category[]): Category[] {
  const ids = new Set(categories.map((category) => category._id))
  return categories.filter(
    (category) => !category.parentId || !ids.has(category.parentId),
  )
}

export function resolveMenu(data: MenuData): MenuData {
  const products = data.products.filter(
    (product) =>
      product.available !== false &&
      Number.isFinite(product.price) &&
      product.price >= 0,
  )
  const categories = new Map(
    data.categories.map((category) => [category._id, category]),
  )
  // Keep older products visible while category references are being migrated.
  for (const product of products) {
    const fallback = menuCategories.find(
      (category) => category._id === product.categoryId,
    )
    if (!fallback || categories.has(fallback._id)) continue
    categories.set(fallback._id, fallback)
    const parent = menuCategories.find(
      (category) => category._id === fallback.parentId,
    )
    if (parent && !categories.has(parent._id))
      categories.set(parent._id, parent)
  }
  return {
    categories: [...categories.values()].sort(
      (a, b) =>
        Number(isNewArrivalsCategory(b)) - Number(isNewArrivalsCategory(a)) ||
        a.order - b.order ||
        a.title.localeCompare(b.title, 'ar'),
    ),
    products: products.map((product) => ({
      ...product,
      categoryTitle:
        categories.get(product.categoryId)?.title ?? product.categoryTitle,
    })),
  }
}
