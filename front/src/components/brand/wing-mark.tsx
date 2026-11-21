/* Znak serwisu: para skrzydeł, na każdym dwa pióra. Jedno skrzydło rysujemy
   raz, a drugie odbijamy lustrem, więc oba zawsze trzymają ten sam kształt.

   Kształt jest wypełniony, nie obrysowany kreską, bo w favikonie przy 16 px
   obrys się rozmywa. Nasady skrzydeł są odsunięte od osi, więc w środku
   zostaje szczelina i znak nie czyta się jak haczyk. */
const WING =
  'M12.9 20.4C14.4 13.6 17.9 8.1 21.8 5.0C20.3 7.1 18.9 8.8 17.7 10.2C18.7 10.7 19.6 11.5 20.3 12.4C18.4 13.9 16.5 15.4 14.9 16.6C14.4 17.9 13.6 19.3 12.9 20.4Z'

export function WingMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      {/* Przesunięcie w górę wyrównuje optycznie zapas nad i pod znakiem. */}
      <g transform="translate(0 -0.5)" fill="currentColor">
        <path d={WING} />
        <g transform="translate(24 0) scale(-1 1)">
          <path d={WING} />
        </g>
      </g>
    </svg>
  )
}