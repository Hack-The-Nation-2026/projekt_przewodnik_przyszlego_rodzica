import type { CalendarEvent } from '@/lib/benefit-documents'
import { shiftDate } from '@/lib/benefit-documents'

/**
 * Tryb planowania: dla ludzi, którzy dopiero myślą o dziecku.
 *
 * Nie liczymy kwot ani tygodni. Bez daty porodu nie da się tego policzyć
 * uczciwie, a liczba podana rok wcześniej kończy się tym, że ktoś się na niej
 * oprze i straci pieniądze. Nie podajemy też okresów wyczekiwania z pamięci:
 * jeśli czegoś nie ma w materiałach od ZUS, pozycja dostaje znacznik
 * "do potwierdzenia w ZUS" i żadnej liczby.
 */
export interface PlanningAnswers {
  employment: 'employee' | 'contractor' | 'self_employed' | 'other' | 'unknown'
  payerReports: 'yes' | 'no' | 'unknown'
  insuranceGaps: 'none' | 'short' | 'long' | 'unknown'
  business: 'none' | 'active' | 'active_arrears' | 'not_started' | 'unknown'
  horizonMonths: string
}

export const emptyPlanning: PlanningAnswers = {
  employment: 'unknown',
  payerReports: 'unknown',
  insuranceGaps: 'unknown',
  business: 'none',
  horizonMonths: '',
}

export type PrepWhen = 'now' | 'before' | 'during'

export interface PrepItem {
  id: string
  when: PrepWhen
  title: string
  /** Dlaczego to ma znaczenie. */
  why: string
  /** Co się stanie, jeśli nic nie zrobisz. */
  ifNothing: string
  action?: { label: string; url: string }
  /** Pozycja bez liczby, bo materiał ZUS jej nie potwierdza. */
  unconfirmed?: boolean
}

export const prepLabels: Record<PrepWhen, string> = {
  now: 'Teraz',
  before: 'Przed ciążą',
  during: 'W ciąży',
}

const zus = 'https://www.zus.pl'
const gov = 'https://www.gov.pl/web/rodzina'

/**
 * Lista przygotowań wynika z odpowiedzi, a nie z katalogu wszystkich możliwych
 * rad. Pytamy o teraźniejszość, więc i lista mówi o teraźniejszości.
 */
