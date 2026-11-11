import { HoneyDrips } from './HoneyDrips'
import { HeroProducts } from './HeroProducts'
import { Icon } from './Icon'
import type { Product } from '../types/menu'

export function Hero({ products }: { products: Product[] }) {
  return (
    <section id="home" className="hero-section" aria-labelledby="hero-title">
      <HoneyDrips />
      <div className="hex-corner hex-corner-start" aria-hidden="true" />
      <h1 id="hero-title" className="sr-only" lang="en" dir="ltr">
        BeeBites
      </h1>
      <div className="page-container hero-grid">
        <HeroProducts products={products} />
      </div>
      <div className="hero-bottom-line" aria-hidden="true">
        <span />
        <Icon name="hexagon" size={16} />
        <span />
      </div>
    </section>
  )
}
