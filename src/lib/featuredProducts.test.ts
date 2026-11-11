import assert from 'node:assert/strict'
import test from 'node:test'
import { fallbackMenu } from '../data/fallbackMenu.ts'
import type { Product } from '../types/menu'
import { getFeaturedProducts } from './featuredProducts.ts'

const eligible = fallbackMenu.products.filter(
  (product) => product.available && !product.comingSoon,
)

test('five products marked Featured or Trend fill the hero in menu order', () => {
  const selected: Product[] = eligible.slice(0, 5).map((product, index) => ({
    ...product,
    heroHighlight: index % 2 ? 'trend' : 'featured',
  }))
  const products = [...selected, ...eligible.slice(5)]
  assert.deepEqual(getFeaturedProducts(products, 42), selected)
  assert.deepEqual(getFeaturedProducts(products, 12345), selected)
})

test('fewer than five selected products are completed with unique random products', () => {
  const products: Product[] = eligible.map((product, index) => ({
    ...product,
    heroHighlight: index === 0 ? 'featured' : index === 1 ? 'trend' : 'none',
  }))
  const featured = getFeaturedProducts(products, 42)
  assert.equal(featured.length, 5)
  assert.deepEqual(featured.slice(0, 2), products.slice(0, 2))
  assert.equal(new Set(featured.map((product) => product._id)).size, 5)
  assert.notDeepEqual(
    featured.slice(2),
    getFeaturedProducts(products, 12345).slice(2),
  )
})

test('nothing selected picks five random products and stays stable during a visit', () => {
  const originalIds = fallbackMenu.products.map((product) => product._id)
  const first = getFeaturedProducts(fallbackMenu.products, 42)
  assert.equal(first.length, 5)
  assert.deepEqual(getFeaturedProducts([...fallbackMenu.products].reverse(), 42), first)
  assert.notDeepEqual(getFeaturedProducts(fallbackMenu.products, 12345), first)
  assert.deepEqual(fallbackMenu.products.map((product) => product._id), originalIds)
  assert.equal(new Set(first.map((product) => product._id)).size, first.length)
})

test('more than five marked products uses the first five by order with stable ties', () => {
  const products: Product[] = eligible.map((product) => ({
    ...product,
    heroHighlight: 'featured',
    order: 1,
  }))
  const expected = products.toSorted((a, b) => a._id.localeCompare(b._id)).slice(0, 5)
  assert.deepEqual(getFeaturedProducts(products, 42), expected)
  assert.deepEqual(getFeaturedProducts([...products].reverse(), 12345), expected)
})

test('hidden and coming-soon products cannot be promoted even when selected', () => {
  const products: Product[] = [
    { ...eligible[0], heroHighlight: 'featured', available: false },
    { ...eligible[1], heroHighlight: 'trend', comingSoon: true },
    eligible[2],
  ]
  assert.deepEqual(getFeaturedProducts(products), [products[2]])
})

test('empty and small menus show only the available products without duplicates', () => {
  assert.deepEqual(getFeaturedProducts([]), [])
  assert.deepEqual(getFeaturedProducts([eligible[0]]), [eligible[0]])
  assert.equal(getFeaturedProducts(eligible.slice(0, 3)).length, 3)
  assert.deepEqual(
    new Set(getFeaturedProducts(eligible.slice(0, 3)).map((product) => product._id)),
    new Set(eligible.slice(0, 3).map((product) => product._id)),
  )
})
