import type { CalendarEvent } from '@/lib/benefit-documents'

const PRODID = '-//Skrzydla Rodzica//Terminy//PL'

/** iCalendar wymaga własnego escapowania tekstu, nie HTML. */
function escapeText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

/** Linie w pliku .ics mają maksymalnie 75 bajtów, a UTF-8 liczy się w bajtach. */
function fold(line: string) {
  const encoder = new TextEncoder()
  if (encoder.encode(line).length <= 75) return line
  const parts: string[] = []
  let current = ''
  let currentBytes = 0
  for (const char of line) {
    const size = encoder.encode(char).length
    const limit = parts.length === 0 ? 75 : 74
    if (currentBytes + size > limit) {
      parts.push(current)
      current = char
      currentBytes = size
    } else {
      current += char
      currentBytes += size
    }
  }
  if (current) parts.push(current)
  return parts.join('\r\n ')
}

function stamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function day(value: string) {
  return value.replace(/-/g, '')
}

function nextDay(value: string) {
  const date = new Date(value + 'T00:00:00Z')
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10).replace(/-/g, '')
}

/**
 * Całodniowe wydarzenia z terminami. Każde ma nazwę czynności, link do
 * formularza i przypomnienie dzień wcześniej.
 */
export function buildIcs(events: CalendarEvent[], now = new Date()) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Skrzydła Rodzica — terminy',
  ]

  events.forEach((event, index) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${day(event.date)}-${index}@skrzydla-rodzica`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART;VALUE=DATE:${day(event.date)}`,
      `DTEND;VALUE=DATE:${nextDay(event.date)}`,
      `SUMMARY:${escapeText(event.title)}`,
      `DESCRIPTION:${escapeText(event.description + '\nFormularz: ' + event.url)}`,
      `URL:${event.url}`,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText('Przypomnienie: ' + event.title)}`,
      'END:VALARM',
      'END:VEVENT',
    )
  })

  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}

export function downloadIcs(events: CalendarEvent[], filename: string) {
  const blob = new Blob([buildIcs(events)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}