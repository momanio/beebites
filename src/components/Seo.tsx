import { useEffect } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import type { SiteSettings } from '../types/menu'
import { imageUrl } from '../lib/sanity'
import { safeSocialUrl, whatsappUrl } from '../lib/whatsapp'

export function Seo({ settings, pageTitle }: { settings: SiteSettings; pageTitle?: string }) {
  const { language, t } = useLanguage()
  const { heroSlogan, heroSubline, instagramUrl, facebookUrl, whatsappNumber } = settings
  const logo = imageUrl(settings.logo, 800) || '/logo.jpg'
  const favicon = imageUrl(settings.logo, 64) || '/favicon.png'
  const title = pageTitle ? `${pageTitle} | BeeBites` : t('بي بايتس | طراوة لا تقاوم، طعم لا ينسى')
  const description = t('خلية نحل ومخبوزات منزلية في الأردن. اختار حلا جمعتك، ونخبزها طازجة إلك.')
  const imageAlt = t('شعار BeeBites — بي بايتس')
  useEffect(() => {
    const absoluteLogo = new URL(logo, window.location.origin).href
    document
      .querySelector('meta[property="og:image"]')
      ?.setAttribute('content', absoluteLogo)
    document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', absoluteLogo)
    document.querySelector('link[rel="icon"]')?.setAttribute('href', favicon)
    document.title = title
    for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]'])
      document.querySelector(selector)?.setAttribute('content', description)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title)
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title)
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', language === 'en' ? 'en_JO' : 'ar_JO')
    document.querySelector('meta[property="og:image:alt"]')?.setAttribute('content', imageAlt)
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Bakery',
      name: language === 'en' ? 'BeeBites' : 'BeeBites — بي بايتس',
      description: `${heroSlogan}. ${heroSubline}`,
      image: absoluteLogo,
      url: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href || window.location.origin,
      servesCuisine: language === 'en' ? 'Jordanian home baking' : 'مخبوزات منزلية أردنية',
      address: { '@type': 'PostalAddress', addressCountry: 'JO' },
      sameAs: [instagramUrl, facebookUrl]
        .map(safeSocialUrl)
        .filter(Boolean),
      ...(whatsappUrl(whatsappNumber, '')
        ? { telephone: `+${whatsappNumber.replace(/\D/g, '')}` }
        : {}),
    }
    const schemaElement = document.getElementById('beebites-schema')
    if (schemaElement) schemaElement.textContent = JSON.stringify(schema)
  }, [logo, favicon, title, description, language, imageAlt, heroSlogan, heroSubline, instagramUrl, facebookUrl, whatsappNumber])

  return null
}
