import { InfoHint } from '@/components/ui/info-hint'
import { glossary, glossaryEntries } from '@/lib/glossary'
import type { GlossaryKey } from '@/lib/glossary'

/**
 * Pojęcie ze słownika: kropkowane podkreślenie, a pod nim definicja.
 *
 * Klik albo tap rozwija definicję w miejscu, bez przechodzenia na inną stronę.
 * Na komputerze działa też najechanie, a z klawiatury dojście tabem, otwarcie
 * enterem i zamknięcie escape — wszystko w `InfoHint`, żeby nie było dwóch
 * mechanizmów dymków.
 */
export function Term({ name, children, className }: {
  name: GlossaryKey
  children: React.ReactNode
  className?: string
}) {
  const entry = glossary[name]
  return (
    <InfoHint label={String(children)} className={className} trigger={<span className="cursor-help">{children}</span>}>
      <span className="block">
        <span className="mb-1 block font-semibold">{children}</span>
        {entry.what} {entry.where}
      </span>
    </InfoHint>
  )
}

/**
 * Cały słownik w jednym miejscu. Lista jest po to, żeby dało się ją przejrzeć
 * bez polowania na kropkowane słowa w tekście, i żeby definicje miały jedno
 * widoczne źródło.
 */
export function GlossaryList() {
  return (
    <dl className="divide-y divide-border">
      {glossaryEntries.map(([key, entry]) => (
        <div key={key} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:gap-6">
          <dt className="font-medium">
            <Term name={key}>{entry.term}</Term>
          </dt>
          <dd className="text-sm text-muted-foreground">
            {entry.what} {entry.where}
          </dd>
        </div>
      ))}
    </dl>
  )
}
