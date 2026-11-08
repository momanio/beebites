import type { SiteSettings } from '../types/menu'
import { safeSocialUrl } from '../lib/whatsapp'
import { Icon } from './Icon'

export function SocialLinks({
  settings,
  compact = false,
}: {
  settings: SiteSettings
  compact?: boolean
}) {
  const instagram = safeSocialUrl(settings.instagramUrl)
  const facebook = safeSocialUrl(settings.facebookUrl)
  return (
    <div className={`social-links ${compact ? 'social-links-compact' : ''}`}>
      {instagram && (
        <a
          href={instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="بي بايتس على إنستغرام"
        >
          <Icon name="instagram" size={21} />
          {!compact && <span>إنستغرام</span>}
        </a>
      )}
      {facebook && (
        <a
          href={facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="بي بايتس على فيسبوك"
        >
          <Icon name="facebook" size={20} />
          {!compact && <span>فيسبوك</span>}
        </a>
      )}
    </div>
  )
}
