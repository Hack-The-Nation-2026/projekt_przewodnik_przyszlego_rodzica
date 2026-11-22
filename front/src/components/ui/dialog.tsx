import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Okno modalne oparte na natywnym elemencie <dialog>.
 *
 * Natywny <dialog> daje to, czego zwykły div nie ma za darmo: pułapkę fokusu,
 * zamykanie klawiszem Escape i blokadę reszty strony przed klikaniem. Dlatego
 * nie dokładamy do projektu kolejnej zależności.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Strona pod oknem nie może się przewijać, bo wtedy ucieka kontekst.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Escape zamyka element natywnie, więc przejmujemy zdarzenie, żeby stan Reacta
      // dowiedział się o zamknięciu, a nie tylko sam element.
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      // Klik w tło trafia w sam element <dialog>, a nie w jego treść.
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(56rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-lg border bg-background p-0 text-foreground shadow-xl backdrop:bg-foreground/50"
    >
      {open && (
        <div>
          <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background px-4 py-3 sm:px-5">
            <h2 id={titleId} className="min-w-0 flex-1 font-display text-lg font-semibold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Zamknij okno"
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="p-4 sm:p-5">{children}</div>
        </div>
      )}
    </dialog>,
    document.body,
  )
}