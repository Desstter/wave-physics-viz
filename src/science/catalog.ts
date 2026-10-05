export type MaterialCategory = 'construcción' | 'dieléctrico' | 'conductor'

export interface ScientificMaterial {
  id: string
  name: string
  shortName: string
  category: MaterialCategory
  color: string
  a: number
  b: number
  c: number
  d: number
  minGHz: number
  maxGHz: number
  defaultThicknessM: number
  context: string
  source: 'ITU-R P.2040-3'
}

// ε′r = a·fGHz^b and σ = c·fGHz^d. Values from ITU-R P.2040-3, Table 3.
export const SCIENTIFIC_MATERIALS: ScientificMaterial[] = [
  { id: 'air', name: 'Aire / vacío', shortName: 'Aire', category: 'dieléctrico', color: '#6e8994', a: 1, b: 0, c: 0, d: 0, minGHz: .001, maxGHz: 100, defaultThicknessM: .1, context: 'Referencia prácticamente sin pérdidas para este modelo.', source: 'ITU-R P.2040-3' },
  { id: 'plasterboard', name: 'Placa de yeso', shortName: 'Yeso', category: 'construcción', color: '#d3b99f', a: 2.73, b: 0, c: .0085, d: .9395, minGHz: 1, maxGHz: 100, defaultThicknessM: .0125, context: 'Tabique interior típico; su humedad y composición real pueden variar.', source: 'ITU-R P.2040-3' },
  { id: 'wood', name: 'Madera', shortName: 'Madera', category: 'construcción', color: '#a56a43', a: 1.99, b: 0, c: .0047, d: 1.0718, minGHz: .001, maxGHz: 100, defaultThicknessM: .02, context: 'Modelo agregado; la humedad puede elevar mucho las pérdidas.', source: 'ITU-R P.2040-3' },
  { id: 'glass', name: 'Vidrio común', shortName: 'Vidrio', category: 'dieléctrico', color: '#80c9d2', a: 6.31, b: 0, c: .0036, d: 1.3394, minGHz: .1, maxGHz: 100, defaultThicknessM: .006, context: 'No representa capas metálicas Low-E ni laminados multicapa.', source: 'ITU-R P.2040-3' },
  { id: 'brick', name: 'Ladrillo', shortName: 'Ladrillo', category: 'construcción', color: '#a8523f', a: 3.91, b: 0, c: .0238, d: .16, minGHz: 1, maxGHz: 40, defaultThicknessM: .1, context: 'Modelo promedio; porosidad, mortero y humedad cambian el resultado.', source: 'ITU-R P.2040-3' },
  { id: 'concrete', name: 'Concreto', shortName: 'Concreto', category: 'construcción', color: '#8d9394', a: 5.24, b: 0, c: .0462, d: .7822, minGHz: 1, maxGHz: 100, defaultThicknessM: .2, context: 'Concreto homogéneo. No incluye explícitamente varillas de refuerzo.', source: 'ITU-R P.2040-3' },
  { id: 'chipboard', name: 'Aglomerado', shortName: 'Aglomerado', category: 'construcción', color: '#bc8c60', a: 2.58, b: 0, c: .0217, d: .78, minGHz: 1, maxGHz: 100, defaultThicknessM: .018, context: 'Tablero de partículas de madera, tratado como medio homogéneo.', source: 'ITU-R P.2040-3' },
  { id: 'plywood', name: 'Contrachapado', shortName: 'Plywood', category: 'construcción', color: '#d09a62', a: 2.71, b: 0, c: .33, d: 0, minGHz: 1, maxGHz: 40, defaultThicknessM: .018, context: 'La orientación de las capas no se resuelve en este modelo escalar.', source: 'ITU-R P.2040-3' },
  { id: 'marble', name: 'Mármol', shortName: 'Mármol', category: 'construcción', color: '#c8c7bd', a: 7.074, b: 0, c: .0055, d: .9262, minGHz: 1, maxGHz: 60, defaultThicknessM: .02, context: 'Piedra densa modelada con parámetros eléctricos efectivos.', source: 'ITU-R P.2040-3' },
  { id: 'metal', name: 'Metal conductor', shortName: 'Metal', category: 'conductor', color: '#a8b2b7', a: 1, b: 0, c: 1e7, d: 0, minGHz: 1, maxGHz: 100, defaultThicknessM: .001, context: 'Conductor genérico de 10⁷ S/m; casi toda la energía se refleja.', source: 'ITU-R P.2040-3' },
]

