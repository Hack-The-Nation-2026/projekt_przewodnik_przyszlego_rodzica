import { useEffect, useRef } from 'react'
import { Accessibility, BookOpen, Contrast, PersonStanding, RotateCcw, Type, Volume2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { TEXT_SCALE_LABELS } from '@/lib/accessibility'
import type { TextScale } from '@/lib/accessibility'
import { useA11yStore } from '@/store/a11y-store'
import { cn } from '@/lib/utils'

function Row({ icon: Icon, title, description, children }: {
  icon: typeof Type
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

/** Jeden przełącznik zamiast dwóch przycisków: stan widać bez czytania. */
function Toggle({ id, checked, onChange, label }: {
  id: string
  checked: boolean
  onChange: (value: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors',
        checked ? 'border-primary bg-primary' : 'border-input bg-muted',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none block size-5 rounded-full bg-background shadow transition-transform',
          checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

/**
 * Jeden panel z ustawieniami dostępności, obok przełącznika logowania.
 *
 * Wysoki kontrast, nie tryb ciemny: mocniejsze obramowania, ciemniejszy tekst
 * pomocniczy i wyraźny obrys fokusu naprawiają czytanie, a nie tylko zmieniają
 * kolory na zrzucie ekranu.
 */
export function A11yPanel() {
  const settings = useA11yStore()
  const { panelOpen, setPanelOpen, update, reset } = settings
  const anchor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!panelOpen) return
    const onDown = (event: PointerEvent) => {
      if (!anchor.current?.contains(event.target as Node)) setPanelOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanelOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [panelOpen, setPanelOpen])

  return (
    <div ref={anchor} className="relative" data-print-hide>
      <Button
        variant="ghost"
        size="icon"
        aria-expanded={panelOpen}
        aria-label="Ustawienia dostępności"
        className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
        onClick={() => setPanelOpen(!panelOpen)}
      >
        <Accessibility />
      </Button>

      {panelOpen && (
        <section
          aria-label="Ustawienia dostępności"
          className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border bg-background p-4 text-foreground shadow-2xl"
        >
          <div className="mb-1 flex items-center gap-2">
            <PersonStanding className="size-4 text-primary" aria-hidden="true" />
            <h2 className="font-display text-base font-semibold">Dostępność</h2>
          </div>
          <p className="mb-2 text-xs text-muted-foreground">
            Wybory zapisują się w tej przeglądarce i działają od razu na całej stronie.
          </p>

          <div className="divide-y divide-border">
            <Row icon={Contrast} title="Wysoki kontrast" description="Mocniejsze obramowania i ciemniejszy tekst pomocniczy.">
              <Toggle
                id="a11y-contrast"
                label="Wysoki kontrast"
                checked={settings.contrast}
                onChange={(value) => update({ contrast: value })}
              />
            </Row>

            <Row icon={Zap} title="Ogranicz animacje" description="Wyłącza przejścia i przewijanie animowane.">
              <Toggle
                id="a11y-motion"
                label="Ogranicz animacje"
                checked={settings.reduceMotion}
                onChange={(value) => update({ reduceMotion: value })}
              />
            </Row>

            <Row icon={Volume2} title="Czytanie na głos" description="Pokaż przycisk „Przeczytaj wynik” w wynikach i na karcie.">
              <Toggle
                id="a11y-read"
                label="Czytanie na głos"
                checked={settings.readAloud}
                onChange={(value) => update({ readAloud: value })}
              />
            </Row>

            <Row icon={BookOpen} title="Prosty język" description="Krótsze zdania na trzech ekranach: wynik, ryzyka, terminy.">
              <Toggle
                id="a11y-plain"
                label="Prosty język"
                checked={settings.plainLanguage}
                onChange={(value) => update({ plainLanguage: value })}
              />
            </Row>

            <Row icon={Type} title="Rozmiar tekstu" description="Skaluje całą stronę, nie tylko akapity.">
              <select
                aria-label="Rozmiar tekstu"
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={settings.textScale}
                onChange={(event) => update({ textScale: event.target.value as TextScale })}
              >
                {(Object.keys(TEXT_SCALE_LABELS) as TextScale[]).map((scale) => (
                  <option key={scale} value={scale}>
                    {TEXT_SCALE_LABELS[scale]}
                  </option>
                ))}
              </select>
            </Row>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
            <Label className="text-xs text-muted-foreground">
              Ustawienia zostają tylko na tym urządzeniu.
            </Label>
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              <RotateCcw aria-hidden="true" />
              Przywróć domyślne
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
