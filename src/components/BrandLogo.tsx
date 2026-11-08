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
  const source = imageUrl(logo, large ? 800 : 160) || '/logo.jpg'
  const [failedSource, setFailedSource] = useState<string>()
  const [failedLocal, setFailedLocal] = useState(false)
  const effectiveSource = failedSource === source ? '/logo.jpg' : source

  if (failedLocal && effectiveSource === '/logo.jpg') {
    return (
      <span
        className={`brand-wordmark ${large ? 'brand-wordmark-large' : ''}`}
        aria-label="BeeBites بي بايتس"
      >
        <span lang="en" dir="ltr">
          BeeBites<span className="brand-dot">.</span>
        </span>
        <span className="brand-arabic">خلية نحل . مخبوزات</span>
      </span>
    )
  }

  return (
    <img
      className={`brand-logo ${large ? 'brand-logo-large' : ''}`}
      src={effectiveSource}
      alt="BeeBites — بي بايتس، خلية نحل ومخبوزات"
      width={large ? 420 : 64}
      height={large ? 420 : 64}
      loading={large ? 'eager' : 'lazy'}
      fetchPriority={large ? 'high' : 'auto'}
      onError={() => {
        if (effectiveSource === '/logo.jpg') setFailedLocal(true)
        else setFailedSource(source)
      }}
    />
  )
}
