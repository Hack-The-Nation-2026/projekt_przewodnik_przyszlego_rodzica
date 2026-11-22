import { QrCard } from './QrCard'

/**
 * Plansza otwierająca. Kod jest na ekranie od pierwszej sekundy, więc kto chce,
 * otwiera demo jeszcze przed końcem filmu.
 */
export function IntroScene() {
  return (
    <QrCard
      title="Zeskanuj kod i wejdź na demo"
      body="Film pokazuje drogę od pytania do gotowej karty uprawnień. Serwis działa na telefonie i na komputerze."
    />
  )
}
