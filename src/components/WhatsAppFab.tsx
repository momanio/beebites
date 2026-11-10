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
  return (
    <div className={`whatsapp-fab ${hasCart ? 'fab-with-cart' : ''}`}>
      <WhatsAppLink
        settings={settings}
        className="fab-link button-whatsapp"
        label="تواصل معنا على واتساب"
      >
        <Icon name="whatsapp" size={28} />
      </WhatsAppLink>
      <span className="fab-tooltip" aria-hidden="true">
        نخبزلك شي حلو؟
      </span>
    </div>
  )
}
