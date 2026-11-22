import { create } from 'zustand'
import {
  applyA11ySettings,
  defaultA11ySettings,
  readA11ySettings,
  writeA11ySettings,
} from '@/lib/accessibility'
import type { A11ySettings } from '@/lib/accessibility'

interface A11yState extends A11ySettings {
  /** Otwarcie panelu w nagłówku. Nie zapisujemy go, bo to stan na teraz. */
  panelOpen: boolean
  setPanelOpen: (open: boolean) => void
  update: (patch: Partial<A11ySettings>) => void
  reset: () => void
}

/**
 * Panel dostępności czyta ustawienia raz, przy wejściu na stronę, i zapisuje
 * każdą zmianę od razu. Znaczniki na `<html>` ustawia ta sama funkcja, co
 * czyta arkusz stylów, żeby nie było dwóch źródeł prawdy.
 */
export const useA11yStore = create<A11yState>((set, get) => ({
  ...defaultA11ySettings,
  panelOpen: false,
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  update: (patch) => {
    const next: A11ySettings = {
      contrast: get().contrast,
      textScale: get().textScale,
      readAloud: get().readAloud,
      reduceMotion: get().reduceMotion,
      ...patch,
    }
    writeA11ySettings(next)
    applyA11ySettings(next)
    set(next)
  },
  reset: () => {
    writeA11ySettings(defaultA11ySettings)
    applyA11ySettings(defaultA11ySettings)
    set(defaultA11ySettings)
  },
}))

/** Ustawienia wczytane z przeglądarki wprowadzamy na `<html>` przed pierwszym malowaniem. */
export function initA11ySettings() {
  const settings = readA11ySettings()
  applyA11ySettings(settings)
  useA11yStore.setState(settings)
}
