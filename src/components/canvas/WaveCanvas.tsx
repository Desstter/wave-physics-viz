import { useRef, useEffect } from 'react'
import { useAnimationFrame } from '../../hooks/useAnimationFrame'
import { useCanvasSize } from '../../hooks/useCanvasSize'
import { useSimStore } from '../../store/simulationStore'
import { useAppStore } from '../../store/appStore'
import { getWaveById } from '../../data/waveTypes'
import { getMaterialById, interpolateMaterialAtFreq } from '../../data/materials'
import { computeInteraction } from '../../physics/materialInteraction'
import { formatWavelength } from '../../utils/formatters'
import type { MaterialSlab } from '../../types/simulation.types'
import type { Material } from '../../types/material.types'
import type { InteractionResult } from '../../physics/materialInteraction'

// Visual propagation speed (px/s)
const VISUAL_SPEED = 150
const MIN_RINGS = 10
const MAX_RINGS = 26

interface SlabPhysics {
  mat: Material
  result: InteractionResult
  slabX: number
  slabRight: number
  lossDb: number
  penetrationDepthPx: number
}

interface Props {
  waveId?: string
  compact?: boolean
}

export default function WaveCanvas({ waveId, compact = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useCanvasSize(canvasRef as React.RefObject<HTMLCanvasElement | null>)
  const { isPlaying, speedMultiplier, timeSeconds, tickTime, slabs, showReflection, showTransmission } = useSimStore()
  const { selectedWaveId } = useAppStore()

  const effectiveWaveId = waveId ?? selectedWaveId
  const wave = getWaveById(effectiveWaveId)

  useAnimationFrame((deltaMs) => {
    if (isPlaying) tickTime(deltaMs / 1000)
  }, isPlaying)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !wave || w === 0 || h === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, w, h)

    // Background
    ctx.fillStyle = '#0a0d14'
    ctx.fillRect(0, 0, w, h)

    drawGrid(ctx, w, h)

    const srcX = w * 0.14
    const srcY = h * 0.5
    const rxX = w * 0.88
    const rxY = h * 0.5

    const waveColor = wave.color
    const freq = wave.frequencyHz
    const realWavelength = 2.998e8 / freq

    // Visual wavelength: log-mapped from 3 Hz → 25% canvas, 1e24 Hz → 5% canvas
    const logF = Math.log10(freq)
    const normalizedF = Math.max(0, Math.min(1, (logF - 3) / 21))
    const visualWavelength = w * 0.25 * (1 - normalizedF * 0.8)

    const numRings = Math.round(MIN_RINGS + normalizedF * (MAX_RINGS - MIN_RINGS))

    // ── Pre-compute slab physics once per frame ──
    const slabPhysics: SlabPhysics[] = (slabs as MaterialSlab[]).map(slab => {
      const mat = getMaterialById(slab.materialId)
      if (!mat) return null
      const props = interpolateMaterialAtFreq(mat, freq)
      const result = computeInteraction(freq, props.relativePermittivity, props.conductivity, mat.thicknessM)
      const slabX = slab.x * w
      const slabRight = (slab.x + slab.width) * w
      const lossDb = -10 * Math.log10(Math.max(result.transmittance, 1e-10))
      const slabW = slabRight - slabX
      const penetrationDepthPx = computePenetrationDepthPx(result, mat, slabW)
      return { mat, result, slabX, slabRight, lossDb, penetrationDepthPx }
    }).filter((x): x is SlabPhysics => x !== null)

    // ── Field intensity background (before slabs) ──
    drawFieldBackground(ctx, w, h, srcX, slabPhysics, waveColor, visualWavelength)

    // ── Draw slabs (base fill + borders + labels) ──
    slabPhysics.forEach(sp => drawSlab(ctx, sp, h))

    // ── Shadow zones behind opaque slabs ──
    slabPhysics.forEach(sp =>
      drawShadowZone(ctx, sp.slabRight, w, h, sp.result.transmittance, sp.mat.category === 'conductor')
    )

    // ── Penetration depth gradient inside each slab ──
    slabPhysics.forEach(sp => drawPenetrationGradient(ctx, sp, h))

    // ── Path loss annotation (top-right) ──
    if (!compact) {
      drawPathAnnotations(ctx, w, slabPhysics, freq)
    }

    // ── Compute cumulative transmittance at RX position ──
    let rxCumulativeT = 1
    slabPhysics.forEach(sp => { rxCumulativeT *= sp.result.transmittance })
    const rxDistancePx = rxX - srcX
    const rxAmplitude = Math.min(1, Math.sqrt(visualWavelength / Math.max(rxDistancePx, 1))) * Math.pow(rxCumulativeT, 0.5)

    // ── Draw expanding wave rings ──
    // Warmup offset so rings are visible immediately from t=0
    const warmupOffset = numRings * visualWavelength
    const refDist = visualWavelength

    for (let n = 0; n < numRings; n++) {
      const r = ((timeSeconds * VISUAL_SPEED * speedMultiplier + warmupOffset - n * visualWavelength) % (w * 1.5))
      if (r <= 0) continue

      // sqrt(refDist/r) — 2D cylindrical spreading, more visible than 1/r
      let amplitude = Math.min(1.0, Math.sqrt(refDist / Math.max(r, 1)))
      // Floor before material attenuation so every ring has a base visibility
      amplitude = Math.min(1.0, Math.max(0.15, amplitude))

      // Cumulative attenuation through slabs the ring has passed
      let cumulativeT = 1
      for (const sp of slabPhysics) {
        if (r > sp.slabX - srcX) {
          cumulativeT *= sp.result.transmittance
        }
      }
      amplitude *= Math.pow(cumulativeT, 0.5)

      if (amplitude < 0.04) continue

      // Draw forward semicircle arc (right hemisphere — waves propagate away from TX)
      if (showTransmission) {
        drawRingArc(ctx, srcX, srcY, r, amplitude, waveColor)
      }

      // Reflected waves — dashed, blue-tinted, expanding leftward from mirror source
      if (showReflection) {
        for (const sp of slabPhysics) {
          if (sp.result.reflectance < 0.01) continue

          // FIX: correct mirror source across slab face
          const reflSrcX = 2 * sp.slabX - srcX
          const distToSlab = sp.slabX - srcX
          const reflRadius = r - distToSlab * 2
          if (reflRadius <= 0) continue

          const reflAmplitude = amplitude * sp.result.reflectance * 0.8
          if (reflAmplitude < 0.04) continue

          ctx.save()
          ctx.setLineDash([5, 4])
          const col = blendWithBlue(waveColor, Math.min(reflAmplitude, 1))
          ctx.strokeStyle = col
          ctx.lineWidth = Math.max(0.8, reflAmplitude * 2.5)
          // FIX: arc faces left (toward TX), expanding from mirror point behind slab
          ctx.shadowColor = col
          ctx.shadowBlur = reflAmplitude > 0.3 ? 8 * reflAmplitude : 0
          ctx.beginPath()
          ctx.arc(reflSrcX, srcY, reflRadius, Math.PI / 2, (3 * Math.PI) / 2)
          ctx.stroke()
          ctx.restore()
        }
      }
    }

    // Reset any lingering shadow
    ctx.shadowBlur = 0
    ctx.shadowColor = 'transparent'

    // ── Source emitter ──
    drawSource(ctx, srcX, srcY, waveColor, timeSeconds)

    // ── Receiver indicator ──
    drawReceiver(ctx, rxX, rxY, rxAmplitude, waveColor)

    // ── Labels & legend ──
    if (!compact) {
      drawScaleBar(ctx, w, h, visualWavelength, realWavelength)
      drawLegend(ctx, w, h, showReflection, showTransmission)
    }
  }, [w, h, timeSeconds, wave, slabs, showReflection, showTransmission, speedMultiplier, isPlaying])

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-lg"
      style={{ height: compact ? '200px' : '380px', display: 'block' }}
    />
  )
}

