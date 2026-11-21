import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Container } from '@/components/layout/container'
import { PageHeading } from '@/components/layout/page-heading'

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
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { dueDate: '' },
  })

  return (
    <Container className="max-w-3xl py-16">
      <PageHeading
        title="Kalkulator zasiłku"
        description="Policz zasiłek chorobowy, macierzyński i rodzicielski. Zacznij od przewidywanej daty porodu."
        crumb="Kalkulator"
        backTo="/wejscie"
        backLabel="Wróć do wejścia"
      />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Twoja sytuacja</CardTitle>
          <CardDescription>
            Data porodu wyznacza początek urlopu macierzyńskiego i okres, za który należy się
            zasiłek.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-5" onSubmit={form.handleSubmit((values) => setSubmitted(values))}>
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Przewidywana data porodu</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Policz</Button>
            </form>
          </Form>

          {submitted && (
            <p className="mt-6 rounded-md bg-neutral-100 p-4 text-sm">
              Termin porodu: {submitted.dueDate}.
            </p>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}
