const photos = [
  { src: '/hero/caramel-bites.webp', alt: 'خلية نحل ذهبية مغطاة بالكراميل' },
  { src: '/hero/honey-bites.webp', alt: 'خلية نحل كلاسيكية مع العسل الطبيعي' },
  { src: '/hero/fresh-bites.webp', alt: 'خلية نحل بالفيتا والزعتر مخبوزة وطازجة' },
]

export function HeroProducts() {
  return (
    <div className="hero-showcase" role="group" aria-label="صور من مخبوزات بي بايتس">
      <div className="hero-photo-grid">
        {photos.map((photo, index) => (
          <div key={photo.src} className="hero-photo-card">
            <div className="hero-product-photo">
              <img
                src={photo.src}
                alt={photo.alt}
                width={index === 0 ? 941 : 960}
                height={index === 0 ? 1672 : 1280}
                loading="eager"
                fetchPriority={index === 0 ? 'high' : 'auto'}
                decoding="async"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