// ────────────────────────── Penetration depth ──────────────────────────

/**
 * Log-scale mapping of skin depth to visual slab pixel width.
 * Ensures even extreme conductors (steel, copper) show a visible — but thin — gradient.
 */
function computePenetrationDepthPx(result: InteractionResult, mat: Material, slabWidthPx: number): number {
  if (result.attenuationCoeffPerM <= 0) return slabWidthPx  // lossless
  const skinDepthM = 1 / result.attenuationCoeffPerM
  if (skinDepthM >= mat.thicknessM) return slabWidthPx      // wave exits the other side

  // Log-scale: ratio -12…0 maps to 2%…100% of slab visual width
  const ratio = skinDepthM / mat.thicknessM
  const logRatio = Math.log10(Math.max(ratio, 1e-12))
  const fraction = Math.max(0.02, (logRatio + 12) / 12)
  return fraction * slabWidthPx
}

// ────────────────────────── Draw helpers ──────────────────────────

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = 1
  const step = 50
  for (let x = 0; x < w; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }
}

/**
 * Subtle field intensity background showing how signal strength drops across zones.
 * Drawn before slabs so it appears underneath material overlays.
 */
function drawFieldBackground(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  srcX: number,
  slabPhysics: SlabPhysics[],
  waveColor: string,
  visualWavelength: number
) {
  const sortedSlabs = [...slabPhysics].sort((a, b) => a.slabX - b.slabX)

  // Build zones: free space before/between/after slabs, and inside slabs
  type Zone = { x0: number; x1: number; cumTLeft: number; cumTRight: number }
  const zones: Zone[] = []
  let cumT = 1.0
  let prevX = srcX

  for (const sp of sortedSlabs) {
    if (sp.slabX > prevX) {
      zones.push({ x0: prevX, x1: sp.slabX, cumTLeft: cumT, cumTRight: cumT })
    }
    // Inside slab: cumT drops from cumT to cumT * transmittance
    zones.push({ x0: sp.slabX, x1: sp.slabRight, cumTLeft: cumT, cumTRight: cumT * sp.result.transmittance })
    cumT *= sp.result.transmittance
    prevX = sp.slabRight
  }
  zones.push({ x0: prevX, x1: w, cumTLeft: cumT, cumTRight: cumT })

  for (const zone of zones) {
    if (zone.x1 <= zone.x0) continue
    const r0 = Math.max(1, zone.x0 - srcX)
    const r1 = Math.max(1, zone.x1 - srcX)
    const decay0 = Math.sqrt(visualWavelength / r0)
    const decay1 = Math.sqrt(visualWavelength / r1)
    const alpha0 = Math.min(0.11, decay0 * zone.cumTLeft * 0.14)
    const alpha1 = Math.min(0.11, decay1 * zone.cumTRight * 0.14)

    const grad = ctx.createLinearGradient(zone.x0, 0, zone.x1, 0)
    grad.addColorStop(0, hexOrRgbToRgba(waveColor, Math.max(0, alpha0)))
    grad.addColorStop(1, hexOrRgbToRgba(waveColor, Math.max(0, alpha1)))
    ctx.fillStyle = grad
    ctx.fillRect(zone.x0, 0, zone.x1 - zone.x0, h)
  }
}

