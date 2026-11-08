import assert from 'node:assert/strict'
import test from 'node:test'
import { fallbackMenu } from '../data/fallbackMenu.ts'
import type { Product, SanityImage } from '../types/menu'
import { getFeaturedProducts } from './featuredProducts.ts'

const photo: SanityImage = {
  _type: 'image',
  asset: { _type: 'reference', _ref: 'image-example-640x640-jpg' },
}

test('hero uses photos first and showcases both categories when photos exist', () => {
  const products: Product[] = [
    fallbackMenu.products[0],
    { ...fallbackMenu.products[1], image: photo },
    { ...fallbackMenu.products[2], image: photo },
    { ...fallbackMenu.products[3], image: photo },
    { ...fallbackMenu.products[10], image: photo },
  ]
  const featured = getFeaturedProducts(products)
  assert.equal(featured.length, 3)
  assert.equal(featured[0]._id, products[1]._id)
  assert.ok(featured.every((product) => product.image))
  assert.deepEqual(
    new Set(featured.map((product) => product.categoryId)),
    new Set(['category-sweet', 'category-savory']),
  )
  assert.equal(products[0], fallbackMenu.products[0])
})

test('hidden and coming-soon products cannot be promoted in the hero', () => {
  const products = [
    { ...fallbackMenu.products[0], image: photo, available: false },
    { ...fallbackMenu.products[1], image: photo, comingSoon: true },
    fallbackMenu.products[2],
  ]
  assert.deepEqual(getFeaturedProducts(products), [products[2]])
})

test('hero supports empty menus, a single product and products without photos', () => {
  assert.deepEqual(getFeaturedProducts([]), [])
  assert.deepEqual(getFeaturedProducts([fallbackMenu.products[0]]), [fallbackMenu.products[0]])
  const featured = getFeaturedProducts(fallbackMenu.products)
  assert.equal(featured.length, 3)
  assert.equal(new Set(featured.map((product) => product._id)).size, 3)
  assert.equal(featured[0], fallbackMenu.products[0])
})
