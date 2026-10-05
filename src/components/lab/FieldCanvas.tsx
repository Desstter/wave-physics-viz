import { useEffect, useRef } from 'react'
import type { LayerInput } from '../../science/engine'
import { stackInteraction, wavelengthM } from '../../science/engine'
import { materialById } from '../../science/catalog'

interface FieldCanvasProps {
  frequencyHz: number
  distanceM: number
  layers: LayerInput[]
  isPlaying: boolean
  powerWatts: number
  angleDeg: number
}

export default function FieldCanvas({ frequencyHz, distanceM, layers, isPlaying, powerWatts, angleDeg }: FieldCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const phaseRef = useRef(0)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let frame = 0
    let last = performance.now()
    const stack = stackInteraction(frequencyHz, layers, angleDeg)

    const render = (now: number) => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(320, rect.width)
      const height = Math.max(300, rect.height)
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr)
        canvas.height = Math.round(height * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const delta = Math.min(40, now - last)
      last = now
      if (isPlaying) phaseRef.current += delta * .001

      ctx.clearRect(0, 0, width, height)
      const bg = ctx.createLinearGradient(0, 0, width, height)
      bg.addColorStop(0, '#0e1418')
      bg.addColorStop(1, '#090d11')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, width, height)

      ctx.strokeStyle = 'rgba(255,255,255,.035)'
      ctx.lineWidth = 1
      for (let x = 0; x <= width; x += 44) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke() }
      for (let y = 0; y <= height; y += 44) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke() }

      const txX = 52
      const rxX = width - 52
      const cy = height * .52
      const barrierX = width * .61
      const barrierW = Math.max(22, Math.min(72, layers.length * 18 + 8))

      // Energy field zones. Opacity follows power transmission, not a decorative guess.
      const field = ctx.createLinearGradient(txX, 0, rxX, 0)
      field.addColorStop(0, 'rgba(213,255,95,.16)')
      field.addColorStop(Math.max(0, (barrierX - txX) / (rxX - txX) - .01), 'rgba(213,255,95,.055)')
      field.addColorStop(Math.min(1, (barrierX + barrierW - txX) / (rxX - txX) + .01), `rgba(95,227,255,${.025 + .12 * Math.sqrt(stack.transmission)})`)
      field.addColorStop(1, `rgba(95,227,255,${.01 + .06 * Math.sqrt(stack.transmission)})`)
      ctx.fillStyle = field
      ctx.fillRect(txX, 36, rxX - txX, height - 76)

      // Material stack.
      layers.forEach((layer, index) => {
        const material = materialById(layer.materialId)
        const x = barrierX + index * (barrierW / Math.max(1, layers.length))
        const w = barrierW / Math.max(1, layers.length)
        ctx.globalAlpha = .28
        ctx.fillStyle = material.color
        ctx.fillRect(x, 42, w, height - 88)
        ctx.globalAlpha = 1
        ctx.strokeStyle = material.color
        ctx.lineWidth = 1
        ctx.strokeRect(x + .5, 42.5, w - 1, height - 89)
      })

      // Propagating field: visually compressed, while amplitude tracks computed power.
      const lambda = wavelengthM(frequencyHz)
      const cycles = Math.max(5, Math.min(24, 7 + Math.log10(frequencyHz / 1e6) * 3.2))
      const phase = phaseRef.current * 4.2
      const drawWave = (x0: number, x1: number, amplitude: number, color: string, dashed = false) => {
        ctx.save()
        if (dashed) ctx.setLineDash([5, 5])
        ctx.strokeStyle = color
        ctx.lineWidth = 1.7
        ctx.shadowColor = color
        ctx.shadowBlur = 8 * Math.min(1, amplitude)
        ctx.beginPath()
        for (let x = x0; x <= x1; x += 2) {
          const local = (x - txX) / (rxX - txX)
          const spread = 1 / Math.sqrt(1 + local * 5)
          const y = cy + Math.sin(local * cycles * Math.PI * 2 - phase) * 34 * amplitude * spread
          if (x === x0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.restore()
      }
      drawWave(txX, barrierX, 1, '#d5ff5f')
      drawWave(barrierX + barrierW, rxX, Math.sqrt(stack.transmission), '#5fe3ff')
      const reflected = stack.details[0]?.result.reflectance ?? 0
      if (reflected > .002) drawWave(txX, barrierX, Math.sqrt(reflected) * .8, 'rgba(152,137,255,.75)', true)

      // Source and receiver.
      ctx.fillStyle = '#d5ff5f'; ctx.beginPath(); ctx.arc(txX, cy, 6, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = 'rgba(213,255,95,.35)'; ctx.lineWidth = 1
      for (let r = 13; r <= 28; r += 8) { ctx.beginPath(); ctx.arc(txX, cy, r, -.8, .8); ctx.stroke() }
      const rxGlow = Math.max(.08, Math.min(1, Math.sqrt(stack.transmission * powerWatts / .1)))
      ctx.fillStyle = `rgba(95,227,255,${rxGlow})`; ctx.beginPath(); ctx.arc(rxX, cy, 5, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = '#5fe3ff'; ctx.strokeRect(rxX - 9, cy - 16, 18, 32)

      ctx.font = '600 10px Inter, system-ui, sans-serif'
      ctx.fillStyle = '#87919a'; ctx.textAlign = 'center'
      ctx.fillText('TX · 0 m', txX, height - 23)
      ctx.fillText(`RX · ${formatDistance(distanceM)}`, rxX, height - 23)
      ctx.fillStyle = '#b8c0c5'
      ctx.fillText(layers.length ? layers.map((l) => materialById(l.materialId).shortName).join(' + ') : 'Sin obstáculos', barrierX + barrierW / 2, 27)

      // Ruler uses the actual TX—RX distance.
      ctx.strokeStyle = '#47515a'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(txX, height - 52); ctx.lineTo(rxX, height - 52); ctx.stroke()
      for (let i = 0; i <= 4; i += 1) {
        const x = txX + (rxX - txX) * i / 4
        ctx.beginPath(); ctx.moveTo(x, height - 56); ctx.lineTo(x, height - 48); ctx.stroke()
        if (i > 0 && i < 4) { ctx.fillStyle = '#606a73'; ctx.fillText(formatDistance(distanceM * i / 4), x, height - 39) }
      }

      ctx.textAlign = 'left'; ctx.fillStyle = '#657079'; ctx.font = '500 9px Inter, system-ui, sans-serif'
      ctx.fillText(`λ real ${formatDistance(lambda)} · animación temporal comprimida`, 14, height - 7)
      if (isPlaying) frame = requestAnimationFrame(render)
    }

    frame = requestAnimationFrame(render)
    return () => cancelAnimationFrame(frame)
  }, [angleDeg, distanceM, frequencyHz, isPlaying, layers, powerWatts])

  return <canvas ref={ref} className="field-canvas" aria-label="Visualización de propagación entre transmisor, materiales y receptor" />
}

function formatDistance(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(2)} km`
  if (value >= 1) return `${value.toFixed(value < 10 ? 2 : 1)} m`
  if (value >= .01) return `${(value * 100).toFixed(1)} cm`
  if (value >= 1e-3) return `${(value * 1e3).toFixed(2)} mm`
  if (value >= 1e-6) return `${(value * 1e6).toFixed(2)} µm`
  return `${(value * 1e9).toFixed(2)} nm`
}
