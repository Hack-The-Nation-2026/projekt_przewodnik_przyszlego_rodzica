import { Link, useNavigate } from 'react-router-dom'
import { Calculator, ChevronDown, LogOut, UserRound } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/store/app-store'

/** Inicjały do krążka, gdy nie ma zdjęcia. Dwa znaki, jak w skrzynkach pocztowych. */
function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

/**
 * Menu konta w nagłówku. Zamiast wypisanego imienia i osobnego przycisku wylogowania
 * pokazujemy jeden przycisk z krążkiem, a pod nim skróty do danych, kalkulatora i wyjścia.
 */
export function ProfileMenu() {
  const citizen = useAppStore((state) => state.citizen)
  const signOut = useAppStore((state) => state.signOut)
  const navigate = useNavigate()

  if (!citizen) return null

  const fullName = `${citizen.first_name} ${citizen.last_name}`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Menu konta, ${fullName}`}
        className="flex items-center gap-2 rounded-md py-1 pl-1 pr-1.5 text-primary-foreground transition-colors hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/60 sm:pr-2.5"
      >
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-full bg-primary-foreground text-sm font-semibold text-primary"
        >
          {initials(citizen.first_name, citizen.last_name)}
        </span>
        <span className="hidden max-w-[9rem] truncate text-sm font-medium sm:inline">
          {citizen.first_name}
        </span>
        <ChevronDown className="hidden size-4 opacity-80 sm:block" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <span className="block text-sm font-medium text-foreground">{fullName}</span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {citizen.case_label}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/wejscie">
            <UserRound />
            Moje dane
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/kalkulator">
            <Calculator />
            Kalkulator
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            signOut()
            navigate('/')
          }}
        >
          <LogOut />
          Wyloguj
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
