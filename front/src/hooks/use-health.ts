import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { HealthStatus } from '@/types/api'

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const { data } = await api.get<HealthStatus>('/health')
      return data
    },
    retry: false,
    refetchInterval: 30_000,
  })
}
