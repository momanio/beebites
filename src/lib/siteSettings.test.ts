import assert from 'node:assert/strict'
import test from 'node:test'
import { fallbackSettings } from '../data/fallbackMenu.ts'
import {
  resolveSiteSettings,
  validateWhatsappNumber,
  whatsappSetupWarning,
} from './siteSettings.ts'
import { whatsappUrl } from './whatsapp.ts'

test('published About edits cannot replace the three static website cards', () => {
  for (const count of [1, 2]) {
    const cards = fallbackSettings.aboutCards
      .slice(0, count)
      .map((card) => ({ ...card, title: `عنوان جديد ${card._key}` }))
    assert.deepEqual(
      resolveSiteSettings({ aboutCards: cards }).aboutCards,
      fallbackSettings.aboutCards,
    )
  }
})

test('empty or incomplete CMS About cards leave the static website cards intact', () => {
  assert.deepEqual(
    resolveSiteSettings({ aboutCards: [] }).aboutCards,
    fallbackSettings.aboutCards,
  )
  assert.deepEqual(
    resolveSiteSettings({
      aboutCards: [{ _key: 'empty', title: ' ', text: '' }],
    }).aboutCards,
    fallbackSettings.aboutCards,
  )
})

test('empty optional slogan and greeting use defaults while blank contact stays disabled', () => {
  const settings = resolveSiteSettings({
    heroSlogan: '',
    defaultWhatsappMessage: ' ',
    whatsappNumber: '',
  })
  assert.equal(settings.heroSlogan, fallbackSettings.heroSlogan)
  assert.equal(
    settings.defaultWhatsappMessage,
    fallbackSettings.defaultWhatsappMessage,
  )
  assert.equal(settings.whatsappNumber, '')
  assert.equal(
    whatsappUrl(settings.whatsappNumber, settings.defaultWhatsappMessage),
    null,
  )
})

test('unfinished contact setup is publishable with a warning and cannot open WhatsApp', () => {
  for (const number of [undefined, '', fallbackSettings.whatsappNumber]) {
    assert.equal(validateWhatsappNumber(number), true)
    assert.equal(typeof whatsappSetupWarning(number), 'string')
    assert.equal(whatsappUrl(number ?? '', 'مرحبا'), null)
  }
})

test('malformed real numbers remain errors while valid international numbers pass', () => {
  for (const number of ['123', '+962790000000', '9627abc12345']) {
    assert.equal(typeof validateWhatsappNumber(number), 'string')
  }
  assert.equal(validateWhatsappNumber('962790000000'), true)
  assert.equal(whatsappSetupWarning('962790000000'), true)
})
