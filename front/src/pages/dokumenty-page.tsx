import { Suspense, lazy } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeading } from '@/components/layout/page-heading'
import { benefitList, type BenefitCode } from '@/lib/benefit-interview'

const BenefitDocuments = lazy(() => import('@/components/benefit-documents'))

export function DokumentyPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selected = searchParams.get('swiadczenie')
  const benefit = selected && Object.hasOwn(benefitList, selected) ? selected as BenefitCode : 'macierzynski'
  const scenario = searchParams.get('sytuacja')
  const initialRole = scenario === 'adoption' || scenario === 'foster' ? scenario : undefined

  return (
    <PageContainer className="space-y-8 py-12 sm:py-16">
      <PageHeading title="Dokumenty i wnioski" crumb="Dokumenty"
        description="Sprawdź, który formularz wypełnić, co dołączyć i gdzie złożyć wniosek." />
      <Suspense fallback={<p role="status">Wczytujemy dokumenty…</p>}>
        <BenefitDocuments benefit={benefit} initialRole={initialRole} onBenefitChange={(next) => {
          const params = new URLSearchParams(searchParams)
          params.set('swiadczenie', next)
          setSearchParams(params, { replace: true })
        }} />
      </Suspense>
    </PageContainer>
  )
}
