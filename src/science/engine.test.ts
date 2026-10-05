import { describe, expect, it } from 'vitest'
import { materialById } from './catalog'
import {
  CONSTANTS, fsplDb, layerInteraction, linkBudget, materialProperties,
  photonEnergyEv, propagationConstant, stackInteraction, wavelengthM,
} from './engine'

describe('fundamental electromagnetic relations', () => {
  it('uses exact SI constants for c, h and e', () => {
    expect(CONSTANTS.c).toBe(299_792_458)
    expect(CONSTANTS.h).toBe(6.626_070_15e-34)
    expect(CONSTANTS.e).toBe(1.602_176_634e-19)
  })

  it('computes Wi-Fi wavelength and photon energy', () => {
    expect(wavelengthM(2.4e9)).toBeCloseTo(.124913524, 8)
    expect(photonEnergyEv(2.4e9)).toBeCloseTo(9.9256e-6, 9)
  })

  it('matches the canonical 1 m / 2.4 GHz FSPL result', () => {
    expect(fsplDb(1, 2.4e9)).toBeCloseTo(40.052, 2)
  })
})

describe('ITU-R P.2040 material model', () => {
  it('evaluates the published concrete power law at 2.4 GHz', () => {
    const properties = materialProperties(materialById('concrete'), 2.4e9)
    expect(properties.epsilonR).toBeCloseTo(5.24, 8)
    expect(properties.conductivitySm).toBeCloseTo(.0462 * 2.4 ** .7822, 10)
    expect(properties.inValidatedRange).toBe(true)
  })

  it('conserves power at a finite lossy slab', () => {
    const result = layerInteraction(2.4e9, materialById('concrete'), .2, 35, 'TE')
    expect(result.reflectance + result.transmittance + result.absorptance).toBeCloseTo(1, 12)
    expect(result.reflectance).toBeGreaterThanOrEqual(0)
    expect(result.transmittance).toBeGreaterThanOrEqual(0)
    expect(result.absorptance).toBeGreaterThanOrEqual(0)
  })

  it('makes a thicker lossy slab transmit less power', () => {
    const material = materialById('brick')
    const thin = layerInteraction(5e9, material, .02)
    const thick = layerInteraction(5e9, material, .2)
    expect(thick.transmittance).toBeLessThan(thin.transmittance)
    expect(thick.lossDb).toBeGreaterThan(thin.lossDb)
  })

  it('keeps air lossless and reflection-free', () => {
    const result = layerInteraction(2.4e9, materialById('air'), 10)
    expect(result.reflectance).toBeCloseTo(0, 10)
    expect(result.transmittance).toBeCloseTo(1, 10)
    expect(result.absorptance).toBeCloseTo(0, 10)
  })

  it('uses power attenuation exp(-2 alpha d)', () => {
    const material = materialById('wood')
    const properties = materialProperties(material, 10e9)
    const { alphaNpM } = propagationConstant(10e9, properties.epsilonR, properties.conductivitySm)
    const interaction = layerInteraction(10e9, material, .05)
    expect(alphaNpM).toBeGreaterThan(0)
    expect(interaction.penetrationDepthM).toBeCloseTo(1 / alphaNpM, 12)
  })

  it('combines independent material losses multiplicatively', () => {
    const layers = [{ materialId: 'glass', thicknessM: .006 }, { materialId: 'concrete', thicknessM: .2 }]
    const stack = stackInteraction(5e9, layers)
    const product = stack.details.reduce((value, item) => value * item.result.transmittance, 1)
    expect(stack.transmission).toBeCloseTo(product, 12)
  })
})

describe('link budget', () => {
  it('balances transmit power, free-space loss and obstacle loss in dB', () => {
    const result = linkBudget(.1, 10, 2.4e9, 12)
    expect(result.transmitDbm).toBeCloseTo(20, 10)
    expect(result.receivedDbm).toBeCloseTo(20 - fsplDb(10, 2.4e9) - 12, 10)
    expect(result.flightTimeS).toBeCloseTo(10 / CONSTANTS.c, 15)
    expect(result.farFieldRuleOfThumb).toBe(true)
  })
})
