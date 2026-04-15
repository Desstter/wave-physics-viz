/**
 * Maps a frequency to a CSS color for spectrum visualization.
 * Visible light (380–700 nm / 430–789 THz) → real spectral colors.
 * Other ranges → perceptual hue mapping.
 */
export function frequencyToColor(hz: number): string {
  // Visible range: 430e12 (700nm red) to 789e12 (380nm violet)
  if (hz >= 430e12 && hz <= 789e12) {
    return visibleToRgb(hz)
  }
  // Map log frequency to hue
  const logHz = Math.log10(hz)
  // 3 Hz (ELF) → logHz=0.5, 3e24 (gamma) → logHz≈24.5
  const t = (logHz - 0.5) / 24  // 0-1
  return logTToColor(t)
}

function visibleToRgb(hz: number): string {
  // Convert Hz to nm
  const nm = (3e8 / hz) * 1e9
  let r = 0, g = 0, b = 0
  if (nm >= 380 && nm < 440) {
    r = -(nm - 440) / (440 - 380); g = 0; b = 1
  } else if (nm >= 440 && nm < 490) {
    r = 0; g = (nm - 440) / (490 - 440); b = 1
  } else if (nm >= 490 && nm < 510) {
    r = 0; g = 1; b = -(nm - 510) / (510 - 490)
  } else if (nm >= 510 && nm < 580) {
    r = (nm - 510) / (580 - 510); g = 1; b = 0
  } else if (nm >= 580 && nm < 645) {
    r = 1; g = -(nm - 645) / (645 - 580); b = 0
  } else if (nm >= 645 && nm <= 700) {
    r = 1; g = 0; b = 0
  }
  // Intensity drop-off at edges
  let factor = 1
  if (nm >= 380 && nm < 420) factor = 0.3 + 0.7 * (nm - 380) / (420 - 380)
  else if (nm > 680 && nm <= 700) factor = 0.3 + 0.7 * (700 - nm) / (700 - 680)
  const ri = Math.round(255 * r * factor)
  const gi = Math.round(255 * g * factor)
  const bi = Math.round(255 * b * factor)
  return `rgb(${ri},${gi},${bi})`
}

function logTToColor(t: number): string {
  // Map t (0=ELF, 1=gamma) through a hue spectrum
  // Radio (0-0.55): indigo→violet→magenta
  // Microwave/IR (0.55-0.7): red/orange
  // Visible handled separately
  // UV (0.72-0.78): deep violet
  // X-ray/gamma (0.78-1): cyan→green
  const segments: Array<[number, string]> = [
    [0.00, '#4338ca'],   // ELF - indigo
    [0.30, '#7c3aed'],   // MF - purple
    [0.45, '#a21caf'],   // VHF - magenta
    [0.55, '#b91c1c'],   // UHF/SHF - red
    [0.62, '#ea580c'],   // near microwave - orange
    [0.68, '#dc2626'],   // near IR - red
    [0.73, '#7c3aed'],   // UV - violet
    [0.80, '#0891b2'],   // X-ray - cyan
    [1.00, '#059669'],   // gamma - green
  ]

  for (let i = 0; i < segments.length - 1; i++) {
    const [t0, c0] = segments[i]
    const [t1, c1] = segments[i + 1]
    if (t >= t0 && t <= t1) {
      const frac = (t - t0) / (t1 - t0)
      return lerpColor(c0, c1, frac)
    }
  }
  return segments[segments.length - 1][1]
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function lerpColor(c0: string, c1: string, t: number): string {
  const [r0, g0, b0] = hexToRgb(c0)
  const [r1, g1, b1] = hexToRgb(c1)
  return `rgb(${Math.round(r0 + t * (r1 - r0))},${Math.round(g0 + t * (g1 - g0))},${Math.round(b0 + t * (b1 - b0))})`
}
