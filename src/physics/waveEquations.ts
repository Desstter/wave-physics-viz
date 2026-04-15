import { PHYSICS } from './constants'

const { c, h, Z0 } = PHYSICS

/** λ = c / f  (meters) */
export function wavelength(frequencyHz: number): number {
  return c / frequencyHz
}

/** E = hf  (joules) */
export function photonEnergyJ(frequencyHz: number): number {
  return h * frequencyHz
}

/** E = hf / eV  (electron-volts) */
export function photonEnergyEV(frequencyHz: number): number {
  return photonEnergyJ(frequencyHz) / PHYSICS.eV
}

/**
 * Free-Space Path Loss in dB
 * FSPL = 20·log10(4π·d·f / c)
 */
export function fspl_dB(distanceM: number, frequencyHz: number): number {
  if (distanceM <= 0) return 0
  return 20 * Math.log10((4 * Math.PI * distanceM * frequencyHz) / c)
}

/**
 * Power density at distance r from isotropic source (W/m²)
 * S = P₀ / (4π·r²)
 */
export function powerDensity(powerWatts: number, distanceM: number): number {
  if (distanceM <= 0) return Infinity
  return powerWatts / (4 * Math.PI * distanceM * distanceM)
}

/**
 * Electric field amplitude from power density (V/m)
 * E = √(S · Z₀)
 */
export function eFieldAmplitude(powerDensityWm2: number): number {
  return Math.sqrt(powerDensityWm2 * Z0)
}

/**
 * Skin depth in a conductor (m)
 * δ = √(2ρ / ωμ)
 */
export function skinDepth(
  resistivityOhmM: number,
  frequencyHz: number,
  relPermMag: number = 1
): number {
  const omega = 2 * Math.PI * frequencyHz
  const mu = PHYSICS.mu0 * relPermMag
  return Math.sqrt((2 * resistivityOhmM) / (omega * mu))
}

/**
 * Attenuation coefficient α (nepers/m) in a lossy dielectric
 * α = ω·√(με/2)·[√(1+(σ/ωε)²) - 1]^0.5
 */
export function attenuationCoefficient(
  frequencyHz: number,
  relPermittivity: number,
  conductivity: number,
  relPermeability: number = 1
): number {
  const omega = 2 * Math.PI * frequencyHz
  const epsilon = PHYSICS.epsilon0 * relPermittivity
  const mu = PHYSICS.mu0 * relPermeability
  const ratio = conductivity / (omega * epsilon)
  return omega * Math.sqrt((mu * epsilon) / 2) * Math.sqrt(Math.sqrt(1 + ratio * ratio) - 1)
}

/**
 * Beer-Lambert attenuation: I = I₀ · exp(-α · d)
 * Returns the fraction of intensity remaining
 */
export function beerLambert(alphaPerM: number, thicknessM: number): number {
  return Math.exp(-alphaPerM * thicknessM)
}

/**
 * Convert linear ratio to dB
 */
export function linearTodB(ratio: number): number {
  return 10 * Math.log10(ratio)
}

/**
 * Convert dB to linear ratio
 */
export function dBToLinear(dB: number): number {
  return Math.pow(10, dB / 10)
}

/**
 * Wave impedance in a medium (Ω)
 * η = Z₀ · √(μᵣ / εᵣ)
 */
export function waveImpedance(relPermittivity: number, relPermeability: number = 1): number {
  return Z0 * Math.sqrt(relPermeability / relPermittivity)
}

/**
 * Refractive index n = √(εᵣ · μᵣ)
 */
export function refractiveIndex(relPermittivity: number, relPermeability: number = 1): number {
  return Math.sqrt(relPermittivity * relPermeability)
}

/**
 * Snell's law: θₜ = arcsin(n₁/n₂ · sin θᵢ)
 * Returns null if total internal reflection occurs
 */
export function snellsLaw(n1: number, n2: number, thetaIncidentRad: number): number | null {
  const sinT = (n1 / n2) * Math.sin(thetaIncidentRad)
  if (Math.abs(sinT) > 1) return null
  return Math.asin(sinT)
}
