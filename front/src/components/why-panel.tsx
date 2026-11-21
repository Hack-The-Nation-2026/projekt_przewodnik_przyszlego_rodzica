import { Link } from 'react-router-dom'
import { ArrowRight, HelpCircle } from 'lucide-react'
import { Term } from '@/components/glossary/term'
import { Button } from '@/components/ui/button'
import type { WhyPanelData } from '@/lib/why-panel'
import type { GlossaryKey } from '@/lib/glossary'
import { cn } from '@/lib/utils'

/** Trudne nazwy z rozbicia otwierają definicję ze słownika zamiast zostawiać pytanie. */
const TERM_OF_LABEL: Record<string, GlossaryKey> = {
  'Podstawa wymiaru': 'podstawa',
  'Wymiar okresu': 'okres_zasilkowy',
  'Okres z symulacji': 'okres_zasilkowy',
  'Kwota na dzień': 'podstawa',
}

/**
 * Mały odnośnik przy kwocie i przy wymiarze. Jeden mechanizm, to samo pytanie
 * „skąd", na które dziś trzeba sobie odpowiadać samemu.
 */
export function WhyTrigger({ onClick, label, className }: {
  onClick: () => void
  label: string
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded text-xs font-medium text-primary underline decoration-dotted underline-offset-2 hover:no-underline',
        className,
      )}
    >
      <HelpCircle className="size-3.5 shrink-0" aria-hidden="true" />
      {label}
    </button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="font-display text-base font-semibold">{title}</h3>
      {children}
    </section>
  )
}

/**
 * Panel „dlaczego tak": cztery sekcje przy kwocie, jedna droga wyjścia przy
 * braku uprawnień. Bez oceny szans i bez porady prawnej.
 */
export function WhyPanelBody({ data }: { data: WhyPanelData }) {
  return (
    <div className="space-y-5 text-sm">
      {data.granted ? (
        <>
          <Section title="Skąd ta liczba">
            <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {data.breakdown.map((row) => (
                <div
                  key={row.label}
                  className={cn(
                    'flex flex-wrap items-baseline justify-between gap-x-3 border-b border-dashed border-border pb-1 last:border-b-0',
                    row.emphasis && 'font-semibold',
                  )}
                >
                  <dt className="text-muted-foreground">
                    {TERM_OF_LABEL[row.label]
                      ? <Term name={TERM_OF_LABEL[row.label]}>{row.label}</Term>
                      : row.label}
                  </dt>
                  <dd className="tabular-nums">{row.value}</dd>
                </div>
              ))}
            </dl>
          </Section>

          {data.measureRule && (
            <Section title="Skąd ten wymiar">
              <p>{data.measureRule}</p>
            </Section>
          )}

          {data.counterfactuals.length > 0 && (
            <Section title="Co by zmieniło wynik">
              <ul className="list-disc space-y-1.5 pl-5">
                {data.counterfactuals.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Section>
          )}
        </>
      ) : (
        <Section title="Który warunek nie został spełniony">
          <p>{data.blockedCondition}</p>
          <p className="mt-3 font-medium">Co go spełni:</p>
          <ul className="mt-1 list-disc space-y-1.5 pl-5">
            {data.pathOut.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-3 text-muted-foreground">
            Przy odmowie decyzją ZUS masz miesiąc na odwołanie od dnia jej doręczenia.{' '}
            <Link to="/odwolanie" className="font-medium text-primary underline decoration-dotted underline-offset-2">
              Przejdź do ścieżki po decyzji odmownej
            </Link>
            .
          </p>
        </Section>
      )}

      <Section title="Podstawa prawna">
        <ul className="space-y-1">
          {data.legal.map((source) => (
            <li key={source.title}>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary underline decoration-dotted underline-offset-2"
              >
                {source.title}
                <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <p className="border-t border-border pt-3 text-xs text-muted-foreground">
        To wyjaśnienie wyliczenia, a nie porada prawna ani decyzja ZUS. Kwoty są brutto, bo podatek
        i składki rozlicza płatnik zasiłku.
      </p>
    </div>
  )
}

/** Zapasowy przycisk dla ekranów, które nie mają okna dialogowego. */
export function WhyButton({ onClick, label = 'Dlaczego tak' }: { onClick: () => void; label?: string }) {
  return (
    <Button type="button" variant="ghost" size="sm" onClick={onClick}>
      <HelpCircle aria-hidden="true" />
      {label}
    </Button>
  )
}
