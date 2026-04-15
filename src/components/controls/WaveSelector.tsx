import { useAppStore } from '../../store/appStore'
import { WAVE_TYPES, WAVE_CATEGORIES } from '../../data/waveTypes'

interface Props {
  storeKey?: 'selectedWaveId' | 'selectedWaveId2'
  label?: string
}

export default function WaveSelector({ storeKey = 'selectedWaveId', label = 'Wave Type' }: Props) {
  const store = useAppStore()
  const selectedId = store[storeKey]
  const setSelected = storeKey === 'selectedWaveId' ? store.setSelectedWaveId : store.setSelectedWaveId2

  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">{label}</label>
      <select
        value={selectedId}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
      >
        {WAVE_CATEGORIES.map(cat => (
          <optgroup key={cat} label={cat}>
            {WAVE_TYPES.filter(w => w.category === cat).map(w => (
              <option key={w.id} value={w.id}>{w.label}</option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* Color indicator */}
      {(() => {
        const wave = WAVE_TYPES.find(w => w.id === selectedId)
        if (!wave) return null
        return (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: wave.color }} />
            <span className="text-xs text-gray-500">{wave.band} band — {wave.frequencyRangeHz
              ? `${formatHz(wave.frequencyRangeHz[0])} – ${formatHz(wave.frequencyRangeHz[1])}`
              : formatHz(wave.frequencyHz)}</span>
          </div>
        )
      })()}
    </div>
  )
}

function formatHz(hz: number): string {
  if (hz < 1e6) return `${(hz / 1e3).toFixed(0)} kHz`
  if (hz < 1e9) return `${(hz / 1e6).toFixed(0)} MHz`
  if (hz < 1e12) return `${(hz / 1e9).toFixed(2)} GHz`
  return `${(hz / 1e12).toFixed(0)} THz`
}
