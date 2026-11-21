import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CaseApplication, CaseResult, CaseSummary } from '@/types/api'

/** Lista wniosków dostępnych na stronie. */
export function useCases() {
  return useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const { data } = await api.get<CaseSummary[]>('/cases')
      return data
    },
    staleTime: 60_000,
  })
}

/** Przejście jednego wniosku z zestawu: weryfikacja ubezpieczenia i kalkulator. */
export function useCase(caseId: string | null) {
  return useQuery({
    queryKey: ['case', caseId],
    queryFn: async () => {
      const { data } = await api.get<CaseResult>(`/cases/${caseId}`)
      return data
    },
    enabled: !!caseId,
  })
}

/** Ten sam przebieg dla wniosku wgranego z pliku. Nic nie zapisujemy na serwerze. */
export function useSimulateCase() {
  return useMutation({
    mutationFn: async (application: CaseApplication) => {
      const { data } = await api.post<CaseResult>('/cases/simulate', application)
      return data
    },
  })
}