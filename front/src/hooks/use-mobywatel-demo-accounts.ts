import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { DemoAccount } from '@/types/api'

/** Lista kont do dema. Backend wystawia ją tylko poza produkcją. */
export function useMobywatelDemoAccounts() {
  return useQuery({
    queryKey: ['mobywatel', 'demo-accounts'],
    queryFn: async () => {
      const { data } = await api.get<DemoAccount[]>('/auth/mobywatel/demo-accounts')
      return data
    },
    enabled: import.meta.env.DEV,
    retry: false,
    staleTime: Infinity,
  })
}
