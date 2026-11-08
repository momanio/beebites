import { useEffect } from 'react'
import type { SiteSettings } from '../types/menu'
import { imageUrl } from '../lib/sanity'
import { safeSocialUrl, whatsappUrl } from '../lib/whatsapp'

export function Seo({ settings }: { settings: SiteSettings }) {
  const logo = imageUrl(settings.logo, 800) || '/logo.jpg'
  const favicon = imageUrl(settings.logo, 64) || '/logo.jpg'
  useEffect(() => {
    const absoluteLogo = new URL(logo, window.location.origin).href
    document
      .querySelector('meta[property="og:image"]')
      ?.setAttribute('content', absoluteLogo)
    document.querySelector('link[rel="icon"]')?.setAttribute('href', favicon)
  }, [logo, favicon])

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    name: 'BeeBites — بي بايتس',
    description: `${settings.heroSlogan}. ${settings.heroSubline}`,
    image: new URL(logo, window.location.origin).href,
    url: window.location.origin,
    servesCuisine: 'مخبوزات منزلية أردنية',
    address: { '@type': 'PostalAddress', addressCountry: 'JO' },
    sameAs: [settings.instagramUrl, settings.facebookUrl]
      .map(safeSocialUrl)
      .filter(Boolean),
    ...(whatsappUrl(settings.whatsappNumber, '')
      ? { telephone: `+${settings.whatsappNumber.replace(/\D/g, '')}` }
      : {}),
  }
  return (
    <script type="application/ld+json">
      {JSON.stringify(schema).replace(/</g, '\\u003c')}
    </script>
  )
}
