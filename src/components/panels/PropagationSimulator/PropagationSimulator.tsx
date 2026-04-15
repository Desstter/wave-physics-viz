import { useState } from 'react'
import SectionHeader from '../../shared/SectionHeader'
import WaveCanvas from '../../canvas/WaveCanvas'
import WaveSelector from '../../controls/WaveSelector'
import { useSimStore } from '../../../store/simulationStore'
import { useAppStore } from '../../../store/appStore'
import { MATERIALS } from '../../../data/materials'
import { getWaveById } from '../../../data/waveTypes'
import { getMaterialById, interpolateMaterialAtFreq } from '../../../data/materials'
import { computeInteraction } from '../../../physics/materialInteraction'
import { formatPct } from '../../../utils/formatters'
import { Play, Pause, Trash2, Plus, Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'

const TX_POWER_DBM = 20  // Reference: 100 mW transmitter
const ILLUSTRATIVE_DIST_M = 10

export default function PropagationSimulator() {
  const {
    isPlaying, togglePlay, speedMultiplier, setSpeed,
    slabs, addSlab, removeSlab, clearSlabs,
    showReflection, toggleReflection,
    showTransmission, toggleTransmission,
  } = useSimStore()
  const { selectedWaveId } = useAppStore()
  const wave = getWaveById(selectedWaveId)

  const [newMaterialId, setNewMaterialId] = useState('concrete')

  function handleAddSlab() {
    const existingXs = slabs.map(s => s.x)
    let x = 0.55
    while (existingXs.some(ex => Math.abs(ex - x) < 0.12)) x += 0.12
    addSlab({ id: Date.now().toString(), materialId: newMaterialId, x: Math.min(x, 0.85), width: 0.05 })
  }

  // Compute per-slab attenuation info
  const attenuationInfo = wave ? slabs.map(slab => {
    const mat = getMaterialById(slab.materialId)
    if (!mat) return null
    const props = interpolateMaterialAtFreq(mat, wave.frequencyHz)
    return {
      label: mat.label,
      ...computeInteraction(wave.frequencyHz, props.relativePermittivity, props.conductivity, mat.thicknessM),
    }
  }).filter(Boolean) : []

  // Signal budget
  const totalMaterialLossDb = attenuationInfo.reduce((acc, info) => {
    if (!info) return acc
    return acc + (-10 * Math.log10(Math.max(info.transmittance, 1e-10)))
  }, 0)
  const fsplDb = wave
    ? 20 * Math.log10((4 * Math.PI * ILLUSTRATIVE_DIST_M * wave.frequencyHz) / 2.998e8)
    : 0
  const rxLevelDbm = TX_POWER_DBM - fsplDb - totalMaterialLossDb

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        title="Wave Propagation Simulator"
        subtitle="Visualize how waves expand from a source and interact with material barriers in real time"
        color="text-violet-400"
      />

      <div className="p-6 space-y-4 overflow-y-auto">
        {/* Canvas */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <WaveCanvas />
        </div>

        {/* Controls bar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={togglePlay}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded text-sm font-medium"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Speed:</span>
            {[0.25, 0.5, 1, 2].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={clsx(
                  'px-2 py-1 text-xs rounded',
                  speedMultiplier === s ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                )}
              >{s}×</button>
            ))}
          </div>

          <button
            onClick={toggleTransmission}
            className={clsx('flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border',
              showTransmission ? 'border-violet-600 text-violet-400 bg-violet-900/20' : 'border-gray-700 text-gray-500')}
          >
            {showTransmission ? <Eye size={12} /> : <EyeOff size={12} />} Transmitted
          </button>

          <button
            onClick={toggleReflection}
            className={clsx('flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border',
              showReflection ? 'border-blue-600 text-blue-400 bg-blue-900/20' : 'border-gray-700 text-gray-500')}
          >
            {showReflection ? <Eye size={12} /> : <EyeOff size={12} />} Reflected
          </button>

          <button
            onClick={clearSlabs}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-gray-700 text-gray-400 hover:border-red-600 hover:text-red-400"
          >
            <Trash2 size={12} /> Clear slabs
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Wave selector */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <WaveSelector />
            {wave && (
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>Frequency</span>
                  <span className="text-gray-300 font-mono">{formatFreq(wave.frequencyHz)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Wall penetration</span>
                  <span className={clsx('font-medium', {
                    'text-green-400': wave.penetratesWalls === 'high',
                    'text-yellow-400': wave.penetratesWalls === 'medium',
                    'text-orange-400': wave.penetratesWalls === 'low',
                    'text-red-400': wave.penetratesWalls === 'none',
                  })}>{wave.penetratesWalls}</span>
                </div>
              </div>
            )}
          </div>

          {/* Add slab */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Add Material</div>
            <select
              value={newMaterialId}
              onChange={e => setNewMaterialId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded px-3 py-2 mb-3"
            >
              {MATERIALS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            <button
              onClick={handleAddSlab}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-sm"
            >
              <Plus size={14} /> Add to scene
            </button>

            {/* Current slabs list */}
            {slabs.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {slabs.map(slab => {
                  const mat = getMaterialById(slab.materialId)
                  return (
                    <div key={slab.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded" style={{ backgroundColor: mat?.color }} />
                        <span className="text-gray-300">{mat?.label}</span>
                      </div>
                      <button onClick={() => removeSlab(slab.id)} className="text-gray-600 hover:text-red-400">
                        <Trash2 size={10} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Signal budget + attenuation */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Signal Budget</div>

            {/* Budget table — always visible */}
            <div className="bg-gray-800/60 rounded p-2.5 space-y-1.5 mb-3">
              <BudgetRow label="TX Power (ref)" value={`+${TX_POWER_DBM} dBm`} color="text-gray-300" />
              <BudgetRow
                label={`FSPL @ ${ILLUSTRATIVE_DIST_M} m`}
                value={wave ? `−${fsplDb.toFixed(1)} dB` : '—'}
                color="text-orange-400"
              />
              {attenuationInfo.length > 0 && (
                <BudgetRow
                  label="Material loss"
                  value={`−${totalMaterialLossDb.toFixed(1)} dB`}
                  color={totalMaterialLossDb > 30 ? 'text-red-400' : 'text-yellow-400'}
                />
              )}
              <div className="border-t border-gray-700 pt-1.5">
                <BudgetRow
                  label="RX Level"
                  value={wave ? `${rxLevelDbm.toFixed(1)} dBm` : '—'}
                  color={rxLevelDbm > -70 ? 'text-green-400' : rxLevelDbm > -90 ? 'text-yellow-400' : 'text-red-400'}
                  bold
                />
              </div>
            </div>

            {/* Per-slab attenuation bars */}
            {attenuationInfo.length === 0 ? (
              <p className="text-xs text-gray-600">Add materials to see attenuation</p>
            ) : (
              <div className="space-y-3">
                {attenuationInfo.map((info, i) => info && (
                  <div key={i}>
                    <div className="text-xs text-gray-400 mb-1">{info.label}</div>
                    <div className="space-y-1">
                      <Bar label="Reflected" val={info.reflectance} color="bg-blue-500" />
                      <Bar label="Absorbed" val={info.absorptance} color="bg-red-500" />
                      <Bar label="Transmitted" val={info.transmittance} color="bg-green-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Physics note */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-xs text-gray-500">
          <span className="text-gray-400 font-medium">Note: </span>
          Wave speed and wavelength are scaled visually for clarity. Ring amplitude decays as 1/√r (cylindrical spreading) and is attenuated by material transmission coefficients. Colors match the wave's EM band. Signal budget assumes 100 mW TX at {ILLUSTRATIVE_DIST_M} m free-space reference distance.
        </div>
      </div>
    </div>
  )
}

function BudgetRow({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={clsx('font-mono', color, bold && 'font-bold')}>{value}</span>
    </div>
  )
}

function Bar({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-500 w-16 text-right text-xs">{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${val * 100}%` }} />
      </div>
      <span className="text-gray-300 w-10 text-right font-mono text-xs">{formatPct(val)}</span>
    </div>
  )
}

function formatFreq(hz: number): string {
  if (hz < 1e6) return `${(hz / 1e3).toFixed(0)} kHz`
  if (hz < 1e9) return `${(hz / 1e6).toFixed(0)} MHz`
  if (hz < 1e12) return `${(hz / 1e9).toFixed(2)} GHz`
  return `${(hz / 1e12).toFixed(0)} THz`
}
