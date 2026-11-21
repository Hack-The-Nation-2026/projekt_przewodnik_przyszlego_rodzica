import { Container } from '@/components/layout/container'

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <Container className="max-w-3xl py-16">
      <h1 className="font-display text-3xl font-semibold text-navy">{title}</h1>
      <p className="mt-3 text-muted-foreground">{description}</p>
    </Container>
  )
}
