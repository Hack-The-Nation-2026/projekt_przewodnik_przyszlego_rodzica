import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { BackLink } from '@/components/layout/back-link'
import { Container } from '@/components/layout/container'

// Formularz zbiera przewidywaną datę porodu: od niej liczą się terminy urlopów i zasiłków.
const schema = z.object({
  dueDate: z
    .string()
    .min(1, 'Podaj datę porodu.')
    .refine((value) => !Number.isNaN(Date.parse(value)), 'Nieprawidłowa data.'),
})

type FormValues = z.infer<typeof schema>

export function KalkulatorPage() {
  const [submitted, setSubmitted] = useState<FormValues | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  return (
    <Container className="max-w-2xl py-16">
      <div className="flex items-start gap-3">
        <BackLink to="/wejscie" label="Wróć do wejścia" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-semibold text-navy">Kalkulator zasiłku</h1>
          <p className="mt-3 text-muted-foreground">
            Policz zasiłek chorobowy, macierzyński i rodzicielski. Zacznij od przewidywanej daty
            porodu.
          </p>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Twoja sytuacja</CardTitle>
              <CardDescription>
                Data porodu wyznacza początek urlopu macierzyńskiego i okres, za który należy się
                zasiłek.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit((values) => setSubmitted(values))}>
                <div className="space-y-2">
                  <label htmlFor="dueDate" className="text-sm font-medium">
                    Przewidywana data porodu
                  </label>
                  <Input
                    id="dueDate"
                    type="date"
                    aria-invalid={Boolean(errors.dueDate)}
                    {...register('dueDate')}
                  />
                  {errors.dueDate && (
                    <p className="text-sm text-destructive">{errors.dueDate.message}</p>
                  )}
                </div>
                <Button type="submit">Policz</Button>
              </form>

              {submitted && (
                <p className="mt-6 rounded-md border border-border bg-muted p-4 text-sm">
                  Termin porodu: {submitted.dueDate}.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  )
}
