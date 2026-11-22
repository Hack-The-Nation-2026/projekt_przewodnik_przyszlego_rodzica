import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Pasek zakładek na wzór shadcn, ale bez dodatkowej zależności.
 *
 * `@radix-ui/react-tabs` nie jest w projekcie, a filtr świadczeń potrzebuje
 * tylko dwóch rzeczy: jednej wybranej wartości i klawiatury, która działa tak,
 * jak użytkownik się spodziewa. Rola `tablist` plus strzałki, Home i End
 * wystarczają, a czytnik ekranu wie, która zakładka jest otwarta.
 */
type TabsContextValue = {
  value: string
  onValueChange: (value: string) => void
  baseId: string
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabs(component: string) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error(`${component} musi być użyty wewnątrz <Tabs>`)
  return context
}

export function Tabs({
  value,
  onValueChange,
  className,
  children,
}: {
  value: string
  onValueChange: (value: string) => void
  className?: string
  children: React.ReactNode
}) {
  const baseId = React.useId()
  return (
    <TabsContext.Provider value={{ value, onValueChange, baseId }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

/**
 * Lista zakładek. Strzałki przesuwają wybór i fokus razem, bo przy pięciu
 * filtrach trzeba skakać między nimi, a nie klikać każdy po kolei.
 */
export function TabsList({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  const list = React.useRef<HTMLDivElement>(null)

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
    const tabs = Array.from(
      list.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])') ?? [],
    )
    if (!tabs.length) return
    event.preventDefault()
    const current = tabs.indexOf(document.activeElement as HTMLButtonElement)
    const last = tabs.length - 1
    let next = current
    if (event.key === 'ArrowRight') next = current === last ? 0 : current + 1
    else if (event.key === 'ArrowLeft') next = current <= 0 ? last : current - 1
    else if (event.key === 'Home') next = 0
    else next = last
    tabs[next]?.focus()
    tabs[next]?.click()
  }

  return (
    <div
      ref={list}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        'flex flex-wrap gap-1 rounded-lg border border-border bg-secondary/50 p-1',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({
  value,
  className,
  children,
}: {
  value: string
  className?: string
  children: React.ReactNode
}) {
  const { value: active, onValueChange, baseId } = useTabs('TabsTrigger')
  const selected = active === value
  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      data-state={selected ? 'active' : 'inactive'}
      onClick={() => onValueChange(value)}
      className={cn(
        'inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        selected
          ? 'bg-background text-primary shadow-sm ring-1 ring-border'
          : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value,
  className,
  children,
}: {
  value: string
  className?: string
  children: React.ReactNode
}) {
  const { value: active, baseId } = useTabs('TabsContent')
  if (active !== value) return null
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      tabIndex={-1}
      className={cn('focus:outline-none', className)}
    >
      {children}
    </div>
  )
}
