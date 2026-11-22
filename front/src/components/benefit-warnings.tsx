import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Assessment } from '@/lib/benefit-interview'
import type { InterviewValues } from '@/lib/interview-form'
import { usePlain } from '@/lib/plain-language'

const parentGuide = 'https://bip.zus.pl/documents/10182/167567/1184_26%2BPoradnik%2Bdla%2Brodzic%C3%B3w.pdf/9378de60-151e-9b9f-ba65-abdf41d9f5b4'
const maternityGuide = 'https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/prawo-do-zasilku-i-okres-przyslugiwania/za-okres-urlopu-macierzynskiego-albo-urlopu-na-warunkach-urlopu-macierzynskiego'

type Warning = {
  title: string
  message: string
  effect: string
  source: string
  sourceTitle: string
}

function getWarnings(values: InterviewValues, maternityStatus?: Assessment['status']): Warning[] {
  if (values.role !== 'mother') return []
  const warnings: Warning[] = []

  if (values.employment === 'employee') {
    if (values.newContractDuringPregnancy === 'yes' && values.workPerformedUnderContract === 'no') {
      warnings.push({
        title: 'Umowa o pracę, na podstawie której nie wykonywałaś pracy',
        message: 'ZUS może sprawdzić, czy stosunek pracy rzeczywiście powstał. Przy ocenie bierze pod uwagę m.in. okoliczności zawarcia umowy i faktyczne wykonywanie pracy.',
        effect: 'Jeśli ZUS uzna umowę za pozorną, może odmówić zasiłków z tego tytułu. Wypłata z tej umowy może wtedy wynieść 0 zł.',
        source: parentGuide,
        sourceTitle: 'Poradnik ZUS o ważności umowy o pracę',
      })
    }

    if (values.payRaisedDuringPregnancy === 'yes') {
      warnings.push({
        title: 'Podwyżka wynagrodzenia w ciąży',
        message: 'ZUS może sprawdzić, czy wynagrodzenie przyjęte do wyliczenia odpowiada wykonywanej pracy i warunkom zatrudnienia.',
        effect: 'Jeśli symulacja uwzględnia podwyżkę, ustalenie przez ZUS niższej podstawy może obniżyć wypłatę.',
        source: parentGuide,
        sourceTitle: 'Poradnik ZUS o weryfikacji wynagrodzenia',
      })
    }
  }

  const employmentEndsBeforeBirth = values.employmentEnded
    && values.employmentEndDate !== '' && values.employmentEndDate < values.eventDate
  const protectedMaternity = (values.employmentEnded && values.employment === 'employee' && values.extendedToBirth)
    || maternityStatus === 'granted' || maternityStatus === 'partially_granted'

  if (!protectedMaternity && values.insured !== 'yes' && (employmentEndsBeforeBirth || values.insured === 'no')) {
    warnings.push({
      title: employmentEndsBeforeBirth ? 'Koniec zatrudnienia przed porodem' : 'Brak ubezpieczenia w dniu porodu',
      message: employmentEndsBeforeBirth
        ? 'Sprawdź, czy ubezpieczenie z innego tytułu obejmuje dzień porodu lub czy spełniasz warunki wypłaty po ustaniu zatrudnienia.'
        : 'W wywiadzie wskazałaś brak ubezpieczenia chorobowego na dzień powstania prawa. W określonych przypadkach zasiłek może przysługiwać także po ustaniu zatrudnienia.',
      effect: 'Bez ubezpieczenia w dniu porodu i bez prawa do wyjątku wypłata zasiłku macierzyńskiego wyniesie 0 zł.',
      source: maternityGuide,
      sourceTitle: 'ZUS o zasiłku po ustaniu zatrudnienia',
    })
  }

  return warnings
}

export function BenefitWarnings({ values, maternityStatus, onEditEmployment }: {
  values: InterviewValues
  maternityStatus?: Assessment['status']
  onEditEmployment: () => void
}) {
  const warnings = getWarnings(values, maternityStatus)
  const needsInsurance = values.role === 'mother' && values.insured === 'unknown' && maternityStatus === 'missing_data'
  const plain = usePlain()
  if (!warnings.length && !needsInsurance) return null

  return (
    <section className="mt-6 space-y-3 border-t border-border pt-6" aria-labelledby="benefit-warnings">
      <h3 id="benefit-warnings" className="text-xl font-semibold">{plain('Co może zmienić wypłatę')}</h3>
      {needsInsurance && (
        <div className="space-y-3 rounded-lg border border-input bg-secondary p-4 text-sm">
          <p>{plain('Potwierdź ubezpieczenie chorobowe w dniu porodu, aby kalkulator mógł ocenić prawo do zasiłku.')}</p>
          <Button className="h-auto min-h-10 whitespace-normal" type="button" variant="outline" onClick={onEditEmployment}>
            Uzupełnij dane o zatrudnieniu
          </Button>
        </div>
      )}
      {warnings.length > 0 && (
        <ul className="space-y-3">
          {warnings.map(({ title, message, effect, source, sourceTitle }) => (
            <li key={title} className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
              <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-800" aria-hidden="true" />
              <div className="space-y-2 text-sm">
                <h4 className="text-base font-semibold">{title}</h4>
                <p>{plain(message)}</p>
                <p><strong>Wpływ na wypłatę</strong> {plain(effect)}</p>
                <a className="inline-block font-medium underline underline-offset-2" href={source} target="_blank" rel="noreferrer">
                  {sourceTitle}
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