export interface WavePreset {
  id: string
  name: string
  family: string
  frequencyHz: number
  color: string
  example: string
}

export const WAVE_PRESETS: WavePreset[] = [
  { id: 'am', name: 'Radio AM', family: 'Radio', frequencyHz: 1e6, color: '#8c7cff', example: 'Difracción y alcance terrestre' },
  { id: 'fm', name: 'Radio FM', family: 'Radio', frequencyHz: 100e6, color: '#b26cff', example: 'Radiodifusión VHF' },
  { id: 'lte700', name: 'LTE 700 MHz', family: 'Celular', frequencyHz: 700e6, color: '#ff7f76', example: 'Cobertura amplia' },
  { id: 'wifi24', name: 'Wi‑Fi 2.4 GHz', family: 'Wi‑Fi', frequencyHz: 2.4e9, color: '#d5ff5f', example: 'Red doméstica' },
  { id: 'wifi5', name: 'Wi‑Fi 5 GHz', family: 'Wi‑Fi', frequencyHz: 5e9, color: '#ffd35f', example: 'Más capacidad, menor penetración' },
  { id: 'n78', name: '5G n78', family: 'Celular', frequencyHz: 3.5e9, color: '#ff9b64', example: 'Banda media 5G' },
  { id: 'xradar', name: 'Radar X', family: 'Radar', frequencyHz: 10e9, color: '#5fffc1', example: 'Resolución centimétrica' },
  { id: 'mmwave', name: '5G mmWave', family: 'Celular', frequencyHz: 28e9, color: '#5fe3ff', example: 'Alta capacidad y línea de vista' },
  { id: 'oxygen', name: 'Enlace 60 GHz', family: 'Milimétrica', frequencyHz: 60e9, color: '#6ca8ff', example: 'Banda de absorción del oxígeno' },
]

export interface SpectrumBand {
  id: string
  name: string
  range: string
  minHz: number
  maxHz: number
  color: string
  fact: string
}

export const SPECTRUM_BANDS: SpectrumBand[] = [
  { id: 'radio', name: 'Radio', range: '3 Hz — 300 GHz', minHz: 3, maxHz: 3e11, color: '#8676ff', fact: 'Una onda de 3 Hz en vacío tiene una longitud cercana a 100 000 km.' },
  { id: 'infrared', name: 'Infrarrojo', range: '300 GHz — 430 THz', minHz: 3e11, maxHz: 4.3e14, color: '#ff6b52', fact: 'La radiación térmica de objetos cotidianos aparece principalmente aquí.' },
  { id: 'visible', name: 'Visible', range: '430 — 790 THz', minHz: 4.3e14, maxHz: 7.9e14, color: '#d5ff5f', fact: 'La luz visible ocupa menos de una octava del enorme espectro electromagnético.' },
  { id: 'uv', name: 'Ultravioleta', range: '790 THz — 30 PHz', minHz: 7.9e14, maxHz: 3e16, color: '#a967ff', fact: 'La frontera ionizante no es una línea universal: depende del átomo o molécula.' },
  { id: 'xray', name: 'Rayos X', range: '30 PHz — 30 EHz', minHz: 3e16, maxHz: 3e19, color: '#62d8ff', fact: 'Su longitud de onda es comparable a distancias atómicas.' },
  { id: 'gamma', name: 'Gamma', range: '> 30 EHz', minHz: 3e19, maxHz: 3e22, color: '#5fffa5', fact: 'Rayos X y gamma se distinguen mejor por su origen que por una frontera de frecuencia.' },
]

export function materialById(id: string): ScientificMaterial {
  return SCIENTIFIC_MATERIALS.find((material) => material.id === id) ?? SCIENTIFIC_MATERIALS[0]
}
