import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, Compass, RotateCcw, Send, Sparkles, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAskAssistant, useAssistantTopics } from '@/hooks/use-assistant'
import { cn } from '@/lib/utils'
import type { AssistantAnswer, AssistantLink, AssistantTopic, AssistantTurn } from '@/types/api'

type Turn =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'assistant'; answer: AssistantAnswer }

// Ile ostatnich pytań jedzie z każdym zapytaniem, żeby asystent pamiętał rozmowę.
const HISTORY_TURNS = 4
// Zaproszenie do rozmowy pokazujemy raz na sesję, po chwili od wejścia.
const TEASER_DELAY_MS = 6000
const TEASER_STORAGE_KEY = 'asystent-zaproszenie'

/** Pary pytanie-odpowiedź z rozmowy, w formie, którą rozumie serwer. */
function buildHistory(turns: Turn[]): AssistantTurn[] {
  const history: AssistantTurn[] = []
  for (const turn of turns) {
    if (turn.role === 'user') {
      history.push({ question: turn.text, topic: null })
    } else if (history.length > 0) {
      history[history.length - 1].topic = turn.answer.topic
    }
  }
  return history.slice(-HISTORY_TURNS)
}

function SuggestionChip({
  topic,
  onPick,
}: {
  topic: AssistantTopic
  onPick: (question: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(topic.question)}
      className="rounded-full border border-border px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent"
    >
      {topic.question}
    </button>
  )
}

/** Link do podstrony albo do instytucji. Zewnętrzne otwieramy w nowej karcie. */
function AnswerLink({ link }: { link: AssistantLink }) {
  const body = (
    <>
      <span className="min-w-0">
        <span className="block font-medium">{link.label}</span>
        {link.description && (
          <span className="mt-0.5 block text-muted-foreground">{link.description}</span>
        )}
      </span>
      {link.kind === 'page' ? (
        <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      ) : (
        <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      )}
    </>
  )

  const className =
    'flex h-full items-start justify-between gap-3 rounded-md border border-primary/35 bg-primary/5 px-3 py-2.5 text-sm transition-colors hover:border-primary/70 hover:bg-primary/10'

  if (link.kind === 'page') {
    return (
      <Link to={link.href} className={className}>
        {body}
      </Link>
    )
  }
  return (
    <a href={link.href} target="_blank" rel="noreferrer noopener" className={className}>
      {body}
    </a>
  )
}

