import { QrCard } from './QrCard'

/** Karta końcowa: kod zostaje na ekranie dłużej, bo to ostatnia okazja do zeskanowania. */
export function OutroScene() {
  return (
    <QrCard
      title="Sprawdź, co Ci przysługuje"
      body="Zeskanuj kod albo wejdź na stronę. Wywiad zajmuje kilka minut, a wynik zostaje na ekranie."
    />
  )
}
