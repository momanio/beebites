import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { fallbackMenu, fallbackSettings } from '../src/data/fallbackMenu.ts'

const port = 4175
const origin = `http://127.0.0.1:${port}`
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
    '--strictPort',
  ],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      VITE_SANITY_PROJECT_ID: 'test1234',
      VITE_SANITY_DATASET: 'production',
      VITE_SANITY_API_VERSION: '2026-01-01',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
)
let serverOutput = ''
server.stdout.on('data', (data) => {
  serverOutput += data.toString()
})
server.stderr.on('data', (data) => {
  serverOutput += data.toString()
})
let browser
try {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null)
      throw new Error(`Test server failed: ${serverOutput}`)
    try {
      if ((await fetch(origin)).ok) break
    } catch {
      /* Vite is still starting. */
    }
    if (attempt === 59) throw new Error(`Test server timeout: ${serverOutput}`)
    await delay(250)
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  })
  await context.route('https://fonts.googleapis.com/**', (route) =>
    route.fulfill({ contentType: 'text/css', body: '' }),
  )
  await context.route('https://cdn.sanity.io/images/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640"><rect width="640" height="640" fill="#f5c542"/></svg>',
    }),
  )
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  let failCms = false
  let menu = structuredClone(fallbackMenu)
  menu.products[0].image = {
    _type: 'image',
    asset: {
      _type: 'reference',
      _ref: 'image-0123456789abcdef0123456789abcdef01234567-640x640-png',
    },
  }
  const settings = {
    ...fallbackSettings,
    whatsappNumber: '962790000000',
    defaultWhatsappMessage: 'test',
    highlightTitle: 'test',
    highlightText: 'testing',
    heroSubline: 'مذاقات من إعدادات الموقع',
    announcement: { enabled: true, text: 'إعلان تجريبي من الاستوديو' },
    aboutCards: [
      { _key: 'cms-only', title: 'نص من الاستوديو', text: 'لا يظهر في الموقع' },
    ],
  }
  await page.route('**/api/sanity/**', async (route) => {
    if (failCms)
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Test CMS unavailable' }),
      })
    const query = new URL(route.request().url()).searchParams.get('query') || ''
    await delay(350)
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        result: query.includes('"categories"') ? menu : settings,
      }),
    })
  })
  await page.goto(origin)
  await page.locator('.skeleton-card').first().waitFor()
  await page.locator('.product-card').first().waitFor()
  assert.equal(await page.locator('html').getAttribute('dir'), 'rtl')
  assert.equal(await page.locator('html').getAttribute('lang'), 'ar')
  assert.equal(await page.locator('.product-card').count(), 13)
  assert.deepEqual(
    await page.locator('.category-nav .category-chip').allTextContents(),
    ['جديدنا', 'الخلايا'],
  )
  assert.deepEqual(await page.locator('.subcategory-title').allTextContents(), [
    'خلايا حلوة',
    'خلايا مالحه',
  ])
  assert.equal(
    await page
      .locator(
        '#category-category-cells #category-category-sweet .product-card',
      )
      .count(),
    10,
  )
  assert.equal(
    await page
      .locator(
        '#category-category-cells #category-category-savory .product-card',
      )
      .count(),
    3,
  )
  assert.equal(await page.locator('.highlight-ribbon').count(), 0)
  // The local data proxy must not become the base URL for uploaded photos.
  const productImage = page.locator('.product-card').first().locator('img')
  const productImageUrl = new URL(await productImage.getAttribute('src'))
  assert.equal(productImageUrl.origin, 'https://cdn.sanity.io')
  assert.equal(
    productImageUrl.pathname,
    '/images/test1234/production/0123456789abcdef0123456789abcdef01234567-640x640.png',
  )
  await productImage.scrollIntoViewIfNeeded()
  await page.waitForFunction(
    (image) => image.complete && image.naturalWidth > 0,
    await productImage.elementHandle(),
  )
  assert.equal(
    await page
      .locator('.product-card')
      .first()
      .locator('.placeholder-caption')
      .count(),
    0,
  )
  assert.equal(await page.locator('#home .hero-product-main').count(), 1)
  assert.equal(await page.locator('#home .hero-peek').count(), 2)
  const heroProduct = page.locator('#home .hero-product-link')
  assert.ok(
    (await page.locator('.hero-product-caption').innerText()).includes(
      menu.products[0].name,
    ),
  )
  assert.ok(
    (await page.locator('.hero-product-caption').innerText()).includes(
      '5.5 JD',
    ),
  )
  assert.equal(
    await heroProduct.getAttribute('href'),
    `#menu-product-${menu.products[0]._id}`,
  )
  await heroProduct.click()
  assert.equal(
    new URL(page.url()).hash,
    `#menu-product-${menu.products[0]._id}`,
  )
  await page.evaluate(() => window.scrollTo(0, 0))
  // Every orderable product appears once before the shuffled carousel wraps.
  const eligibleIds = menu.products
    .filter((product) => product.available && !product.comingSoon)
    .map((product) => product._id)
  const carouselIds = new Set()
  for (let index = 0; index < eligibleIds.length; index++) {
    const previousHref = await heroProduct.getAttribute('href')
    carouselIds.add(previousHref.replace('#menu-product-', ''))
    await page
      .getByRole('button', { name: 'المنتج التالي', exact: true })
      .click()
    await page.waitForFunction((previous) => {
      const href = document
        .querySelector('.hero-product-link')
        ?.getAttribute('href')
      return href && href !== previous
    }, previousHref)
  }
  assert.deepEqual(carouselIds, new Set(eligibleIds))
  assert.equal(
    await heroProduct.getAttribute('href'),
    `#menu-product-${menu.products[0]._id}`,
  )
  // RTL swipe advances, and the previous button returns to the same product.
  const stage = page.locator('.hero-carousel-stage')
  await stage.dispatchEvent('pointerdown', {
    clientX: 100,
    clientY: 200,
    pointerType: 'touch',
  })
  await stage.dispatchEvent('pointerup', {
    clientX: 220,
    clientY: 205,
    pointerType: 'touch',
  })
  await page.waitForFunction((id) => {
    const href = document
      .querySelector('.hero-product-link')
      ?.getAttribute('href')
    return href && href !== `#menu-product-${id}`
  }, menu.products[0]._id)
  assert.notEqual(
    await heroProduct.getAttribute('href'),
    `#menu-product-${menu.products[0]._id}`,
  )
  await page.getByRole('button', { name: 'المنتج السابق', exact: true }).click()
  await page
    .getByRole('button', {
      name: `أضف ${menu.products[0].name} لصندوقك`,
      exact: true,
    })
    .click()
  await page.locator('.cart-bar').waitFor()
  assert.ok(
    (await page.locator('.hero-add').innerText()).includes('1 في صندوقك'),
  )
  assert.ok(
    (await page.locator('.cart-summary').innerText()).includes('5.5 JD'),
  )
  await page
    .locator('.product-card')
    .first()
    .getByRole('button', {
      name: `تقليل كمية ${menu.products[0].name}`,
      exact: true,
    })
    .click()
  assert.equal(await page.locator('.cart-bar').count(), 0)
  assert.equal(
    await page.locator('.hero-carousel-play').count(),
    0,
    'Reduced motion disables automatic rotation',
  )
  assert.equal(await page.locator('#about .value-card').count(), 3)
  assert.equal(
    await page.locator('#about h3').first().innerText(),
    'هشّة زي الغيم',
  )
  assert.ok(
    !(await page.locator('#about').innerText()).includes('نص من الاستوديو'),
  )
  assert.equal(
    await page.locator('.product-coming-soon button:disabled').count(),
    2,
  )
  assert.equal(
    await page.locator('.announcement').innerText(),
    settings.announcement.text,
  )
  assert.equal(
    await page.locator('.hero-subline').innerText(),
    settings.heroSubline,
  )
  assert.equal(await page.locator('.bee-trail').count(), 0)
  assert.ok(
    await page.locator('.hero-actions a[href^="https://wa.me/"]').count(),
  )

  // Publishing a product must update an already open storefront without a reload.
  menu.products.push({
    ...menu.products[0],
    _id: 'new-published-product',
    name: 'منتج جديد منشور',
  })
  await page
    .getByRole('heading', { name: 'منتج جديد منشور', exact: true })
    .waitFor()
  assert.equal(await page.locator('.product-card').count(), 14)
  menu.products.pop()
  await page
    .getByRole('heading', { name: 'منتج جديد منشور', exact: true })
    .waitFor({ state: 'detached' })

  // Categories published in Studio appear without a frontend deployment.
  menu.categories.push(
    {
      _id: 'custom-category',
      title: 'كيك',
      slug: 'cakes',
      order: 3,
      parentId: null,
    },
    {
      _id: 'custom-child',
      title: 'كيك الشوكليت',
      slug: 'chocolate-cakes',
      order: 1,
      parentId: 'custom-category',
    },
  )
  menu.products.push({
    ...menu.products[0],
    _id: 'custom-product',
    name: 'كيك تجريبي',
    categoryId: 'custom-child',
  })
  await page
    .getByRole('heading', { name: 'كيك الشوكليت', exact: true })
    .waitFor()
  assert.equal(
    await page
      .locator('#category-custom-category #category-custom-child .product-card')
      .count(),
    1,
  )
  assert.ok((await page.locator('.category-nav').innerText()).includes('كيك'))
  menu.categories.splice(-2)
  menu.products.pop()
  await page
    .getByRole('heading', { name: 'كيك الشوكليت', exact: true })
    .waitFor({ state: 'detached' })

  const first = page.locator('.product-card').first()
  await first
    .getByRole('button', { name: 'زيادة كمية خلية شوكليت مكس', exact: true })
    .click({ clickCount: 2 })
  await page
    .locator('.product-card')
    .nth(3)
    .getByRole('button', { name: 'زيادة كمية كلاسيك مع عسل', exact: true })
    .click()
  await page.locator('.cart-bar').waitFor()
  assert.ok((await page.locator('.cart-summary').innerText()).includes('17 JD'))
  const orderUrl = new URL(
    await page.locator('.cart-send').getAttribute('href'),
  )
  assert.equal(orderUrl.hostname, 'wa.me')
  assert.equal(orderUrl.pathname, '/962790000000')
  assert.ok(
    orderUrl.searchParams.get('text').startsWith('طلبي من BeeBites 🐝\n'),
  )
  assert.ok(!orderUrl.searchParams.get('text').includes('test'))
  assert.ok(orderUrl.searchParams.get('text').includes('2 × 5.5 JD = 11 JD'))
  assert.ok(orderUrl.searchParams.get('text').includes('المجموع: 17 JD'))
  await page.reload()
  await page.locator('.cart-bar').waitFor()
  assert.ok((await page.locator('.cart-summary').innerText()).includes('17 JD'))
  await page.locator('.cart-summary').click()
  await page.locator('dialog[open]').waitFor()
  assert.equal(await page.locator('.cart-line-list li').count(), 2)
  const dialogOrderUrl = new URL(
    await page.locator('.cart-dialog-send').getAttribute('href'),
  )
  assert.equal(
    dialogOrderUrl.searchParams.get('text'),
    orderUrl.searchParams.get('text'),
  )
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('dialog[open]').count(), 0)
  assert.ok(
    await page
      .locator('.cart-summary')
      .evaluate((element) => element === document.activeElement),
  )

  // A CMS change updates current prices and removes unavailable products from persisted orders.
  menu.products[0].price = 6.5
  menu.products[3].available = false
  await page.reload()
  await page.locator('.cart-bar').waitFor()
  assert.equal(await page.locator('.product-card').count(), 12)
  assert.ok((await page.locator('.cart-summary').innerText()).includes('13 JD'))
  await page.locator('.cart-summary').click()
  await page.getByRole('button', { name: 'إفراغ الصندوق', exact: true }).click()
  assert.equal(await page.locator('.cart-bar').count(), 0)

  await mkdir('test-results', { recursive: true })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true })
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.evaluate(() => window.scrollTo(0, 0))
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `Overflow at ${width}px`,
    )
    const heroAdd = await page.locator('.hero-add').boundingBox()
    assert.ok(heroAdd.height >= 44, `Order button is easy to tap at ${width}px`)
    assert.ok(
      heroAdd.x >= 0 && heroAdd.x + heroAdd.width <= width,
      `Hero order button fits at ${width}px`,
    )
    for (const button of await page.locator('.hero-carousel-arrow').all()) {
      const box = await button.boundingBox()
      assert.ok(
        box.width >= 44 && box.height >= 44,
        `Carousel control is easy to tap at ${width}px`,
      )
    }
    if (width < 768) {
      await page
        .getByRole('button', { name: 'فتح القائمة', exact: true })
        .click()
      assert.equal(await page.locator('#mobile-navigation').isVisible(), true)
      await page.keyboard.press('Escape')
      assert.equal(await page.locator('#mobile-navigation').isVisible(), false)
      await page.locator('.category-chip').last().click()
      const top = await page
        .locator('.category-nav')
        .evaluate((element) => element.getBoundingClientRect().top)
      assert.ok(
        Math.abs(top - 72) < 2,
        'Category chips stick below the mobile header',
      )
      const fab = await page.locator('.whatsapp-fab').boundingBox()
      assert.ok(fab.x < width / 2, 'RTL WhatsApp button is on the left')
      await page.evaluate(() => {
        document.documentElement.dir = 'ltr'
      })
      const mirroredFab = await page.locator('.whatsapp-fab').boundingBox()
      assert.ok(
        mirroredFab.x > width / 2,
        'LTR WhatsApp button mirrors to the right',
      )
      await page.evaluate(() => {
        document.documentElement.dir = 'rtl'
      })
      await page.evaluate(() => window.scrollTo(0, 0))
      if (width === 390)
        await page.screenshot({
          path: 'test-results/mobile.png',
          fullPage: true,
        })
    }
  }

  // Normal motion rotates the carousel; an explicit pause persists after blur.
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.clock.install()
  await page.reload()
  await page.locator('.hero-carousel-play').waitFor()
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.mouse.move(1, 1)
  const beforeRotation = await heroProduct.getAttribute('href')
  await page.clock.runFor(6500)
  await page.waitForFunction((before) => {
    const href = document
      .querySelector('.hero-product-link')
      ?.getAttribute('href')
    return href && href !== before
  }, beforeRotation)
  await page
    .getByRole('button', { name: 'إيقاف عرض المنتجات مؤقتاً', exact: true })
    .click()
  await page.locator('#hero-title').click()
  await page.mouse.move(1, 1)
  const beforePause = await heroProduct.getAttribute('href')
  await page.clock.runFor(12000)
  assert.equal(await heroProduct.getAttribute('href'), beforePause)
  await page.emulateMedia({ reducedMotion: 'reduce' })

  menu = { ...menu, products: [] }
  await page.reload()
  await page.locator('.hero-products-empty').waitFor()
  assert.equal(await page.locator('.hero-carousel-controls').count(), 0)
  menu.products = [fallbackMenu.products[0]]
  await page.reload()
  await page.locator('.hero-product-main:not(.skeleton-card)').waitFor()
  assert.equal(await page.locator('.hero-carousel-controls').count(), 0)
  assert.equal(await page.locator('.hero-peek').count(), 0)

  failCms = true
  await page.reload()
  await page.locator('.product-card').first().waitFor()
  assert.equal(await page.locator('.product-card').count(), 13)
  assert.equal(await page.locator('.announcement').count(), 0)
  assert.equal(
    await page.locator('.hero-subline').innerText(),
    fallbackSettings.heroSubline,
  )
  assert.equal(await page.locator('.fab-link').isDisabled(), true)
  await page
    .locator('.product-card')
    .first()
    .getByRole('button', { name: 'زيادة كمية خلية شوكليت مكس', exact: true })
    .click()
  assert.ok(await page.locator('.cart-send').isDisabled())
  // Denied localStorage must not prevent selecting products.
  const blockedStorage = await browser.newContext({
    reducedMotion: 'reduce',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  await blockedStorage.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Denied', 'SecurityError')
      },
    })
  })
  await blockedStorage.route('**/api/sanity/**', (route) =>
    route.fulfill({ status: 400, body: '{}' }),
  )
  const privatePage = await blockedStorage.newPage()
  privatePage.on('pageerror', (error) => errors.push(error.message))
  await privatePage.goto(origin)
  await privatePage.locator('.product-card').first().waitFor()
  await privatePage.locator('.hero-add').tap()
  await privatePage.locator('.cart-bar').waitFor()
  await blockedStorage.close()
  assert.deepEqual(errors, [])
  console.log(
    'Browser checks passed: CMS loading/fallback, Sanity CDN photos, shuffled carousel, swipe/arrow navigation, autoplay/pause/reduced motion, hero add-to-box, empty/single-product menus, cart persistence, WhatsApp orders, mobile touch, dialog focus, RTL/LTR, blocked storage and four viewport sizes.',
  )
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
