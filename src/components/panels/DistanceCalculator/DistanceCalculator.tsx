import { useState, useMemo } from 'react'
import SectionHeader from '../../shared/SectionHeader'
import WaveSelector from '../../controls/WaveSelector'
import { useAppStore } from '../../../store/appStore'
import { getWaveById } from '../../../data/waveTypes'
import { fspl_dB, powerDensity, eFieldAmplitude } from '../../../physics/waveEquations'
import { formatFreq, formatPower, formatPowerDensity, formatDistance } from '../../../utils/formatters'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell, ReferenceLine,
} from 'recharts'

const BASE_FREQS = [2.4e9, 5e9, 28e9, 100e6]
const BASE_LABELS = ['WiFi 2.4G', 'WiFi 5G', '5G mmWave', 'FM Radio']
const BASE_COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#22c55e']

// Linear distances 0.1–100 m (101 points)
const LINEAR_DISTANCES = Array.from({ length: 101 }, (_, i) => (i === 0 ? 0.1 : i))
// Log distances 0.1–10 000 m (36 points)
const LOG_DISTANCES = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]

function buildDecayData(freqs: number[], distances: number[]) {
  return distances.map(d => {
    const point: Record<string, number> = { d }
    freqs.forEach((f, idx) => { point[`fspl_${idx}`] = fspl_dB(d, f) })
    return point
  })
}

// Power bar data — received power in dBm at standard distances
function buildPowerBarData(freqHz: number, powerWatts: number) {
  const distances = [1, 5, 10, 50, 100, 500, 1000]
  return distances.map(d => ({
    dist: formatDistance(d),
    distM: d,
    rxDbm: 10 * Math.log10(powerWatts * 1000) - fspl_dB(d, freqHz),
  }))
}

// Color bar based on typical reception thresholds
function rxDbmColor(dbm: number) {
  if (dbm > -60) return '#4ade80'   // strong
  if (dbm > -90) return '#fbbf24'   // moderate
  return '#ef4444'                   // weak/unusable
}

