import { attenuationCoefficient, beerLambert, snellsLaw } from './waveEquations'

export interface InteractionResult {
  reflectance: number    // 0-1, fraction of power reflected
  transmittance: number  // 0-1, fraction of power transmitted
  absorptance: number    // 0-1, fraction of power absorbed
  /** Skin depth δ for conductors, or field penetration depth 1/α for lossy dielectrics (field amplitude falls to 1/e). Null if lossless. */
  skinDepthM: number | null
  attenuationCoeffPerM: number
  thetaTransmittedRad: number | null
}

/**
 * Fresnel reflectance at normal incidence (angle = 0)
 * R = ((n1 - n2) / (n1 + n2))²
 */
export function fresnelNormal(n1: number, n2: number): number {
  return Math.pow((n1 - n2) / (n1 + n2), 2)
}

/**
 * Fresnel reflectance for TE polarization at angle θᵢ
 * R_TE = |(n1·cos θᵢ - n2·cos θₜ) / (n1·cos θᵢ + n2·cos θₜ)|²
 */
export function fresnelTE(n1: number, n2: number, thetaIncidentRad: number): number {
  const thetaT = snellsLaw(n1, n2, thetaIncidentRad)
  if (thetaT === null) return 1.0 // total internal reflection
  const num = n1 * Math.cos(thetaIncidentRad) - n2 * Math.cos(thetaT)
  const den = n1 * Math.cos(thetaIncidentRad) + n2 * Math.cos(thetaT)
  return (num / den) * (num / den)
}

/**
 * Fresnel reflectance for TM polarization at angle θᵢ
 * R_TM = |(n2·cos θᵢ - n1·cos θₜ) / (n2·cos θᵢ + n1·cos θₜ)|²
 */
export function fresnelTM(n1: number, n2: number, thetaIncidentRad: number): number {
  const thetaT = snellsLaw(n1, n2, thetaIncidentRad)
  if (thetaT === null) return 1.0
  const num = n2 * Math.cos(thetaIncidentRad) - n1 * Math.cos(thetaT)
  const den = n2 * Math.cos(thetaIncidentRad) + n1 * Math.cos(thetaT)
  return (num / den) * (num / den)
}

/**
 * Brewster's angle (TM reflectance = 0)
 * θ_B = arctan(n2/n1)
 */
export function brewsterAngle(n1: number, n2: number): number {
  return Math.atan(n2 / n1)
}

/**
 * Full interaction model: Fresnel reflection at surface + Beer-Lambert through bulk
 * Returns R, T, A (energy conservation: R + T + A = 1)
 */
export function computeInteraction(
  frequencyHz: number,
  relPermittivity: number,
  conductivity: number,
  thicknessM: number,
  thetaIncidentRad: number = 0,
  relPermeability: number = 1
): InteractionResult {
  const n1 = 1.0 // air
  const n2 = Math.sqrt(relPermittivity * relPermeability)

  // Fresnel reflectance (average of TE and TM)
  const rTE = fresnelTE(n1, n2, thetaIncidentRad)
  const rTM = fresnelTM(n1, n2, thetaIncidentRad)
  const R_surface = (rTE + rTM) / 2

  // Beer-Lambert through bulk
  const alpha = attenuationCoefficient(frequencyHz, relPermittivity, conductivity, relPermeability)
  const bulkTransmission = beerLambert(alpha, thicknessM)

  // Apply surface reflections at both entry and exit faces
  const T_entry = 1 - R_surface
  const T_exit = 1 - R_surface
  const T_total = T_entry * bulkTransmission * T_exit

  // Absorptance = what entered but didn't exit
  const A = T_entry * (1 - bulkTransmission * T_exit)
  const R = R_surface + (1 - R_surface) * bulkTransmission * R_surface // multiple reflections simplified

  // Normalize so R + T + A = 1 exactly
  const total = R + T_total + A
  const reflectance = R / total
  const transmittance = T_total / total
  const absorptance = A / total

  const thetaT = snellsLaw(n1, n2, thetaIncidentRad)

  // Skin depth for conductors (high conductivity) or penetration depth 1/α for lossy dielectrics
  let skinDepthM: number | null = null
  if (conductivity > 1e3) {
    const omega = 2 * Math.PI * frequencyHz
    const mu = 1.257e-6 * relPermeability
    const resistivity = 1 / conductivity
    skinDepthM = Math.sqrt((2 * resistivity) / (omega * mu))
  } else if (alpha > 0) {
    // For lossy dielectrics: depth at which field amplitude falls to 1/e (same definition as skin depth)
    skinDepthM = 1 / alpha
  }

  return {
    reflectance,
    transmittance,
    absorptance,
    skinDepthM,
    attenuationCoeffPerM: alpha,
    thetaTransmittedRad: thetaT,
  }
}

/**
 * Generate Fresnel curve data (reflectance vs angle 0-90°)
 */
export function fresnelCurveData(n1: number, n2: number): Array<{ angleDeg: number; rTE: number; rTM: number; rAvg: number }> {
  const points = []
  for (let deg = 0; deg <= 90; deg += 1) {
    const rad = (deg * Math.PI) / 180
    const rTE = fresnelTE(n1, n2, rad)
    const rTM = fresnelTM(n1, n2, rad)
    points.push({ angleDeg: deg, rTE, rTM, rAvg: (rTE + rTM) / 2 })
  }
  return points
}