function drawSlab(ctx: CanvasRenderingContext2D, sp: SlabPhysics, h: number) {
  const { mat, slabX, slabRight, lossDb } = sp
  const slabW = slabRight - slabX

  ctx.save()
  ctx.fillStyle = mat.color + '3a'
  ctx.fillRect(slabX, 0, slabW, h)
  ctx.strokeStyle = mat.color + 'cc'
  ctx.lineWidth = 2
  ctx.strokeRect(slabX, 0, slabW, h)

  // Material name at top
  ctx.fillStyle = 'rgba(255,255,255,0.88)'
  ctx.font = 'bold 10px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText(mat.label, slabX + slabW / 2, 18)
  ctx.font = '9px system-ui'
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.fillText(`${(mat.thicknessM * 100).toFixed(0)} cm`, slabX + slabW / 2, 30)

  // dB loss at bottom
  const lossColor = lossDb > 20 ? '#ef4444' : lossDb > 5 ? '#f59e0b' : '#4ade80'
  ctx.fillStyle = lossColor
  ctx.font = 'bold 10px system-ui'
  ctx.fillText(`-${lossDb > 99 ? '>99' : lossDb.toFixed(1)} dB`, slabX + slabW / 2, h - 8)

  // Arrow label at right edge showing loss contribution
  if (lossDb > 0.5 && slabRight + 6 < slabRight + 60) {
    ctx.fillStyle = lossColor
    ctx.font = 'bold 8px system-ui'
    ctx.textAlign = 'left'
    ctx.fillText(`→ -${lossDb > 99 ? '>99' : lossDb.toFixed(1)} dB`, slabRight + 4, 20)
  }

  ctx.restore()
}

/**
 * Shadow zone to the right of opaque slabs with soft leading edge.
 */
