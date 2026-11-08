import type { SiteSettings } from '../types/menu'
import { Icon } from './Icon'

export function HighlightRibbon({ settings }: { settings: SiteSettings }) {
  if (!settings.highlightTitle && !settings.highlightText) return null
  return (
    <aside className="highlight-ribbon" aria-label="سر طراوة بي بايتس">
      <div className="ribbon-inner page-container">
        <Icon name="wheat" className="ribbon-wheat" size={42} />
        <div>
          <p className="ribbon-title">{settings.highlightTitle}</p>
          <p className="ribbon-text">{settings.highlightText}</p>
        </div>
        <Icon name="wheat" className="ribbon-wheat" size={42} />
      </div>
    </aside>
  )
}
