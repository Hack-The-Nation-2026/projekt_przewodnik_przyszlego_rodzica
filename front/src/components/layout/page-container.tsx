import type { ReactNode } from 'react'
import { Container } from '@/components/layout/container'
import { cn } from '@/lib/utils'

/**
 * Wspólna kolumna treści dla wszystkich podstron.
 *
 * Trzyma jedną szerokość, żeby karty nie zmieniały rozmiaru, gdy użytkownik
 * przechodzi z wejścia do kalkulatora, do świadczeń albo do dokumentów.
 * `className` służy do paddingu i układu, nie do nadpisywania `max-w-*`.
 */
export function PageContainer({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <Container className={cn('max-w-4xl', className)}>{children}</Container>
}