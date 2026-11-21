import type { ReactNode } from 'react'
import { PageBreadcrumbs } from '@/components/layout/page-breadcrumbs'

/**
 * Nagłówek podstrony: ścieżka w jednej linii, a pod nią tytuł i jedno zdanie opisu.
 *
 * Przycisku powrotu tu nie ma. Podstrony z górnej nawigacji są zwykłymi miejscami,
 * a nie krokami, z których trzeba wyjść; „Wstecz” staje tylko w formularzach,
 * gdzie użytkownik naprawdę idzie krok po kroku.
 */
export function PageHeading({
  title,
  description,
  crumb,
}: {
  title: string
  description?: ReactNode
  crumb?: string
}) {
  return (
    <div>
      <PageBreadcrumbs items={[{ label: crumb ?? title }]} />
      <div className="mt-4 min-w-0">
        <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}