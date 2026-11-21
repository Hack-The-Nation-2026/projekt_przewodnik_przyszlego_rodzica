import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoHint } from '@/components/ui/info-hint'
import { Slider } from '@/components/ui/slider'
import type { ParentalPool } from '@/lib/benefit-interview'
import { cn } from '@/lib/utils'
import { useSettings } from '@/hooks/use-settings'

const currency = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', useGrouping: 'always' })

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

  const rows = [
    { parent: 'first_parent' as const, label: 'Pierwszy rodzic', days: firstDays, dot: 'bg-primary' },
    { parent: 'second_parent' as const, label: 'Drugi rodzic', days: secondDays, dot: 'bg-gold' },
  ]
  const differs = averaged.gross !== flat.gross
  const limitOne = zaZyciem ? 130 : 82
  const limitMulti = zaZyciem ? 134 : 86
  // Stopy i wymiary urlopu przychodzą z panelu administracyjnego, więc opisy muszą
  // pokazywać to, czym naprawdę liczy backend.
  const { data: settings } = useSettings()
  const percent = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 })
  const averagedRate = percent.format(settings?.rates.averaged ?? 81.5)
  const parentalRate = percent.format(settings?.rates.parental ?? 70)
  const exclusiveWeeks = settings?.leave.exclusive_weeks ?? 9
  const parentalWeeksSingle = settings?.leave.parental_weeks_single ?? 41

  return (
    <Card className={cn(busy && 'transition-opacity')} aria-busy={busy}>
      <CardHeader>
        <div className="flex items-start gap-1.5">
          <CardTitle>Podział urlopu rodzicielskiego</CardTitle>
          <InfoHint label="Urlop rodzicielski">
            Czas po urlopie macierzyńskim, za który ZUS płaci zasiłek. Przy jednym dziecku to{' '}
            {parentalWeeksSingle}{' '}
            {parentalWeeksSingle === 1 ? 'tydzień' : parentalWeeksSingle < 5 ? 'tygodnie' : 'tygodni'}.
          </InfoHint>
        </div>
        <div className="flex items-start gap-1.5">
          <CardDescription>
            {weeks(totalDays)} tygodni dla obojga rodziców, po {exclusiveWeeks} nieprzenoszalnych dla
            każdego.
          </CardDescription>
          <InfoHint label="Jak czytać pasek podziału">
            Pełny kolor to 9 tygodni zarezerwowanych dla jednego rodzica. Jaśniejszy to tygodnie
            z wspólnej puli, które przesuwa suwak.
          </InfoHint>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {!workingOnLeave && (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-4">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <label htmlFor="second-share">Wspólne tygodnie dla drugiego rodzica</label>
                <InfoHint label="Wspólne tygodnie">
                  Tygodnie, które możesz oddać drugiemu rodzicowi. Po {exclusiveWeeks} tygodni każdego
                z was zostaje poza podziałem.
                </InfoHint>
              </span>
            </div>
            <div className="relative pt-6">
              <span
                className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-full bg-navy px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-white"
                style={{ left: `clamp(2.5rem, ${sharedWeeks ? (weeks(secondShare) / sharedWeeks) * 100 : 0}%, calc(100% - 2.5rem))` }}
                aria-hidden="true"
              >
                {weeks(secondShare)} tyg.
              </span>
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
            </div>
            {partnerKnown ? (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>{sharedWeeks} tyg.</span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Uzupełnij kartę „Drugi rodzic” w formularzu i wyślij odpowiedzi ponownie, żeby
                podzielić wspólną pulę.
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-1">
          {rows.map(({ parent, label, days, dot }, index) => {
            const result = averaged.byParent[parent]
            const granted = result?.status === 'granted' || result?.status === 'partially_granted'
            const shared = Math.max(days - exclusive, 0)
            const end = index > 0
            return (
              <div
                key={parent}
                className="min-w-0 sm:flex-[var(--share)_1_0]"
                style={{ '--share': days } as React.CSSProperties}
              >
                <div className={cn('mb-1.5 flex flex-wrap items-baseline gap-x-2 text-sm', end && 'sm:justify-end')}>
                  <span className="whitespace-nowrap font-medium">{label}</span>
                  {parent === respondent && (
                    <span className="whitespace-nowrap rounded-full bg-navy/10 px-2 py-0.5 text-xs font-normal text-navy">
                      Ty
                    </span>
                  )}
                </div>
                <div className="flex h-3 overflow-hidden rounded-full" aria-hidden="true">
                  <div className={dot} style={{ width: `${(exclusive / days) * 100}%` }} />
                  <div className={cn(dot, 'opacity-40')} style={{ width: `${(shared / days) * 100}%` }} />
                </div>
                <div className={cn('mt-1.5 text-sm', end && 'sm:text-right')}>
                  <span className="block text-base font-semibold">{weeks(days)} tyg.</span>
                  <span className="block text-muted-foreground">{money(result?.gross, !!result)}</span>
                </div>
                {result && !granted && (
                  <p className="mt-1 text-xs text-muted-foreground">{result.reason}</p>
                )}
              </div>
            )
          })}
        </div>

        <div className="border-t pt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h4 className="text-base font-semibold">Zasiłek za urlop rodzicielski, oboje rodzice</h4>
            <p className="text-xs text-muted-foreground">
              {exclusiveWeeks} tygodni drugiego rodzica zawsze po {parentalRate}%.
            </p>
          </div>
          {differs ? (
            <dl className="mt-3 grid gap-2 text-base sm:max-w-xl">
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  Wniosek w 21 dni ({averagedRate}%)
                  <InfoHint label="Wniosek w 21 dni">
                    Stawka {averagedRate}% należy się, gdy wniosek o urlop rodzicielski złożysz
                    w ciągu 21 dni od porodu.
                  </InfoHint>
                </dt>
                <dd className="font-semibold text-primary">{currency.format(averaged.gross / 100)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  Wniosek później ({parentalRate}%)
                  <InfoHint label="Wniosek później">
                    Po 21 dniach stawka spada do {parentalRate}%. Zasiłek dostajesz wtedy od razu
                    za cały urlop, w jednej niższej kwocie.
                  </InfoHint>
                </dt>
                <dd className="font-semibold text-navy">{currency.format(flat.gross / 100)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-t pt-2">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  Różnica
                  <InfoHint label="Różnica">
                    Ile więcej dostaniesz, gdy złożysz wniosek w terminie.
                  </InfoHint>
                </dt>
                <dd className="font-semibold">{currency.format((averaged.gross - flat.gross) / 100)}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Ten wariant nie obejmuje {averagedRate}%, więc urlop liczy się po {parentalRate}%.
            </p>
          )}
        </div>

        {workingOnLeave && (
          <div className="border-t pt-5">
            <h4 className="flex items-center gap-1.5 text-base font-semibold">
              Łączenie pracy z urlopem
              <InfoHint label="Łączenie pracy z urlopem">
                Możesz pracować na część etatu i dalej dostawać zasiłek. Urlop wydłuża się wtedy
                proporcjonalnie do wymiaru pracy.
              </InfoHint>
            </h4>
            <p className="mt-2 text-base">
              {extendedDays !== undefined && extendedDays > 0 && (
                <>Urlop wydłuża się do <strong className="font-semibold">{weeks(extendedDays)} tygodni</strong>. </>
              )}
              Limit: {limitOne} tygodni przy jednym dziecku, {limitMulti} przy więcej niż jednym.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Za czas pracy zasiłek zmniejsza się proporcjonalnie do wymiaru.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}