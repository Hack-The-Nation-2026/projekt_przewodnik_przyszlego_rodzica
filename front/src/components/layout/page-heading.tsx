import type { ReactNode } from 'react'
import { BackLink } from '@/components/layout/back-link'
import { PageBreadcrumbs } from '@/components/layout/page-breadcrumbs'

/**
 * Nagłówek podstrony: ścieżka, tytuł i jedno zdanie opisu.
 *
 * Przycisk powrotu staje tylko wtedy, gdy strona jest częścią krótkiego ciągu
 * ekranów, a nie zwykłym miejscem z górnej nawigacji. Ścieżka, tytuł i opis
 * trzymają się jednej lewej krawędzi, więc podstrony nie skaczą względem siebie.
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
    <div className="flex items-start gap-3">
      {backTo && <BackLink to={backTo} label={backLabel} />}
      <div className="min-w-0 flex-1">
        <PageBreadcrumbs items={[{ label: crumb ?? title }]} />
        <h1 className="mt-4 font-display text-3xl font-semibold text-navy sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}