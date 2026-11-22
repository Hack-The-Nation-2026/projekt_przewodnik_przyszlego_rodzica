/**
 * Zaznaczenia na liście dokumentów karty uprawnień: użytkownik odhacza to,
 * co już ma, i widzi, czego jeszcze brakuje. Stan zostaje w przeglądarce, więc
 * przy kolejnym wejściu lista pamięta, co jest w teczce.
 *
 * Karta jest drukowana, więc znaczniki są zwykłym tekstem (☑/☐), a nie
 * kontrolką formularza: to, co widać na ekranie, jest tym, co wyjdzie z drukarki.
 */
const STORAGE_KEY = 'card-documents-have'

export function readCardDocuments(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function saveCardDocuments(documents: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents))
  } catch {
    // Prywatny tryb przeglądarki: zaznaczenia zostają do końca wizyty.
  }
}

export function toggleCardDocument(documents: string[], document: string): string[] {
  return documents.includes(document)
    ? documents.filter((item) => item !== document)
    : [...documents, document]
}
