import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AssistantAnswer, AssistantTopic, AssistantTurn } from '@/types/api'

/** Pytania startowe pokazywane pod pustą rozmową. */
export function useAssistantTopics() {
  return useQuery({
    queryKey: ['assistant', 'topics'],
    queryFn: async () => {
      const { data } = await api.get<AssistantTopic[]>('/assistant/topics')
      return data
    },
    staleTime: 5 * 60_000,
  })
}

/**
 * Pytanie do asystenta razem z ostatnimi pytaniami z rozmowy.
 *
 * Historia jedzie z przeglądarki przy każdym pytaniu, więc dopytanie typu
 * "a co z dokumentami?" ma kontekst. Serwer jej nie zapisuje.
 */
export function useAskAssistant() {
  return useMutation({
    mutationFn: async (input: { question: string; history: AssistantTurn[] }) => {
      const { data } = await api.post<AssistantAnswer>('/assistant/ask', input)
      return data
    },
  })
}