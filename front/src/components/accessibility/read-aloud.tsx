import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { CircleAlert, Pause, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** Ten atrybut znaczy "ten fragment idzie do lektora", a nie "to ozdoba". */
export const READ_ATTR = 'data-read'

/** Prosty język i lektor zostają pod kontrolą użytkownika, nie pod kontrolą przeglądarki. */
function polishVoice() {
  if (typeof speechSynthesis === 'undefined') return undefined
  return speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith('pl'))
}

function textOf(element: Element) {
  return (element.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/**
 * Czyta na głos podsumowanie wyniku. Podczas czytania podświetla czytany
 * fragment, a drugie kliknięcie zatrzymuje. Gdy urządzenie nie ma polskiego
 * lektora, mówimy to wprost, zamiast pokazywać przycisk, który milczy.
 */
export function ReadAloud({
  targetRef,
  label = 'Przeczytaj wynik',
  className,
}: {
  targetRef: RefObject<HTMLElement | null>
  label?: string
  className?: string
}) {
  const [speaking, setSpeaking] = useState(false)
  const [noVoice, setNoVoice] = useState(false)
  const cancelled = useRef(false)

  const stop = useCallback(() => {
    cancelled.current = true
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
    document.querySelectorAll('.is-reading').forEach((node) => node.classList.remove('is-reading'))
    setSpeaking(false)
  }, [])

  useEffect(() => stop, [stop])

  function start() {
    const target = targetRef.current
    if (!target) return
    const nodes = Array.from(target.querySelectorAll(`[${READ_ATTR}]`)).filter((node) => textOf(node))
    if (!nodes.length) return
    const voice = polishVoice()
    if (!voice) {
      setNoVoice(true)
      return
    }
    setNoVoice(false)
    cancelled.current = false
    setSpeaking(true)
    speechSynthesis.cancel()

    nodes.forEach((node, index) => {
      const utterance = new SpeechSynthesisUtterance(textOf(node))
      utterance.voice = voice
      utterance.lang = voice.lang || 'pl-PL'
      utterance.onstart = () => {
        if (cancelled.current) return
        node.classList.add('is-reading')
      }
      utterance.onend = () => {
        node.classList.remove('is-reading')
        if (index === nodes.length - 1 && !cancelled.current) setSpeaking(false)
      }
      utterance.onerror = () => {
        node.classList.remove('is-reading')
        if (index === nodes.length - 1) setSpeaking(false)
      }
      speechSynthesis.speak(utterance)
    })
  }

  return (
    <div className={className}>
      <Button type="button" variant="outline" onClick={speaking ? stop : start}>
        {speaking ? <Pause aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
        {speaking ? 'Zatrzymaj czytanie' : label}
      </Button>
      {noVoice && (
        <p role="status" className="mt-2 flex items-start gap-2 text-sm text-amber-800">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          To urządzenie nie ma polskiego lektora, więc nie przeczytamy tekstu. Na komputerze
          z Windows dodaj polski głos w ustawieniach mowy, a na telefonie włącz syntezator mowy.
        </p>
      )}
    </div>
  )
}
