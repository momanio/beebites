import { useLanguage } from '../hooks/useLanguage'
import { useState } from 'react'
import type { SanityImage } from '../types/menu'
import { imageUrl } from '../lib/sanity'

export function BrandLogo({
  logo,
  large = false,
}: {
  logo?: SanityImage | null
  large?: boolean
}) {
  const { t } = useLanguage()
  const fallback = large ? '/logo.jpg' : '/logo-small.webp'
  const source = imageUrl(logo, large ? 800 : 160) || fallback
  const [failedSource, setFailedSource] = useState<string>()
  const [failedLocal, setFailedLocal] = useState(false)
  const effectiveSource = failedSource === source ? fallback : source

  if (failedLocal && effectiveSource === fallback) {
    return (
      <span
        className={`brand-wordmark ${large ? 'brand-wordmark-large' : ''}`}
        aria-label={t('BeeBites بي بايتس')}
      >
        <span lang="en" dir="ltr">
          BeeBites<span className="brand-dot">.</span>
        </span>
        <span className="brand-arabic">{t('خلية نحل . مخبوزات')}</span>
      </span>
    )
  }

  return (
    <img
      className={`brand-logo ${large ? 'brand-logo-large' : ''}`}
      src={effectiveSource}
      alt={t('BeeBites — بي بايتس، خلية نحل ومخبوزات')}
      width={large ? 420 : 64}
      height={large ? 420 : 64}
      loading={large ? 'eager' : 'lazy'}
      fetchPriority={large ? 'high' : 'auto'}
      onError={() => {
        if (effectiveSource === fallback) setFailedLocal(true)
        else setFailedSource(source)
      }}
    />
  )
}