function AssistantTurn({
  answer,
  onPick,
}: {
  answer: AssistantAnswer
  onPick: (question: string) => void
}) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Sparkles className="size-3.5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-relaxed">{answer.answer}</p>
        <ul className="mt-2 grid gap-2">
          {answer.links.map((link) => (
            <li key={link.href}>
              <AnswerLink link={link} />
            </li>
          ))}
        </ul>
        {answer.suggestions.length > 0 && (
          <div className="mt-2.5 space-y-1.5">
            <p className="text-xs text-muted-foreground">Możesz też zapytać o</p>
            <div className="flex flex-wrap gap-1.5">
              {answer.suggestions.map((topic) => (
                <SuggestionChip key={topic.id} topic={topic} onPick={onPick} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function AssistantWidget() {
  const topics = useAssistantTopics()
  const ask = useAskAssistant()
  const [open, setOpen] = useState(false)
  const [teaser, setTeaser] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([])
  const [question, setQuestion] = useState('')
  const launcher = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const lastAnswer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (sessionStorage.getItem(TEASER_STORAGE_KEY)) return
    const timer = window.setTimeout(() => setTeaser(true), TEASER_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!open) return
    input.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      launcher.current?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    const container = body.current
    if (!open || !container) return
    // Pytanie i "Szukam strony…" mają być widoczne od razu, a po odpowiedzi panel
    // pokazuje jej początek, bo linki i podpowiedzi i tak są dłuższe niż okno.
    if (ask.isPending) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
      return
    }
    const answer = lastAnswer.current
    if (!answer) return
    const top =
      container.scrollTop +
      answer.getBoundingClientRect().top -
      container.getBoundingClientRect().top -
      8
    container.scrollTo({ top, behavior: 'smooth' })
  }, [open, ask.isPending, turns.length])

  function dismissTeaser() {
    setTeaser(false)
    sessionStorage.setItem(TEASER_STORAGE_KEY, '1')
  }

  function openWidget() {
    dismissTeaser()
    setOpen(true)
  }

  function send(text: string) {
    const trimmed = text.trim()
    if (trimmed.length < 2 || ask.isPending) return
    const id = Date.now()
    setTurns((previous) => [...previous, { id, role: 'user', text: trimmed }])
    setQuestion('')
    ask.mutate(
      { question: trimmed, history: buildHistory(turns) },
      {
        onSuccess: (answer) => {
          setTurns((previous) => [...previous, { id: id + 1, role: 'assistant', answer }])
        },
      },
    )
  }

  const suggestions = (topics.data ?? []).slice(0, 4)
  const lastAnswerId = turns.findLast((turn) => turn.role === 'assistant')?.id

  return (
    <div
      data-scroll-ignore
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-end p-4 [&_button:not(:disabled)]:cursor-pointer sm:p-6"
    >
      <div className="pointer-events-auto flex w-full max-w-sm flex-col items-end gap-3">
        {open && (
          <section
            id="asystent-panel"
            role="dialog"
            aria-label="Asystent nawigacyjny"
            className="flex max-h-[min(34rem,calc(100dvh-7rem))] w-full flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
          >
            <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
              <Sparkles className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-sm font-semibold">Asystent</p>
              <div className="ml-auto flex items-center">
                {turns.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Wyczyść rozmowę"
                    onClick={() => setTurns([])}
                  >
                    <RotateCcw />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Zamknij asystenta"
                  onClick={() => setOpen(false)}
                >
                  <X />
                </Button>
              </div>
            </header>

            <div
              ref={body}
              className="flex-1 space-y-5 overflow-y-auto px-3 py-4"
              aria-live="polite"
            >
              {turns.length === 0 && (
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Compass className="size-3.5" aria-hidden="true" />
                    </span>
                    <p className="text-sm font-medium">Od czego chcesz zacząć?</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Wskażę stronę, na której znajdziesz odpowiedź. Kwoty i terminy zostawiam
                    kalkulatorowi.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {topics.isPending
                      ? Array.from({ length: 3 }, (_, index) => (
                          <span
                            key={index}
                            className="h-8 w-40 animate-pulse rounded-full bg-secondary"
                          />
                        ))
                      : suggestions.map((topic) => (
                          <SuggestionChip key={topic.id} topic={topic} onPick={send} />
                        ))}
                  </div>
                </div>
              )}

              {turns.map((turn) =>
                turn.role === 'user' ? (
                  <p
                    key={turn.id}
                    className="ml-auto w-fit max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                  >
                    {turn.text}
                  </p>
                ) : (
                  <div key={turn.id} ref={turn.id === lastAnswerId ? lastAnswer : undefined}>
                    <AssistantTurn answer={turn.answer} onPick={send} />
                  </div>
                ),
              )}

              {ask.isPending && (
                <p role="status" className="text-sm text-muted-foreground">
                  Szukam strony…
                </p>
              )}

              {ask.isError && (
                <p className="rounded-md bg-secondary px-3 py-2 text-sm">
                  Nie udało się zapytać. Sprawdź połączenie i spróbuj jeszcze raz.
                </p>
              )}

            </div>

            <form
              className="border-t border-border px-3 py-2.5"
              onSubmit={(event) => {
                event.preventDefault()
                send(question)
              }}
            >
              <label htmlFor="asystent-pytanie" className="sr-only">
                Twoje pytanie
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="asystent-pytanie"
                  ref={input}
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  maxLength={300}
                  autoComplete="off"
                  placeholder="Np. gdzie złożyć wniosek?"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={question.trim().length < 2 || ask.isPending}
                  aria-label="Zapytaj asystenta"
                  className="shrink-0"
                >
                  <Send />
                </Button>
              </div>
            </form>
          </section>
        )}

        {!open && teaser && (
          <div className="flex items-start gap-2 rounded-xl border border-border bg-background p-3 shadow-lg">
            <p className="text-sm">
              Masz pytanie? Napisz, a wskażę stronę, na której znajdziesz odpowiedź.
            </p>
            <button
              type="button"
              onClick={dismissTeaser}
              aria-label="Zamknij zaproszenie"
              className="rounded p-0.5 text-muted-foreground hover:bg-accent"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        <button
          ref={launcher}
          type="button"
          onClick={() => (open ? setOpen(false) : openWidget())}
          aria-expanded={open}
          aria-controls="asystent-panel"
          aria-label={open ? 'Zamknij asystenta' : 'Otwórz asystenta'}
          className={cn(
            // Nad zieloną stopką zielony przycisk by zniknął, więc jest jasny z zieloną
            // obwódką. Na białym tle trzyma go obwódka i cień.
            'flex h-12 items-center gap-2 rounded-full border-2 border-primary bg-background px-4 text-sm font-semibold text-primary shadow-xl transition-colors hover:bg-secondary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          )}
        >
          <Sparkles className="size-4" aria-hidden="true" />
          {open ? 'Zamknij' : 'Asystent'}
        </button>
      </div>
    </div>
  )
}