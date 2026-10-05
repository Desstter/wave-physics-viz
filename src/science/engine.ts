import { materialById, type ScientificMaterial } from './catalog'

export const CONSTANTS = {
  c: 299_792_458,
  h: 6.626_070_15e-34,
  e: 1.602_176_634e-19,
  epsilon0: 8.854_187_8128e-12,
  mu0: 1.256_637_062_12e-6,
  z0: 376.730_313_668,
} as const

export interface MaterialProperties {
  epsilonR: number
  conductivitySm: number
  inValidatedRange: boolean
}

export interface LayerInput {
  materialId: string
  thicknessM: number
}

export type Polarization = 'unpolarized' | 'TE' | 'TM'

export interface Interaction {
  reflectance: number
  transmittance: number
  absorptance: number
  lossDb: number
  alphaNpM: number
  betaRadM: number
  penetrationDepthM: number | null
  refractedAngleDeg: number
  inValidatedRange: boolean
}

type Complex = { re: number; im: number }

const add = (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im })
const sub = (a: Complex, b: Complex): Complex => ({ re: a.re - b.re, im: a.im - b.im })
const div = (a: Complex, b: Complex): Complex => {
  const den = b.re * b.re + b.im * b.im
  return { re: (a.re * b.re + a.im * b.im) / den, im: (a.im * b.re - a.re * b.im) / den }
}
const abs2 = (a: Complex): number => a.re * a.re + a.im * a.im
const sqrtComplex = (z: Complex): Complex => {
  const mag = Math.hypot(z.re, z.im)
  return {
    re: Math.sqrt(Math.max(0, (mag + z.re) / 2)),
    im: Math.sign(z.im || 1) * Math.sqrt(Math.max(0, (mag - z.re) / 2)),
  }
}

export function wavelengthM(frequencyHz: number): number {
  return CONSTANTS.c / frequencyHz
}

export function photonEnergyEv(frequencyHz: number): number {
  return CONSTANTS.h * frequencyHz / CONSTANTS.e
}

export function fsplDb(distanceM: number, frequencyHz: number): number {
  if (distanceM <= 0 || frequencyHz <= 0) return 0
  return 20 * Math.log10(4 * Math.PI * distanceM * frequencyHz / CONSTANTS.c)
}

export const wattsToDbm = (watts: number): number => 10 * Math.log10(Math.max(watts, 1e-30) * 1000)
export const dbmToWatts = (dbm: number): number => 10 ** ((dbm - 30) / 10)
export const linearToDb = (ratio: number): number => -10 * Math.log10(Math.max(ratio, 1e-30))

export function materialProperties(material: ScientificMaterial, frequencyHz: number): MaterialProperties {
  const fGHz = frequencyHz / 1e9
  return {
    epsilonR: material.a * fGHz ** material.b,
    conductivitySm: material.c * fGHz ** material.d,
    inValidatedRange: fGHz >= material.minGHz && fGHz <= material.maxGHz,
  }
}

export function propagationConstant(frequencyHz: number, epsilonR: number, conductivitySm: number) {
  const omega = 2 * Math.PI * frequencyHz
  const epsilon = CONSTANTS.epsilon0 * epsilonR
  const mu = CONSTANTS.mu0
  const ratio = conductivitySm / Math.max(omega * epsilon, 1e-30)
  const common = omega * Math.sqrt(mu * epsilon / 2)
  const root = Math.sqrt(1 + ratio * ratio)
  return {
    alphaNpM: common * Math.sqrt(Math.max(0, root - 1)),
    betaRadM: common * Math.sqrt(root + 1),
  }
}

function normalInterfaceReflectance(frequencyHz: number, epsilonR: number, conductivitySm: number): number {
  const omega = 2 * Math.PI * frequencyHz
  const numerator: Complex = { re: 0, im: omega * CONSTANTS.mu0 }
  const denominator: Complex = { re: conductivitySm, im: omega * CONSTANTS.epsilon0 * epsilonR }
  const eta2 = sqrtComplex(div(numerator, denominator))
  const eta1: Complex = { re: CONSTANTS.z0, im: 0 }
  return Math.min(1, Math.max(0, abs2(div(sub(eta2, eta1), add(eta2, eta1)))))
}

