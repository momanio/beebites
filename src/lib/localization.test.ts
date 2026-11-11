import assert from 'node:assert/strict'
import test from 'node:test'
import { fallbackMenu, fallbackSettings } from '../data/fallbackMenu.ts'
import { localizeMenu, localizeSettings } from './localization.ts'
import { translate } from './i18n.ts'
import { buildOrderMessage } from './whatsapp.ts'
import { getCartLines } from './cart.ts'

test('English localizes the sample menu while preserving IDs, prices, order and the source', () => {
  const translated = localizeMenu(fallbackMenu, 'en')
  assert.equal(translated.categories[0].title, 'New arrivals')
  assert.equal(translated.products[0].name, 'Mixed Chocolate Honeycomb')
  assert.equal(translated.products[0].subtitle, '(White & milk chocolate)')
  assert.equal(translated.products[0].categoryTitle, 'Sweet honeycomb')
  assert.deepEqual(translated.products.map(({ _id, price }) => ({ _id, price })), fallbackMenu.products.map(({ _id, price }) => ({ _id, price })))
  assert.equal(fallbackMenu.products[0].name, 'خلية شوكليت مكس')
  assert.equal(localizeMenu(fallbackMenu, 'ar'), fallbackMenu)
  const existing = localizeMenu({ ...fallbackMenu, products: [{ ...fallbackMenu.products[0], name: 'خليه كلاسيك مع قطر ', subtitle: 'كلاسيك محلاه بالقطر ' }] }, 'en')
  assert.equal(existing.products[0].name, 'Classic Honeycomb with Syrup')
  assert.equal(existing.products[0].subtitle, 'Classic, sweetened with syrup')
})

test('CMS English translations win and unpublished translations fall back without hiding custom content', () => {
  const menu = {
    categories: [{ ...fallbackMenu.categories[0], title: 'قسم مخصص', titleEn: 'Custom category' }],
    products: [{ ...fallbackMenu.products[0], categoryId: fallbackMenu.categories[0]._id, nameEn: 'CMS name', subtitleEn: 'CMS subtitle', description: 'وصف خاص', descriptionEn: 'CMS description', badgeEn: 'New' }],
  }
  const translated = localizeMenu(menu, 'en')
  assert.equal(translated.products[0].name, 'CMS name')
  assert.equal(translated.products[0].description, 'CMS description')
  assert.equal(translated.products[0].categoryTitle, 'Custom category')
  assert.equal(translated.products[0].badge, 'New')
  assert.equal(localizeMenu({ ...menu, products: [{ ...menu.products[0], descriptionEn: ' ' }] }, 'en').products[0].description, 'وصف خاص')
})

test('English settings keep contact details and custom ordering information', () => {
  const english = localizeSettings(fallbackSettings, 'en')
  assert.equal(english.whatsappNumber, fallbackSettings.whatsappNumber)
  assert.ok(english.orderNote.startsWith('Every honeycomb'))
  const custom = { ...fallbackSettings, orderNote: 'معلومة مهمة', orderNoteEn: 'Important ordering information', announcement: { enabled: true, text: 'خبر', textEn: 'News' } }
  assert.equal(localizeSettings(custom, 'en').orderNote, 'Important ordering information')
  assert.equal(localizeSettings(custom, 'en').announcement.text, 'News')
  assert.equal(localizeSettings({ ...custom, orderNoteEn: null }, 'en').orderNote, custom.orderNote)
})

test('language changes keep quantities and generate English WhatsApp orders', () => {
  const quantities = { [fallbackMenu.products[0]._id]: 2 }
  const arabic = getCartLines(quantities, fallbackMenu.products)
  const english = getCartLines(quantities, localizeMenu(fallbackMenu, 'en').products)
  assert.equal(english[0].quantity, arabic[0].quantity)
  assert.equal(english[0].lineTotal, arabic[0].lineTotal)
  const message = buildOrderMessage(english, 'en')
  assert.ok(message.startsWith('My BeeBites order 🐝'))
  assert.ok(message.includes('Mixed Chocolate Honeycomb'))
  assert.ok(message.includes('Total: 11 JD'))
  assert.ok(buildOrderMessage(arabic).startsWith('طلبي من BeeBites'))
  assert.equal(translate('زيادة كمية {name}', 'en', { name: 'Chocolate' }), 'Increase quantity of Chocolate')
  assert.equal(translate('{count} قطع', 'en', { count: 1 }), '1 item')
})
