import { BackLink } from '@/components/layout/back-link'
import { Container } from '@/components/layout/container'

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <Container className="max-w-3xl py-16">
      <div className="flex items-start gap-3">
        <BackLink to="/" label="Wróć na stronę startową" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-semibold text-navy">{title}</h1>
          <p className="mt-3 text-muted-foreground">{description}</p>
        </div>
      </div>
    </Container>
  )
}