function dielectricAngularReflectance(epsilonR: number, incidentRad: number, polarization: Polarization): number {
  const n1 = 1
  const n2 = Math.sqrt(epsilonR)
  const sinT = Math.min(1, n1 / n2 * Math.sin(incidentRad))
  const thetaT = Math.asin(sinT)
  const cosI = Math.cos(incidentRad)
  const cosT = Math.cos(thetaT)
  const rTE = (n1 * cosI - n2 * cosT) / (n1 * cosI + n2 * cosT)
  const rTM = (n2 * cosI - n1 * cosT) / (n2 * cosI + n1 * cosT)
  if (polarization === 'TE') return rTE * rTE
  if (polarization === 'TM') return rTM * rTM
  return (rTE * rTE + rTM * rTM) / 2
}

export function layerInteraction(
  frequencyHz: number,
  material: ScientificMaterial,
  thicknessM: number,
  incidentAngleDeg = 0,
  polarization: Polarization = 'unpolarized',
): Interaction {
  const properties = materialProperties(material, frequencyHz)
  const { alphaNpM, betaRadM } = propagationConstant(frequencyHz, properties.epsilonR, properties.conductivitySm)
  const incidentRad = incidentAngleDeg * Math.PI / 180
  const refractedRad = Math.asin(Math.min(1, Math.sin(incidentRad) / Math.sqrt(properties.epsilonR)))
  const conductorLike = properties.conductivitySm / Math.max(2 * Math.PI * frequencyHz * CONSTANTS.epsilon0 * properties.epsilonR, 1e-30) > 1
  const rNormal = normalInterfaceReflectance(frequencyHz, properties.epsilonR, properties.conductivitySm)
  const rAngle = dielectricAngularReflectance(properties.epsilonR, incidentRad, polarization)
  const surfaceR = conductorLike ? rNormal : Math.min(1, rAngle * (rNormal / Math.max(dielectricAngularReflectance(properties.epsilonR, 0, 'unpolarized'), 1e-12)))
  const pathM = thicknessM / Math.max(Math.cos(refractedRad), .05)
  const bulkPower = Math.exp(-2 * alphaNpM * pathM)
  // Incoherent sum of internal round trips. Avoids false phase certainty for heterogeneous walls.
  const denominator = Math.max(1e-18, 1 - surfaceR * surfaceR * bulkPower * bulkPower)
  const transmittance = Math.min(1, (1 - surfaceR) ** 2 * bulkPower / denominator)
  const reflectance = Math.min(1, surfaceR + (1 - surfaceR) ** 2 * surfaceR * bulkPower * bulkPower / denominator)
  const absorptance = Math.max(0, 1 - reflectance - transmittance)
  return {
    reflectance,
    transmittance,
    absorptance,
    lossDb: linearToDb(transmittance),
    alphaNpM,
    betaRadM,
    penetrationDepthM: alphaNpM > 0 ? 1 / alphaNpM : null,
    refractedAngleDeg: refractedRad * 180 / Math.PI,
    inValidatedRange: properties.inValidatedRange,
  }
}

export function stackInteraction(
  frequencyHz: number,
  layers: LayerInput[],
  incidentAngleDeg = 0,
  polarization: Polarization = 'unpolarized',
) {
  const details = layers.map((layer) => ({
    ...layer,
    material: materialById(layer.materialId),
    result: layerInteraction(frequencyHz, materialById(layer.materialId), layer.thicknessM, incidentAngleDeg, polarization),
  }))
  const transmission = details.reduce((value, layer) => value * layer.result.transmittance, 1)
  return {
    details,
    transmission,
    lossDb: linearToDb(transmission),
    inValidatedRange: details.every((layer) => layer.result.inValidatedRange),
  }
}

export function linkBudget(powerWatts: number, distanceM: number, frequencyHz: number, obstacleLossDb = 0) {
  const transmitDbm = wattsToDbm(powerWatts)
  const freeSpaceLossDb = fsplDb(distanceM, frequencyHz)
  const receivedDbm = transmitDbm - freeSpaceLossDb - obstacleLossDb
  return {
    transmitDbm,
    freeSpaceLossDb,
    obstacleLossDb,
    receivedDbm,
    receivedWatts: dbmToWatts(receivedDbm),
    flightTimeS: distanceM / CONSTANTS.c,
    powerDensityWm2: powerWatts / (4 * Math.PI * distanceM * distanceM),
    electricFieldVm: Math.sqrt(30 * powerWatts) / distanceM,
    // Conservative educational rule of thumb. True Fraunhofer distance also depends on antenna aperture.
    farFieldRuleOfThumb: distanceM >= 10 * wavelengthM(frequencyHz),
  }
}