function drawShadowZone(
  ctx: CanvasRenderingContext2D,
  slabRight: number, w: number, h: number,
  transmittance: number,
  isConductor: boolean
) {
  if (transmittance >= 0.5) return
  const maxOpacity = Math.min(0.80, 0.80 * (1 - transmittance * 2))
  const edgeWidth = Math.min(40, (w - slabRight) * 0.15)

  ctx.save()

  // Soft gradient leading edge
  if (edgeWidth > 0) {
    const edgeGrad = ctx.createLinearGradient(slabRight, 0, slabRight + edgeWidth, 0)
    edgeGrad.addColorStop(0, 'rgba(0,0,0,0)')
    edgeGrad.addColorStop(1, `rgba(0,0,0,${maxOpacity.toFixed(3)})`)
    ctx.fillStyle = edgeGrad
    ctx.fillRect(slabRight, 0, edgeWidth, h)
  }

  // Flat dark fill for the rest
  ctx.fillStyle = `rgba(0,0,0,${maxOpacity.toFixed(3)})`
  ctx.fillRect(slabRight + edgeWidth, 0, w - slabRight - edgeWidth, h)

  // Conductor: subtle red tint overlay
  if (isConductor) {
    ctx.fillStyle = 'rgba(239,68,68,0.07)'
    ctx.fillRect(slabRight, 0, w - slabRight, h)
  }

  // "RF shadow" label for heavily attenuated regions
  if (transmittance < 0.1) {
    ctx.fillStyle = 'rgba(255,255,255,0.22)'
    ctx.font = '10px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('RF shadow', slabRight + (w - slabRight) / 2, h / 2 - 22)
  }

  ctx.restore()
}

/**
 * Gradient showing wave penetration depth inside each slab.
 * Three branches: lossless, conductor (hatch), lossy dielectric (gradient).
 */
function drawPenetrationGradient(ctx: CanvasRenderingContext2D, sp: SlabPhysics, h: number) {
  const { mat, result, slabX, slabRight, penetrationDepthPx } = sp
  const slabW = slabRight - slabX

  ctx.save()
  ctx.textAlign = 'center'

  // Case 1: lossless — wave passes freely
  if (result.attenuationCoeffPerM < 0.01) {
    ctx.fillStyle = 'rgba(74,222,128,0.45)'
    ctx.font = '9px system-ui'
    ctx.fillText('↔ penetra', slabX + slabW / 2, h / 2 + 16)
    ctx.restore()
    return
  }

  // Case 2: conductor — diagonal hatch + thin surface glow
  if (mat.category === 'conductor') {
    ctx.strokeStyle = hexOrRgbToRgba(mat.color, 0.3)
    ctx.lineWidth = 1
    const spacing = 7
    ctx.beginPath()
    for (let x = slabX - h; x < slabRight; x += spacing) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x + h, h)
    }
    ctx.stroke()

    // Surface glow at entry face
    const glowW = Math.max(penetrationDepthPx, 5)
    const surfGrad = ctx.createLinearGradient(slabX, 0, slabX + glowW, 0)
    surfGrad.addColorStop(0, hexOrRgbToRgba(mat.color, 0.75))
    surfGrad.addColorStop(1, hexOrRgbToRgba(mat.color, 0.0))
    ctx.fillStyle = surfGrad
    ctx.fillRect(slabX, 0, glowW, h)

    // Skin depth label
    if (result.skinDepthM !== null) {
      ctx.fillStyle = 'rgba(255,255,255,0.72)'
      ctx.font = '9px system-ui'
      ctx.fillText(`δ=${formatWavelength(result.skinDepthM)}`, slabX + slabW / 2, h / 2 + 16)
    }
    ctx.restore()
    return
  }

  // Case 3: lossy dielectric — absorption gradient
  const grad = ctx.createLinearGradient(slabX, 0, slabX + penetrationDepthPx, 0)
  grad.addColorStop(0, hexOrRgbToRgba(mat.color, 0.78))
  grad.addColorStop(0.5, hexOrRgbToRgba(mat.color, 0.35))
  grad.addColorStop(1, hexOrRgbToRgba(mat.color, 0.0))
  ctx.fillStyle = grad
  ctx.fillRect(slabX, 0, penetrationDepthPx, h)

  // Skin depth label
  if (result.skinDepthM !== null) {
    const labelX = slabX + Math.min(penetrationDepthPx, slabW) / 2
    ctx.fillStyle = 'rgba(255,255,255,0.72)'
    ctx.font = '9px system-ui'
    ctx.fillText(`δ=${formatWavelength(result.skinDepthM)}`, labelX, h / 2 + 16)
  }

  ctx.restore()
}

