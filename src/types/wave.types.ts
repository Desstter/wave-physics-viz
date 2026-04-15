export type EMBand =
  | 'ELF' | 'SLF' | 'ULF' | 'VLF' | 'LF' | 'MF' | 'HF'
  | 'VHF' | 'UHF' | 'SHF' | 'EHF'
  | 'Infrared' | 'Visible' | 'UV' | 'XRay' | 'Gamma'

export interface WaveType {
  id: string
  label: string
  category: string
  band: EMBand
  frequencyHz: number
  frequencyRangeHz?: [number, number]
  wavelengthM: number
  energyEV: number
  color: string         // hex accent color
  description: string
  useCases: string[]
  ionizing: boolean
  penetratesWalls: 'high' | 'medium' | 'low' | 'none'
  safetyNote?: string
}
