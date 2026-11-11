import { useLanguage } from '../hooks/useLanguage'
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
  const { t } = useLanguage()
  const instagram = safeSocialUrl(settings.instagramUrl)
  const facebook = safeSocialUrl(settings.facebookUrl)
  return (
    <div className={`social-links ${compact ? 'social-links-compact' : ''}`}>
      {instagram && (
        <a
          href={instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('بي بايتس على إنستغرام')}
        >
          <Icon name="instagram" size={21} />
          {!compact && <span>{t('إنستغرام')}</span>}
        </a>
      )}
      {facebook && (
        <a
          href={facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('بي بايتس على فيسبوك')}
        >
          <Icon name="facebook" size={20} />
          {!compact && <span>{t('فيسبوك')}</span>}
        </a>
      )}
    </div>
  )
}