/**
 * Path loss annotation in top-right: FSPL + material + total.
 */
function drawPathAnnotations(
  ctx: CanvasRenderingContext2D,
  w: number,
  slabPhysics: SlabPhysics[],
  freq: number
) {
  const totalMaterialLossDb = slabPhysics.reduce((acc, sp) => acc + sp.lossDb, 0)
  const illustrativeDistM = 10
  const fsplDb = 20 * Math.log10((4 * Math.PI * illustrativeDistM * freq) / 2.998e8)

  ctx.save()
  ctx.textAlign = 'right'

  const x = w - 8
  const y = 46
  const boxH = totalMaterialLossDb > 0.1 ? 54 : 36
  const boxW = 148

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.beginPath()
  ctx.roundRect(x - boxW, y - 16, boxW, boxH, 4)
  ctx.fill()

  ctx.font = '9px system-ui'
  ctx.fillStyle = 'rgba(255,200,100,0.75)'
  ctx.fillText(`FSPL@10m: −${fsplDb.toFixed(1)} dB`, x - 6, y)

  if (totalMaterialLossDb > 0.1) {
    ctx.fillStyle = totalMaterialLossDb > 30 ? '#ef4444' : '#f59e0b'
    ctx.fillText(`Material: −${totalMaterialLossDb.toFixed(1)} dB`, x - 6, y + 14)
    ctx.font = 'bold 9px system-ui'
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillText(`Total: −${(fsplDb + totalMaterialLossDb).toFixed(1)} dB`, x - 6, y + 28)
  }

  ctx.restore()
}

/** Forward semicircle arc — wave propagates right, with glow effect */
function drawRingArc(
  ctx: CanvasRenderingContext2D,
  srcX: number, srcY: number, r: number,
  amplitude: number, color: string
) {
  const rgba = hexOrRgbToRgba(color, Math.min(amplitude, 1))
  const lineW = Math.max(1.0, amplitude * 3.5)

  // Wide glow pass (only for bright rings to keep performance)
  if (amplitude > 0.3) {
    ctx.save()
    ctx.shadowColor = hexOrRgbToRgba(color, amplitude * 0.55)
    ctx.shadowBlur = 14 * amplitude
    ctx.strokeStyle = rgba
    ctx.lineWidth = lineW
    ctx.beginPath()
    ctx.arc(srcX, srcY, r, -Math.PI / 2, Math.PI / 2)
    ctx.stroke()
    ctx.restore()
  }

  // Tight bright core — always drawn
  ctx.save()
  ctx.shadowColor = hexOrRgbToRgba(color, amplitude * 0.85)
  ctx.shadowBlur = 5 * amplitude
  ctx.strokeStyle = hexOrRgbToRgba(color, Math.min(amplitude * 1.35, 1))
  ctx.lineWidth = Math.max(0.8, amplitude * 1.6)
  ctx.beginPath()
  ctx.arc(srcX, srcY, r, -Math.PI / 2, Math.PI / 2)
  ctx.stroke()
  ctx.restore()
}

function drawSource(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, t: number) {
  ctx.save()
  const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 4)
  const r = 7 + pulse * 4

  // Outer glow halo
  const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5)
  halo.addColorStop(0, hexOrRgbToRgba(color, 0.55))
  halo.addColorStop(0.5, hexOrRgbToRgba(color, 0.18))
  halo.addColorStop(1, 'transparent')
  ctx.fillStyle = halo
  ctx.beginPath()
  ctx.arc(x, y, r * 2.5, 0, Math.PI * 2)
  ctx.fill()

  // Core dot
  ctx.shadowColor = color
  ctx.shadowBlur = 12
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = 'bold 10px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('TX', x, y - 16)
  ctx.restore()
}

/**
 * Receiver antenna with a vertical power bar.
 * Green = strong (>-70 dBm equiv.), yellow = moderate, red = weak.
 */
