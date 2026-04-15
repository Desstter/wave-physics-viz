import type { Material, MaterialFreqPoint } from '../types/material.types'

// Helper: create a frequency data point
function p(frequencyHz: number, dbPerM: number, epsr: number, sigma: number, mur: number = 1): MaterialFreqPoint {
  return { frequencyHz, attenuationDbPerMeter: dbPerM, relativePermittivity: epsr, conductivity: sigma, relativePermeability: mur }
}

export const MATERIALS: Material[] = [
  {
    id: 'air',
    label: 'Air (free space)',
    category: 'dielectric',
    thicknessM: 1,
    color: '#1e3a5f',
    description: 'Vacuum/air: essentially lossless for RF. Slight absorption at mmWave due to O₂ and H₂O vapor.',
    frequencyData: [
      p(1e6,   0,    1.0,  0),
      p(100e6, 0,    1.0,  0),
      p(2.4e9, 0,    1.0,  0),
      p(5e9,   0.001,1.0,  0),
      p(28e9,  0.007,1.0,  0),
      p(60e9,  10,   1.0,  0),  // 60 GHz O₂ absorption peak
      p(1e12,  0.1,  1.0,  0),
    ],
  },
  {
    id: 'drywall',
    label: 'Drywall / Gypsum Board',
    category: 'building',
    thicknessM: 0.012,
    color: '#d4a88a',
    description: 'Standard interior partition. Low water content → moderate RF attenuation. ~12 mm thick (1/2 inch).',
    frequencyData: [
      p(900e6, 3,   2.9,  0.019),
      p(2.4e9, 4,   2.9,  0.020),
      p(5e9,   6,   2.9,  0.025),
      p(10e9,  10,  2.9,  0.030),
      p(28e9,  18,  2.9,  0.040),
      p(60e9,  30,  2.9,  0.060),
    ],
  },
  {
    id: 'wood',
    label: 'Wood (dry)',
    category: 'building',
    thicknessM: 0.02,
    color: '#92400e',
    description: 'Dry wood. εᵣ ~2–4 depending on density and moisture. Low conductivity → moderate loss.',
    frequencyData: [
      p(900e6, 5,   2.0,  0.04),
      p(2.4e9, 7,   2.0,  0.05),
      p(5e9,   12,  2.0,  0.07),
      p(10e9,  18,  2.0,  0.10),
      p(28e9,  30,  2.0,  0.15),
    ],
  },
  {
    id: 'glass_plain',
    label: 'Glass (Plain)',
    category: 'dielectric',
    thicknessM: 0.006,
    color: '#7dd3fc',
    description: 'Standard window glass (soda-lime). Low loss at RF. εᵣ ≈ 6.5.',
    frequencyData: [
      p(900e6, 2,   6.5,  0.001),
      p(2.4e9, 2.5, 6.5,  0.001),
      p(5e9,   4,   6.5,  0.002),
      p(10e9,  6,   6.5,  0.003),
      p(28e9,  10,  6.5,  0.005),
    ],
  },
  {
    id: 'glass_lowe',
    label: 'Glass (Low-E coating)',
    category: 'building',
    thicknessM: 0.006,
    color: '#38bdf8',
    description: 'Energy-efficient glass with metallic oxide coating. The coating reflects RF strongly — acts almost like metal at RF frequencies.',
    frequencyData: [
      p(900e6, 13,  6.5,  0.08),
      p(2.4e9, 20,  6.5,  0.10),
      p(5e9,   28,  6.5,  0.15),
      p(10e9,  35,  6.5,  0.20),
      p(28e9,  45,  6.5,  0.30),
    ],
  },
  {
    id: 'concrete',
    label: 'Concrete (plain)',
    category: 'building',
    thicknessM: 0.2,
    color: '#6b7280',
    description: 'Standard concrete wall (20 cm). High εᵣ due to moisture. Significant RF attenuation. Reinforced concrete is even higher.',
    frequencyData: [
      p(900e6, 10, 6.5,  0.07),
      p(2.4e9, 15, 6.5,  0.08),
      p(5e9,   25, 6.5,  0.10),
      p(10e9,  35, 6.5,  0.15),
      p(28e9,  45, 6.5,  0.25),
      p(60e9,  60, 6.5,  0.40),
    ],
  },
  {
    id: 'concrete_reinforced',
    label: 'Concrete (reinforced)',
    category: 'building',
    thicknessM: 0.3,
    color: '#4b5563',
    description: 'Reinforced concrete with steel rebar. The metal mesh creates additional reflections. Very high RF attenuation.',
    frequencyData: [
      p(900e6, 20, 6.5,  0.15),
      p(2.4e9, 30, 6.5,  0.20),
      p(5e9,   40, 6.5,  0.30),
      p(10e9,  50, 6.5,  0.50),
      p(28e9,  60, 6.5,  0.80),
    ],
  },
  {
    id: 'brick',
    label: 'Brick',
    category: 'building',
    thicknessM: 0.1,
    color: '#b91c1c',
    description: 'Common building brick (10 cm). εᵣ ~4–5. Porous structure; moisture increases conductivity.',
    frequencyData: [
      p(900e6, 4,  4.5,  0.020),
      p(2.4e9, 7,  4.5,  0.025),
      p(5e9,   12, 4.5,  0.035),
      p(10e9,  18, 4.5,  0.050),
      p(28e9,  28, 4.5,  0.080),
    ],
  },
  {
    id: 'human_body',
    label: 'Human Body (tissue)',
    category: 'biological',
    thicknessM: 0.2,
    color: '#fda4af',
    description: 'Human tissue: ~60% water by mass. High εᵣ and conductivity at RF. Strongly absorbs microwave energy (basis of microwave heating).',
    frequencyData: [
      p(900e6, 5,  51.0, 0.90),
      p(2.4e9, 8,  52.7, 1.80),  // εᵣ=52.7 at 2.45GHz (muscle)
      p(5e9,   12, 49.1, 4.20),
      p(10e9,  18, 40.0, 7.50),
      p(28e9,  25, 21.0, 12.0),
      p(60e9,  40, 10.0, 20.0),
    ],
  },
  {
    id: 'water_liquid',
    label: 'Water (liquid)',
    category: 'liquid',
    thicknessM: 0.1,
    color: '#3b82f6',
    description: 'Liquid water. Very high εᵣ (~80 at low freq, decreasing with frequency due to Debye relaxation). Strong microwave absorber.',
    frequencyData: [
      p(900e6, 8,  79.8, 0.10),
      p(2.4e9, 12, 77.0, 0.50),
      p(5e9,   22, 70.0, 2.30),
      p(10e9,  40, 55.0, 7.00),
      p(28e9,  80, 30.0, 20.0),
    ],
  },
  {
    id: 'metal_steel',
    label: 'Steel / Metal',
    category: 'conductor',
    thicknessM: 0.003,
    color: '#9ca3af',
    description: 'Metals have extreme conductivity. Skin depth at 2.4 GHz is ~1.3 µm for copper. Essentially all RF is reflected from the surface.',
    frequencyData: [
      p(900e6,  1e6, 1.0, 6.3e7),  // skin depth dominates, very high attenuation
      p(2.4e9,  1e6, 1.0, 6.3e7),
      p(5e9,    1e6, 1.0, 6.3e7),
      p(10e9,   1e6, 1.0, 6.3e7),
      p(28e9,   1e6, 1.0, 6.3e7),
    ],
  },
  {
    id: 'wood_wet',
    label: 'Wood (wet)',
    category: 'building',
    thicknessM: 0.02,
    color: '#78350f',
    description: 'Wet/green wood has much higher moisture content → significantly higher RF loss than dry wood.',
    frequencyData: [
      p(900e6, 12,  10.0, 0.20),
      p(2.4e9, 18,  10.0, 0.30),
      p(5e9,   28,  10.0, 0.50),
      p(28e9,  55,  10.0, 1.00),
    ],
  },
  {
    id: 'foam_insulation',
    label: 'Foam Insulation',
    category: 'dielectric',
    thicknessM: 0.05,
    color: '#fef3c7',
    description: 'Polyurethane foam insulation. Very low density and εᵣ ≈ 1.1. Essentially transparent to RF.',
    frequencyData: [
      p(900e6, 0.5, 1.1, 0.001),
      p(2.4e9, 0.5, 1.1, 0.001),
      p(5e9,   1.0, 1.1, 0.002),
      p(28e9,  2.0, 1.1, 0.005),
    ],
  },
]

