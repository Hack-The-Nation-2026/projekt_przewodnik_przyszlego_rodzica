import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AppSettings } from '@/types/api'

/** Parametry kalkulatora i stany funkcji. Wspólny cache, żeby nagłówek i ekrany
    czytały ten sam zestaw i odświeżały się po zapisie w panelu. */
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get<AppSettings>('/settings')
      return data
    },
    staleTime: 30_000,
  })
}

/** Czy funkcja jest włączona. Dopóki ustawienia się nie wczytają, nic nie chowamy. */
export function useFeature(key: string) {
  const { data } = useSettings()
  return data?.features.find((flag) => flag.key === key)?.enabled ?? true
}

export function useSaveSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (settings: AppSettings) => {
      const { data } = await api.put<AppSettings>('/admin/settings', settings)
      return data
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(['settings'], settings)
      queryClient.invalidateQueries({ queryKey: ['settings-preview'] })
    },
  })
}

export function useResetSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<AppSettings>('/admin/settings/reset')
      return data
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(['settings'], settings)
      queryClient.invalidateQueries({ queryKey: ['settings-preview'] })
    },
  })
}