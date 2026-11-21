import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

/**
 * Przycisk powrotu, który staje po lewej stronie tytułu podstrony.
 *
 * Wracamy historią, gdy użytkownik naprawdę przyszedł z innej strony, a gdy wszedł
 * w adres bezpośrednio, idziemy na adres zapasowy, żeby przycisk nigdy nie był martwy.
 * Kursor zmienia się w dłoń, bo Tailwind 4 nie robi tego już sam dla przycisków.
 */
export function BackLink({ to, label = 'Wróć' }: { to: string; label?: string }) {
  const navigate = useNavigate()
  const cameFromAnotherPage = window.history.length > 1

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => (cameFromAnotherPage ? navigate(-1) : navigate(to))}
      className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-neutral-100 text-muted-foreground transition-colors hover:bg-neutral-200 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <ArrowLeft className="size-4" />
    </button>
  )
}
