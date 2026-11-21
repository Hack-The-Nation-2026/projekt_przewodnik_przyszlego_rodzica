/* Znak serwisu: para skrzydeł z trzech piór. Lewe skrzydło rysujemy raz,
   a prawe odbijamy lustrem, więc oba zawsze trzymają ten sam kształt. */
const WING = [
  'M11.3 20.2c-1.8-1.4-2.7-3.2-2.9-5.8',
  'M11.6 14.8c-3.9-1.2-6.8-4.1-8.4-8.2',
]

export function WingMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth={1.9} strokeLinecap="round">
        {WING.map((d) => <path key={d} d={d} />)}
        <g transform="translate(24 0) scale(-1 1)">
          {WING.map((d) => <path key={d} d={d} />)}
        </g>
      </g>
    </svg>
  )
}