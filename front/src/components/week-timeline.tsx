import { CalendarClock, CircleAlert } from 'lucide-react'
import { InfoHint } from '@/components/ui/info-hint'
import { Term } from '@/components/glossary/term'
import { formatDocumentDate, shiftDate } from '@/lib/benefit-documents'
import { blockColor } from '@/lib/week-timeline'
import type { TimelineBlock, WeekTimelineData } from '@/lib/week-timeline'
import { cn } from '@/lib/utils'

const currency = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', useGrouping: 'always' })
const shortDate = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'numeric', timeZone: 'UTC' })

/**
 * Podpis daty nad taśmą. Przy przewidywanej dacie porodu pokazujemy widełki,
 * bo pojedyncza data wyglądałaby na pewną, a nią nie jest.
 */
function dateTick(date: string, forecast: boolean) {
  if (!forecast) return formatDocumentDate(date).replace(/\s\d{4}$/, '')
  const from = shortDate.format(new Date(shiftDate(date, -14) + 'T00:00:00Z'))
  const to = shortDate.format(new Date(shiftDate(date, 14) + 'T00:00:00Z'))
  return `≈${from}–${to}`
}

function blockTitle(block: TimelineBlock, data: WeekTimelineData) {
  const start = formatDocumentDate(new Date(Date.parse(data.origin + 'T00:00:00Z') + block.startDay * 86_400_000).toISOString().slice(0, 10))
  const end = formatDocumentDate(new Date(Date.parse(data.origin + 'T00:00:00Z') + (block.startDay + block.days - 1) * 86_400_000).toISOString().slice(0, 10))
  const parts = [`${block.label}: ${start} – ${end}, ${block.days} dni`]
  if (block.rate) parts.push(`${block.rate}% podstawy wymiaru`)
  if (block.gross != null) parts.push(`${currency.format(block.gross / 100)} za cały okres`)
  if (block.exclusiveDays) parts.push(`${block.exclusiveDays} dni nieprzenoszalnych`)
  return parts.join('. ')
}

function pct(day: number, data: WeekTimelineData) {
  return ((day + data.leadingWeeks * 7) / data.totalDays) * 100
}

