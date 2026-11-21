import type { Assessment, BenefitCode, ParentalPool } from '@/lib/benefit-interview'
import { benefitList } from '@/lib/benefit-interview'
import type { DocumentContext } from '@/lib/benefit-document-context'
import { formatDocumentDate } from '@/lib/benefit-documents'
import type { InterviewValues } from '@/lib/interview-form'
import { parseNumber } from '@/lib/interview-form'
import type { RateVariant } from '@/components/parental-plan'
import type { AppSettings } from '@/types/api'

const currency = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', useGrouping: 'always' })
const percent = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 })

export interface WhyRow {
  label: string
  value: string
  /** Krok liczony z poprzedniego, żeby widać było działanie, a nie sam wynik. */
  emphasis?: boolean
}

export interface WhyPanelData {
  name: string
  granted: boolean
  /** Skąd ta liczba: podstawa wymiaru, procent, dni, kwota. */
  breakdown: WhyRow[]
  /** Skąd ten wymiar: reguła jednym zdaniem. */
  measureRule: string | null
  /** Co by zmieniło wynik. Najciekawsza sekcja i najmniej oczywista. */
  counterfactuals: string[]
  legal: { title: string; url: string }[]
  /** Dla braku uprawnień: który warunek nie został spełniony. */
  blockedCondition: string | null
  /** I co go spełni. */
  pathOut: string[]
}

export interface WhyInput {
  assessment: Assessment
  values: InterviewValues
  context: DocumentContext
  pool: ParentalPool | null
  averaged: RateVariant | null
  flat: RateVariant | null
  settings?: AppSettings
}

function weeksText(days: number) {
  const weeks = Math.floor(days / 7)
  const rest = days % 7
  const base = weeks === 1 ? '1 tydzień' : weeks < 5 && weeks > 0 ? `${weeks} tygodnie` : `${weeks} tygodni`
  return rest ? `${base} i ${rest} dni` : base
}

function money(grosze: number) {
  return currency.format(grosze / 100)
}

/**
 * Reguła wymiaru po ludzku. Bierzemy liczby z panelu administracyjnego, żeby
 * zdanie nie rozjechało się z tym, czym naprawdę liczy backend.
 */
function measureRule(benefit: BenefitCode, input: WhyInput) {
  const { values, pool, settings } = input
  const leave = settings?.leave
  const exclusive = leave?.exclusive_weeks ?? (pool ? Math.round(pool.exclusive_days_per_parent / 7) : 9)
  const single = leave?.parental_weeks_single ?? 41
  const multiple = leave?.parental_weeks_multiple ?? 43
  const children = Math.max(1, parseNumber(values.childCount) ?? 1)
  const multi = children > 1

  if (benefit === 'macierzynski' || benefit === 'uzupelniajacy') {
    const weeks = leave?.maternity_weeks_by_child_count?.[children - 1]
    return `Macierzyński to ${weeks ?? (multi ? 37 : 20)} tygodni przy ${children === 1 ? 'jednym dziecku' : `${children} dzieciach`}.`
  }
  if (benefit === 'rodzicielski') {
    return `Rodzicielski to ${single} tygodni przy jednym dziecku i ${multiple} przy bliźniętach, plus ${exclusive} tygodni, których nie da się przenieść na drugiego rodzica.`
  }
  if (benefit === 'ojcowski') return 'Ojcowski to dwa tygodnie, które można wykorzystać do dwunastego miesiąca życia dziecka.'
  return null
}

/**
 * Kontrprzykłady z tej samej sytuacji. To najciekawsza część panelu: pokazuje,
 * że wynik nie jest jedyny, ale też nie zmienia się bez powodu.
 */
