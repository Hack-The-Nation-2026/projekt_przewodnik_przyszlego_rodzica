import { Container } from '@/components/layout/container'
import { Badge } from '@/components/ui/badge'

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <Container className="max-w-3xl py-16">
      <Badge variant="outline">W budowie</Badge>
      <h1 className="mt-4 font-display text-3xl font-semibold text-navy">{title}</h1>
      <p className="mt-3 text-muted-foreground">{description}</p>
    </Container>
  )
}
