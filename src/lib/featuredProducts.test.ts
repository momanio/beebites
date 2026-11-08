import assert from 'node:assert/strict'
import test from 'node:test'
import { fallbackMenu } from '../data/fallbackMenu.ts'
import type { Product, SanityImage } from '../types/menu'
import { getFeaturedProducts } from './featuredProducts.ts'

const photo: SanityImage = {
  _type: 'image',
  asset: { _type: 'reference', _ref: 'image-example-640x640-jpg' },
}

test('carousel includes every orderable product, with uploaded photos first', () => {
  const products: Product[] = [
    fallbackMenu.products[0],
    { ...fallbackMenu.products[1], image: photo },
    { ...fallbackMenu.products[2], image: photo },
    { ...fallbackMenu.products[10], image: photo },
  ]
  const featured = getFeaturedProducts(products, 42)
  assert.equal(featured.length, products.length)
  assert.ok(featured.slice(0, 3).every((product) => product.image))
  assert.equal(featured[3], products[0])
  assert.deepEqual(
    new Set(featured.map((product) => product.categoryId)),
    new Set(['category-sweet', 'category-savory']),
  )
  assert.equal(products[0], fallbackMenu.products[0])
})

test('a visit keeps its shuffled order across CMS refreshes and source reordering', () => {
  const originalIds = fallbackMenu.products.map((product) => product._id)
  const first = getFeaturedProducts(fallbackMenu.products, 42)
  assert.deepEqual(
    getFeaturedProducts([...fallbackMenu.products].reverse(), 42),
    first,
  )
  assert.notDeepEqual(getFeaturedProducts(fallbackMenu.products, 12345), first)
  assert.deepEqual(
    fallbackMenu.products.map((product) => product._id),
    originalIds,
  )
  assert.equal(new Set(first.map((product) => product._id)).size, first.length)
})

test('hidden and coming-soon products cannot be promoted in the hero', () => {
  const products = [
    { ...fallbackMenu.products[0], image: photo, available: false },
    { ...fallbackMenu.products[1], image: photo, comingSoon: true },
    fallbackMenu.products[2],
  ]
  assert.deepEqual(getFeaturedProducts(products), [products[2]])
})

test('carousel supports empty menus, a single product and products without photos', () => {
  assert.deepEqual(getFeaturedProducts([]), [])
  assert.deepEqual(getFeaturedProducts([fallbackMenu.products[0]]), [
    fallbackMenu.products[0],
  ])
  const eligible = fallbackMenu.products.filter(
    (product) => product.available && !product.comingSoon,
  )
  assert.equal(
    getFeaturedProducts(fallbackMenu.products).length,
    eligible.length,
  )
  assert.deepEqual(
    new Set(
      getFeaturedProducts(fallbackMenu.products).map((product) => product._id),
    ),
    new Set(eligible.map((product) => product._id)),
  )
})