function counterfactuals(input: WhyInput) {
  const { assessment, values, pool, averaged, flat, settings } = input
  const list: string[] = []
  const averagedRate = settings?.rates.averaged ?? 81.5
  const parentalRate = settings?.rates.parental ?? 70
  const exclusiveWeeks = settings?.leave.exclusive_weeks ?? 9

  if (
    (assessment.benefit === 'macierzynski' || assessment.benefit === 'rodzicielski') &&
    averaged && flat && averaged.gross && flat.gross && averaged.gross !== flat.gross
  ) {
    const difference = averaged.gross - flat.gross
    list.push(
      difference > 0
        ? `Gdyby wniosek o ${percent.format(averagedRate)}% poszedł w ciągu 21 dni po porodzie, całość dałaby ${money(averaged.gross)}, czyli o ${money(difference)} więcej niż wariant bez uśredniania, w którym macierzyński to 100% podstawy, a rodzicielski ${percent.format(parentalRate)}%.`
        : `Wariant bez uśredniania daje ${money(flat.gross)}, czyli o ${money(-difference)} więcej niż wniosek o ${percent.format(averagedRate)}%. Sprawdź, który jest lepszy w Twojej sytuacji.`,
    )
  }

  if (pool && (assessment.benefit === 'rodzicielski' || assessment.benefit === 'macierzynski')) {
    list.push(
      `Drugi rodzic ma swoje ${exclusiveWeeks} tygodni, których nie można mu odebrać ani przenieść na Ciebie. Jeśli ich nie wykorzysta, te tygodnie przepadają.`,
    )
  }

  if (values.employment === 'employee' && !values.workingOnLeave && assessment.benefit === 'rodzicielski') {
    list.push(
      'Gdybyś połączył urlop rodzicielski z pracą w obniżonym wymiarze, urlop wydłużyłby się proporcjonalnie do wymiaru pracy, a zasiłek za ten czas byłby liczony z nowej stawki.',
    )
  }

  if (!values.zaZyciem && assessment.benefit === 'rodzicielski') {
    const extra = settings?.leave.za_zyciem_extra_weeks ?? 24
    list.push(
      `Z zaświadczeniem „Za życiem” urlop rodzicielski rośnie o ${extra} tygodni. Zaświadczenie wydaje szpital, gdy dziecko ma ciężką wadę rozwojową.`,
    )
  }

  if (values.employment === 'contractor' || values.employment === 'self_employed') {
    list.push(
      'Kwota nie może spaść poniżej minimalnej podstawy wymiaru, a przy umowie zlecenia i działalności ZUS podnosi wypłatę do wysokości świadczenia rodzicielskiego, jeśli wyliczenie wypada niżej.',
    )
  }

  return list
}

/** Powód odmowy sprowadzamy do jednego warunku i jednej drogi wyjścia. */
function blockedFromReason(reason: string) {
  const text = reason.toLowerCase()
  if (text.includes('zaległo') || text.includes('zadłuż') || text.includes('składk')) {
    return {
      condition: 'Zaległości wobec ZUS przekraczają próg, od którego świadczenie nie przysługuje.',
      path: [
        'Wyrównaj zaległości i złóż wniosek ponownie.',
        'Sprawdź w ZUS na dzień powstania prawa, ile dokładnie brakuje.',
        'Kwota i próg zależą od tytułu ubezpieczenia — potwierdź je w ZUS.',
      ],
    }
  }
  if (text.includes('ustaniu') || text.includes('ustało') || text.includes('nie jest już objęta') || text.includes('ustał')) {
    return {
      condition: 'Ubezpieczenie ustało, zanim powstało prawo do świadczenia.',
      path: [
        'Sprawdź, czy umowa nie wygasła wskutek śmierci pracodawcy albo rozwiązania w ciąży z powodu upadłości lub likwidacji. Wtedy zasiłek przysługuje po ustaniu zatrudnienia.',
        'Rozważ dobrowolne ubezpieczenie chorobowe, jeśli nadal możesz je opłacać.',
        'Termin i okres wyczekiwania potwierdź w ZUS, bo zależą od tytułu ubezpieczenia.',
      ],
    }
  }
  if (text.includes('nie jest objęta') || text.includes('brak ubezpieczenia') || text.includes('nie podlega')) {
    return {
      condition: 'Nie ma tytułu do ubezpieczenia chorobowego.',
      path: [
        'Sprawdź u płatnika, czy zgłasza Cię do ubezpieczenia chorobowego — przy umowie zlecenia to nie jest automatyczne.',
        'Przy działalności gospodarczej rozważ dobrowolne ubezpieczenie chorobowe.',
        'Zgłoszenie musi objąć okres przed porodem, więc nie odkładaj tego na później.',
      ],
    }
  }
  if (text.includes('okres')) {
    return {
      condition: 'Okres ubezpieczenia jest zbyt krótki, żeby powstało prawo do świadczenia.',
      path: [
        'Sprawdź w ZUS, ile dni ubezpieczenia chorobowego jest już zapisanych.',
        'Nowy tytuł ubezpieczenia zaczyna okres wyczekiwania od nowa — potwierdź w ZUS, ile dni brakuje.',
      ],
    }
  }
  if (text.includes('dokument') || text.includes('zaświadcz')) {
    return {
      condition: 'ZUS nie uznał dokumentów, które miały potwierdzić prawo do świadczenia.',
      path: [
        'Poproś płatnika składek o zaświadczenie Z-3 i sprawdź, czy jest czytelne i kompletne.',
        'Dołącz dokumenty potwierdzające tytuł do ubezpieczenia, na przykład umowę albo zgłoszenie do ZUS.',
      ],
    }
  }
  if (text.includes('podstaw')) {
    return {
      condition: 'ZUS zakwestionował podstawę wymiaru składki.',
      path: [
        'Przygotuj dokumenty płacowe za okres, z którego liczona jest podstawa.',
        'Poproś płatnika o zaświadczenie o wysokości składek, żeby obronić kwotę.',
      ],
    }
  }
  if (text.includes('wniosek') && (text.includes('termin') || text.includes('później'))) {
    return {
      condition: 'Wniosek złożono po terminie, który daje prawo do wyższej stawki albo do świadczenia.',
      path: [
        'Sprawdź, czy termin da się utrzymać przy drugim świadczeniu, które ma inny termin.',
        'Przy odmowie z powodu terminu wnosi się odwołanie w ciągu miesiąca od doręczenia decyzji.',
      ],
    }
  }
  return {
    condition: 'ZUS wskazał powód, który trzeba przeczytać dosłownie: to zdanie mówi, którego warunku brakuje.',
    path: [
      'Przeczytaj uzasadnienie decyzji i wypisz z niego powód odmowy.',
      'Zbierz dokument na ten powód i złóż odwołanie albo wniosek o zmianę decyzji.',
      'Jeśli nie wiesz, co donieść, zapytaj w ZUS albo skorzystaj z bezpłatnej pomocy prawnej.',
    ],
  }
}

