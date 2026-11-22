import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ZusRecognition } from '@/types/api'

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
