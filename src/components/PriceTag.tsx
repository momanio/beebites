import { formatPrice } from '../lib/formatPrice'

export function PriceTag({ price }: { price: number }) {
  return (
    <span className="price-tag" dir="ltr">
      {formatPrice(price)}
    </span>
  )
}
