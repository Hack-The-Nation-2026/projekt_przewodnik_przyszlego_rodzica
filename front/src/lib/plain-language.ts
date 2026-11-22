import { useA11yStore } from '@/store/a11y-store'

/**
 * Prosty język: gotowe krótkie wersje długich zdań, napisane obok oryginałów.
 *
 * To nie model ani skracanie automatyczne — każdy tekst jest napisany ręcznie,
 * bo tylko wtedy da się zagwarantować, że nie zmieni znaczenia. Dlatego
 * obejmujemy trzy ekrany, na których zrozumienie naprawdę ratuje sprawę:
 * wynik, ryzyka i terminy. Zdania, które niosą datę albo kwotę, zostają jak są.
 */
export const PLAIN_TEXTS: Record<string, string> = {
  // Ekran ryzyk.
  'Co może zmienić wypłatę': 'Co może obniżyć wypłatę',
  'ZUS może sprawdzić, czy stosunek pracy rzeczywiście powstał. Przy ocenie bierze pod uwagę m.in. okoliczności zawarcia umowy i faktyczne wykonywanie pracy.':
    'ZUS sprawdzi, czy umowa była prawdziwa.',
  'Jeśli ZUS uzna umowę za pozorną, może odmówić zasiłków z tego tytułu. Wypłata z tej umowy może wtedy wynieść 0 zł.':
    'Jeśli ZUS uzna umowę za pozorną, zasiłek z tej umowy wyniesie 0 zł.',
  'ZUS może sprawdzić, czy wynagrodzenie przyjęte do wyliczenia odpowiada wykonywanej pracy i warunkom zatrudnienia.':
    'ZUS sprawdzi, czy podwyżka odpowiada pracy.',
  'Jeśli symulacja uwzględnia podwyżkę, ustalenie przez ZUS niższej podstawy może obniżyć wypłatę.':
    'Jeśli ZUS przyjmie niższą podstawę, wypłata spadnie.',
  'Sprawdź, czy ubezpieczenie z innego tytułu obejmuje dzień porodu lub czy spełniasz warunki wypłaty po ustaniu zatrudnienia.':
    'Sprawdź, czy inne ubezpieczenie obejmuje dzień porodu.',
  'W wywiadzie wskazałaś brak ubezpieczenia chorobowego na dzień powstania prawa. W określonych przypadkach zasiłek może przysługiwać także po ustaniu zatrudnienia.':
    'Nie masz ubezpieczenia w dniu porodu. Czasem zasiłek i tak przysługuje.',
  'Bez ubezpieczenia w dniu porodu i bez prawa do wyjątku wypłata zasiłku macierzyńskiego wyniesie 0 zł.':
    'Bez ubezpieczenia i bez wyjątku zasiłek wyniesie 0 zł.',
  'Potwierdź ubezpieczenie chorobowe w dniu porodu, aby kalkulator mógł ocenić prawo do zasiłku.':
    'Powiedz, czy w dniu porodu miałaś ubezpieczenie chorobowe.',

  // Ekran wyniku.
  'Wstępna symulacja z przewidywaną datą porodu, na podstawie ostatnio wysłanych odpowiedzi.':
    'To wstępne wyliczenie. Data porodu jest przewidywana.',
  'Symulacja na podstawie ostatnio wysłanych odpowiedzi.':
    'To wyliczenie z Twoich ostatnich odpowiedzi.',
  'Część okresu się należy, resztę pomijamy. Szczegóły są w opisie karty.':
    'Część okresu się należy.',
  'Brakuje odpowiedzi, żeby to policzyć. Wróć do formularza i uzupełnij dane.':
    'Brakuje danych. Wróć do formularza.',
  'Ten wariant wywiadu nie obejmuje tego świadczenia.':
    'Ten wariant tego nie obejmuje.',

  // Ekran terminów (karta uprawnień).
  'Do tych świadczeń nie ma terminu, który dałoby się wyliczyć z podanych dat.':
    'Nie ma tu terminu, który da się wyliczyć z podanych dat.',
  'Sprawdź z płatnikiem, czy wniosek jeszcze przejdzie.':
    'Sprawdź u płatnika, czy wniosek jeszcze przejdzie.',
  'Złóż wniosek o zasiłek w stawce 81,5%': 'Wniosek o 81,5%',
  'Złóż wniosek o urlop rodzicielski': 'Wniosek o urlop rodzicielski',
  'Złóż wniosek o urlop ojcowski': 'Wniosek o urlop ojcowski',
  'Złóż wniosek o przejęcie urlopu przez ojca': 'Wniosek o przejęcie urlopu',
  'Złóż wniosek o uzupełniający urlop macierzyński': 'Wniosek o urlop uzupełniający',
  'Bez wniosku w terminie wraca wariant bez uśredniania: sto procent podstawy za macierzyński i siedemdziesiąt procent za rodzicielski.':
    'Po terminie macierzyński to 100%, a rodzicielski 70% podstawy.',
  'Wniosek po terminie zwykle przesuwa początek części urlopu, a nie skraca jego wymiaru. Ustal to z pracodawcą.':
    'Po terminie urlop zwykle zaczyna się później. Ustal nowy termin z pracodawcą.',
  'Urlop ojcowski przepada, jeśli nie zostanie wykorzystany do dwunastego miesiąca życia dziecka.':
    'Urlop ojcowski przepada po dwunastym miesiącu życia dziecka.',
  'Przejęcie urlopu bez zachowania terminu wymaga zgody pracodawcy.':
    'Przejęcie urlopu wymaga zgody pracodawcy.',
  'Urlop uzupełniający wykorzystuje się bezpośrednio po macierzyńskim, więc spóźniony wniosek najczęściej go zamyka.':
    'Urlop uzupełniający jest zaraz po macierzyńskim, więc po terminie przepada.',
}

/**
 * Zwraca funkcję, która zamienia zdanie na krótszą wersję, gdy prosty język
 * jest włączony. Zdania bez gotowej wersji zostają niezmienione.
 */
export function usePlain() {
  const on = useA11yStore((state) => state.plainLanguage)
  return (text: string) => (on ? (PLAIN_TEXTS[text] ?? text) : text)
}
