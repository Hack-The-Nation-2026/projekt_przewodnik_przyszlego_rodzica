import { create } from 'zustand'

interface AppState {
  // Symulacja logowania przez mObywatel. Prawdziwy przepływ dojdzie po doprecyzowaniu zadania.
  citizenName: string | null
  signIn: (name: string) => void
  signOut: () => void
}

export const useAppStore = create<AppState>((set) => ({
  citizenName: null,
  signIn: (name) => set({ citizenName: name }),
  signOut: () => set({ citizenName: null }),
}))