export function getMaterialById(id: string): Material | undefined {
  return MATERIALS.find(m => m.id === id)
}

/**
 * Interpolate material properties at a given frequency using log-linear interpolation
 */
export function interpolateMaterialAtFreq(mat: Material, frequencyHz: number): MaterialFreqPoint {
  const data = mat.frequencyData
  if (data.length === 0) return { frequencyHz, attenuationDbPerMeter: 0, relativePermittivity: 1, conductivity: 0, relativePermeability: 1 }
  if (frequencyHz <= data[0].frequencyHz) return data[0]
  if (frequencyHz >= data[data.length - 1].frequencyHz) return data[data.length - 1]

  // Find bracket
  let lo = 0
  for (let i = 0; i < data.length - 1; i++) {
    if (data[i].frequencyHz <= frequencyHz && frequencyHz <= data[i + 1].frequencyHz) {
      lo = i
      break
    }
  }
  const hi = lo + 1
  const t = (Math.log10(frequencyHz) - Math.log10(data[lo].frequencyHz)) /
            (Math.log10(data[hi].frequencyHz) - Math.log10(data[lo].frequencyHz))

  return {
    frequencyHz,
    attenuationDbPerMeter: data[lo].attenuationDbPerMeter + t * (data[hi].attenuationDbPerMeter - data[lo].attenuationDbPerMeter),
    relativePermittivity: data[lo].relativePermittivity + t * (data[hi].relativePermittivity - data[lo].relativePermittivity),
    conductivity: data[lo].conductivity + t * (data[hi].conductivity - data[lo].conductivity),
    relativePermeability: data[lo].relativePermeability + t * (data[hi].relativePermeability - data[lo].relativePermeability),
  }
}