/** Pasmo jednego rodzica na szerokim ekranie: bloki w skali tygodni. */
function Lane({ lane, data }: { lane: WeekTimelineData['lanes'][number]; data: WeekTimelineData }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0 truncate text-xs font-medium text-muted-foreground sm:w-36 sm:text-sm">
        {lane.label}
      </span>
      <div className="relative h-9 min-w-0 flex-1 rounded-md bg-secondary/60">
        {lane.blocks.map((block) => {
          const colors = blockColor(block.benefit)
          const exclusivePart = block.days ? (block.exclusiveDays / block.days) * 100 : 0
          return (
            <button
              key={`${block.benefit}-${block.startDay}-${block.exclusiveDays}`}
              type="button"
              title={blockTitle(block, data)}
              aria-label={blockTitle(block, data)}
              style={{ left: `${pct(block.startDay, data)}%`, width: `${(block.days / data.totalDays) * 100}%` }}
              className={cn(
                'absolute top-0 flex h-full items-center overflow-hidden rounded-sm px-1.5 text-[10px] font-medium whitespace-nowrap sm:text-xs',
                colors.band,
                colors.text,
              )}
            >
              <span className="truncate">{block.label.replace('Zasiłek ', '')}</span>
              {exclusivePart > 0 && (
                <span
                  aria-hidden
                  style={{ width: `${exclusivePart}%` }}
                  className="absolute inset-y-0 left-0 border-r-2 border-white/70 bg-white/25"
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Na telefonie taśma obraca się w pion: ten sam plan czytany jako lista tygodni. */
function LaneAgenda({ lane, data }: { lane: WeekTimelineData['lanes'][number]; data: WeekTimelineData }) {
  if (!lane.blocks.length) {
    return (
      <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
        {lane.label}: brak okresu w tym wariancie.
      </div>
    )
  }
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{lane.label}</p>
      <ul className="space-y-1.5">
        {lane.blocks.map((block) => {
          const colors = blockColor(block.benefit)
          const start = new Date(Date.parse(data.origin + 'T00:00:00Z') + block.startDay * 86_400_000)
          const end = new Date(Date.parse(data.origin + 'T00:00:00Z') + (block.startDay + block.days - 1) * 86_400_000)
          return (
            <li
              key={`${block.benefit}-${block.startDay}-${block.exclusiveDays}`}
              className={cn('rounded-md p-2.5 text-sm', colors.band, colors.text)}
            >
              <span className="block font-medium">{block.label}</span>
              <span className="block text-xs opacity-90">
                {formatDocumentDate(start.toISOString().slice(0, 10))} – {formatDocumentDate(end.toISOString().slice(0, 10))}
              </span>
              <span className="block text-xs opacity-90">
                {block.days} dni{block.rate ? ` · ${block.rate}% podstawy` : ''}
                {block.gross != null ? ` · ${currency.format(block.gross / 100)}` : ''}
              </span>
              {block.exclusiveDays > 0 && (
                <span className="mt-0.5 block text-xs font-medium">
                  w tym {block.exclusiveDays} dni nieprzenoszalnych
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Markers({ data }: { data: WeekTimelineData }) {
  return (
    <>
      {data.markers.map((marker) => (
        <span
          key={`${marker.kind}-${marker.date}`}
          aria-hidden
          style={{ left: `${pct(marker.day, data)}%` }}
          className={cn(
            'absolute inset-y-0 w-px',
            marker.kind === 'birth' ? 'bg-navy' : marker.missed ? 'bg-destructive' : 'bg-primary',
            marker.kind === 'today' && 'border-l border-dashed bg-transparent',
          )}
        />
      ))}
    </>
  )
}

function Band({ data }: { data: WeekTimelineData }) {
  const weekTicks = data.weeks.filter((week) => week.week % 4 === 0)
  // Daty nad taśmą idą rzadziej niż tygodnie, bo przy 60 kolumnach nachodzą na siebie.
  const dateTicks = data.weeks.filter((week) => week.week % 12 === 0)
  return (
    <div className="space-y-2">
      {/* Nad taśmą daty, pod taśmą tygodnie od porodu. */}
      <div className="hidden sm:block">
        <div className="relative ml-28 h-4 sm:ml-36">
          {dateTicks.map((week) => (
            <span
              key={week.week}
              style={{ left: `${pct(week.startDay, data)}%` }}
              className="absolute -translate-x-1/2 text-[10px] whitespace-nowrap text-muted-foreground"
            >
              {dateTick(week.date, data.forecast)}
            </span>
          ))}
        </div>
        <div className="space-y-1.5">
          {data.lanes.map((lane) => (
            <div key={lane.person} className="relative">
              <Lane lane={lane} data={data} />
              <div aria-hidden className="pointer-events-none absolute inset-y-0 left-28 right-0 sm:left-36">
                <Markers data={data} />
              </div>
            </div>
          ))}
        </div>
        <div className="relative mt-1 ml-28 h-4 sm:ml-36">
          {weekTicks.map((week) => (
            <span
              key={week.week}
              style={{ left: `${pct(week.startDay, data)}%` }}
              className={cn(
                'absolute -translate-x-1/2 text-[10px] tabular-nums',
                week.week === 0 ? 'font-semibold text-navy' : 'text-muted-foreground',
              )}
            >
              {week.week === 0 ? 'poród' : week.week}
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-3 sm:hidden">
        {data.lanes.map((lane) => (
          <LaneAgenda key={lane.person} lane={lane} data={data} />
        ))}
      </div>
    </div>
  )
}

/**
 * Oś czasu tygodni. Czterdzieści jeden tygodni to dla człowieka liczba; taśma
 * pokazuje, że to prawie rok życia i że część tego czasu należy do drugiego
 * rodzica, a niewykorzystana przepada.
 */
export function WeekTimeline({
  data,
  variants,
  className,
}: {
  data: WeekTimelineData
  variants?: { label: string; data: WeekTimelineData }[]
  className?: string
}) {
  const missed = data.markers.filter((marker) => marker.kind === 'deadline' && marker.missed)
  return (
    <section className={cn('space-y-4', className)} aria-label="Oś czasu tygodni">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <CalendarClock className="size-5 text-primary" aria-hidden="true" />
          <h3 className="font-display text-lg font-semibold">Oś czasu tygodni</h3>
          <InfoHint label="Oś czasu tygodni">
            Taśma od szóstego tygodnia przed porodem do roku po nim. Macierzyński i rodzicielski są
            na jednej osi, więc widać, ile czasu jest już za Tobą, a ile przed Tobą.
          </InfoHint>
          {data.forecast && (
            <span className="rounded-full bg-gold/30 px-2.5 py-0.5 text-xs font-semibold text-gold-foreground">
              szacunkowe
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground" data-read>{data.status}</p>
      </div>

      <div className="rounded-lg border border-border p-4">
        <Band data={data} />
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
          {[...new Map(data.lanes.flatMap((lane) => lane.blocks).map((block) => [block.benefit, block])).values()].map((block) => {
            const colors = blockColor(block.benefit)
            return (
              <span key={block.benefit} className="flex items-center gap-1.5">
                <span aria-hidden className={cn('size-3 rounded-sm', colors.band)} />
                {block.label.replace('Zasiłek ', '')}
              </span>
            )
          })}
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="relative size-3 rounded-sm bg-primary">
              <span className="absolute inset-0 rounded-sm border-r-2 border-white/70 bg-white/40" />
            </span>
            <Term name="tygodnie_niezbywalne">tygodnie niezbywalne</Term>
          </span>
        </div>
      </div>

      {missed.length > 0 && (
        <p className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          <span>
            Czerwone znaczniki to terminy, które już minęły: {missed.map((marker) => `${marker.label} (${formatDocumentDate(marker.date)})`).join(', ')}.
            Symulacja liczy realny wariant po terminie, a nie ten, na który jest już za późno.
          </span>
        </p>
      )}

      {variants && variants.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-display text-base font-semibold">Porównanie wariantów</h4>
          {variants.map((variant, index) => (
            <div key={`${index}-${variant.label}`} className="rounded-lg border border-border p-4">
              <p className="mb-3 text-sm font-medium">{variant.label}</p>
              <Band data={variant.data} />
              <p className="mt-3 text-xs text-muted-foreground">{variant.data.status}</p>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Urlop drugiego rodzica układamy po Twoim, bo tak wygląda typowy plan. Kolejność i części
        wynikają z wniosków, które złożycie, więc taśma pokazuje wymiar, a nie decyzję za Was.
      </p>
    </section>
  )
}
