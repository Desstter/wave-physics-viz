import { wavelength, photonEnergyEV } from '../physics/waveEquations'
import type { WaveType } from '../types/wave.types'

function wave(
  id: string,
  label: string,
  category: string,
  band: WaveType['band'],
  frequencyHz: number,
  color: string,
  description: string,
  useCases: string[],
  ionizing: boolean,
  penetratesWalls: WaveType['penetratesWalls'],
  safetyNote?: string,
  frequencyRangeHz?: [number, number]
): WaveType {
  return {
    id, label, category, band, frequencyHz, frequencyRangeHz,
    wavelengthM: wavelength(frequencyHz),
    energyEV: photonEnergyEV(frequencyHz),
    color, description, useCases, ionizing, penetratesWalls, safetyNote,
  }
}

export const WAVE_TYPES: WaveType[] = [
  // ── Radio: Extremely Low Frequency ──────────────────────────────────────
  wave('elf', 'ELF (Extremely Low Freq)', 'Radio', 'ELF', 50,
    '#4f46e5',
    'Frequency range 3–300 Hz. Wavelengths of thousands of kilometers. Penetrates seawater and rock.',
    ['Submarine communications', 'Geophysical surveys', 'Power grid (50/60 Hz)'],
    false, 'high',
    undefined, [3, 300]),

  wave('vlf', 'VLF (Very Low Freq)', 'Radio', 'VLF', 20e3,
    '#6366f1',
    'Frequency 3–30 kHz. Wavelengths 10–100 km. Can propagate globally via Earth-ionosphere waveguide.',
    ['Naval submarine comms (ZEVS, NWC)', 'Time signal stations', 'Navigation'],
    false, 'high',
    undefined, [3e3, 30e3]),

  // ── Radio: AM Band ───────────────────────────────────────────────────────
  wave('am_radio', 'AM Radio', 'Radio', 'MF', 1e6,
    '#8b5cf6',
    'Amplitude Modulation: 530–1700 kHz. Ground waves follow terrain, sky waves bounce off ionosphere at night allowing long-range reception.',
    ['AM broadcasting', 'Amateur radio', 'Navigation beacons (NDB)'],
    false, 'high',
    undefined, [530e3, 1700e3]),

  // ── Radio: Shortwave / HF ────────────────────────────────────────────────
  wave('hf_shortwave', 'Shortwave (HF)', 'Radio', 'HF', 15e6,
    '#7c3aed',
    '3–30 MHz. Reflects off the ionosphere enabling global propagation. Wavelengths 10–100 m.',
    ['International broadcasting', 'Amateur radio (ham)', 'Aviation HF comms', 'NOAA weather fax'],
    false, 'high',
    undefined, [3e6, 30e6]),

  // ── Radio: FM Band ───────────────────────────────────────────────────────
  wave('fm_radio', 'FM Radio', 'Radio', 'VHF', 100e6,
    '#a855f7',
    'Frequency Modulation: 87–108 MHz. Line-of-sight propagation. Wavelength ~3 m. Less susceptible to noise than AM.',
    ['FM broadcasting', 'Police/fire radio', 'Aviation VOR navigation'],
    false, 'medium',
    undefined, [87e6, 108e6]),

  // ── TV VHF/UHF ───────────────────────────────────────────────────────────
  wave('uhf_tv', 'UHF Television', 'Radio', 'UHF', 600e6,
    '#c026d3',
    '300 MHz – 3 GHz. Digital TV broadcasting (DVB-T, ATSC). Penetrates buildings moderately.',
    ['Digital TV (DVB-T/ATSC)', '4G LTE 700/850 MHz', 'First responder comms'],
    false, 'medium',
    undefined, [300e6, 3e9]),

  // ── Cellular ─────────────────────────────────────────────────────────────
  wave('lte_700', '4G LTE 700 MHz', 'Cellular', 'UHF', 700e6,
    '#db2777',
    'Long-range 4G band. Good wall penetration. Used for rural coverage and building interiors.',
    ['4G LTE (Band 12/17/13)', 'Indoor coverage', 'Rural cellular'],
    false, 'high'),

  wave('lte_2600', '4G LTE 2.6 GHz', 'Cellular', 'SHF', 2.6e9,
    '#e11d48',
    'High-capacity 4G band. Shorter range, less wall penetration than 700 MHz.',
    ['4G LTE (Band 7)', 'Urban capacity', 'Data-heavy areas'],
    false, 'medium'),

  wave('5g_sub6', '5G Sub-6 GHz (3.5 GHz)', 'Cellular', 'SHF', 3.5e9,
    '#f43f5e',
    'Primary 5G band globally. Balances coverage and capacity. Wavelength ~86 mm. Moderate wall penetration.',
    ['5G NR (n78 band)', 'Urban 5G coverage', 'Fixed wireless access'],
    false, 'medium'),

  wave('5g_mmwave', '5G mmWave (28 GHz)', 'Cellular', 'EHF', 28e9,
    '#fb7185',
    'Millimeter wave 5G. Extremely high bandwidth but very short range and poor wall penetration. Wavelength ~10.7 mm.',
    ['5G NR (n257/n261)', 'Stadium/event coverage', 'Fixed point-to-point links'],
    false, 'low',
    'Blocked by most building materials; requires line-of-sight or outdoor small cells.'),

  // ── WiFi ──────────────────────────────────────────────────────────────────
  wave('wifi_24', 'WiFi 2.4 GHz (802.11)', 'WiFi', 'SHF', 2.4e9,
    '#f97316',
    'IEEE 802.11b/g/n/ax. Wavelength 12.5 cm. Good wall penetration, longer range, but more congested.',
    ['WiFi home networking', 'Bluetooth (also 2.4 GHz)', 'Microwave ovens (leakage)', 'Zigbee IoT'],
    false, 'high'),

  wave('wifi_5', 'WiFi 5 GHz (802.11ac/ax)', 'WiFi', 'SHF', 5e9,
    '#fb923c',
    'IEEE 802.11ac/ax (Wi-Fi 5/6). Higher bandwidth than 2.4 GHz but weaker wall penetration. Wavelength 6 cm.',
    ['WiFi high-speed networking', 'Wi-Fi 6/6E', 'Point-to-point links'],
    false, 'medium'),

  wave('wifi_6ghz', 'WiFi 6 GHz (Wi-Fi 6E)', 'WiFi', 'SHF', 6e9,
    '#fbbf24',
    'Wi-Fi 6E uses 5.925–7.125 GHz. More spectrum, less congestion, but shortest range of the WiFi bands.',
    ['Wi-Fi 6E', 'High-density deployments', 'AR/VR streaming'],
    false, 'low'),

  // ── Radar ─────────────────────────────────────────────────────────────────
  wave('radar_l', 'Radar L-band', 'Radar', 'UHF', 1.3e9,
    '#16a34a',
    'L-band radar: 1–2 GHz. Long range, moderate resolution. Used by air traffic control.',
    ['Air traffic control (ATC)', 'Long-range surveillance', 'Weather radar (some)', 'GPS (1.575 GHz)'],
    false, 'high'),

  wave('radar_s', 'Radar S-band', 'Radar', 'SHF', 3e9,
    '#15803d',
    'S-band: 2–4 GHz. Compromise between L and X-band. Common in weather radar.',
    ['Weather radar (WSR-88D Nexrad)', 'Marine radar', 'Airport surface detection'],
    false, 'medium'),

  wave('radar_x', 'Radar X-band', 'Radar', 'SHF', 10e9,
    '#166534',
    'X-band: 8–12 GHz. High resolution, shorter range. Used in marine and police speed guns.',
    ['Marine radar', 'Police traffic radar', 'Missile guidance', 'Satellite imaging radar'],
    false, 'low'),

  wave('radar_ka', 'Radar Ka-band (35 GHz)', 'Radar', 'EHF', 35e9,
    '#14532d',
    'Ka-band: 26.5–40 GHz. Very high resolution. Used in automotive radar and speed enforcement.',
    ['Automotive radar (ADAS)', 'Police speed guns', 'High-res satellite SAR', 'Airport security scanners'],
    false, 'low'),

  // ── Microwave ─────────────────────────────────────────────────────────────
  wave('microwave_oven', 'Microwave Oven (2.45 GHz)', 'Microwave', 'SHF', 2.45e9,
    '#d97706',
    'Exactly 2.45 GHz — chosen because water, fats, and sugars absorb this frequency efficiently (dielectric heating). Not a resonance of water.',
    ['Microwave ovens', 'Industrial heating', 'Medical diathermy'],
    false, 'high',
    'Inside an oven, field strengths are hundreds of V/m. Enclosure acts as Faraday cage.'),

  wave('satellite_ku', 'Satellite Ku-band (12 GHz)', 'Satellite', 'SHF', 12e9,
    '#b45309',
    'Ku-band (10.7–18 GHz). Used by satellite TV and internet (Starlink uplink/downlink).',
    ['Direct-to-home TV (DirecTV)', 'Starlink satellite internet', 'VSAT enterprise links'],
    false, 'low'),

  // ── Infrared ─────────────────────────────────────────────────────────────
  wave('ir_thermal', 'Thermal Infrared (10 µm)', 'Infrared', 'Infrared', 30e12,
    '#ef4444',
    'Far infrared / thermal IR. All warm objects radiate here. Human body peak emission ~9.5 µm (Wien\'s law at 37°C).',
    ['Thermal cameras', 'Night vision', 'Weather satellites (GOES)', 'Heat-seeking missiles'],
    false, 'none',
    'Absorbed by glass, water, and skin. Does not penetrate walls.'),

  wave('ir_near', 'Near Infrared (1 µm)', 'Infrared', 'Infrared', 300e12,
    '#f87171',
    'Near IR: 700 nm – 2.5 µm. Just below visible light. Used in fiber optics and remote controls.',
    ['Fiber optic communications (1310/1550 nm)', 'TV remote controls', 'Night vision cameras', 'Medical imaging (OCT)'],
    false, 'none'),

  // ── Visible Light ─────────────────────────────────────────────────────────
  wave('visible_red', 'Visible Red (700 nm)', 'Visible', 'Visible', 428e12,
    '#dc2626',
    'Red light: ~620–750 nm. Lowest energy visible photons. Scatters less in tissue than blue light.',
    ['Laser pointers', 'Red traffic lights', 'Photodynamic therapy', 'LiDAR (some systems)'],
    false, 'none'),

  wave('visible_green', 'Visible Green (550 nm)', 'Visible', 'Visible', 545e12,
    '#16a34a',
    'Green light: ~500–565 nm. Peak sensitivity of human eye (photopic vision). Appears brightest.',
    ['Traffic lights', 'Laser surgery', 'Optical fiber', 'Photography'],
    false, 'none'),

  wave('visible_blue', 'Visible Blue (450 nm)', 'Visible', 'Visible', 666e12,
    '#2563eb',
    'Blue light: ~380–500 nm. Higher energy than red/green. Scattered more by atmosphere (blue sky).',
    ['Blu-ray discs', 'LED lighting', 'Fluorescence microscopy', 'UV sterilization (near)'],
    false, 'none'),

  // ── Ultraviolet ───────────────────────────────────────────────────────────
  wave('uv_a', 'UV-A (365 nm)', 'Ultraviolet', 'UV', 820e12,
    '#7c3aed',
    'UV-A: 315–400 nm. Not ionizing. Causes tanning, penetrates glass. Used in black lights.',
    ['Black lights / fluorescence', 'Tanning beds', 'Phototherapy', 'Banknote verification'],
    false, 'none',
    'Long-term exposure causes skin aging. Does not cause sunburn directly.'),

  wave('uv_c', 'UV-C (254 nm)', 'Ultraviolet', 'UV', 1.18e15,
    '#6d28d9',
    'UV-C: 100–280 nm. Ionizing. Absorbed by the ozone layer — does not reach Earth\'s surface naturally. Kills DNA in bacteria/viruses.',
    ['Germicidal UV sterilization', 'Water purification', 'Air disinfection', 'Semiconductor fabrication'],
    true, 'none',
    'Extremely dangerous to skin and eyes. Never look directly at UV-C sources.'),

  // ── X-Ray ─────────────────────────────────────────────────────────────────
  wave('xray_soft', 'Soft X-ray (1 nm / 1.2 keV)', 'X-Ray', 'XRay', 3e17,
    '#06b6d4',
    'Low-energy X-rays (0.1–10 keV). Absorbed by soft tissue and air. Used in XPS and synchrotron research.',
    ['X-ray photoelectron spectroscopy (XPS)', 'Synchrotron research', 'Soft tissue imaging'],
    true, 'none',
    'Ionizing radiation. Damages DNA. Exposure must be strictly controlled.'),

  wave('xray_hard', 'Hard X-ray (0.01 nm / 125 keV)', 'X-Ray', 'XRay', 3e19,
    '#0891b2',
    'High-energy X-rays. Penetrates soft tissue, partially absorbed by bone and dense materials. Standard medical X-ray.',
    ['Medical radiography', 'CT scanning', 'Airport baggage scanners', 'NDT (non-destructive testing)'],
    true, 'none',
    'Ionizing radiation. Biological tissue exposure must comply with ALARA principle.'),

  // ── Gamma Rays ────────────────────────────────────────────────────────────
  wave('gamma', 'Gamma Ray (0.001 nm / 1.25 MeV)', 'Gamma', 'Gamma', 3e20,
    '#10b981',
    'Highest energy EM radiation (>100 keV). Emitted by nuclear decays (e.g., Co-60 at 1.25 MeV). Penetrates most materials — only thick lead or concrete attenuates significantly.',
    ['Cancer radiotherapy', 'PET scanning', 'Nuclear power monitoring', 'Gamma-ray astronomy', 'Food irradiation'],
    true, 'high',
    'Extreme ionizing radiation. Requires lead shielding. Tissue DNA damage at low doses, lethal at high doses.'),
]

export const WAVE_CATEGORIES = [...new Set(WAVE_TYPES.map(w => w.category))]

export function getWaveById(id: string): WaveType | undefined {
  return WAVE_TYPES.find(w => w.id === id)
}
