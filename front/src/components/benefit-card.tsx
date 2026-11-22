import { Suspense, lazy, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { benefitList, type BenefitCode } from '@/lib/benefit-interview'
import type { Role } from '@/lib/benefit-documents'

const BenefitDocuments = lazy(() => import('@/components/benefit-documents'))

/**
 * Karta jednego świadczenia z katalogu.
 *
 * Stoi w dwóch miejscach: na stronie świadczeń i na stronie głównej. Katalog
 * pokazuje też podstawy prawne, strona główna je pomija, żeby nie przeciążać
 * pierwszego ekranu. „Dokumenty i terminy" otwiera się w oknie dialogowym,
 * tak samo jak w karcie wyniku kalkulatora, więc użytkownik nie traci miejsca,
 * w którym był.
 */
export function BenefitCard({
  code,
  initialRole,
  headingLevel = 3,
  showSources = true,
}: {
  code: BenefitCode
  /** Sytuacja z filtra katalogu: adopcja albo rodzina zastępcza. */
  initialRole?: Extract<Role, 'adoption' | 'foster'>
  headingLevel?: 2 | 3
  showSources?: boolean
}) {
  const [open, setOpen] = useState(false)
  const { name, what, sources } = benefitList[code]
  const Heading = headingLevel === 2 ? 'h2' : 'h3'

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="gap-2 pb-4">
        <Heading className="text-lg font-semibold">{name}</Heading>
        <p className="text-sm text-muted-foreground">{what}</p>
      </CardHeader>
      <CardContent className="mt-auto space-y-3">
        {showSources && (
          <ul className="space-y-1 text-sm">
            {sources.map(({ title, url }) => (
              <li key={title}>
                <a href={url} className="text-primary underline underline-offset-2">
                  {title}
                </a>
              </li>
            ))}
          </ul>
        )}
        <Button
          type="button"
          variant="ghost"
          aria-haspopup="dialog"
          aria-label={`Dokumenty i terminy — ${name}`}
          onClick={() => setOpen(true)}
          className="w-full font-semibold text-primary hover:bg-primary/10 hover:text-primary"
        >
          <ClipboardList aria-hidden="true" />
          Dokumenty i terminy
        </Button>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title={`Dokumenty i terminy — ${name}`}
        >
          {open && (
            <Suspense
              fallback={
                <p role="status" className="py-8 text-center text-sm">
                  Wczytujemy dokumenty…
                </p>
              }
            >
              <BenefitDocuments benefit={code} initialRole={initialRole} plain />
            </Suspense>
          )}
        </Dialog>
      </CardContent>
    </Card>
  )
}
