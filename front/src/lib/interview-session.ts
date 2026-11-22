import type { InterviewValues } from '@/lib/interview-form'

/**
 * Ostatnie odpowiedzi z wywiadu, zapisane na czas wizyty.
 *
 * Karta uprawnień żyje na osobnej trasie, a kalkulator trzyma wynik tylko
 * w pamięci. Bez tego zapisu powrót z karty zaczynałby wywiad od pierwszego
 * pytania, mimo że wynik już był policzony. Dane zostają w przeglądarce, tak
 * samo jak odpowiedzi w formularzu.
 */
const STORAGE_KEY = 'interview-last'

export function saveInterviewSession(values: InterviewValues) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values))
  } catch {
    // Prywatny tryb przeglądarki: wynik zostaje do końca bieżącej trasy.
  }
}

export function readInterviewSession(): InterviewValues | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as InterviewValues) : null
  } catch {
    return null
  }
}
