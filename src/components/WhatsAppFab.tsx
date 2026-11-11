import { useLanguage } from '../hooks/useLanguage'
import type { SiteSettings } from '../types/menu'
import { Icon } from './Icon'
import { WhatsAppLink } from './WhatsAppLink'

export function WhatsAppFab({
  settings,
  hasCart,
}: {
  settings: SiteSettings
  hasCart: boolean
}) {
  const { t } = useLanguage()
  return (
    <div className={`whatsapp-fab ${hasCart ? 'fab-with-cart' : ''}`}>
      <WhatsAppLink
        settings={settings}
        className="fab-link button-whatsapp"
        label={t('تواصل معنا على واتساب')}
      >
        <Icon name="whatsapp" size={28} />
      </WhatsAppLink>
      <span className="fab-tooltip" aria-hidden="true">
        {t('نخبزلك شي حلو؟')}
      </span>
    </div>
  )
}
