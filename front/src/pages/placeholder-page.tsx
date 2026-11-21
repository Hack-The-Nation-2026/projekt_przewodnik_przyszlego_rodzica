import { PageContainer } from '@/components/layout/page-container'
import { PageHeading } from '@/components/layout/page-heading'

export function PlaceholderPage({
  title,
  description,
  crumb,
}: {
  title: string
  description: string
  crumb?: string
}) {
  return (
    <PageContainer className="py-16">
      <PageHeading title={title} description={description} crumb={crumb} />
    </PageContainer>
  )
}