/**
 * Panel „dlaczego tak" dla jednej kwoty albo jednego wymiaru.
 *
 * Nie ocenia szans i nie udziela porady prawnej: pokazuje, z czego wynikła
 * liczba, jaką regułą jest wymiar, co by go zmieniło i na jakim przepisie
 * to stoi. Wariant bez uprawnień mówi, który warunek nie został spełniony.
 */
export function buildWhyPanel(input: WhyInput): WhyPanelData {
  const { assessment, values, context } = input
  const granted = assessment.status === 'granted' || assessment.status === 'partially_granted'
  const benefit = assessment.benefit
  const rate = assessment.periods?.find((period) => period.rate_percent)?.rate_percent

  const breakdown: WhyRow[] = []
  const basis = parseNumber(values.basis)
  if (basis !== undefined) {
    breakdown.push({ label: 'Podstawa wymiaru', value: money(Math.round(basis * 100)) })
  }
  if (rate) {
    breakdown.push({ label: 'Stawka zasiłku', value: `${percent.format(rate)}% podstawy` })
  }
  if (assessment.days) {
    breakdown.push({ label: 'Wymiar okresu', value: `${assessment.days} dni, czyli ${weeksText(assessment.days)}` })
  }
  if (granted && assessment.gross_grosze != null && assessment.days) {
    breakdown.push({
      label: 'Kwota na dzień',
      value: money(Math.round(assessment.gross_grosze / assessment.days)),
    })
    breakdown.push({ label: 'Razem brutto', value: money(assessment.gross_grosze), emphasis: true })
    breakdown.push({
      label: 'Przeliczenie na miesiąc',
      value: money(Math.round((assessment.gross_grosze / assessment.days) * 30)) + ' — przybliżenie',
    })
  }
  if (granted) {
    breakdown.push({
      label: 'Kwota to brutto',
      value: 'Kalkulator nie liczy podatku ani składek, bo rozlicza je płatnik zasiłku.',
    })
  }

  const period = context.periods[benefit]
  if (period) {
    breakdown.push({
      label: 'Okres z symulacji',
      value: `${formatDocumentDate(period.start)} – ${formatDocumentDate(period.end)}${context.forecast ? ', liczony od przewidywanej daty porodu' : ''}`,
    })
  }

  const blocked = granted ? null : blockedFromReason(assessment.reason)

  return {
    name: benefitList[benefit].name,
    granted,
    breakdown,
    measureRule: measureRule(benefit, input),
    counterfactuals: granted ? counterfactuals(input) : [],
    legal: benefitList[benefit].sources.map((source) => ({ title: source.title, url: source.url })),
    blockedCondition: blocked?.condition ?? null,
    pathOut: blocked?.path ?? [],
  }
}

/** Karta i wynik dzielą ten sam zestaw skrótów, żeby opisy się nie rozjechały. */
export const whyHelpers = { weeksText }