function drawReceiver(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  amplitudeRatio: number, waveColor: string
) {
  ctx.save()

  // Antenna icon
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([])
  ctx.shadowBlur = 0

  // Vertical mast
  ctx.beginPath()
  ctx.moveTo(x, y + 18)
  ctx.lineTo(x, y - 18)
  ctx.stroke()

  // Horizontal antenna elements
  for (const dy of [-12, -4, 6, 14]) {
    const len = 5 + Math.abs(dy) * 0.3
    ctx.beginPath()
    ctx.moveTo(x - len, y + dy)
    ctx.lineTo(x + len, y + dy)
    ctx.stroke()
  }

  // Power bar (vertical, to the right of the antenna)
  const maxBarH = 36
  const barH = Math.max(1, amplitudeRatio * maxBarH)
  const barX = x + 10
  const barY = y + 18

  // Background track
  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  ctx.fillRect(barX, barY - maxBarH, 5, maxBarH)

  // Filled level with color coding
  const barColor = amplitudeRatio > 0.3 ? '#4ade80' : amplitudeRatio > 0.08 ? '#fbbf24' : '#ef4444'
  ctx.fillStyle = barColor
  ctx.fillRect(barX, barY - barH, 5, barH)

  // Labels
  ctx.fillStyle = waveColor
  ctx.font = 'bold 10px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('RX', x, y - 26)

  ctx.fillStyle = barColor
  ctx.font = '8px system-ui'
  ctx.textAlign = 'left'
  const sigLabel = amplitudeRatio > 0.3 ? 'fuerte' : amplitudeRatio > 0.08 ? 'débil' : 'nula'
  ctx.fillText(sigLabel, barX + 8, barY - barH / 2 + 4)

  ctx.restore()
}

/**
 * Scale bar showing 1 visual wavelength.
 */
function drawScaleBar(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  visualWavelength: number, realWavelengthM: number
) {
  ctx.save()
  const barLen = Math.min(visualWavelength, w * 0.22)
  const bx = w - barLen - 12
  const by = h - 24

  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(bx, by)
  ctx.lineTo(bx + barLen, by)
  ctx.moveTo(bx, by - 4); ctx.lineTo(bx, by + 4)
  ctx.moveTo(bx + barLen, by - 4); ctx.lineTo(bx + barLen, by + 4)
  ctx.stroke()

  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '9px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('1λ visual', bx + barLen / 2, by - 6)

  ctx.fillStyle = 'rgba(255,255,255,0.32)'
  ctx.font = '8px system-ui'
  ctx.fillText(`(real λ = ${formatWavelength(realWavelengthM)})`, bx + barLen / 2, by + 14)
  ctx.restore()
}

/**
 * Legend explaining solid vs dashed ring styles.
 */
function drawLegend(
  ctx: CanvasRenderingContext2D,
  _w: number, h: number,
  showReflection: boolean,
  showTransmission: boolean
) {
  ctx.save()
  ctx.font = '9px system-ui'
  ctx.textAlign = 'left'

  let ly = h - 24
  if (showTransmission) {
    ctx.setLineDash([])
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(8, ly); ctx.lineTo(26, ly); ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.fillText('transmitida', 30, ly + 4)
    ly -= 14
  }

  if (showReflection) {
    ctx.setLineDash([5, 4])
    ctx.strokeStyle = 'rgba(100,150,255,0.55)'
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(8, ly); ctx.lineTo(26, ly); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(100,150,255,0.55)'
    ctx.fillText('reflejada', 30, ly + 4)
  }

  ctx.setLineDash([])
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.font = '8px system-ui'
  ctx.textAlign = 'right'
  ctx.fillText('Amplitud ∝ 1/√r · T^0.5 (escala perceptual)', _w - 8, h - 8)
  ctx.restore()
}

// ────────────────────────── Color utilities ──────────────────────────

function hexOrRgbToRgba(color: string, alpha: number): string {
  if (color.startsWith('#')) {
    const n = parseInt(color.replace('#', ''), 16)
    const r = (n >> 16) & 255
    const g = (n >> 8) & 255
    const b = n & 255
    return `rgba(${r},${g},${b},${alpha.toFixed(3)})`
  }
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `,${alpha.toFixed(3)})`)
  }
  return color
}

/** Mix wave color 30% toward blue (#3b82f6) for reflected wave tinting */
function blendWithBlue(color: string, alpha: number): string {
  if (color.startsWith('#')) {
    const n = parseInt(color.replace('#', ''), 16)
    const r = Math.round(((n >> 16) & 255) * 0.7 + 59 * 0.3)
    const g = Math.round(((n >> 8) & 255) * 0.7 + 130 * 0.3)
    const b = Math.round((n & 255) * 0.7 + 246 * 0.3)
    return `rgba(${r},${g},${b},${alpha.toFixed(3)})`
  }
  return hexOrRgbToRgba(color, alpha)
}
