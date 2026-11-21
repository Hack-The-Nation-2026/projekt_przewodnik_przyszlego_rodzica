import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { Container } from '@/components/layout/container'
import { cn } from '@/lib/utils'

export function NotFoundPage() {
  return (
    <Container className="flex max-w-xl flex-col items-start py-24">
      <p className="font-display text-5xl font-semibold text-primary">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold text-navy">Nie znaleźliśmy tej strony</h1>
      <p className="mt-3 text-muted-foreground">
        Adres jest nieprawidłowy albo strona jeszcze nie istnieje.
      </p>
      <Link to="/" className={cn(buttonVariants(), 'mt-6')}>
        Wróć na start
      </Link>
    </Container>
  )
}
