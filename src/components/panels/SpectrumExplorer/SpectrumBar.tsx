import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { frequencyToColor } from '../../../utils/colorMapping'
import { WAVE_TYPES } from '../../../data/waveTypes'
import { useAppStore } from '../../../store/appStore'

const BANDS = [
  { label: 'ELF', fMin: 3, fMax: 300 },
  { label: 'VLF', fMin: 3e3, fMax: 30e3 },
  { label: 'LF', fMin: 30e3, fMax: 300e3 },
  { label: 'MF (AM)', fMin: 300e3, fMax: 3e6 },
  { label: 'HF', fMin: 3e6, fMax: 30e6 },
  { label: 'VHF (FM)', fMin: 30e6, fMax: 300e6 },
  { label: 'UHF', fMin: 300e6, fMax: 3e9 },
  { label: 'SHF (WiFi/5G)', fMin: 3e9, fMax: 30e9 },
  { label: 'EHF (mmWave)', fMin: 30e9, fMax: 300e9 },
  { label: 'Infrared', fMin: 300e9, fMax: 430e12 },
  { label: 'Visible', fMin: 430e12, fMax: 789e12 },
  { label: 'UV', fMin: 789e12, fMax: 30e15 },
  { label: 'X-Ray', fMin: 30e15, fMax: 30e18 },
  { label: 'Gamma', fMin: 30e18, fMax: 3e24 },
]

export default function SpectrumBar() {
  const svgRef = useRef<SVGSVGElement>(null)
  const { selectedFrequencyHz, setSelectedFrequencyHz, setSelectedWaveId } = useAppStore()

  // Persistent refs so the cursor effect can update without a full rebuild
  const scaleRef = useRef<d3.ScaleLogarithmic<number, number> | null>(null)
  const cursorRef = useRef<d3.Selection<SVGLineElement, unknown, null, undefined> | null>(null)

  // ── Effect 1: Static content (gradient, bands, markers) ──
  // Runs on mount and when the container resizes. Does NOT depend on selectedFrequencyHz.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    function build() {
      if (!svg) return
      const el = svg.parentElement!
      const W = el.clientWidth || 800
      const H = 120
      const marginTop = 12
      const barH = 48
      const labelH = 20

      d3.select(svg).selectAll('*').remove()
      svg.setAttribute('width', String(W))
      svg.setAttribute('height', String(H))

      const xScale = d3.scaleLog().domain([3, 3e24]).range([0, W])
      scaleRef.current = xScale

      const g = d3.select(svg).append('g')

      // Gradient spectrum bar
      const steps = 300
      const stepW = W / steps
      for (let i = 0; i < steps; i++) {
        const f = xScale.invert(i * stepW)
        g.append('rect')
          .attr('x', i * stepW)
          .attr('y', marginTop)
          .attr('width', stepW + 1)
          .attr('height', barH)
          .attr('fill', frequencyToColor(f))
      }

      // Band labels under the bar
      BANDS.forEach(band => {
        const x0 = xScale(band.fMin)
        const x1 = xScale(band.fMax)
        const xMid = (x0 + x1) / 2
        const bW = x1 - x0
        if (bW < 8) return

        g.append('line')
          .attr('x1', x0).attr('y1', marginTop)
          .attr('x2', x0).attr('y2', marginTop + barH)
          .attr('stroke', 'rgba(0,0,0,0.4)').attr('stroke-width', 1)

        if (bW > 20) {
          g.append('text')
            .attr('x', xMid)
            .attr('y', marginTop + barH + labelH - 4)
            .attr('text-anchor', 'middle')
            .attr('font-size', Math.min(11, bW / band.label.length + 2))
            .attr('fill', '#9ca3af')
            .text(band.label)
        }
      })

      // Wave type markers
      WAVE_TYPES.forEach(wt => {
        const x = xScale(wt.frequencyHz)
        if (x < 0 || x > W) return
        g.append('line')
          .attr('x1', x).attr('y1', marginTop)
          .attr('x2', x).attr('y2', marginTop + barH)
          .attr('stroke', 'rgba(255,255,255,0.6)')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '3,2')
      })

      // Cursor line — stored in ref so the cursor effect can update it cheaply
      const initialX = xScale(useAppStore.getState().selectedFrequencyHz)
      cursorRef.current = g.append('line')
        .attr('x1', initialX).attr('y1', marginTop - 4)
        .attr('x2', initialX).attr('y2', marginTop + barH + 4)
        .attr('stroke', 'white')
        .attr('stroke-width', 2)

      // Invisible overlay for interaction
      g.append('rect')
        .attr('x', 0).attr('y', marginTop)
        .attr('width', W).attr('height', barH)
        .attr('fill', 'transparent')
        .attr('cursor', 'crosshair')
        .on('click', function (event: MouseEvent) {
          const [mx] = d3.pointer(event, this)
          const freq = xScale.invert(mx)
          setSelectedFrequencyHz(freq)
          const closest = WAVE_TYPES.reduce((a, b) =>
            Math.abs(Math.log10(b.frequencyHz) - Math.log10(freq)) <
            Math.abs(Math.log10(a.frequencyHz) - Math.log10(freq)) ? b : a
          )
          if (Math.abs(Math.log10(closest.frequencyHz) - Math.log10(freq)) < 0.8) {
            setSelectedWaveId(closest.id)
          }
        })
        .on('mousemove', function (event: MouseEvent) {
          const [mx] = d3.pointer(event, this)
          if (cursorRef.current) cursorRef.current.attr('x1', mx).attr('x2', mx)
        })
        .on('mouseleave', function () {
          const x = xScale(useAppStore.getState().selectedFrequencyHz)
          if (cursorRef.current) cursorRef.current.attr('x1', x).attr('x2', x)
        })
    }

    build()

    // Rebuild when the element resizes (e.g. sidebar collapse, window resize)
    const ro = new ResizeObserver(() => build())
    const parent = svg.parentElement
    if (parent) ro.observe(parent)
    return () => ro.disconnect()
  }, [setSelectedFrequencyHz, setSelectedWaveId])

  // ── Effect 2: Cursor-only update (cheap, no SVG rebuild) ──
  // Runs every time selectedFrequencyHz changes.
  useEffect(() => {
    if (!scaleRef.current || !cursorRef.current) return
    const x = scaleRef.current(selectedFrequencyHz)
    cursorRef.current.attr('x1', x).attr('x2', x)
  }, [selectedFrequencyHz])

  return (
    <div className="w-full overflow-hidden">
      <svg ref={svgRef} className="w-full" />
    </div>
  )
}
