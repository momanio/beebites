import type { Product, SiteSettings } from '../types/menu'
import { HoneyDrips } from './HoneyDrips'
import { HeroProducts } from './HeroProducts'
import { Icon } from './Icon'
import { WhatsAppLink } from './WhatsAppLink'

export function Hero({
  settings,
  products,
  loading,
  quantities,
  onQuantityChange,
}: {
  settings: SiteSettings
  products: Product[]
  loading: boolean
  quantities: Record<string, number>
  onQuantityChange: (id: string, change: number) => void
}) {
  return (
    <section id="home" className="hero-section" aria-labelledby="hero-title">
      <HoneyDrips />
      <div className="hex-corner hex-corner-start" aria-hidden="true" />
      <div className="page-container hero-grid">
        <div className="hero-copy">
          <div className="hero-heading">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              خلايا حلوة ومالحة، مخبوزة على طلبك
            </div>
            <h1 id="hero-title">
              {settings.heroSlogan}
              <span className="slogan-heart" aria-hidden="true">
                ♡
              </span>
            </h1>
            <p className="hero-subline">{settings.heroSubline}</p>
            <p className="hero-guide">
              اختار نكهتك، شكّل صندوقك، واطلب عبر واتساب.
            </p>
          </div>
          <div className="hero-actions">
            <a href="#menu" className="button button-chocolate">
              شاهد القائمة
              <Icon name="arrow" size={20} />
            </a>
            <WhatsAppLink settings={settings} className="button button-outline">
              <Icon name="whatsapp" size={20} />
              اطلب عبر واتساب
            </WhatsAppLink>
          </div>
          <div className="hero-footnote">
            <span className="tiny-hex" />
            خلية نحل . مخبوزات<span className="footnote-dot">·</span>
            <span>صُنع بحب في الأردن</span>
          </div>
        </div>
        <HeroProducts
          products={products}
          loading={loading}
          quantities={quantities}
          onQuantityChange={onQuantityChange}
        />
      </div>
      <div className="hero-bottom-line" aria-hidden="true">
        <span />
        <Icon name="hexagon" size={16} />
        <span />
      </div>
    </section>
  )
}
