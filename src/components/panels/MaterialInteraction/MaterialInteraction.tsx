import SectionHeader from '../../shared/SectionHeader'
import WaveSelector from '../../controls/WaveSelector'
import MaterialSelector from '../../controls/MaterialSelector'
import { useAppStore } from '../../../store/appStore'
import { getWaveById } from '../../../data/waveTypes'
import { getMaterialById, interpolateMaterialAtFreq, MATERIALS } from '../../../data/materials'
import { computeInteraction, fresnelCurveData, brewsterAngle } from '../../../physics/materialInteraction'
import { refractiveIndex, waveImpedance } from '../../../physics/waveEquations'
import { formatPct, formatFreq, formatdB, formatWavelength } from '../../../utils/formatters'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ReferenceLine,
  BarChart, Bar,
} from 'recharts'

export default function MaterialInteraction() {
  const { selectedWaveId, selectedMaterialId, incidentAngleDeg, setIncidentAngleDeg } = useAppStore()
  const wave = getWaveById(selectedWaveId)
  const mat = getMaterialById(selectedMaterialId)

  const result = wave && mat ? (() => {
    const props = interpolateMaterialAtFreq(mat, wave.frequencyHz)
    const thetaRad = (incidentAngleDeg * Math.PI) / 180
    const interaction = computeInteraction(wave.frequencyHz, props.relativePermittivity, props.conductivity, mat.thicknessM, thetaRad)
    return {
      interaction,
      props,
      n: refractiveIndex(props.relativePermittivity),
      eta: waveImpedance(props.relativePermittivity),
    }
  })() : null

  const fresnelData = result ? fresnelCurveData(1, result.n) : []
  const brewsterDeg = result ? (brewsterAngle(1, result.n) * 180 / Math.PI) : 0

  const pieData = result ? [
    { name: 'Reflected', value: parseFloat((result.interaction.reflectance * 100).toFixed(1)), color: '#3b82f6' },
    { name: 'Absorbed', value: parseFloat((result.interaction.absorptance * 100).toFixed(1)), color: '#ef4444' },
    { name: 'Transmitted', value: parseFloat((result.interaction.transmittance * 100).toFixed(1)), color: '#22c55e' },
  ] : []

  // Attenuation vs frequency chart using real measured data from the material database
  const attVsFreqData = mat ? mat.frequencyData.map(pt => ({
    freqLabel: formatFreq(pt.frequencyHz),
    dbPerM: pt.attenuationDbPerMeter,
    isCurrent: wave ? Math.abs(Math.log10(pt.frequencyHz) - Math.log10(wave.frequencyHz)) < 0.3 : false,
  })) : []

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        title="Wave–Material Interaction"
        subtitle="How electromagnetic waves reflect, absorb, and transmit through different materials — Fresnel equations + Beer-Lambert law"
        color="text-amber-400"
      />

      <div className="p-6 space-y-4 overflow-y-auto">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <WaveSelector />
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <MaterialSelector />
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">
              Incident Angle: {incidentAngleDeg}°
            </label>
            <input
              type="range" min={0} max={89} step={1}
              value={incidentAngleDeg}
              onChange={e => setIncidentAngleDeg(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>0° (normal)</span>
              <span>89° (grazing)</span>
            </div>
          </div>
        </div>

        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* R/A/T Pie chart with inline labels */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Energy Distribution (R + A + T = 100%)
              </div>
              <div className="flex items-center gap-4">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        cx="50%" cy="50%"
                        outerRadius={70} innerRadius={40}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, value, name }) => {
                          if (value < 5) return null
                          const RADIAN = Math.PI / 180
                          const radius = innerRadius + (outerRadius - innerRadius) * 0.5
                          const x = cx + radius * Math.cos(-midAngle * RADIAN)
                          const y = cy + radius * Math.sin(-midAngle * RADIAN)
                          return (
                            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
                              fontSize={10} fontWeight="bold">
                              {value}%
                            </text>
                          )
                        }}
                        labelLine={false}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => `${v}%`}
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 6, fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {pieData.map(d => (
                    <div key={d.name}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-sm font-medium text-gray-200">{d.name}</span>
                      </div>
                      <div className="text-2xl font-bold font-mono" style={{ color: d.color }}>{d.value}%</div>
                      <div className="text-xs text-gray-500 mt-0.5">{formatdB(10 * Math.log10(Math.max(d.value / 100, 1e-10)))} loss</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Material properties */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Material Properties at {formatFreq(wave!.frequencyHz)}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <PropCard label="Rel. Permittivity εᵣ" value={result.props.relativePermittivity.toFixed(2)} unit="" />
                <PropCard label="Conductivity σ" value={result.props.conductivity < 1 ? result.props.conductivity.toExponential(2) : result.props.conductivity.toPrecision(3)} unit="S/m" />
                <PropCard label="Refractive Index n" value={result.n.toFixed(3)} unit="" />
                <PropCard label="Wave Impedance η" value={result.eta.toFixed(1)} unit="Ω" />
                <PropCard label="Attenuation α" value={result.interaction.attenuationCoeffPerM.toExponential(2)} unit="Np/m" />
                <PropCard label="Thickness" value={(mat!.thicknessM * 100).toFixed(1)} unit="cm" />
              </div>

              {/* Penetration depth — now shown for ALL materials (Bug 1 fix) */}
              {result.interaction.skinDepthM !== null && (
                <div className="mt-3 p-3 bg-gray-800 rounded">
                  <div className="text-xs text-gray-400 mb-1">
                    {result.props.conductivity > 1e3 ? 'Skin Depth δ (conductor)' : 'Penetration Depth (1/α)'}
                  </div>
                  <div className="font-mono text-amber-300 text-sm">
                    {formatWavelength(result.interaction.skinDepthM)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {result.props.conductivity > 1e3
                      ? 'δ = √(2ρ/ωμ) — wave amplitude falls to 1/e in this depth'
                      : '1/α — field amplitude falls to 1/e (≈ 8.7 dB) in this depth'}
                  </div>
                </div>
              )}
            </div>

            {/* Attenuation vs frequency chart (real material data) */}
            {attVsFreqData.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                  Attenuation vs. Frequency — {mat?.label}
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attVsFreqData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="freqLabel" stroke="#6b7280" fontSize={9} angle={-30} textAnchor="end" interval={0} height={40} />
                      <YAxis stroke="#6b7280" fontSize={10} unit=" dB/m" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 6, fontSize: 12 }}
                        formatter={(v) => [`${v} dB/m`, 'Attenuation']}
                      />
                      <Bar dataKey="dbPerM" radius={[3, 3, 0, 0]}>
                        {attVsFreqData.map((entry, i) => (
                          <Cell key={i} fill={entry.isCurrent ? '#f59e0b' : '#4b5563'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Amber bar = selected frequency. Higher dB/m → wave attenuated faster per meter.
                </div>
              </div>
            )}

            {/* Fresnel curve with Brewster angle marker */}
            <div className={`bg-gray-900 border border-gray-800 rounded-lg p-4 ${attVsFreqData.length > 0 ? '' : 'lg:col-span-2'}`}>
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Fresnel Reflectance vs. Incident Angle — n₁=1 (air) → n₂={result.n.toFixed(2)} ({mat?.label})
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fresnelData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="angleDeg" stroke="#6b7280" fontSize={11}
                      label={{ value: 'Angle (°)', position: 'insideBottomRight', offset: -5, style: { fill: '#6b7280', fontSize: 11 } }} />
                    <YAxis stroke="#6b7280" fontSize={11} tickFormatter={v => `${(v * 100).toFixed(0)}%`} domain={[0, 1]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 6, fontSize: 12 }}
                      formatter={(v, name) => [`${(Number(v) * 100).toFixed(1)}%`, name]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="rTE" name="TE (s-pol)" stroke="#3b82f6" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="rTM" name="TM (p-pol)" stroke="#f59e0b" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="rAvg" name="Average" stroke="#6b7280" dot={false} strokeWidth={1} strokeDasharray="4 2" />
                    {/* Brewster's angle marker — TM reflectance goes to zero here */}
                    <ReferenceLine
                      x={Math.round(brewsterDeg)}
                      stroke="#f59e0b"
                      strokeDasharray="4 2"
                      strokeOpacity={0.7}
                      label={{ value: `θ_B=${brewsterDeg.toFixed(0)}°`, position: 'top', fill: '#f59e0b', fontSize: 10 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-xs text-gray-600 mt-2">
                θ_B = arctan(n₂/n₁) = {brewsterDeg.toFixed(1)}° — at Brewster's angle, TM-polarized light has zero reflectance.
              </div>
            </div>
          </div>
        )}

        {/* Comparison table — all materials from database */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Attenuation Comparison at {wave ? formatFreq(wave.frequencyHz) : '—'} — All Materials
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-900">
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-500 py-2 pr-4">Material</th>
                  <th className="text-right text-gray-500 py-2 px-3">Reflected</th>
                  <th className="text-right text-gray-500 py-2 px-3">Absorbed</th>
                  <th className="text-right text-gray-500 py-2 px-3">Transmitted</th>
                  <th className="text-right text-gray-500 py-2 px-3">Loss (dB)</th>
                </tr>
              </thead>
              <tbody>
                {wave && MATERIALS.map(m => {
                  const matId = m.id
                  const props = interpolateMaterialAtFreq(m, wave.frequencyHz)
                  const r = computeInteraction(wave.frequencyHz, props.relativePermittivity, props.conductivity, m.thicknessM)
                  const lossDB = -10 * Math.log10(Math.max(r.transmittance, 1e-10))
                  return (
                    <tr key={matId} className={`border-b border-gray-800/50 ${matId === selectedMaterialId ? 'bg-amber-900/10' : ''}`}>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded shrink-0" style={{ backgroundColor: m.color }} />
                          <span className="text-gray-300">{m.label}</span>
                        </div>
                      </td>
                      <td className="text-right py-2 px-3 text-blue-400 font-mono">{formatPct(r.reflectance)}</td>
                      <td className="text-right py-2 px-3 text-red-400 font-mono">{formatPct(r.absorptance)}</td>
                      <td className="text-right py-2 px-3 text-green-400 font-mono">{formatPct(r.transmittance)}</td>
                      <td className="text-right py-2 px-3 text-gray-300 font-mono">{lossDB > 200 ? '>200 dB' : lossDB.toFixed(1)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Physics formulas */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Key Physics</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-800 rounded p-3">
              <div className="font-mono text-amber-300 mb-1">R = |(η₂cosθᵢ - η₁cosθₜ) / (η₂cosθᵢ + η₁cosθₜ)|²</div>
              <div className="text-gray-500">Fresnel reflectance (TE polarization)</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="font-mono text-amber-300 mb-1">I = I₀ · exp(−α · d)</div>
              <div className="text-gray-500">Beer-Lambert: intensity through thickness d with attenuation α</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="font-mono text-amber-300 mb-1">R + T + A = 1</div>
              <div className="text-gray-500">Energy conservation always holds</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="font-mono text-amber-300 mb-1">δ = 1/α (dielectrics) = √(2ρ/ωμ) (conductors)</div>
              <div className="text-gray-500">Penetration/skin depth — depth at which field amplitude falls to 1/e</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PropCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-gray-800 rounded p-2.5">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm font-mono text-white">{value} <span className="text-gray-400 text-xs">{unit}</span></div>
    </div>
  )
}
