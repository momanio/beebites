const priceFormatter = new Intl.NumberFormat('en-JO', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatPrice(price: number): string {
  return `${priceFormatter.format(price)} JD`
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
