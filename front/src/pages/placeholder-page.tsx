import { Container } from '@/components/layout/container'
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
    <Container className="max-w-3xl py-16">
      <PageHeading title={title} description={description} crumb={crumb} />
    </Container>
  )
}