export function buildPrepList(answers: PlanningAnswers): PrepItem[] {
  const items: PrepItem[] = []
  const horizon = Number(answers.horizonMonths)
  const soon = Number.isFinite(horizon) && horizon > 0 && horizon <= 6

  if (answers.employment === 'contractor' && answers.payerReports !== 'yes') {
    items.push({
      id: 'zlecenie-chorobowe',
      when: 'now',
      title: 'Sprawdź, czy płatnik zgłasza Cię do ubezpieczenia chorobowego',
      why: 'Umowa zlecenia sama nie daje prawa do zasiłku. Potrzebne jest zgłoszenie do ubezpieczenia chorobowego.',
      ifNothing: 'Bez zgłoszenia nie będzie zasiłku macierzyńskiego ani chorobowego, choć praca i składki mogą być opłacane.',
      action: { label: 'Zasady ubezpieczenia w ZUS', url: zus + '/pl/ubezpieczenia/spoleczne' },
    })
  }

  if (answers.employment === 'self_employed' || answers.business === 'active' || answers.business === 'active_arrears') {
    items.push({
      id: 'dzialalnosc-dobrowolne',
      when: 'now',
      title: 'Zdecyduj o dobrowolnym ubezpieczeniu chorobowym przy działalności',
      why: 'Przy działalności ubezpieczenie chorobowe jest dobrowolne. Trzeba je zgłosić, zanim zaczną się zdarzenia, z których ma wypłacać.',
      ifNothing: 'Bez tego ubezpieczenia zasiłek macierzyński z działalności nie będzie należny.',
      action: { label: 'Dobrowolne ubezpieczenie chorobowe', url: zus + '/pl/ubezpieczenia/dobrowolne-ubezpieczenie-chorobowe' },
    })
  }

  if (answers.business === 'active_arrears') {
    items.push({
      id: 'zaleglosci',
      when: 'before',
      title: 'Wyrównaj zaległości wobec ZUS przed porodem',
      why: 'Zaległości ze składek przekraczające próg mogą pozbawić prawa do świadczenia, mimo opłacania składek na bieżąco.',
      ifNothing: 'ZUS może odmówić wypłaty, a wtedy zostaje odwołanie i wyrównanie długu po fakcie.',
      action: { label: 'Stan zadłużenia w ZUS', url: zus + '/pl/platnosci' },
    })
  }

  if (answers.insuranceGaps === 'short' || answers.insuranceGaps === 'long') {
    items.push({
      id: 'przerwa-w-ubezpieczeniu',
      when: 'before',
      title: 'Zaplanuj ciągłość ubezpieczenia przed ciążą',
      why: 'Przerwa w ubezpieczeniu chorobowym skraca wymiar świadczeń, a przy nowym tytule ubezpieczenia okres wyczekiwania liczy się od nowa.',
      ifNothing: 'Może się okazać, że do porodu brakuje dni ubezpieczenia i prawo do zasiłku nie powstanie.',
      action: { label: 'Okresy ubezpieczenia w eZUS', url: zus + '/pl/ezus' },
      unconfirmed: true,
    })
  }

  if (answers.employment === 'employee' && answers.payerReports === 'no') {
    items.push({
      id: 'umowa-bez-zgloszenia',
      when: 'now',
      title: 'Poproś pracodawcę o wyjaśnienie braku zgłoszenia',
      why: 'Umowa o pracę z mocy prawa obejmuje ubezpieczenie chorobowe, więc brak zgłoszenia to błąd płatnika, nie brak tytułu.',
      ifNothing: 'Późniejsze prostowanie zgłoszenia jest możliwe, ale opóźnia wypłatę i komplikuje sprawę.',
      action: { label: 'Informacja o zgłoszeniach w ZUS', url: zus + '/pl/swiadczenia' },
    })
  }

  if (soon) {
    items.push({
      id: 'wczekiwanie',
      when: 'now',
      title: 'Sprawdź, ile dni ubezpieczenia chorobowego już masz',
      why: 'Prawo do zasiłku zależy od tego, czy okres ubezpieczenia zdąży się nazbierać przed porodem.',
      ifNothing: 'Przy krótkim horyzoncie czasu może zabraknąć dni i wniosek zostanie odrzucony.',
      action: { label: 'PUE/eZUS — Twoje okresy ubezpieczenia', url: zus + '/pl/ezus' },
      unconfirmed: true,
    })
  }

  items.push({
    id: 'dokumenty',
    when: 'before',
    title: 'Uzupełnij dokumenty potwierdzające tytuł do ubezpieczenia',
    why: 'Umowa, zgłoszenie do ZUS i zaświadczenie płatnika to dokumenty, które ZUS bierze pod uwagę przy spornej sprawie.',
    ifNothing: 'Bez nich ZUS może zakwestionować ubezpieczenie i podważać podstawę wymiaru.',
    action: { label: 'Wymagane dokumenty', url: zus + '/pl/swiadczenia/zasilki/zasilek-macierzynski/niezbedne-dokumenty' },
  })

  if (answers.employment === 'employee' || answers.employment === 'contractor' || answers.employment === 'self_employed') {
    items.push({
      id: 'podstawa',
      when: 'during',
      title: 'Sprawdź podstawę wymiaru składki przed porodem',
      why: 'Podstawa wymiaru to kwota, od której liczy się zasiłek. Podwyżka podstawy w ciąży bywa kwestionowana przez ZUS.',
      ifNothing: 'Zbyt niska podstawa obniży wypłatę, a podwyższona w ciąży może zostać zakwestionowana.',
      action: { label: 'Podstawa wymiaru zasiłku', url: zus + '/pl/swiadczenia/zasilki/zasilek-macierzynski' },
    })
  }

  items.push({
    id: 'wniosek-815',
    when: 'during',
    title: 'Przygotuj wniosek o stawkę 81,5%',
    why: 'Wniosek złożony wkrótce po porodzie daje uśrednioną stawkę za cały okres urlopu.',
    ifNothing: 'Po terminie zostaje wariant bez uśredniania: 100% podstawy za macierzyński i 70% za rodzicielski.',
    action: { label: 'Zasady zasiłku macierzyńskiego', url: zus + '/pl/swiadczenia/zasilki/zasilek-macierzynski' },
  })

  items.push({
    id: 'plan-urlopow',
    when: 'during',
    title: 'Ustal z drugim rodzicem plan urlopów',
    why: 'Część urlopu rodzicielskiego jest nieprzenoszalna dla każdego z rodziców. Niewykorzystana przepada.',
    ifNothing: 'Zapłacicie za brak decyzji: tygodnie drugiego rodzica przepadną, bo nie da się ich przenieść.',
    action: { label: 'Urlop rodzicielski — gov.pl', url: gov + '/urlop-rodzicielski' },
  })

  return items
}

/** Terminy bez daty porodu: jeden punkt kontrolny na koniec horyzontu, o którym mówi użytkownik. */
export function planningCalendar(answers: PlanningAnswers, items: PrepItem[]): CalendarEvent[] {
  const months = Number(answers.horizonMonths)
  if (!Number.isFinite(months) || months <= 0) return []
  const date = shiftDate(new Date().toISOString().slice(0, 10), Math.round(months * 30))
  return [{
    date,
    title: 'Przegląd przygotowań przed ciążą',
    description: [
      'Punkt kontrolny z trybu planowania. Do tego dnia sprawdź:',
      ...items.map((item) => '- ' + item.title),
    ].join('\n'),
    url: zus + '/pl/swiadczenia',
    hint: 'Horyzont, który sam podałeś, to ' + months + ' miesięcy. To przypomnienie, nie termin ustawowy.',
  }]
}

export const planningHelpers = { prepLabels }
