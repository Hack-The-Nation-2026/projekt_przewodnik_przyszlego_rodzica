import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export type Crumb = { label: string; to?: string }

/**
 * Ścieżka od strony startowej do bieżącej podstrony. Ostatnia pozycja to miejsce,
 * w którym jesteśmy, więc nie jest linkiem i nie da się w nią kliknąć.
 */
export function PageBreadcrumbs({ items }: { items: Crumb[] }) {
  const trail: Crumb[] = [{ label: 'Start', to: '/' }, ...items]

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {trail.map((item, index) => (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {item.to ? (
                <BreadcrumbLink asChild>
                  <Link to={item.to}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}