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
  menu.products[0].heroHighlight = 'featured'
  menu.products[1].heroHighlight = 'trend'
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
    defaultWhatsappMessageEn: 'Hello BeeBites! I would like to order.',
    orderNoteEn: 'Please order a day ahead.',
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
  const heroTitle = page.locator('#home .hero-product-caption h2')
  const heroDots = page.locator('.hero-carousel-dots button')
  const heroNext = page.getByRole('button', { name: 'التالي', exact: true })
  const heroPrevious = page.getByRole('button', { name: 'السابق', exact: true })
  assert.equal(await heroPhotos.count(), 1)
  assert.equal(await heroDots.count(), 5)
  assert.equal(await heroTitle.innerText(), menu.products[0].name)
  assert.equal(await page.locator('.hero-product-description').innerText(), menu.products[0].description)
  assert.equal(new URL(await heroPhotos.getAttribute('src')).origin, 'https://cdn.sanity.io')
  assert.equal(new URL(await heroPhotos.getAttribute('src')).searchParams.get('fit'), 'max')
  await page.waitForFunction((image) => image.complete && image.naturalWidth > 0, await heroPhotos.elementHandle())
  const heroNames = await heroDots.evaluateAll((dots) => dots.map((dot) => dot.getAttribute('aria-label').replace('عرض ', '')))
  assert.equal(new Set(heroNames).size, 5)
  assert.deepEqual(heroNames.slice(0, 2), menu.products.slice(0, 2).map((product) => product.name))
  assert.equal(await page.locator('.hero-slide-counter').count(), 0)
  assert.equal(await page.locator('.hero-carousel-hint').getAttribute('aria-hidden'), 'false')
  assert.equal(await page.locator('.hero-product-caption').getAttribute('aria-live'), 'polite')
  assert.equal(await heroNext.getAttribute('aria-controls'), await page.locator('.hero-product-slide').getAttribute('id'))
  assert.equal(await heroPrevious.getAttribute('aria-controls'), await heroNext.getAttribute('aria-controls'))
  assert.ok((await heroNext.getAttribute('title')).includes(heroNames[1]))
  await heroNext.focus()
  await page.keyboard.press('Enter')
  assert.equal(await heroTitle.innerText(), heroNames[1])
  assert.equal(await heroNext.evaluate((element) => element === document.activeElement), true, 'The image arrow keeps keyboard focus after navigation')
  await page.keyboard.press('Enter')
  assert.equal(await heroTitle.innerText(), heroNames[2])
  assert.equal(await page.locator('.hero-carousel-hint').getAttribute('aria-hidden'), 'true')
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.hero-carousel-hint')).opacity === '0')
  assert.equal(await heroNext.evaluate((element) => getComputedStyle(element).outlineWidth), '2px')
  assert.equal(await heroNext.evaluate((element) => getComputedStyle(element).outlineOffset), '3px')
  assert.equal(await heroNext.evaluate((element) => getComputedStyle(element).scale), 'none', 'Reduced motion avoids button scaling')
  for (let index = 0; index < 5; index++) {
    await heroDots.nth(index).click()
    assert.equal(await heroTitle.innerText(), heroNames[index])
    assert.equal(await heroDots.nth(index).getAttribute('aria-current'), 'true')
    assert.equal(await heroPhotos.count(), 1)
    assert.ok((await page.locator('.hero-product-description').innerText()).length > 0)
  }
  await heroNext.click()
  assert.equal(await heroTitle.innerText(), heroNames[0], 'Next wraps to the first product')
  await heroPrevious.click()
  assert.equal(await heroTitle.innerText(), heroNames[4], 'Previous wraps to the last product')
  await page.locator('.hero-showcase').focus()
  await page.keyboard.press('ArrowLeft')
  assert.equal(await heroTitle.innerText(), heroNames[0])
  await page.keyboard.press('ArrowRight')
  assert.equal(await heroTitle.innerText(), heroNames[4])
  assert.equal(await heroPrevious.locator('svg').evaluate((element) => getComputedStyle(element).rotate), '180deg')
  assert.equal(await heroNext.locator('svg').evaluate((element) => getComputedStyle(element).rotate), 'none')
  const rtlNextBounds = await heroNext.boundingBox()
  const rtlPreviousBounds = await heroPrevious.boundingBox()
  assert.ok(rtlNextBounds.x < rtlPreviousBounds.x, 'RTL next sits on the left')
  await page.evaluate(() => {
    document.documentElement.dir = 'ltr'
    document.documentElement.lang = 'en'
  })
  const englishNext = page.getByRole('button', { name: 'Next', exact: true })
  const englishPrevious = page.getByRole('button', { name: 'Previous', exact: true })
  await englishNext.waitFor()
  const englishHeroNames = await heroDots.evaluateAll((dots) => dots.map((dot) => dot.getAttribute('aria-label').replace('View ', '')))
  assert.equal(englishHeroNames[0], 'Mixed Chocolate Honeycomb')
  await page.keyboard.press('ArrowRight')
  assert.equal(await heroTitle.innerText(), englishHeroNames[0])
  assert.equal(await englishNext.locator('svg').evaluate((element) => getComputedStyle(element).rotate), '180deg')
  assert.equal(await englishPrevious.locator('svg').evaluate((element) => getComputedStyle(element).rotate), 'none')
  assert.ok((await englishNext.boundingBox()).x > (await englishPrevious.boundingBox()).x, 'LTR next sits on the right')
  await page.keyboard.press('ArrowLeft')
  assert.equal(await heroTitle.innerText(), englishHeroNames[4])
  await page.evaluate(() => {
    document.documentElement.dir = 'rtl'
    document.documentElement.lang = 'ar'
  })
  await heroNext.waitFor()
  await heroNext.click()
  const heroImageBounds = await heroPhotos.boundingBox()
  const dragStartX = heroImageBounds.x + heroImageBounds.width / 2
  const dragStartY = heroImageBounds.y + heroImageBounds.height / 2
  await page.mouse.move(dragStartX, dragStartY)
  await page.mouse.down()
  await page.mouse.move(dragStartX + 110, dragStartY, { steps: 8 })
  await page.mouse.up()
  await page.waitForFunction((name) => document.querySelector('.hero-product-caption h2')?.textContent === name, heroNames[1])
  await heroDots.first().click()
  assert.equal(await page.locator('.hero-actions, #home a[href="#menu"]').count(), 0)
  assert.ok(!(await page.locator('#home').innerText()).includes('شاهد القائمة'))
  // Viewing or dragging a hero product leaves the cart unchanged.
  await heroPhotos.click()
  assert.equal(await page.locator('.cart-bar').count(), 0)
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

  // Category highlights follow clicks, keyboard navigation and the visible section.
  const currentMainCategory = page.locator('.category-nav .category-chip[aria-current="location"]')
  const newCategoryLink = page.locator('.category-nav a[href="#category-category-new"]')
  const cellsCategoryLink = page.locator('.category-nav a[href="#category-category-cells"]')
  const sweetCategoryLink = page.locator('.subcategory-nav a[href="#category-category-sweet"]')
  const savoryCategoryLink = page.locator('.subcategory-nav a[href="#category-category-savory"]')
  async function trackCategoryHighlights(link) {
    await link.evaluate((element) => {
      element.addEventListener('click', () => {
        window.categoryHighlightHistory = []
        window.categoryHighlightObserver = new MutationObserver((records) => {
          for (const record of records) {
            const button = record.target
            if (button.matches('.category-nav .category-chip[aria-current="location"]'))
              window.categoryHighlightHistory.push(button.getAttribute('href'))
          }
        })
        window.categoryHighlightObserver.observe(document.querySelector('.category-nav'), {
          attributes: true,
          subtree: true,
          attributeFilter: ['aria-current'],
        })
      }, { once: true })
    })
  }
  async function stopTrackingCategoryHighlights() {
    await delay(250)
    return page.evaluate(() => {
      window.categoryHighlightObserver.disconnect()
      return [...new Set(window.categoryHighlightHistory)]
    })
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await trackCategoryHighlights(cellsCategoryLink)
  await cellsCategoryLink.click()
  await page.waitForFunction(() => {
    const section = document.getElementById('category-category-cells')
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)
    return Math.abs(section.getBoundingClientRect().top - padding) < 2
  })
  assert.equal(await cellsCategoryLink.getAttribute('aria-current'), 'location')
  assert.equal(await currentMainCategory.count(), 1)
  assert.deepEqual((await stopTrackingCategoryHighlights()).filter((href) => href !== '#category-category-cells'), [], 'Smooth navigation must not flash another category as selected')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await savoryCategoryLink.click()
  await page.waitForFunction(() => document.querySelector('.subcategory-nav a[href="#category-category-savory"]')?.getAttribute('aria-current') === 'location')
  assert.equal(await cellsCategoryLink.getAttribute('aria-current'), 'location', 'A selected subcategory also highlights its parent')
  await page.locator('#category-category-sweet').evaluate((section) => {
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)
    const margin = parseFloat(getComputedStyle(section).scrollMarginBlockStart)
    window.scrollTo(0, window.scrollY + section.getBoundingClientRect().top - padding - margin)
  })
  await page.waitForFunction(() => document.querySelector('.subcategory-nav a[href="#category-category-sweet"]')?.getAttribute('aria-current') === 'location')
  assert.equal(await sweetCategoryLink.getAttribute('aria-current'), 'location')
  assert.equal(await savoryCategoryLink.getAttribute('aria-current'), null)
  await newCategoryLink.focus()
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => document.querySelector('.category-nav a[href="#category-category-new"]')?.getAttribute('aria-current') === 'location')
  await newCategoryLink.evaluate((element) => element.blur())
  assert.equal(await newCategoryLink.getAttribute('aria-current'), 'location', 'The highlight remains after focus leaves the button')
  assert.equal(await currentMainCategory.count(), 1)

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
  for (const width of [320, 360, 390, 768, 1280, 1440]) {
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
      for (const arrow of [heroPrevious, heroNext]) {
        const control = await arrow.boundingBox()
        assert.ok(control.x + control.width <= bounds.x || control.x >= bounds.x + bounds.width, `Hero controls never cover the product photo at ${width}px`)
        assert.ok(Math.abs(control.y + control.height / 2 - bounds.y - bounds.height / 2) < 3, `Hero controls are centered beside the photo at ${width}px`)
        assert.equal(await arrow.evaluate((element) => element.firstElementChild.offsetWidth), width < 768 ? 36 : width < 1024 ? 44 : 48, `The visible button has the requested size at ${width}px`)
        if (control.x < 0 || control.x + control.width > width) await page.screenshot({ path: `test-results/carousel-overflow-${width}.png` })
        assert.ok(control.x >= 0 && control.x + control.width <= width, `Hero arrows stay inside the viewport at ${width}px: ${JSON.stringify(control)}`)
        assert.ok(control.width >= 44 && control.height >= 44, 'Hero arrows are easy to tap')
        assert.equal(await arrow.evaluate((element) => {
          const bounds = element.getBoundingClientRect()
          return element.contains(document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2))
        }), true, 'Image navigation remains clickable beside the photo')
      }
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
    await page.screenshot({ path: `test-results/hero-slider-${width}.png` })
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
      await page.waitForFunction(() => document.querySelector('.subcategory-nav a[href="#category-category-savory"]')?.getAttribute('aria-current') === 'location')
      assert.equal(await cellsCategoryLink.getAttribute('aria-current'), 'location')
      if (width === 390) {
        await page.emulateMedia({ reducedMotion: 'no-preference' })
        await trackCategoryHighlights(newCategoryLink)
        await newCategoryLink.click()
        await page.waitForFunction(() => {
          const section = document.getElementById('category-category-new')
          const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)
          return Math.abs(section.getBoundingClientRect().top - padding) < 2
        })
        assert.deepEqual((await stopTrackingCategoryHighlights()).filter((href) => href !== '#category-category-new'), [], 'Mobile navigation must keep the clicked category highlighted throughout the scroll')
        assert.equal(await newCategoryLink.getAttribute('aria-current'), 'location')
        await page.emulateMedia({ reducedMotion: 'reduce' })
      }
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

  // Manual navigation stays put with either motion preference and across CMS refreshes.
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.clock.install()
  await page.reload()
  await page.locator('.product-card').first().waitFor()
  await heroNext.click()
  const beforeRefresh = await heroTitle.innerText()
  const beforeRefreshChoices = await heroDots.evaluateAll((dots) => dots.map((dot) => dot.getAttribute('aria-label')))
  await page.clock.runFor(12000)
  assert.equal(await heroTitle.innerText(), beforeRefresh, 'There is no autoplay')
  assert.deepEqual(await heroDots.evaluateAll((dots) => dots.map((dot) => dot.getAttribute('aria-label'))), beforeRefreshChoices)
  await page.emulateMedia({ reducedMotion: 'reduce' })

  // Publishing different Featured/Trend choices updates the five-product selection.
  const newHeroProducts = menu.products.filter((product) => product.available && !product.comingSoon).slice(-5)
  for (const product of menu.products) product.heroHighlight = 'none'
  for (const product of newHeroProducts) product.heroHighlight = 'trend'
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.waitForFunction((names) => {
    const actual = [...document.querySelectorAll('.hero-carousel-dots button')].map((dot) => dot.getAttribute('aria-label').replace('عرض ', ''))
    return actual.length === 5 && names.every((name) => actual.includes(name))
  }, newHeroProducts.map((product) => product.name))
  assert.equal(await heroDots.count(), 5)
  const refreshedHeroTitle = await heroTitle.innerText()
  assert.ok(newHeroProducts.some((product) => product.name === refreshedHeroTitle))

  menu = { ...menu, products: [] }
  await page.reload()
  await page.locator('.empty-category').first().waitFor()
  assert.equal(await heroPhotos.count(), 0)
  assert.equal(await heroDots.count(), 0)
  menu.products = [fallbackMenu.products[0]]
  await page.reload()
  await page.locator('.product-card').waitFor()
  assert.equal(await heroPhotos.count(), 1)
  assert.equal(await heroTitle.innerText(), menu.products[0].name)
  assert.equal(await page.locator('.hero-carousel-controls').count(), 0)
  assert.equal(await heroPhotos.getAttribute('src'), '/product-placeholder.svg')

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
  assert.equal(await heroPhotos.count(), 0)
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
  // A full language switch translates the storefront and keeps the existing box.
  await page.setViewportSize({ width: 1280, height: 900 })
  menu.products[0].nameEn = 'English pastry from Studio'
  menu.products[0].descriptionEn = 'An English product description from Studio.'
  menu.categories.find((category) => category._id === 'category-sweet').titleEn = 'Sweet favourites'
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await delay(450)
  const savedCartBeforeLanguage = await page.evaluate(() => localStorage.getItem('beebites-cart-v1'))
  await page.getByRole('button', { name: 'Switch to English', exact: true }).click()
  await page.getByRole('heading', { name: 'The BeeBites menu', exact: true }).waitFor()
  assert.equal(await page.locator('html').getAttribute('dir'), 'ltr')
  assert.equal(await page.locator('html').getAttribute('lang'), 'en')
  assert.equal(await page.locator('#about h2').innerText(), 'Why BeeBites?')
  assert.equal(await page.locator('#about h3').first().innerText(), 'Soft as a cloud')
  assert.equal(await page.locator('.product-card h3').innerText(), 'English pastry from Studio')
  assert.equal(await page.locator('.subcategory-title').first().innerText(), 'Sweet favourites')
  assert.equal(await page.locator('.order-note p').innerText(), 'Please order a day ahead.')
  assert.equal(await page.evaluate(() => localStorage.getItem('beebites-cart-v1')), savedCartBeforeLanguage)
  assert.ok((await page.locator('.cart-summary').innerText()).includes('2 items'))
  const englishOrder = new URL(await page.locator('.cart-send').getAttribute('href')).searchParams.get('text')
  assert.ok(englishOrder.startsWith('My BeeBites order'))
  assert.ok(englishOrder.includes('English pastry from Studio'))
  assert.ok(englishOrder.includes('Total: 11 JD'))
  assert.ok((await page.title()).includes('BeeBites |'))
  assert.equal(await page.locator('meta[property="og:locale"]').getAttribute('content'), 'en_JO')
  await previewTrigger.click()
  await preview.waitFor()
  assert.equal(await preview.locator('h2').innerText(), 'English pastry from Studio')
  assert.equal(await preview.locator('.product-preview-description').innerText(), 'An English product description from Studio.')
  await preview.getByRole('button', { name: 'Increase quantity of English pastry from Studio in details', exact: true }).click()
  await preview.getByRole('button', { name: 'Decrease quantity of English pastry from Studio in details', exact: true }).click()
  await preview.getByRole('button', { name: 'Back to menu', exact: true }).click()
  for (const width of [320, 360, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await page.evaluate(() => window.scrollTo(0, 0))
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `English layout fits at ${width}px`)
    const brandBounds = await page.locator('.site-header .brand-link').boundingBox()
    const actionBounds = await page.locator('.header-order').locator('..').boundingBox()
    assert.ok(brandBounds.x + brandBounds.width <= actionBounds.x, `English header controls fit with a full box at ${width}px`)
    await page.screenshot({ path: `test-results/english-${width}.png` })
  }
  await page.reload()
  await page.getByRole('heading', { name: 'The BeeBites menu', exact: true }).waitFor()
  await page.locator('.cart-bar').waitFor()
  assert.equal(await page.locator('html').getAttribute('lang'), 'en', 'Language choice survives reload')
  await page.setViewportSize({ width: 390, height: 900 })
  await page.getByRole('button', { name: 'Open menu', exact: true }).click()
  await page.getByRole('button', { name: 'التبديل إلى العربية', exact: true }).click()
  await page.getByRole('heading', { name: 'قائمة بي بايتس', exact: true }).waitFor()
  assert.equal(await page.locator('html').getAttribute('dir'), 'rtl')
  assert.equal(await page.evaluate(() => localStorage.getItem('beebites-cart-v1')), savedCartBeforeLanguage)
  await page.getByRole('button', { name: 'Switch to English', exact: true }).click()
  await page.getByRole('button', { name: 'Close menu', exact: true }).click()
  await page.goto(`${origin}/?lang=ar`)
  await page.getByRole('heading', { name: 'قائمة بي بايتس', exact: true }).waitFor()
  assert.equal(await page.locator('html').getAttribute('dir'), 'rtl', 'An explicit language link overrides the stored preference')

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
  const touchMenu = { ...fallbackMenu, products: fallbackMenu.products.filter((product) => product.available && !product.comingSoon) }
  await blockedStorage.route('**/api/sanity/**', (route) => {
    const query = new URL(route.request().url()).searchParams.get('query') || ''
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        result: query.includes('"categories"') ? touchMenu : settings,
      }),
    })
  })
  const privatePage = await blockedStorage.newPage()
  privatePage.on('pageerror', (error) => errors.push(error.message))
  await privatePage.goto(origin)
  await privatePage.locator('.product-card').first().waitFor()
  const touchTitle = privatePage.locator('.hero-product-caption h2')
  const touchNames = await privatePage.locator('.hero-carousel-dots button').evaluateAll((dots) => dots.map((dot) => dot.getAttribute('aria-label').replace('عرض ', '')))
  await privatePage.getByRole('button', { name: 'التالي', exact: true }).tap()
  assert.equal(await touchTitle.innerText(), touchNames[1])
  await privatePage.getByRole('button', { name: 'السابق', exact: true }).tap()
  assert.equal(await touchTitle.innerText(), touchNames[0])
  const touchPhoto = await privatePage.locator('.hero-product-photo').boundingBox()
  const touchX = touchPhoto.x + touchPhoto.width / 2
  const touchY = touchPhoto.y + touchPhoto.height / 2
  const touchSession = await blockedStorage.newCDPSession(privatePage)
  async function swipeHero(distance) {
    await touchSession.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: touchX, y: touchY }] })
    for (let step = 1; step <= 6; step++) {
      await touchSession.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: touchX + distance * step / 6, y: touchY }] })
      await delay(20)
    }
    await touchSession.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }
  await swipeHero(100)
  await privatePage.waitForFunction((name) => document.querySelector('.hero-product-caption h2')?.textContent === name, touchNames[1])
  await swipeHero(-100)
  await privatePage.waitForFunction((name) => document.querySelector('.hero-product-caption h2')?.textContent === name, touchNames[0])
  assert.equal(await touchTitle.innerText(), touchNames[0])
  await privatePage.evaluate(() => {
    document.documentElement.lang = 'en'
    document.documentElement.dir = 'ltr'
  })
  await privatePage.getByRole('button', { name: 'Next', exact: true }).waitFor()
  const englishTouchNames = await privatePage.locator('.hero-carousel-dots button').evaluateAll((dots) => dots.map((dot) => dot.getAttribute('aria-label').replace('View ', '')))
  await swipeHero(-100)
  await privatePage.waitForFunction((name) => document.querySelector('.hero-product-caption h2')?.textContent === name, englishTouchNames[1])
  await swipeHero(100)
  await privatePage.waitForFunction((name) => document.querySelector('.hero-product-caption h2')?.textContent === name, englishTouchNames[0])
  await privatePage.evaluate(() => {
    document.documentElement.lang = 'ar'
    document.documentElement.dir = 'rtl'
  })
  assert.equal(await privatePage.locator('.cart-bar').count(), 0)
  await privatePage.locator('.product-card .product-image-wrap').first().tap()
  await privatePage.locator('.product-preview[open]').waitFor()
  await privatePage.getByRole('button', { name: 'أضف إلى الصندوق', exact: true }).tap()
  await privatePage.locator('.product-preview-send[href^="https://wa.me/"]').waitFor()
  await privatePage.getByRole('button', { name: 'رجوع للقائمة', exact: true }).tap()
  await privatePage.locator('.cart-bar').waitFor()
  await blockedStorage.close()
  assert.deepEqual(errors, [])
  console.log(
    'Browser checks passed: CMS loading/fallback, Sanity CDN photos, product modal ordering/quantities/full-box WhatsApp messages/focus/dismissal/image fallback/long content, manual five-product hero, Featured/Trend updates, desktop drag and mobile swipes, mobile branding and filled-cart header, empty/single-product menus, cart persistence, mobile touch ordering from the modal, blocked storage, RTL/LTR, light/dark preferences, translated RTL/LTR carousel controls, unobstructed photos and six viewport sizes.',
  )
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
