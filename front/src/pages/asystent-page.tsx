import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, Compass, RotateCcw, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeading } from '@/components/layout/page-heading'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAskAssistant, useAssistantTopics } from '@/hooks/use-assistant'
import { cn } from '@/lib/utils'
import type { AssistantAnswer, AssistantLink, AssistantTopic } from '@/types/api'

type Turn =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'assistant'; answer: AssistantAnswer }

const FIRST_SUGGESTIONS = 6

function SuggestionChip({
  topic,
  onPick,
  className,
}: {
  topic: AssistantTopic
  onPick: (question: string) => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(topic.question)}
      className={cn(
        'rounded-full border border-border px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent',
        className,
      )}
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
          <span className="mt-0.5 block text-sm text-muted-foreground">{link.description}</span>
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
    'flex h-full items-start justify-between gap-3 rounded-md border border-border px-3 py-2.5 text-sm transition-colors hover:bg-accent'

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
    <div className="flex gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Sparkles className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="leading-relaxed">{answer.answer}</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {answer.links.map((link) => (
            <li key={link.href}>
              <AnswerLink link={link} />
            </li>
          ))}
        </ul>
        {answer.suggestions.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-muted-foreground">Może chodziło o</p>
            <div className="flex flex-wrap gap-2">
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

function EmptyState({
  topics,
  isPending,
  onPick,
}: {
  topics: AssistantTopic[]
  isPending: boolean
  onPick: (question: string) => void
}) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? topics : topics.slice(0, FIRST_SUGGESTIONS)

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Compass className="size-4" aria-hidden="true" />
        </span>
        <div>
          <p className="font-medium">Od czego chcesz zacząć?</p>
          <p className="text-sm text-muted-foreground">
            Wybierz gotowe pytanie albo wpisz własne słowami.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {isPending
          ? Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-8 w-52 rounded-full" />
            ))
          : visible.map((topic) => (
              <SuggestionChip key={topic.id} topic={topic} onPick={onPick} />
            ))}
      </div>
      {!isPending && topics.length > FIRST_SUGGESTIONS && (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="mt-2 h-auto px-0"
          onClick={() => setShowAll((value) => !value)}
        >
          {showAll ? 'Mniej pytań' : 'Zobacz wszystkie pytania'}
        </Button>
      )}
    </div>
  )
}

export function AsystentPage() {
  const topics = useAssistantTopics()
  const ask = useAskAssistant()
  const [turns, setTurns] = useState<Turn[]>([])
  const [question, setQuestion] = useState('')
  const anchor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (turns.length === 0) return
    anchor.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [turns.length, ask.isPending])

  function send(text: string) {
    const trimmed = text.trim()
    if (trimmed.length < 2 || ask.isPending) return
    const id = Date.now()
    setTurns((previous) => [...previous, { id, role: 'user', text: trimmed }])
    setQuestion('')
    ask.mutate(trimmed, {
      onSuccess: (answer) => {
        setTurns((previous) => [...previous, { id: id + 1, role: 'assistant', answer }])
      },
    })
  }

  return (
    <PageContainer className="space-y-8 py-12 sm:py-16">
      <PageHeading
        title="Asystent"
        crumb="Asystent"
        description="Wskaże stronę, na której znajdziesz odpowiedź, albo odeśle do ZUS, ministerstwa czy inspekcji pracy. Kwot i terminów nie podaje."
      />

      <Card className="overflow-hidden">
        <div className="flex items-start gap-3 border-b border-border/70 px-5 py-4 sm:px-6">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-medium">To nawigacja, nie doradca prawny</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Zasiłki liczy kalkulator z reguł zapisanych w przepisach. Pytanie zostaje w tym
              serwisie i nie idzie do żadnego zewnętrznego modelu.
            </p>
          </div>
          {turns.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto shrink-0"
              onClick={() => setTurns([])}
            >
              <RotateCcw />
              <span className="hidden sm:inline">Wyczyść</span>
            </Button>
          )}
        </div>

        <CardContent className="px-5 py-6 sm:px-6">
          <div className="space-y-6" aria-live="polite">
            {turns.length === 0 && (
              <EmptyState topics={topics.data ?? []} isPending={topics.isPending} onPick={send} />
            )}

            {turns.map((turn) =>
              turn.role === 'user' ? (
                <p
                  key={turn.id}
                  className="ml-auto w-fit max-w-[85%] rounded-lg bg-primary px-4 py-2.5 text-primary-foreground"
                >
                  {turn.text}
                </p>
              ) : (
                <AssistantTurn key={turn.id} answer={turn.answer} onPick={send} />
              ),
            )}

            {ask.isPending && (
              <p role="status" className="text-sm text-muted-foreground">
                Szukam strony…
              </p>
            )}

            {ask.isError && (
              <p className="rounded-md border border-border bg-secondary/60 px-4 py-3 text-sm">
                Nie udało się zapytać asystenta. Sprawdź połączenie i spróbuj jeszcze raz.
              </p>
            )}

            <div ref={anchor} />
          </div>
        </CardContent>

        <form
          className="border-t border-border/70 px-5 py-4 sm:px-6"
          onSubmit={(event) => {
            event.preventDefault()
            send(question)
          }}
        >
          <label htmlFor="assistant-question" className="sr-only">
            Twoje pytanie
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="assistant-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={300}
              autoComplete="off"
              placeholder="Np. gdzie złożyć wniosek o zasiłek?"
            />
            <Button type="submit" disabled={question.trim().length < 2 || ask.isPending}>
              Zapytaj
            </Button>
          </div>
        </form>
      </Card>

      <p className="text-sm text-muted-foreground">
        Szukasz liczby? <Link to="/kalkulator" className="font-medium text-primary underline underline-offset-4">Przejdź do kalkulatora</Link> i odpowiedz na pytania o swoją sytuację.
      </p>
    </PageContainer>
  )
}