export type MaterialCategory = 'building' | 'biological' | 'conductor' | 'dielectric' | 'liquid'

export interface MaterialFreqPoint {
  frequencyHz: number
  attenuationDbPerMeter: number
  relativePermittivity: number
  conductivity: number         // S/m
  relativePermeability: number
}

export interface Material {
  id: string
  label: string
  category: MaterialCategory
  thicknessM: number           // default slab thickness
  color: string                // hex fill for canvas
  description: string
  frequencyData: MaterialFreqPoint[]
}
