import type { SiteSettings } from '../types/menu'
import { BrandLogo } from './BrandLogo'
import { HoneyDrips } from './HoneyDrips'
import { Icon } from './Icon'
import { Reveal } from './Reveal'
import { WhatsAppLink } from './WhatsAppLink'

export function Hero({ settings }: { settings: SiteSettings }) {
  return (
    <section id="home" className="hero-section" aria-labelledby="hero-title">
      <HoneyDrips />
      <div className="hex-corner hex-corner-start" aria-hidden="true" />
      <div className="page-container hero-grid">
        <Reveal className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-line" />
            من بيتنا… بكل حب <Icon name="heart" size={15} />
          </div>
          <h1 id="hero-title">
            {settings.heroSlogan}
            <span className="slogan-heart" aria-hidden="true">
              ♡
            </span>
          </h1>
          <p className="hero-subline">{settings.heroSubline}</p>
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
        </Reveal>
        <Reveal className="hero-art" delay={0.12}>
          <div className="hero-orbit" aria-hidden="true" />
          <span className="hero-art-note">شويّة عسل، كثير حبّ</span>
          <div className="hero-badge">
            <BrandLogo logo={settings.logo} large />
          </div>
          <div className="fresh-seal">
            <Icon name="wheat" size={26} />
            <span>
              طازجة
              <br />
              على طلبك
            </span>
          </div>
          <Icon name="wheat" size={84} className="floating-wheat wheat-one" />
          <Icon name="wheat" size={54} className="floating-wheat wheat-two" />
          <span className="hero-star hero-star-one" aria-hidden="true">
            ✧
          </span>
          <span className="hero-star hero-star-two" aria-hidden="true">
            ✧
          </span>
        </Reveal>
      </div>
      <div className="hero-bottom-line" aria-hidden="true">
        <span />
        <Icon name="hexagon" size={16} />
        <span />
      </div>
    </section>
  )
}
