import { create } from 'zustand'
import type { MaterialSlab } from '../types/simulation.types'

interface SimStore {
  isPlaying: boolean
  togglePlay: () => void
  speedMultiplier: number
  setSpeed: (s: number) => void
  timeSeconds: number
  tickTime: (dt: number) => void
  slabs: MaterialSlab[]
  addSlab: (slab: MaterialSlab) => void
  removeSlab: (id: string) => void
  clearSlabs: () => void
  showReflection: boolean
  toggleReflection: () => void
  showTransmission: boolean
  toggleTransmission: () => void
}

export const useSimStore = create<SimStore>((set) => ({
  isPlaying: true,
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  speedMultiplier: 1,
  setSpeed: (speedMultiplier) => set({ speedMultiplier }),
  timeSeconds: 0,
  tickTime: (dt) => set((s) => ({ timeSeconds: s.timeSeconds + dt * s.speedMultiplier })),
  slabs: [
    { id: 'slab1', materialId: 'concrete', x: 0.55, width: 0.05 },
  ],
  addSlab: (slab) => set((s) => ({ slabs: [...s.slabs, slab] })),
  removeSlab: (id) => set((s) => ({ slabs: s.slabs.filter(sl => sl.id !== id) })),
  clearSlabs: () => set({ slabs: [] }),
  showReflection: true,
  toggleReflection: () => set((s) => ({ showReflection: !s.showReflection })),
  showTransmission: true,
  toggleTransmission: () => set((s) => ({ showTransmission: !s.showTransmission })),
}))
