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
  menu.products[0].description = 'عجينة هشة وطرية، محشية بالشوكليت ومخبوزة على طلبك.\nلقمة حلوة بتكمّل جمعتك.'
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
    heroSlogan: 'BeeBites',
    heroSubline: 'test',
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
  // Product photos open an accessible preview without changing the cart.
  const preview = page.locator('.product-preview[open]')
  const previewTrigger = page.locator('.product-card .product-image-wrap').first()
  await previewTrigger.click()
  await preview.waitFor()
  assert.equal(await preview.getAttribute('aria-labelledby'), 'product-preview-title')
  assert.equal(await preview.locator('h2').innerText(), menu.products[0].name)
  assert.equal(await preview.locator('.product-preview-description').innerText(), menu.products[0].description)
  assert.equal(await preview.locator('.product-preview-subtitle').innerText(), menu.products[0].subtitle)
  const previewImage = preview.locator('img')
  assert.equal(new URL(await previewImage.getAttribute('src')).searchParams.get('fit'), 'max')
  assert.equal(new URL(await previewImage.getAttribute('src')).searchParams.has('h'), false)
  await page.waitForFunction((image) => image.complete && image.naturalWidth > 0, await previewImage.elementHandle())
  assert.equal(await page.locator('.cart-bar').count(), 0)
  assert.equal(await page.locator('body').evaluate((element) => getComputedStyle(element).overflow), 'hidden')
  assert.equal(await preview.locator('.product-preview-close').evaluate((element) => element === document.activeElement), true)
  await page.keyboard.press('Shift+Tab')
  assert.equal(await preview.getByRole('button', { name: 'رجوع للقائمة' }).evaluate((element) => element === document.activeElement), true)
  await page.keyboard.press('Tab')
  assert.equal(await preview.locator('.product-preview-close').evaluate((element) => element === document.activeElement), true)
  await preview.locator('h2').click()
  assert.equal(await preview.count(), 1, 'Clicking modal content keeps it open')
  await page.keyboard.press('Escape')
  await preview.waitFor({ state: 'hidden' })
  assert.equal(await previewTrigger.evaluate((element) => element === document.activeElement), true)
  await page.keyboard.press('Enter')
  await preview.waitFor()
  await preview.locator('.product-preview-close').click()
  await preview.waitFor({ state: 'hidden' })
  await previewTrigger.click()
  await preview.waitFor()
  await page.mouse.click(2, 2)
  await preview.waitFor({ state: 'hidden' })
  assert.equal(await previewTrigger.evaluate((element) => element === document.activeElement), true)

  // Missing descriptions and photos, including coming-soon items, still preview.
  await page.locator('.product-coming-soon .product-image-wrap').first().click()
  await preview.waitFor()
  assert.equal(await preview.locator('img').getAttribute('src'), '/product-placeholder.svg')
  assert.equal(await preview.locator('.product-preview-placeholder').count(), 1)
  assert.equal(await preview.locator('.product-preview-description').innerText(), 'تفاصيل هالنكهة بنشاركها معك قريباً.')
  assert.equal(await preview.locator('.product-preview-badge').innerText(), 'قريباً… استنّونا')
  assert.equal(await preview.locator('.product-preview-quantity').count(), 0)
  assert.equal(await preview.getByRole('button', { name: 'قريباً… استنّونا' }).isDisabled(), true)
  assert.equal(await preview.locator('.product-preview-add, .product-preview-send').count(), 0)
  await preview.getByRole('button', { name: 'رجوع للقائمة' }).click()
  await preview.waitFor({ state: 'hidden' })

  const failPhoto = (route) => route.abort()
  await page.route('https://cdn.sanity.io/images/**', failPhoto)
  await previewTrigger.click()
  await preview.locator('.product-preview-placeholder').waitFor()
  assert.equal(await preview.locator('img').getAttribute('src'), '/product-placeholder.svg')
  await page.keyboard.press('Escape')
  await preview.waitFor({ state: 'hidden' })
  await page.unroute('https://cdn.sanity.io/images/**', failPhoto)

  // Order directly from the details, keeping the menu and full box in sync.
  const secondProduct = page.locator('.product-card').nth(1)
  await secondProduct.locator('.quantity-label').click()
  const titleTrigger = page.locator('.product-title-button').first()
  await titleTrigger.click()
  await preview.waitFor()
  const modalIncrease = preview.getByRole('button', {
    name: `زيادة كمية ${menu.products[0].name} في التفاصيل`, exact: true,
  })
  const modalDecrease = preview.getByRole('button', {
    name: `تقليل كمية ${menu.products[0].name} في التفاصيل`, exact: true,
  })
  const modalQuantity = preview.locator('.product-preview-quantity output')
  assert.equal(await modalDecrease.isDisabled(), true)
  await preview.getByRole('button', { name: 'أضف إلى الصندوق', exact: true }).click()
  assert.equal((await modalQuantity.textContent()).trim(), '1 في الصندوق')
  assert.equal(await modalIncrease.evaluate((element) => element === document.activeElement), true)
  await modalIncrease.click()
  assert.equal((await modalQuantity.textContent()).trim(), '2 في الصندوق')
  assert.equal(await page.locator('.product-card .quantity-label').first().locator('span').first().innerText(), '2')
  assert.ok((await preview.locator('.product-preview-line-total').innerText()).includes('11 JD'))
  const modalOrderUrl = new URL(await preview.locator('.product-preview-send').getAttribute('href'))
  assert.equal(modalOrderUrl.pathname, '/962790000000')
  assert.ok(modalOrderUrl.searchParams.get('text').includes('2 × 5.5 JD = 11 JD'))
  assert.ok(modalOrderUrl.searchParams.get('text').includes(menu.products[1].name))
  assert.ok(modalOrderUrl.searchParams.get('text').includes('المجموع: 16.5 JD'))
  assert.equal(modalOrderUrl.href, await page.locator('.cart-send').getAttribute('href'))
  // The WhatsApp link participates in the dialog's keyboard focus cycle.
  await preview.locator('.product-preview-send').focus()
  await page.keyboard.press('Tab')
  assert.equal(await preview.getByRole('button', { name: 'رجوع للقائمة' }).evaluate((element) => element === document.activeElement), true)
  await page.keyboard.press('Tab')
  assert.equal(await preview.locator('.product-preview-close').evaluate((element) => element === document.activeElement), true)
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Shift+Tab')
  assert.equal(await preview.locator('.product-preview-send').evaluate((element) => element === document.activeElement), true)
  await modalDecrease.click()
  await preview.getByRole('button', { name: 'رجوع للقائمة' }).click()
  await preview.waitFor({ state: 'hidden' })
  assert.equal(await titleTrigger.evaluate((element) => element === document.activeElement), true)
  await previewTrigger.click()
  await preview.waitFor()
  assert.equal((await modalQuantity.textContent()).trim(), '1 في الصندوق')
  await modalDecrease.click()
  assert.equal(await modalDecrease.isDisabled(), true)
  assert.equal(await preview.locator('.product-preview-send').count(), 0)
  assert.equal(await preview.getByRole('button', { name: 'أضف إلى الصندوق' }).isEnabled(), true)
  await page.keyboard.press('Escape')
  await preview.waitFor({ state: 'hidden' })
  await secondProduct.getByRole('button', { name: `تقليل كمية ${menu.products[1].name}`, exact: true }).click()
  assert.equal(await page.locator('.cart-bar').count(), 0)

  const heroPhotos = page.locator('#home .hero-photo-card img')
  assert.equal(await heroPhotos.count(), 3)
  assert.equal(
    new Set(await heroPhotos.evaluateAll((images) => images.map((image) => image.src))).size,
    3,
    'The hero shows three distinct bakery photos',
  )
  for (const photo of await heroPhotos.all()) {
    assert.ok((await photo.getAttribute('alt')).length > 0)
    await page.waitForFunction(
      (image) => image.complete && image.naturalWidth > 0,
      await photo.elementHandle(),
    )
  }
  assert.equal(await page.locator('#home .hero-product-caption, #home .hero-carousel-controls').count(), 0)
  for (const text of [
    'خلايا حلوة ومالحة، مخبوزة على طلبك',
    'test',
    'اختار نكهتك، شكّل صندوقك، واطلب عبر واتساب.',
    'شو نفسك اليوم؟',
    'كل لفّة… نكهة بتحبّها',
  ]) {
    assert.ok(!(await page.locator('#home').innerText()).includes(text))
  }
  // The photo collage remains view-only; ordering stays in the menu.
  assert.equal(await page.locator('.hero-photo-grid a, .hero-photo-grid button, .hero-photo-grid [tabindex]').count(), 0)
  const beforeHeroClick = page.url()
  await heroPhotos.first().click()
  assert.equal(page.url(), beforeHeroClick)
  assert.equal(await page.locator('.cart-bar').count(), 0)
  await page.locator('.hero-actions a[href="#menu"]').click()
  assert.equal(new URL(page.url()).hash, '#menu')
  // Ordering remains available from the menu.
  await page
    .locator('.product-card')
    .first()
    .getByRole('button', {
      name: `زيادة كمية ${menu.products[0].name}`,
      exact: true,
    })
    .click()
  await page.locator('.cart-bar').waitFor()
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
  assert.equal(await page.locator('.hero-subline').count(), 0)
  assert.equal(await page.locator('.bee-trail').count(), 0)
  assert.equal(await page.locator('#home a[href^="https://wa.me/"]').count(), 0)
  assert.equal(await page.locator('.header-order[href^="https://wa.me/"]').count(), 1)

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
  const newArrivals = menu.categories.find(({ _id }) => _id === 'category-new')
  const previousNewArrivalsOrder = newArrivals.order
  newArrivals.order = 99
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
  assert.deepEqual(
    await page.locator('.category-nav .category-chip').allTextContents(),
    ['جديدنا', 'الخلايا', 'كيك'],
    'New arrivals stays first in navigation regardless of its saved order',
  )
  assert.deepEqual(
    await page.locator('.menu-content > .category-section > .section-title-wrap h2').allTextContents(),
    ['جديدنا', 'الخلايا', 'كيك'],
    'Category sections follow the same order as navigation',
  )
  newArrivals.order = previousNewArrivalsOrder
  menu.categories.splice(-2)
  menu.products.pop()
  await page
    .getByRole('heading', { name: 'كيك الشوكليت', exact: true })
    .waitFor({ state: 'detached' })

  // Arbitrary editor-created categories stay reachable without widening the page.
  for (let index = 0; index < 14; index++)
    menu.categories.push({
      _id: 'overflow-category-' + index,
      title: 'قسم تجريبي إضافي ' + index,
      slug: 'overflow-' + index,
      order: index + 10,
    })
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.waitForFunction(() =>
    document.querySelectorAll('.category-nav .category-chip').length === 16,
  )
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    'Many categories must not cause desktop horizontal overflow',
  )
  assert.equal(
    await page.locator('.category-nav-inner').evaluate(
      (element) => getComputedStyle(element).overflowX,
    ),
    'auto',
  )
  menu.categories.splice(-14)
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.waitForFunction(() =>
    document.querySelectorAll('.category-nav .category-chip').length === 2,
  )

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
  await page.locator('.cart-dialog').click({ position: { x: 5, y: 5 } })
  assert.equal(await page.locator('dialog[open]').count(), 1)
  await page.mouse.click(2, 2)
  assert.equal(await page.locator('dialog[open]').count(), 0)
  await page.locator('.cart-summary').click()
  await page.locator('dialog[open]').waitFor()
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
    for (const photo of await heroPhotos.all()) {
      const bounds = await photo.boundingBox()
      assert.ok(
        bounds.x >= 0 && bounds.x + bounds.width <= width,
        `Every hero photo fits at ${width}px`,
      )
    }
    const brandName = page.locator('.mobile-brand-name')
    assert.equal(await brandName.isVisible(), width < 768)
    if (width < 768) {
      assert.equal(await brandName.innerText(), 'BeeBites')
      const logo = await page.locator('.site-header .brand-logo').boundingBox()
      const name = await brandName.boundingBox()
      assert.ok(name.x + name.width <= logo.x, 'The mobile wordmark sits beside the logo')
    }
    // The extra mobile branding must still leave room for cart/order/menu controls.
    await first.getByRole('button', { name: 'زيادة كمية خلية شوكليت مكس', exact: true }).click()
    await page.locator('.header-bag').waitFor()
    const brand = await page.locator('.site-header .brand-link').boundingBox()
    const controls = await page.locator('.header-order').locator('..').boundingBox()
    assert.ok(brand.x >= controls.x + controls.width, `Header controls do not overlap the brand at ${width}px`)
    assert.ok(controls.x >= 0 && brand.x + brand.width <= width, `Header fits with a filled cart at ${width}px`)
    await first.getByRole('button', { name: 'تقليل كمية خلية شوكليت مكس', exact: true }).click()
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: `test-results/hero-photos-${width}.png` })
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme })
      await previewTrigger.click()
      await preview.waitFor()
      const bounds = await preview.boundingBox()
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width, `Preview fits at ${width}px in ${colorScheme} mode`)
      assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= 900, 'Preview fits viewport height')
      assert.equal(await preview.evaluate((element) => element.scrollWidth <= element.clientWidth), true)
      await page.screenshot({ path: `test-results/product-preview-${width}-${colorScheme}.png` })
      await preview.getByRole('button', { name: 'أضف إلى الصندوق', exact: true }).click()
      await preview.locator('.product-preview-send[href^="https://wa.me/"]').waitFor()
      assert.equal(await preview.evaluate((element) => element.scrollWidth <= element.clientWidth), true)
      for (const control of await preview.locator('.product-preview-quantity button').all()) {
        const box = await control.boundingBox()
        assert.ok(box.width >= 44 && box.height >= 44, `Modal quantity controls are easy to tap at ${width}px`)
      }
      await page.screenshot({ path: `test-results/product-modal-order-${width}-${colorScheme}.png` })
      await modalDecrease.click()
      await preview.getByRole('button', { name: 'رجوع للقائمة' }).click()
      await preview.waitFor({ state: 'hidden' })
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

  // Long descriptions stay readable on small screens with the close control reachable.
  await page.setViewportSize({ width: 320, height: 568 })
  const originalDescription = menu.products[0].description
  menu.products[0].description = originalDescription.repeat(24)
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.waitForFunction((description) => document.querySelector('.product-card .product-description')?.textContent === description, menu.products[0].description)
  await previewTrigger.click()
  await preview.waitFor()
  await preview.evaluate((element) => { element.scrollTop = element.scrollHeight })
  const stickyClose = await preview.locator('.product-preview-close').boundingBox()
  assert.ok(stickyClose.y >= 0 && stickyClose.y + stickyClose.height <= 568)
  assert.equal(await preview.evaluate((element) => element.scrollWidth <= element.clientWidth), true)
  await preview.locator('.product-preview-close').click()
  await preview.waitFor({ state: 'hidden' })
  menu.products[0].description = originalDescription
  await page.setViewportSize({ width: 1440, height: 900 })

  // The three photos stay still with either motion preference and across CMS refreshes.
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.clock.install()
  await page.reload()
  await heroPhotos.first().waitFor()
  const beforeRefresh = await heroPhotos.evaluateAll((images) => images.map((image) => image.alt))
  await page.clock.runFor(12000)
  assert.deepEqual(await heroPhotos.evaluateAll((images) => images.map((image) => image.alt)), beforeRefresh)
  assert.equal(await page.locator('#home button').count(), 0)
  await page.emulateMedia({ reducedMotion: 'reduce' })

  menu = { ...menu, products: [] }
  await page.reload()
  await page.locator('.empty-category').first().waitFor()
  assert.equal(await heroPhotos.count(), 3)
  menu.products = [fallbackMenu.products[0]]
  await page.reload()
  await page.locator('.product-card').waitFor()
  assert.equal(await heroPhotos.count(), 3)

  // A withdrawn cart item must not return merely because it is published again.
  await page.locator('.product-card .quantity-label').click()
  await page.locator('.cart-bar').waitFor()
  await previewTrigger.click()
  await preview.waitFor()
  menu.products = []
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.locator('.product-card').waitFor({ state: 'detached' })
  await preview.waitFor({ state: 'hidden' })
  menu.products = [fallbackMenu.products[0]]
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.locator('.product-card').waitFor()
  assert.equal(await page.locator('.cart-bar').count(), 0)

  // A failed initial CMS read keeps the saved cart and never offers sample stock.
  menu.products = [
    { ...fallbackMenu.products[0], _id: 'published-cart-product' },
  ]
  await page.evaluate(() =>
    localStorage.setItem(
      'beebites-cart-v1',
      JSON.stringify({ 'published-cart-product': 2 }),
    ),
  )
  failCms = true
  await page.reload()
  await page.locator('.menu-notice').waitFor()
  assert.equal(await page.locator('.product-card').count(), 0)
  assert.equal(await page.locator('.cart-bar').count(), 0)
  assert.equal(
    await page.evaluate(() => localStorage.getItem('beebites-cart-v1')),
    JSON.stringify({ 'published-cart-product': 2 }),
  )
  assert.equal(await page.locator('.announcement').count(), 0)
  assert.equal(await page.locator('.hero-subline').count(), 0)
  assert.equal(await page.locator('.fab-link').isDisabled(), true)
  failCms = false
  await page.locator('.menu-notice button').click()
  await page.locator('#menu-product-published-cart-product').waitFor()
  await page.locator('.cart-send[href^="https://wa.me/"]').waitFor()
  assert.equal(await page.locator('.product-card').count(), 1)
  assert.ok((await page.locator('.cart-summary').innerText()).includes('11 JD'))
  assert.equal(await page.locator('.menu-notice').count(), 0)
  assert.equal(
    await page.evaluate(() => document.activeElement?.id),
    'menu-title',
    'Retry keeps keyboard focus in the menu after removing the notice',
  )
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
  await blockedStorage.route('https://fonts.googleapis.com/**', (route) =>
    route.fulfill({ contentType: 'text/css', body: '' }))
  await blockedStorage.route('**/api/sanity/**', (route) => {
    const query = new URL(route.request().url()).searchParams.get('query') || ''
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        result: query.includes('"categories"') ? menu : settings,
      }),
    })
  })
  const privatePage = await blockedStorage.newPage()
  privatePage.on('pageerror', (error) => errors.push(error.message))
  await privatePage.goto(origin)
  await privatePage.locator('.product-card').first().waitFor()
  await privatePage.locator('.product-card .product-image-wrap').first().tap()
  await privatePage.locator('.product-preview[open]').waitFor()
  await privatePage.getByRole('button', { name: 'أضف إلى الصندوق', exact: true }).tap()
  await privatePage.locator('.product-preview-send[href^="https://wa.me/"]').waitFor()
  await privatePage.getByRole('button', { name: 'رجوع للقائمة', exact: true }).tap()
  await privatePage.locator('.cart-bar').waitFor()
  await blockedStorage.close()
  assert.deepEqual(errors, [])
  console.log(
    'Browser checks passed: CMS loading/fallback, Sanity CDN photos, product modal ordering/quantities/full-box WhatsApp messages/focus/dismissal/image fallback/long content, three-photo hero, mobile branding and filled-cart header, empty/single-product menus, cart persistence, mobile touch ordering from the modal, blocked storage, RTL/LTR, light/dark preferences and four viewport sizes.',
  )
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
