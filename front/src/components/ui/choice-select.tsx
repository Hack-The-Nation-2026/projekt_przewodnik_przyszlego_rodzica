import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export type Choice = readonly [value: string, label: string]

/**
 * Lista wyboru na komponencie Radix, a nie na natywnym <select>. Natywna lista
 * otwiera się w warstwie systemowej przeglądarki, więc jej opcji nie widać ani
 * na nagraniu, ani w teście. Tutaj wszystkie opcje są częścią strony.
 */
export function ChoiceSelect({
  id,
  value,
  onValueChange,
  choices,
  ariaLabel,
  className,
  field,
}: {
  id?: string
  value: string
  onValueChange: (value: string) => void
  choices: readonly Choice[]
  ariaLabel?: string
  className?: string
  /** Nazwa pola formularza, zostawiona w DOM, żeby testy i nagrania miały po czym trafić. */
  field?: string
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id={id} aria-label={ariaLabel} data-field={field ?? id} className={cn('h-10 text-sm', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {choices.map(([optionValue, label]) => (
          <SelectItem key={optionValue} value={optionValue}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
