import { useEffect, useRef } from 'react'

export interface ChartPoint { x: number; y: number }

interface LineChartProps {
  points: ChartPoint[]
  xLabel: string
  yLabel: string
  color?: string
  xLog?: boolean
  yFormatter?: (value: number) => string
  xFormatter?: (value: number) => string
  markerX?: number
}

export default function LineChart({ points, xLabel, yLabel, color = '#d5ff5f', xLog = false, yFormatter = compact, xFormatter = compact, markerX }: LineChartProps) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || points.length < 2) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const render = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(devicePixelRatio || 1, 2)
      const w = Math.max(280, rect.width), h = Math.max(190, rect.height)
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      const pad = { l: 48, r: 16, t: 18, b: 38 }
      const pw = w - pad.l - pad.r, ph = h - pad.t - pad.b
      const tx = (x: number) => xLog ? Math.log10(x) : x
      const xs = points.map((p) => tx(p.x)), ys = points.map((p) => p.y)
      const minX = Math.min(...xs), maxX = Math.max(...xs)
      let minY = Math.min(...ys), maxY = Math.max(...ys)
      if (minY === maxY) { minY -= 1; maxY += 1 }
      const px = (x: number) => pad.l + (tx(x) - minX) / (maxX - minX) * pw
      const py = (y: number) => pad.t + (maxY - y) / (maxY - minY) * ph
      ctx.font = '500 9px Inter, system-ui, sans-serif'
      ctx.lineWidth = 1
      for (let i = 0; i <= 4; i += 1) {
        const y = pad.t + ph * i / 4
        const val = maxY - (maxY - minY) * i / 4
        ctx.strokeStyle = 'rgba(255,255,255,.055)'; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke()
        ctx.fillStyle = '#68727b'; ctx.textAlign = 'right'; ctx.fillText(yFormatter(val), pad.l - 7, y + 3)
      }
      for (let i = 0; i <= 4; i += 1) {
        const valueT = minX + (maxX - minX) * i / 4
        const val = xLog ? 10 ** valueT : valueT
        const x = pad.l + pw * i / 4
        ctx.fillStyle = '#68727b'; ctx.textAlign = 'center'; ctx.fillText(xFormatter(val), x, h - 20)
      }
      const area = ctx.createLinearGradient(0, pad.t, 0, pad.t + ph)
      area.addColorStop(0, `${color}38`); area.addColorStop(1, `${color}00`)
      ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(px(p.x), py(p.y)) : ctx.moveTo(px(p.x), py(p.y)))
      ctx.lineTo(px(points[points.length - 1].x), pad.t + ph); ctx.lineTo(px(points[0].x), pad.t + ph); ctx.closePath(); ctx.fillStyle = area; ctx.fill()
      ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(px(p.x), py(p.y)) : ctx.moveTo(px(p.x), py(p.y)))
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.shadowColor = color; ctx.shadowBlur = 6; ctx.stroke(); ctx.shadowBlur = 0
      if (markerX && markerX >= points[0].x && markerX <= points[points.length - 1].x) {
        const x = px(markerX); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, pad.t + ph); ctx.stroke(); ctx.setLineDash([])
      }
      ctx.fillStyle = '#7c868f'; ctx.font = '600 9px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(xLabel.toUpperCase(), pad.l + pw / 2, h - 5)
      ctx.save(); ctx.translate(10, pad.t + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(yLabel.toUpperCase(), 0, 0); ctx.restore()
    }
    render()
    const ro = new ResizeObserver(render); ro.observe(canvas)
    return () => ro.disconnect()
  }, [color, markerX, points, xFormatter, xLabel, xLog, yFormatter, yLabel])

  return <canvas ref={ref} className="line-chart" role="img" aria-label={`${yLabel} frente a ${xLabel}`} />
}

function compact(value: number) {
  const abs = Math.abs(value)
  if (abs >= 1e9) return `${(value / 1e9).toFixed(0)}G`
  if (abs >= 1e6) return `${(value / 1e6).toFixed(0)}M`
  if (abs >= 1e3) return `${(value / 1e3).toFixed(0)}k`
  if (abs < .01 && abs > 0) return value.toExponential(0)
  return value.toFixed(abs < 10 ? 1 : 0)
}
