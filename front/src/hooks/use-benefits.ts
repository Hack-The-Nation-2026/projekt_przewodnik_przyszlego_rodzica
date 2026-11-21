import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { BenefitSummary } from '@/types/api'

export function useBenefits() {
  return useQuery({
    queryKey: ['benefits'],
    queryFn: async () => {
      const { data } = await api.get<BenefitSummary[]>('/benefits')
      return data
    },
  })
}
