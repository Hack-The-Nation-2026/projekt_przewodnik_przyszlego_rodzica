/**
 * Ustawienia dostępności.
 *
 * Trzymamy je w localStorage, bo mają przetrwać odświeżenie i powrót na stronę
 * następnego dnia. To nie są dane o sprawie, tylko o tym, jak ktoś chce czytać:
 * kontrast, rozmiar tekstu, prosty język i tak dalej.
 */

export type TextScale = 'normal' | 'large' | 'largest'

export interface A11ySettings {
  /** Wysoki kontrast zamiast trybu ciemnego: mocniejsze obramowania i ciemniejszy tekst pomocniczy. */
  contrast: boolean
  textScale: TextScale
  /** Przełącznik pokazuje przycisk „Przeczytaj wynik" tam, gdzie ma sens. */
  readAloud: boolean
  plainLanguage: boolean
  reduceMotion: boolean
}

export const defaultA11ySettings: A11ySettings = {
  contrast: false,
  textScale: 'normal',
  readAloud: false,
  plainLanguage: false,
  reduceMotion: false,
}

export const TEXT_SCALE_LABELS: Record<TextScale, string> = {
  normal: 'Normalny',
  large: 'Większy',
  largest: 'Największy',
}

export const A11Y_STORAGE_KEY = 'skrzydla-a11y'

export function readA11ySettings(): A11ySettings {
  if (typeof localStorage === 'undefined') return defaultA11ySettings
  try {
    const raw = localStorage.getItem(A11Y_STORAGE_KEY)
    if (!raw) return defaultA11ySettings
    const parsed = JSON.parse(raw) as Partial<A11ySettings>
    return {
      contrast: parsed.contrast === true,
      textScale: parsed.textScale === 'large' || parsed.textScale === 'largest' ? parsed.textScale : 'normal',
      readAloud: parsed.readAloud === true,
      plainLanguage: parsed.plainLanguage === true,
      reduceMotion: parsed.reduceMotion === true,
    }
  } catch {
    return defaultA11ySettings
  }
}

export function writeA11ySettings(settings: A11ySettings) {
  try {
    localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Prywatny tryb przeglądarki bywa zablokowany. Ustawienia działają wtedy
    // tylko do końca wizyty, więc nie przerywamy.
  }
}

/** Te znaczniki czyta arkusz stylów; jeden zapis, jedno miejsce prawdy. */
export function applyA11ySettings(settings: A11ySettings) {
  const root = document.documentElement
  root.dataset.contrast = settings.contrast ? 'high' : 'normal'
  root.dataset.text = settings.textScale
  root.dataset.plain = settings.plainLanguage ? 'on' : 'off'
  root.dataset.motion = settings.reduceMotion ? 'reduced' : 'full'
}

/**
 * Prosty język: krótkie wersje zdań napisane obok dłuższych, nie streszczenia
 * maszynowe. `plain` zwraca krótką wersję tylko wtedy, gdy przełącznik jest
 * włączony, więc teksty zostają w jednym miejscu.
 */
export function plain(settings: A11ySettings, full: string, simple: string) {
  return settings.plainLanguage ? simple : full
}
