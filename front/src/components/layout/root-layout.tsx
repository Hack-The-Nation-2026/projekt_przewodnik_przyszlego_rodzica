import { Outlet, useMatch } from 'react-router-dom'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { cn } from '@/lib/utils'

export function RootLayout() {
  const isHome = useMatch('/') !== null

  return (
    <div className={cn('flex flex-col', isHome ? 'h-dvh overflow-hidden' : 'min-h-dvh')}>
      <a
        href="#tresc"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Przejdź do treści
      </a>
      <SiteHeader />
      <main id="tresc" tabIndex={-1} className={cn('flex-1', isHome && 'min-h-0')}>
        <Outlet />
      </main>
      {!isHome && <SiteFooter />}
    </div>
  )
}
