import { ArrowRight, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { benefitList, type BenefitCode } from '@/lib/benefit-interview'

/**
 * Karta jednego świadczenia z katalogu.
 *
 * Stoi w dwóch miejscach: na stronie świadczeń i na stronie głównej, żeby obie
 * pokazywały ten sam opis, te same podstawy prawne i ten sam przycisk do
 * dokumentów. `placement` dopina sytuację (adopcja, rodzina zastępcza), gdy
 * karta jest wybrana z filtrem.
 */
export function BenefitCard({
  code,
  placement = '',
  headingLevel = 3,
}: {
  code: BenefitCode
  placement?: string
  headingLevel?: 2 | 3
}) {
  const { name, what, sources } = benefitList[code]
  const Heading = headingLevel === 2 ? 'h2' : 'h3'

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="gap-2 pb-4">
        <Heading className="text-lg font-semibold">{name}</Heading>
        <p className="text-sm text-muted-foreground">{what}</p>
      </CardHeader>
      <CardContent className="mt-auto space-y-3">
        <ul className="space-y-1 text-sm">
          {sources.map(({ title, url }) => (
            <li key={title}>
              <a href={url} className="text-primary underline underline-offset-2">
                {title}
              </a>
            </li>
          ))}
        </ul>
        <Link
          to={`/dokumenty?swiadczenie=${code}${placement}`}
          className={buttonVariants({ variant: 'outline' })}
          aria-label={`Dokumenty i terminy – ${name}`}
        >
          <FileText aria-hidden="true" /> Dokumenty i terminy <ArrowRight aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  )
}
