import { create } from 'zustand'
import type { Citizen } from '@/types/api'

interface AppState {
  // Sesja żyje tylko w pamięci: symulacja logowania, nic nie ląduje w localStorage.
  citizen: Citizen | null
  signIn: (citizen: Citizen) => void
  signOut: () => void
}

export const useAppStore = create<AppState>((set) => ({
  citizen: null,
  signIn: (citizen) => set({ citizen }),
  signOut: () => set({ citizen: null }),
}))
