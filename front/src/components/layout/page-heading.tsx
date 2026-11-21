import type { ReactNode } from 'react'
import { BackLink } from '@/components/layout/back-link'
import { PageBreadcrumbs } from '@/components/layout/page-breadcrumbs'

/**
 * Nagłówek podstrony: ścieżka w jednej linii, a pod nią tytuł i jedno zdanie opisu.
 *
 * Przycisk powrotu staje tylko wtedy, gdy strona jest częścią krótkiego ciągu
 * ekranów, a nie zwykłym miejscem z górnej nawigacji. Siedzi tuż po lewej od
 * tytułu, więc czyta się jak droga wyjścia z tego kroku.
 */
export function PageHeading({
  title,
  description,
  crumb,
  backTo,
  backLabel,
}: {
  title: string
  description?: ReactNode
  crumb?: string
  backTo?: string
  backLabel?: string
}) {
  return (
    <div>
      <PageBreadcrumbs items={[{ label: crumb ?? title }]} />
      <div className="mt-4 flex items-start gap-3">
        {backTo && <BackLink to={backTo} label={backLabel} />}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">{title}</h1>
          {description && (
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
}