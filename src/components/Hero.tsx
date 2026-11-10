import { HoneyDrips } from './HoneyDrips'
import { HeroProducts } from './HeroProducts'
import { Icon } from './Icon'

export function Hero() {
  return (
    <section id="home" className="hero-section" aria-labelledby="hero-title">
      <HoneyDrips />
      <div className="hex-corner hex-corner-start" aria-hidden="true" />
      <h1 id="hero-title" className="sr-only" lang="en" dir="ltr">
        BeeBites
      </h1>
      <div className="page-container hero-grid">
        <HeroProducts />
        <div className="hero-actions">
          <a href="#menu" className="button button-chocolate">
            شاهد القائمة
            <Icon name="arrow" size={20} />
          </a>
        </div>
      </div>
      <div className="hero-bottom-line" aria-hidden="true">
        <span />
        <Icon name="hexagon" size={16} />
        <span />
      </div>
    </section>
  )
}
