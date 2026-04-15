import { useAppStore } from '../../../store/appStore'
import { formatFreq } from '../../../utils/formatters'
import { WAVE_TYPES } from '../../../data/waveTypes'

const LOG_MIN = Math.log10(3)         // 3 Hz
const LOG_MAX = Math.log10(3e24)      // 3×10²⁴ Hz

export default function FrequencySlider() {
  const { selectedFrequencyHz, setSelectedFrequencyHz, setSelectedWaveId } = useAppStore()
  const logVal = Math.log10(selectedFrequencyHz)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const logF = parseFloat(e.target.value)
    const freq = Math.pow(10, logF)
    setSelectedFrequencyHz(freq)
    // Snap to nearest wave type if within 0.5 decades
    const closest = WAVE_TYPES.reduce((a, b) =>
      Math.abs(Math.log10(b.frequencyHz) - logF) <
      Math.abs(Math.log10(a.frequencyHz) - logF) ? b : a
    )
    if (Math.abs(Math.log10(closest.frequencyHz) - logF) < 0.3) {
      setSelectedWaveId(closest.id)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Frequency</label>
        <span className="text-sm font-mono text-indigo-300">{formatFreq(selectedFrequencyHz)}</span>
      </div>
      <input
        type="range"
        min={LOG_MIN}
        max={LOG_MAX}
        step={0.01}
        value={logVal}
        onChange={handleChange}
        className="w-full accent-indigo-500 cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-600">
        <span>3 Hz</span>
        <span>kHz</span>
        <span>MHz</span>
        <span>GHz</span>
        <span>THz</span>
        <span>3×10²⁴ Hz</span>
      </div>
    </div>
  )
}
