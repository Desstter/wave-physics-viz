/** Format frequency with auto unit (Hz / kHz / MHz / GHz / THz / PHz / EHz) */
export function formatFreq(hz: number): string {
  if (hz < 1e3) return `${hz.toFixed(0)} Hz`
  if (hz < 1e6) return `${(hz / 1e3).toPrecision(4)} kHz`
  if (hz < 1e9) return `${(hz / 1e6).toPrecision(4)} MHz`
  if (hz < 1e12) return `${(hz / 1e9).toPrecision(4)} GHz`
  if (hz < 1e15) return `${(hz / 1e12).toPrecision(4)} THz`
  if (hz < 1e18) return `${(hz / 1e15).toPrecision(4)} PHz`
  return `${(hz / 1e18).toPrecision(4)} EHz`
}

/** Format wavelength with auto unit */
export function formatWavelength(m: number): string {
  if (m >= 1000) return `${(m / 1000).toPrecision(3)} km`
  if (m >= 1) return `${m.toPrecision(3)} m`
  if (m >= 1e-2) return `${(m * 100).toPrecision(3)} cm`
  if (m >= 1e-3) return `${(m * 1e3).toPrecision(3)} mm`
  if (m >= 1e-6) return `${(m * 1e6).toPrecision(3)} µm`
  if (m >= 1e-9) return `${(m * 1e9).toPrecision(3)} nm`
  if (m >= 1e-12) return `${(m * 1e12).toPrecision(3)} pm`
  return `${(m * 1e15).toPrecision(3)} fm`
}

/** Format energy in eV or keV/MeV for higher energies */
export function formatEnergy(eV: number): string {
  if (eV < 1e-6) return `${(eV * 1e9).toPrecision(3)} neV`
  if (eV < 1e-3) return `${(eV * 1e6).toPrecision(3)} µeV`
  if (eV < 1) return `${(eV * 1e3).toPrecision(3)} meV`
  if (eV < 1e3) return `${eV.toPrecision(3)} eV`
  if (eV < 1e6) return `${(eV / 1e3).toPrecision(3)} keV`
  return `${(eV / 1e6).toPrecision(3)} MeV`
}

/** Format power in W/mW/µW/dBm */
export function formatPower(watts: number): string {
  if (watts >= 1) return `${watts.toPrecision(3)} W`
  if (watts >= 1e-3) return `${(watts * 1e3).toPrecision(3)} mW`
  return `${(watts * 1e6).toPrecision(3)} µW`
}

/** Format power density */
export function formatPowerDensity(wm2: number): string {
  if (wm2 >= 1) return `${wm2.toPrecision(3)} W/m²`
  if (wm2 >= 1e-3) return `${(wm2 * 1e3).toPrecision(3)} mW/m²`
  return `${(wm2 * 1e6).toPrecision(3)} µW/m²`
}

/** Format dB value */
export function formatdB(dB: number): string {
  return `${dB >= 0 ? '+' : ''}${dB.toFixed(1)} dB`
}

/** Format distance */
export function formatDistance(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`
  if (m >= 1) return `${m.toFixed(1)} m`
  return `${(m * 100).toFixed(1)} cm`
}

/** Format percentage */
export function formatPct(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`
}

/** Engineering notation for large/small numbers */
export function engineeringNotation(val: number, unit: string = ''): string {
  if (val === 0) return `0 ${unit}`
  const exp = Math.floor(Math.log10(Math.abs(val)) / 3) * 3
  const mantissa = val / Math.pow(10, exp)
  const prefix: Record<string, string> = { '-15': 'f', '-12': 'p', '-9': 'n', '-6': 'µ', '-3': 'm', '0': '', '3': 'k', '6': 'M', '9': 'G', '12': 'T', '15': 'P', '18': 'E' }
  const p = prefix[String(exp)] ?? `×10^${exp}`
  return `${mantissa.toPrecision(3)} ${p}${unit}`
}