export default function DistanceCalculator() {
  const { selectedWaveId, distanceM, setDistanceM, powerWatts, setPowerWatts } = useAppStore()
  const wave = getWaveById(selectedWaveId)
  const [showComparisons, setShowComparisons] = useState(false)
  const [logScale, setLogScale] = useState(false)

  // Build freq list: base + current wave (deduplicated)
  const allFreqs = useMemo(() => {
    if (!wave) return BASE_FREQS
    const isDuplicate = BASE_FREQS.some(f => Math.abs(Math.log10(f) - Math.log10(wave.frequencyHz)) < 0.2)
    return isDuplicate ? BASE_FREQS : [...BASE_FREQS, wave.frequencyHz]
  }, [wave])

  const allLabels = useMemo(() => {
    if (!wave || allFreqs.length === BASE_FREQS.length) return BASE_LABELS
    return [...BASE_LABELS, wave.label]
  }, [wave, allFreqs])

  const allColors = useMemo(() => {
    if (!wave || allFreqs.length === BASE_FREQS.length) return BASE_COLORS
    return [...BASE_COLORS, wave.color]
  }, [wave, allFreqs])

  const distances = logScale ? LOG_DISTANCES : LINEAR_DISTANCES
  const decayData = useMemo(() => buildDecayData(allFreqs, distances), [allFreqs, distances])

  const fspl = wave ? fspl_dB(distanceM, wave.frequencyHz) : 0
  const S = powerDensity(powerWatts, distanceM)
  const E = eFieldAmplitude(S)
  const P_received_dBm = 10 * Math.log10(powerWatts * 1000) - fspl
  const remainingPower = powerWatts * Math.pow(10, -fspl / 10)

  const powerBarData = useMemo(
    () => wave ? buildPowerBarData(wave.frequencyHz, powerWatts) : [],
    [wave, powerWatts]
  )

  const selectedWaveIsExtra = wave && allFreqs.length > BASE_FREQS.length

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        title="Distance & Path Loss Calculator"
        subtitle="Free-space path loss (FSPL), power density, and signal strength vs. distance"
        color="text-green-400"
      />

      <div className="p-6 space-y-4 overflow-y-auto">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <WaveSelector />
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">
                Distance: {formatDistance(distanceM)}
              </label>
              <input
                type="range" min={0} max={2} step={0.01}
                value={Math.log10(distanceM)}
                onChange={e => setDistanceM(Math.pow(10, parseFloat(e.target.value)))}
                className="w-full accent-green-500"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>1 m</span><span>10 m</span><span>100 m</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">
                TX Power: {formatPower(powerWatts)}
              </label>
              <input
                type="range" min={-3} max={2} step={0.1}
                value={Math.log10(powerWatts)}
                onChange={e => setPowerWatts(Math.pow(10, parseFloat(e.target.value)))}
                className="w-full accent-green-500"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>1 mW</span><span>100 mW</span><span>100 W</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Results at {formatDistance(distanceM)}</div>
            {wave ? (
              <div className="space-y-3">
                <ResultRow label="FSPL" value={`${fspl.toFixed(1)} dB`} color="text-green-400" />
                <ResultRow label="TX Power" value={formatPower(powerWatts)} color="text-white" />
                <ResultRow label="RX Power (est.)" value={formatPower(remainingPower)} color="text-yellow-400" />
                <ResultRow label="Power Density" value={formatPowerDensity(S)} color="text-orange-400" />
                <ResultRow label="E-field" value={`${E.toPrecision(3)} V/m`} color="text-red-400" />
                <ResultRow label="RX (dBm)" value={`${P_received_dBm.toFixed(1)} dBm`} color="text-blue-400" />
              </div>
            ) : <p className="text-xs text-gray-600">Select a wave type</p>}
          </div>
        </div>

        {/* FSPL Chart — with current wave as highlighted 5th line */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Path Loss vs. Distance — Multiple Frequencies
            </div>
            <div className="flex items-center gap-2">
              {/* Log/Linear toggle */}
              <button
                onClick={() => setLogScale(v => !v)}
                className="text-xs px-2 py-1 rounded border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500"
              >
                {logScale ? 'Log scale' : 'Linear scale'}
              </button>
              <button
                onClick={() => setShowComparisons(!showComparisons)}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                {showComparisons ? 'Hide legend' : 'Show legend'}
              </button>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={decayData} margin={{ top: 5, right: 20, bottom: 15, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="d"
                  stroke="#6b7280"
                  fontSize={11}
                  scale={logScale ? 'log' : 'linear'}
                  domain={logScale ? ['auto', 'auto'] : [0, 100]}
                  tickFormatter={v => logScale && v >= 1000 ? `${v / 1000}km` : `${v}m`}
                  label={{ value: `Distance (m) — ${logScale ? 'log scale' : 'linear'}`, position: 'insideBottom', offset: -10, style: { fill: '#6b7280', fontSize: 11 } }}
                  allowDataOverflow
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  tickFormatter={v => `${v} dB`}
                  label={{ value: 'Path Loss (dB)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 11 } }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 6, fontSize: 12 }}
                  formatter={(v, name) => [`${Number(v).toFixed(1)} dB`, name]}
                  labelFormatter={d => `Distance: ${d} m`}
                />
                {showComparisons && <Legend />}
                {allFreqs.map((f, i) => {
                  const isCurrentWave = selectedWaveIsExtra && i === allFreqs.length - 1
                  return (
                    <Line
                      key={f}
                      type="monotone"
                      dataKey={`fspl_${i}`}
                      name={allLabels[i]}
                      stroke={allColors[i]}
                      dot={false}
                      strokeWidth={isCurrentWave ? 3 : 2}
                      strokeDasharray={isCurrentWave ? '6 3' : undefined}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-gray-600 mt-2 flex justify-between">
            <span>FSPL = 20·log₁₀(4π·d·f/c) — +6 dB per doubling of distance</span>
            {selectedWaveIsExtra && wave && (
              <span style={{ color: wave.color }} className="font-medium">
                — — — = {wave.label} ({formatFreq(wave.frequencyHz)})
              </span>
            )}
          </div>
        </div>

        {/* Received power bar chart */}
        {wave && powerBarData.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Received Power at Standard Distances — {formatFreq(wave.frequencyHz)}, TX={formatPower(powerWatts)}
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={powerBarData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="dist" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={10} unit=" dBm"
                    label={{ value: 'RX Power (dBm)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 10 } }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 6, fontSize: 12 }}
                    formatter={(v) => [`${Number(v).toFixed(1)} dBm`, 'Received Power']}
                  />
                  {/* Threshold reference lines */}
                  <ReferenceLine y={-60} stroke="#4ade80" strokeDasharray="3 2" strokeOpacity={0.5}
                    label={{ value: '-60 dBm', position: 'right', fill: '#4ade80', fontSize: 9 }} />
                  <ReferenceLine y={-90} stroke="#fbbf24" strokeDasharray="3 2" strokeOpacity={0.5}
                    label={{ value: '-90 dBm', position: 'right', fill: '#fbbf24', fontSize: 9 }} />
                  <Bar dataKey="rxDbm" radius={[3, 3, 0, 0]}>
                    {powerBarData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={rxDbmColor(entry.rxDbm)}
                        opacity={Math.abs(entry.distM - distanceM) < entry.distM * 0.8 ? 1 : 0.6}
                        stroke={Math.abs(entry.distM - distanceM) < entry.distM * 0.5 ? '#fff' : 'none'}
                        strokeWidth={1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-gray-600 mt-1 flex gap-4">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> {'>'} -60 dBm: strong</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> -60 to -90: usable</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> {'<'} -90 dBm: weak</span>
            </div>
          </div>
        )}

        {/* Reference table: FSPL at common distances */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            FSPL Reference Table — {wave ? formatFreq(wave.frequencyHz) : '—'}
          </div>
          {wave && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left text-gray-500 py-2 pr-4">Distance</th>
                    <th className="text-right text-gray-500 py-2 px-3">FSPL (dB)</th>
                    <th className="text-right text-gray-500 py-2 px-3">Power Density</th>
                    <th className="text-right text-gray-500 py-2 px-3">E-field (V/m)</th>
                    <th className="text-right text-gray-500 py-2 px-3">Received (dBm)</th>
                  </tr>
                </thead>
                <tbody>
                  {[0.1, 1, 5, 10, 50, 100, 500, 1000, 10000].map(d => {
                    const loss = fspl_dB(d, wave.frequencyHz)
                    const s = powerDensity(powerWatts, d)
                    const eF = eFieldAmplitude(s)
                    const rxdBm = 10 * Math.log10(powerWatts * 1000) - loss
                    return (
                      <tr key={d} className={`border-b border-gray-800/50 ${Math.abs(d - distanceM) < d * 0.1 ? 'bg-green-900/10' : ''}`}>
                        <td className="py-2 pr-4 text-gray-300 font-mono">{formatDistance(d)}</td>
                        <td className="text-right py-2 px-3 text-green-400 font-mono">{loss.toFixed(1)}</td>
                        <td className="text-right py-2 px-3 text-orange-400 font-mono">{formatPowerDensity(s)}</td>
                        <td className="text-right py-2 px-3 text-red-400 font-mono">{eF.toPrecision(3)}</td>
                        <td className="text-right py-2 px-3 text-blue-400 font-mono">{rxdBm.toFixed(1)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ResultRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-mono font-medium ${color}`}>{value}</span>
    </div>
  )
}
