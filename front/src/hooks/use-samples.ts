import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ZusRecognition, ZusSample, ZusSampleSummary } from '@/types/api'

/** Lista spraw z zestawu przykładowego ZUS. */
export function useSamples() {
  return useQuery({
    queryKey: ['zus-samples'],
    queryFn: async () => {
      const { data } = await api.get<ZusSampleSummary[]>('/samples')
      return data
    },
    staleTime: Number.POSITIVE_INFINITY,
  })
}

/** Jedna sprawa z zestawu, wybrana z listy zamiast wgrania pliku. */
export function useSample(sampleId: string | null) {
  return useQuery({
    queryKey: ['zus-sample', sampleId],
    queryFn: async () => {
      const { data } = await api.get<ZusSample>(`/samples/${sampleId}`)
      return data
    },
    enabled: !!sampleId,
  })
}

/**
   * Rozpoznanie wgranego PDF-a: najpierw odcisk, potem nazwa pliku jako zapas.
   */
export function useRecognizeSample() {
  return useMutation({
    mutationFn: async (file: { sha256: string; file_name: string }) => {
      const { data } = await api.post<ZusRecognition>('/samples/recognize', file)
      return data
    },
  })
}