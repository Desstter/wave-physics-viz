import SectionHeader from '../../shared/SectionHeader'
import WaveSelector from '../../controls/WaveSelector'
import WaveCanvas from '../../canvas/WaveCanvas'
import { useAppStore } from '../../../store/appStore'
import { getWaveById } from '../../../data/waveTypes'
import { fspl_dB, powerDensity, wavelength, photonEnergyEV } from '../../../physics/waveEquations'
import { formatFreq, formatWavelength, formatEnergy, formatPowerDensity } from '../../../utils/formatters'

export default function ComparisonMode() {
  const { selectedWaveId, selectedWaveId2, distanceM, powerWatts } = useAppStore()
  const wave1 = getWaveById(selectedWaveId)
  const wave2 = getWaveById(selectedWaveId2)

  const rows: Array<{ label: string; fn: (w: ReturnType<typeof getWaveById>) => string }> = [
    { label: 'Frequency', fn: w => w ? formatFreq(w.frequencyHz) : '—' },
    { label: 'Wavelength', fn: w => w ? formatWavelength(wavelength(w.frequencyHz)) : '—' },
    { label: 'Photon Energy', fn: w => w ? formatEnergy(photonEnergyEV(w.frequencyHz)) : '—' },
    { label: 'EM Band', fn: w => w?.band ?? '—' },
    { label: 'Ionizing', fn: w => w ? (w.ionizing ? 'Yes ⚠️' : 'No') : '—' },
    { label: 'Wall Penetration', fn: w => w?.penetratesWalls ?? '—' },
    { label: `FSPL at ${distanceM}m`, fn: w => w ? `${fspl_dB(distanceM, w.frequencyHz).toFixed(1)} dB` : '—' },
    { label: `Power Density at ${distanceM}m`, fn: w => w ? formatPowerDensity(powerDensity(powerWatts, distanceM)) : '—' },
  ]

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        title="Wave Comparison"
        subtitle="Side-by-side comparison of two EM wave types — behavior, properties, and path loss"
        color="text-cyan-400"
      />

      <div className="p-6 space-y-4 overflow-y-auto">
        {/* Selectors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <WaveSelector storeKey="selectedWaveId" label="Wave A" />
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <WaveSelector storeKey="selectedWaveId2" label="Wave B" />
          </div>
        </div>

        {/* Side-by-side canvas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-800 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: wave1?.color }} />
              <span className="text-sm text-gray-300">{wave1?.label}</span>
            </div>
            <WaveCanvas waveId={selectedWaveId} compact />
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-800 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: wave2?.color }} />
              <span className="text-sm text-gray-300">{wave2?.label}</span>
            </div>
            <WaveCanvas waveId={selectedWaveId2} compact />
          </div>
        </div>

        {/* Delta table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Property Comparison</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-500 py-2 pr-4 text-xs">Property</th>
                  <th className="text-right text-gray-500 py-2 px-3 text-xs">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: wave1?.color }} />
                      Wave A
                    </div>
                  </th>
                  <th className="text-right text-gray-500 py-2 px-3 text-xs">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: wave2?.color }} />
                      Wave B
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.label} className="border-b border-gray-800/50">
                    <td className="py-2 pr-4 text-gray-500 text-xs">{row.label}</td>
                    <td className="text-right py-2 px-3 font-mono text-gray-200 text-xs">{row.fn(wave1)}</td>
                    <td className="text-right py-2 px-3 font-mono text-gray-200 text-xs">{row.fn(wave2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Applications comparison */}
        <div className="grid grid-cols-2 gap-4">
          {[wave1, wave2].map((wave, i) => wave && (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: wave.color }} />
                <span className="text-xs font-medium text-gray-300">{wave.label} — Applications</span>
              </div>
              <div className="space-y-1.5">
                {wave.useCases.map(uc => (
                  <div key={uc} className="text-xs text-gray-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-gray-600 shrink-0" />
                    {uc}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-3 leading-relaxed">{wave.description.substring(0, 120)}…</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
