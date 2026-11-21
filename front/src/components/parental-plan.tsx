import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import type { ParentalPool } from '@/lib/benefit-interview'
import { cn } from '@/lib/utils'

const currency = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' })

type Parent = 'first_parent' | 'second_parent'

export interface ParentResult {
  days: number
  gross: number | null
  status: string
  reason: string
}

export interface RateVariant {
  days: number
  gross: number
  byParent: Partial<Record<Parent, ParentResult>>
}

function weeks(days: number) {
  return Math.round(days / 7)
}

function money(grosze: number | null | undefined, known: boolean) {
  if (!known) return 'brak wyliczenia'
  return grosze === null || grosze === undefined ? 'kwota do uzupełnienia' : currency.format(grosze / 100)
}

/**
 * Plan urlopu rodzicielskiego. Cały wymiar jest wspólny dla obojga rodziców,
 * ale po dziewięć tygodni każdego z nich jest nieprzenoszalne. Suwak dzieli
 * tylko resztę, więc nigdy nie da się odebrać drugiej osobie jej dziewięciu tygodni.
 */
export function ParentalPlanCard({
  pool,
  respondent,
  secondShareDays,
  onSecondShareChange,
  averaged,
  flat,
  zaZyciem,
  workingOnLeave,
  partnerKnown,
  extendedDays,
  busy,
}: {
  pool: ParentalPool
  respondent: Parent
  secondShareDays: number
  onSecondShareChange: (days: number) => void
  averaged: RateVariant
  flat: RateVariant
  zaZyciem: boolean
  workingOnLeave: boolean
  partnerKnown: boolean
  extendedDays?: number
  busy?: boolean
}) {
  const exclusive = pool.exclusive_days_per_parent
  const sharedTotal = Math.max(0, pool.total_days - exclusive * 2)
  const sharedWeeks = Math.floor(sharedTotal / 7)
  const secondShare = Math.min(secondShareDays, sharedWeeks * 7)
  const firstDays = exclusive + (sharedTotal - secondShare)
  const secondDays = exclusive + secondShare
  const totalDays = pool.total_days
  const slice = (days: number) => `${(days / totalDays) * 100}%`

  const rows = [
    { parent: 'first_parent' as const, label: 'Pierwszy rodzic', days: firstDays },
    { parent: 'second_parent' as const, label: 'Drugi rodzic', days: secondDays },
  ]
  const differs = averaged.gross !== flat.gross
  const limitOne = zaZyciem ? 130 : 82
  const limitMulti = zaZyciem ? 134 : 86

  return (
    <Card className={cn('mt-8', busy && 'transition-opacity')}>
      <CardHeader>
        <CardTitle>Podział urlopu rodzicielskiego</CardTitle>
        <CardDescription>
          Cały wymiar to {weeks(totalDays)} tygodni dla obojga rodziców. Po 9 tygodni każdego
          rodzica jest nieprzenoszalne, a resztą dzielicie się dowolnie.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!workingOnLeave && (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <label htmlFor="second-share" className="text-sm font-medium">
                Wspólne tygodnie dla drugiego rodzica
              </label>
              <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-navy">{weeks(secondShare)} tyg.</span>
            </div>
            <Slider
              id="second-share"
              min={0}
              max={sharedWeeks}
              step={1}
              value={[weeks(secondShare)]}
              disabled={!partnerKnown || sharedWeeks === 0}
              onValueChange={([value]) => onSecondShareChange(value * 7)}
              aria-label="Wspólne tygodnie dla drugiego rodzica"
            />
            <p className="text-xs text-muted-foreground">
              {partnerKnown
                ? `Do podziału jest ${sharedWeeks} wspólnych tygodni. Suwak nie rusza dziewięciu tygodni każdego rodzica, więc drugi rodzic zachowuje swoje 9 tygodni także przy zerze.`
                : 'Uzupełnij kartę „Drugi rodzic” w formularzu i wyślij odpowiedzi ponownie, żeby podzielić wspólną pulę.'}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex h-3 overflow-hidden rounded-full" aria-hidden>
            <div className="bg-primary" style={{ width: slice(exclusive) }} />
            <div className="bg-primary/45" style={{ width: slice(sharedTotal - secondShare) }} />
            <div className="bg-gold/60" style={{ width: slice(secondShare) }} />
            <div className="bg-gold" style={{ width: slice(exclusive) }} />
          </div>
          <p className="text-xs text-muted-foreground">
            Ciemniejsze odcinki to dziewięć nieprzenoszalnych tygodni każdego rodzica, jaśniejsze to
            podzielona wspólna pula.
          </p>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {rows.map(({ parent, label, days }) => {
              const result = averaged.byParent[parent]
              const granted = result?.status === 'granted' || result?.status === 'partially_granted'
              return (
                <div key={parent} className="rounded-md bg-neutral-100 p-3">
                  <dt className="flex items-center gap-2 font-medium">
                    <span
                      className={cn('size-2.5 rounded-full', parent === 'first_parent' ? 'bg-primary' : 'bg-gold')}
                      aria-hidden
                    />
                    {label}
                    {parent === respondent && (
                      <span className="rounded-full bg-navy/10 px-2 py-0.5 text-xs font-normal text-navy">
                        Ty
                      </span>
                    )}
                  </dt>
                  <dd className="mt-1">
                    <span className="text-lg font-semibold">{weeks(days)} tyg.</span>
                    <span className="text-muted-foreground"> · {money(result?.gross, !!result)}</span>
                  </dd>
                  {result && !granted && (
                    <dd className="mt-1 text-xs text-muted-foreground">{result.reason}</dd>
                  )}
                </div>
              )
            })}
          </dl>
        </div>

        <div className="rounded-md bg-neutral-100 p-4">
          <p className="text-sm font-medium">Stawka zasiłku za urlop rodzicielski</p>
          {differs ? (
            <>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Wniosek do 21 dni po porodzie</dt>
                  <dd className="mt-0.5 text-lg font-semibold text-primary">
                    {currency.format(averaged.gross / 100)}
                  </dd>
                  <dd className="text-xs text-muted-foreground">81,5% podstawy</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Wniosek po 21 dniach</dt>
                  <dd className="mt-0.5 text-lg font-semibold text-navy">
                    {currency.format(flat.gross / 100)}
                  </dd>
                  <dd className="text-xs text-muted-foreground">70% podstawy</dd>
                </div>
              </dl>
              <p className="mt-3 text-sm">
                Wniosek w 21 dni daje{' '}
                <strong className="font-semibold">
                  {currency.format((averaged.gross - flat.gross) / 100)}
                </strong>{' '}
                więcej niż wniosek złożony później.
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Dla tego wariantu stawka 81,5% nie wchodzi, więc urlop rodzicielski liczy się po 70%.
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Dziewięć tygodni drugiego rodzica zawsze liczy się po 70%, nawet gdy pierwszy rodzic
            złoży wniosek na 81,5%.
          </p>
        </div>

        {workingOnLeave && (
          <div className="rounded-md bg-neutral-100 p-4">
            <p className="text-sm font-medium">Łączenie pracy z urlopem</p>
            <p className="mt-2 text-sm">
              {extendedDays !== undefined && extendedDays > 0
                ? <>Urlop wydłuża się do <strong className="font-semibold">{weeks(extendedDays)} tygodni</strong>. </>
                : null}
              Cały wymiar może się wydłużyć najwyżej do {limitOne} tygodni przy jednym dziecku
              i {limitMulti} tygodni przy więcej niż jednym.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Za okres pracy zasiłek za urlop rodzicielski zmniejsza się proporcjonalnie do wymiaru
              czasu pracy.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}