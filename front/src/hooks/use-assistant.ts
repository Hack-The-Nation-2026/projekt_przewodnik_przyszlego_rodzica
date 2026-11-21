import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AssistantAnswer, AssistantTopic } from '@/types/api'

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

/** Jedno pytanie do asystenta. Serwer nic nie zapisuje, więc nie ma historii do czyszczenia. */
export function useAskAssistant() {
  return useMutation({
    mutationFn: async (question: string) => {
      const { data } = await api.post<AssistantAnswer>('/assistant/ask', { question })
      return data
    },
  })
}