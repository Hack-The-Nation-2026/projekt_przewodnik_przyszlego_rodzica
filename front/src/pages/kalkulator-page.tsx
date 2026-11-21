import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Container } from '@/components/layout/container'

// Jedno pole na start. Reguły liczenia zasiłku dojdą, gdy poznamy szczegóły wyzwania.
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
      <h1 className="font-display text-3xl font-semibold text-navy">Kalkulator zasiłku</h1>
      <p className="mt-3 text-muted-foreground">
        Szkielet formularza. Reguły liczenia dopiszemy, gdy dostaniemy szczegóły wyzwania.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Twoja sytuacja</CardTitle>
          <CardDescription>Na razie jedno pole, żeby pokazać walidację i przepływ danych.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit((values) => setSubmitted(values))}>
            <div className="space-y-2">
              <label htmlFor="dueDate" className="text-sm font-medium">
                Przewidywana data porodu
              </label>
              <Input id="dueDate" type="date" aria-invalid={Boolean(errors.dueDate)} {...register('dueDate')} />
              {errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate.message}</p>}
            </div>
            <Button type="submit">Policz</Button>
          </form>

          {submitted && (
            <p className="mt-6 rounded-md border border-border bg-muted p-4 text-sm">
              Formularz przeszedł walidację. Termin porodu: {submitted.dueDate}.
            </p>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}
