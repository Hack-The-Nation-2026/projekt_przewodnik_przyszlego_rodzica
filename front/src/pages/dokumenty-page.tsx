import { Suspense, lazy, useState } from 'react'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeading } from '@/components/layout/page-heading'
import type { BenefitCode } from '@/lib/benefit-interview'

const BenefitDocuments = lazy(() => import('@/components/benefit-documents'))

export function DokumentyPage() {
  const [benefit, setBenefit] = useState<BenefitCode>('macierzynski')

  return (
    <PageContainer className="space-y-8 py-12 sm:py-16">
      <PageHeading title="Dokumenty i wnioski" crumb="Dokumenty"
        description="Wybierz świadczenie, sprawdź listę załączników i przygotuj szkic wniosku." />
      <Suspense fallback={<p role="status">Wczytujemy dokumenty…</p>}>
        <BenefitDocuments benefit={benefit} onBenefitChange={setBenefit} />
      </Suspense>
    </PageContainer>
  )
}
