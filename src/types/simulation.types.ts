export interface MaterialSlab {
  id: string
  materialId: string
  x: number        // 0-1 normalized canvas position
  width: number    // 0-1 normalized width
}

export interface SimulationState {
  isPlaying: boolean
  speedMultiplier: number
  timeSeconds: number
  selectedWaveId: string
  powerWatts: number
  slabs: MaterialSlab[]
  showReflection: boolean
  showTransmission: boolean
}

export type Section = 'spectrum' | 'simulator' | 'materials' | 'distance' | 'compare'
