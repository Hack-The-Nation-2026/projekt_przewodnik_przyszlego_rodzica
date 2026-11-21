import { useState } from 'react'
import { Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Krótkie wyjaśnienie pod ikoną "i": pokazuje się po najechaniu, po wejściu
 * fokusem i po kliknięciu, więc działa też na telefonie i z klawiatury.
 */
export function InfoHint({
  label,
  align = 'start',
  className,
  children,
}: {
  label: string
  align?: 'start' | 'end'
  className?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <span className={cn('relative inline-flex align-middle', className)}>
      <button
        type="button"
        aria-label={`Wyjaśnienie: ${label}`}
        aria-expanded={open}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setOpen((value) => !value)
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
        }}
        className="flex size-5 shrink-0 items-center justify-center text-current opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none"
      >
        <Info className="size-3.5" aria-hidden="true" />
      </button>
      {open && (
        <span
          role="tooltip"
          className={cn(
            'absolute top-full z-30 mt-1.5 w-64 max-w-[calc(100vw-3rem)] rounded-md bg-navy px-3 py-2 text-xs leading-relaxed font-normal text-white shadow-lg',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {children}
        </span>
      )}
    </span>
  )
}