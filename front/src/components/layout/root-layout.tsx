import { Outlet } from 'react-router-dom'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'

export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#tresc"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Przejdź do treści
      </a>
      <SiteHeader />
      <main id="tresc" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
