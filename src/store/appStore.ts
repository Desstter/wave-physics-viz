import { create } from 'zustand'
import type { Section } from '../types/simulation.types'

interface AppStore {
  activeSection: Section
  setActiveSection: (s: Section) => void
  selectedWaveId: string
  setSelectedWaveId: (id: string) => void
  selectedWaveId2: string  // for comparison mode
  setSelectedWaveId2: (id: string) => void
  selectedMaterialId: string
  setSelectedMaterialId: (id: string) => void
  selectedFrequencyHz: number   // custom freq from spectrum slider
  setSelectedFrequencyHz: (f: number) => void
  incidentAngleDeg: number
  setIncidentAngleDeg: (a: number) => void
  distanceM: number
  setDistanceM: (d: number) => void
  powerWatts: number
  setPowerWatts: (p: number) => void
}

export const useAppStore = create<AppStore>((set) => ({
  activeSection: 'spectrum',
  setActiveSection: (activeSection) => set({ activeSection }),
  selectedWaveId: 'wifi_24',
  setSelectedWaveId: (selectedWaveId) => set({ selectedWaveId }),
  selectedWaveId2: '5g_sub6',
  setSelectedWaveId2: (selectedWaveId2) => set({ selectedWaveId2 }),
  selectedMaterialId: 'concrete',
  setSelectedMaterialId: (selectedMaterialId) => set({ selectedMaterialId }),
  selectedFrequencyHz: 2.4e9,
  setSelectedFrequencyHz: (selectedFrequencyHz) => set({ selectedFrequencyHz }),
  incidentAngleDeg: 0,
  setIncidentAngleDeg: (incidentAngleDeg) => set({ incidentAngleDeg }),
  distanceM: 10,
  setDistanceM: (distanceM) => set({ distanceM }),
  powerWatts: 0.1,
  setPowerWatts: (powerWatts) => set({ powerWatts }),
}))
