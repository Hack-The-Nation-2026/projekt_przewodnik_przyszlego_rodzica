import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ArrowLeft, ChevronDown, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMobywatelDemoAccounts } from '@/hooks/use-mobywatel-demo-accounts'
import { api } from '@/lib/api'
import { useAppStore } from '@/store/app-store'
import type { Citizen } from '@/types/api'

const schema = z.object({
  identifier: z.string().trim().min(1, 'Podaj login albo PESEL.'),
  password: z.string().min(1, 'Podaj hasło.'),
})

type FormValues = z.infer<typeof schema>

/** Wracamy tylko na adresy wewnątrz aplikacji, żeby nikt nie przekierował na obcy serwis. */
function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/'
  return value
}

function describeFailure(error: unknown) {
  if (!axios.isAxiosError(error)) return 'Logowanie nie powiodło się.'
  if (!error.response) return 'Nie udało się połączyć z mObywatlem. Spróbuj ponownie.'
  const detail = (error.response.data as { detail?: string } | undefined)?.detail
  return detail ?? 'Logowanie nie powiodło się.'
}

function DemoAccounts() {
  const { data } = useMobywatelDemoAccounts()
  if (!data?.length) return null

  return (
    <details className="group mx-auto mt-8 max-w-[400px] text-xs text-white/80">
      <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 py-1 [&::-webkit-details-marker]:hidden">
        Konta testowe
        <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
      </summary>
      <ul className="mt-3 space-y-1.5">
        {data.map((account) => (
          <li key={account.identifier} className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-medium text-white/95">{account.identifier}</span>
            <span className="text-white/75">{account.password}</span>
            <span className="text-white/80">{account.citizen.case_label}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}

export function MobywatelPage() {
  const [searchParams] = useSearchParams()
  const returnTo = safeReturnTo(searchParams.get('returnTo'))
  const navigate = useNavigate()
  const signIn = useAppStore((state) => state.signIn)

  const [passwordVisible, setPasswordVisible] = useState(false)
  const [showPasswordHint, setShowPasswordHint] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const login = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data } = await api.post<Citizen>('/auth/mobywatel', values)
      return data
    },
    onSuccess: (citizen) => {
      signIn(citizen)
      navigate(returnTo, { replace: true })
    },
  })

  const failure = login.isError ? describeFailure(login.error) : null

  return (
    <div className="relative min-h-dvh bg-mb-blue text-white [--ring:#15529c]">
      <div
        aria-hidden
        className="absolute inset-0 bg-mb-blue-deep bg-[radial-gradient(72%_58%_at_50%_44%,#3a76c4,transparent_72%)]"
      />

      <Link
        to={returnTo}
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/90 transition-colors hover:text-white sm:left-6 sm:top-6"
      >
        <ArrowLeft className="size-4" />
        Wróć do Przewodnika Rodzica
      </Link>

      <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-20">
        <div className="w-full max-w-[400px]">
          <div className="rounded-2xl bg-white p-7 text-mb-ink shadow-[0_24px_70px_-24px_rgba(4,24,52,0.6)]">
            <div className="flex items-center gap-3">
              <img
                src="/mobywatel.png"
                alt=""
                aria-hidden
                width={44}
                height={44}
                className="size-11 rounded-xl"
              />
              <span className="text-[22px] font-bold tracking-tight">mObywatel</span>
            </div>

            <h1 className="mt-7 font-sans text-3xl font-bold tracking-tight">Dzień dobry!</h1>
            <p className="mt-1 text-[15px] text-mb-muted">Zaloguj się do aplikacji.</p>

            <form
              className="mt-6 space-y-4"
              noValidate
              onSubmit={handleSubmit((values) => login.mutate(values))}
            >
              <div className="space-y-1.5">
                <label htmlFor="identifier" className="text-sm font-medium">
                  Login lub PESEL
                </label>
                <Input
                  id="identifier"
                  autoComplete="username"
                  autoFocus
                  aria-invalid={Boolean(errors.identifier)}
                  className="h-12 rounded-[10px] border-mb-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-blue focus-visible:ring-offset-0"
                  {...register('identifier')}
                />
                {errors.identifier && (
                  <p className="text-sm text-destructive">{errors.identifier.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium">
                  Hasło
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={passwordVisible ? 'text' : 'password'}
                    autoComplete="current-password"
                    aria-invalid={Boolean(errors.password)}
                    className="h-12 rounded-[10px] border-mb-line pr-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-blue focus-visible:ring-offset-0"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    aria-label={passwordVisible ? 'Ukryj hasło' : 'Pokaż hasło'}
                    aria-pressed={passwordVisible}
                    onClick={() => setPasswordVisible((visible) => !visible)}
                    className="absolute right-1 top-1 flex size-10 items-center justify-center rounded-md text-mb-muted transition-colors hover:text-mb-ink"
                  >
                    {passwordVisible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowPasswordHint((shown) => !shown)}
                aria-expanded={showPasswordHint}
                className="text-sm font-medium text-mb-blue hover:underline"
              >
                Nie pamiętasz hasła?
              </button>

              {showPasswordHint && (
                <p className="rounded-lg bg-mb-blue/5 p-3 text-sm text-mb-muted">
                  Hasło do wszystkich kont:{' '}
                  <span className="font-medium text-mb-ink">demo1234</span>.
                </p>
              )}

              {failure && (
                <p role="alert" className="rounded-lg bg-destructive/8 p-3 text-sm text-destructive">
                  {failure}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={login.isPending}
                className="w-full bg-mb-blue hover:bg-mb-blue-deep"
              >
                {login.isPending && <Loader2 className="animate-spin" />}
                {login.isPending ? 'Logowanie…' : 'Zaloguj'}
              </Button>
            </form>
          </div>

          <p className="mt-5 text-center text-xs leading-relaxed text-white/85">
            Nie używaj tu hasła, którego używasz w innych serwisach.
          </p>

          {import.meta.env.DEV && <DemoAccounts />}
        </div>
      </main>
    </div>
  )
}
