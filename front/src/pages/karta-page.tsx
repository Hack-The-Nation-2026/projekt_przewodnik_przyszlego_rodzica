import { useMemo } from 'react'
import { KartaPage } from '@/components/entitlement-card'
import { readEntitlementCard } from '@/lib/entitlement-card'

/** Karta uprawnień do wydruku. Dane przychodzą z wyniku sprawdzenia przez sessionStorage. */
export function KartaRoute() {
  const data = useMemo(() => readEntitlementCard(), [])
  return <KartaPage data={data} />
}