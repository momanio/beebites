import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fallbackMenu, fallbackSettings } from '../data/fallbackMenu.ts'
import { getCartLines, parseCart } from './cart.ts'
import { formatPrice } from './formatPrice.ts'
import { buildOrderMessage, safeSocialUrl, whatsappUrl } from './whatsapp.ts'

test('fallback menu matches all 13 requested products, two categories and coming-soon items', () => {
  assert.equal(fallbackMenu.categories.length, 2)
  assert.equal(fallbackMenu.products.length, 13)
  assert.equal(
    fallbackMenu.products.filter((product) => product.comingSoon).length,
    2,
  )
  assert.equal(
    fallbackMenu.products.filter(
      (product) => product.categoryId === 'category-sweet',
    ).length,
    10,
  )
  assert.equal(
    fallbackMenu.products.find(
      (product) => product._id === 'product-whole-wheat',
    )?.price,
    7,
  )
})

test('saved cart discards corrupt data, invalid quantities and unsafe keys', () => {
  for (const value of [null, 'broken', 'null', '[]', '42'])
    assert.deepEqual(parseCart(value), {})
  assert.deepEqual(
    parseCart(
      '{"product-honey":2,"negative":-1,"fraction":1.5,"huge":100,"zero":0,"text":"2","__proto__":5}',
    ),
    { 'product-honey': 2 },
  )
})

test('cart ignores missing, hidden and coming-soon products and recalculates current prices', () => {
  const product = fallbackMenu.products[0]
  const products = [
    { ...product, price: 6.25 },
    { ...fallbackMenu.products[1], available: false },
    fallbackMenu.products[5],
  ]
  const lines = getCartLines(
    {
      [product._id]: 2,
      'product-chocolate': 1,
      'product-toasted-milk': 1,
      removed: 3,
    },
    products,
  )
  assert.equal(lines.length, 1)
  assert.equal(lines[0].lineTotal, 12.5)
  assert.equal(lines[0].product.price, 6.25)
})

test('cart rejects invalid runtime quantities and rounds fractional prices', () => {
  const product = { ...fallbackMenu.products[0], price: 0.1 }
  assert.equal(getCartLines({ [product._id]: 3 }, [product])[0].lineTotal, 0.3)
  assert.deepEqual(getCartLines({ [product._id]: Number.NaN }, [product]), [])
  assert.deepEqual(
    getCartLines({ [product._id]: 1 }, [{ ...product, price: -1 }]),
    [],
  )
})

test('prices omit trailing zeros and preserve half-dinar prices', () => {
  assert.equal(formatPrice(6), '6 JD')
  assert.equal(formatPrice(5.5), '5.5 JD')
  assert.equal(formatPrice(12.25), '12.25 JD')
})

test('WhatsApp message includes names, subtitles, quantities, line totals and grand total', () => {
  const lines = getCartLines(
    { 'product-chocolate-mix': 2, 'product-honey': 1 },
    fallbackMenu.products,
  )
  const message = buildOrderMessage(lines, 'مرحبا بي بايتس')
  assert.ok(message.startsWith('مرحبا بي بايتس\n'))
  assert.ok(message.includes('خلية شوكليت مكس (وايت & عادي)'))
  assert.ok(message.includes('2 × 5.5 JD = 11 JD'))
  assert.ok(message.includes('1 × 6 JD = 6 JD'))
  assert.ok(message.includes('المجموع: 17 JD'))
  const url = whatsappUrl('+962 790 000 000', message)
  assert.ok(url)
  assert.equal(new URL(url).pathname, '/962790000000')
  assert.equal(new URL(url).searchParams.get('text'), message)
})

test('placeholder numbers and non-HTTPS social links never become live links', () => {
  assert.equal(whatsappUrl(fallbackSettings.whatsappNumber, 'hello'), null)
  assert.equal(whatsappUrl('123', 'hello'), null)
  assert.equal(whatsappUrl('9627abc12345', 'hello'), null)
  assert.equal(safeSocialUrl('javascript:alert(1)'), undefined)
  assert.equal(safeSocialUrl('http://example.com'), undefined)
})

test('Sanity seed remains in sync with local fallback data', () => {
  const documents: Record<string, unknown>[] = readFileSync(
    new URL('../../studio/seed/menu.ndjson', import.meta.url),
    'utf8',
  )
    .trim()
    .split('\n')
    .map((line: string) => JSON.parse(line) as Record<string, unknown>)
  assert.equal(documents.length, 16)
  for (const product of fallbackMenu.products) {
    const seeded = documents.find((document) => document._id === product._id)
    assert.ok(seeded)
    assert.equal(seeded.name, product.name)
    assert.equal(seeded.price, product.price)
    assert.equal(seeded.comingSoon, product.comingSoon)
    assert.equal(
      seeded.menuCategory,
      product.categoryId === 'category-savory' ? 'savory' : 'sweet',
    )
  }
  const settings = documents.find((document) => document._id === 'siteSettings')
  assert.equal(settings?.heroSlogan, fallbackSettings.heroSlogan)
  assert.equal(settings?.whatsappNumber, fallbackSettings.whatsappNumber)
})
