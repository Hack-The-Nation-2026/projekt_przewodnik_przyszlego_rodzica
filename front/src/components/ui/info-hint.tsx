import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Odstęp dymka od ikony i od krawędzi okna. */
const GAP = 6
const EDGE = 12

type Position = { top: number; left: number }

/**
 * Krótkie wyjaśnienie pod ikoną "i": pokazuje się po najechaniu, po wejściu
 * fokusem i po kliknięciu, więc działa też na telefonie i z klawiatury.
 *
 * Dymek trafia do `body`, bo karta, która przycina swoją zawartość, nie może
 * go schować. Pozycję liczymy sami: pod ikoną, a gdy tam brakuje miejsca, nad
 * nią. Poziomo dymek zawsze zostaje w granicach okna.
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
  const [position, setPosition] = useState<Position | null>(null)
  const anchor = useRef<HTMLSpanElement>(null)
  const tip = useRef<HTMLSpanElement>(null)
  const id = useId()

  const place = useCallback(() => {
    const rect = anchor.current?.getBoundingClientRect()
    const box = tip.current?.getBoundingClientRect()
    if (!rect || !box) return

    const vw = document.documentElement.clientWidth
    const vh = document.documentElement.clientHeight

    const wanted = align === 'end' ? rect.right - box.width : rect.left
    const left = Math.min(Math.max(wanted, EDGE), Math.max(EDGE, vw - box.width - EDGE))

    const below = rect.bottom + GAP
    const above = rect.top - GAP - box.height
    const roomBelow = below + box.height <= vh - EDGE
    const top = roomBelow || above < EDGE
      ? Math.max(EDGE, Math.min(below, vh - box.height - EDGE))
      : above

    setPosition({ top, left })
  }, [align])

  // Pozycję liczymy przed pierwszym malowaniem, więc dymek nigdy nie mignie
  // w starym miejscu po ponownym otwarciu.
  useLayoutEffect(() => {
    if (open) place()
  }, [open, place])

  useEffect(() => {
    if (!open) return
    const onMove = () => place()
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    return () => {
      window.removeEventListener('scroll', onMove, true)
      window.removeEventListener('resize', onMove)
    }
  }, [open, place])

  // Na telefonie dymek zamyka dotknięcie gdziekolwiek poza ikoną.
  useEffect(() => {
    if (!open) return
    const onDown = (event: PointerEvent) => {
      if (!anchor.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  return (
    <span ref={anchor} className={cn('inline-flex align-middle', className)}>
      <button
        type="button"
        aria-label={`Wyjaśnienie: ${label}`}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          // Mysz i tak pokazuje dymek na najechaniu, więc kliknięcie tylko go
          // utrwala. Na dotyku nie ma najechania i kliknięcie otwiera lub zamyka.
          const canHover = window.matchMedia('(hover: hover)').matches
          setOpen((value) => (canHover ? true : !value))
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
      {open && createPortal(
        <span
          ref={tip}
          id={id}
          role="tooltip"
          style={{
            top: position?.top ?? 0,
            left: position?.left ?? 0,
            width: 'min(16rem, calc(100vw - 1.5rem))',
            visibility: position ? 'visible' : 'hidden',
          }}
          className="pointer-events-none fixed z-[100] block rounded-md bg-navy px-3 py-2 text-xs leading-relaxed font-normal text-white shadow-lg"
        >
          {children}
        </span>,
        document.body,
      )}
    </span>
  )
}