import { useLanguage } from '../hooks/useLanguage'
import { Icon } from './Icon'

export function LanguageSwitch({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useLanguage()
  const next = language === 'ar' ? 'en' : 'ar'
  return (
    <button
      type="button"
      className={`language-switch ${className}`}
      lang={next}
      dir={next === 'en' ? 'ltr' : 'rtl'}
      aria-label={next === 'en' ? 'Switch to English' : 'التبديل إلى العربية'}
      onClick={() => setLanguage(next)}
    >
      <Icon name="globe" size={17} />
      <span>{next === 'en' ? 'English' : 'العربية'}</span>
    </button>
  )
}
