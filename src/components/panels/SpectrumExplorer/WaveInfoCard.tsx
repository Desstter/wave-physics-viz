import { useAppStore } from '../../../store/appStore'
import { WAVE_TYPES } from '../../../data/waveTypes'
import { wavelength, photonEnergyEV } from '../../../physics/waveEquations'
import { formatFreq, formatWavelength, formatEnergy } from '../../../utils/formatters'
import { AlertTriangle, Zap, Radio, Shield } from 'lucide-react'

// Thermal energy at room temperature (kT at 300 K = 0.02585 eV)
const KT_ROOM_EV = 0.02585

function getEnergyContext(eV: number): string {
  if (eV < 1e-9) return `nivel de ruido cuántico — energía extremadamente baja`
  if (eV < 1e-6) return `menor que el desdoblamiento hiperfino del hidrógeno (5.9×10⁻⁶ eV)`
  if (eV < KT_ROOM_EV * 0.1) return `mucho menor que la energía térmica a temperatura ambiente (kT = 0.026 eV)`
  if (eV < KT_ROOM_EV * 2) return `comparable a la energía térmica a temperatura ambiente (kT ≈ 0.026 eV)`
  if (eV < 1.8) return `mayor que kT ambiente pero por debajo de la luz visible (1.8–3.1 eV)`
  if (eV < 12) return `rango visible/UV — puede excitar electrones pero no ionizar`
  if (eV < 1000) return `ionizante — supera la energía de enlace del electrón (H: 13.6 eV)`
  if (eV < 1e6) return `rango de rayos X duros — energía de keV`
  return `rango nuclear (MeV) — capaz de producción de pares e⁻e⁺`
}

function getWavelengthReference(lambdaM: number): string {
  if (lambdaM > 10000) return 'más largo que una ciudad entera'
  if (lambdaM > 1000) return 'escala de montañas (~10 campos de fútbol)'
  if (lambdaM > 100) return 'escala de edificios altos'
  if (lambdaM > 10) return 'escala de una manzana urbana'
  if (lambdaM > 1) return 'escala humana (1 m–10 m)'
  if (lambdaM > 0.1) return 'escala de objetos cotidianos (cm–m)'
  if (lambdaM > 1e-3) return 'escala milimétrica (insecto, gota de agua)'
  if (lambdaM > 1e-5) return 'escala microscópica (diámetro de un cabello ~70 µm)'
  if (lambdaM > 1e-7) return 'escala de células y bacterias'
  if (lambdaM > 1e-9) return 'escala de moléculas grandes y virus'
  return 'escala atómica (radio de Bohr = 0.053 nm)'
}

/** Visual ruler showing 1 wavelength relative to a 12.5 cm WiFi reference */
function WavelengthRuler({ lambdaM }: { lambdaM: number }) {
  const REF_LAMBDA = 0.125  // WiFi 2.4 GHz ≈ 12.5 cm
  const REF_PX = 50          // reference bar width in pixels
  const maxPx = 280
  const barPx = Math.max(2, Math.min(maxPx, REF_PX * (lambdaM / REF_LAMBDA)))
  const isAtMax = barPx >= maxPx - 1
  const isAtMin = barPx <= 3

  return (
    <div className="mt-3">
      <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-medium">
        Escala de longitud de onda (guía visual, no lineal)
      </div>
      <div className="relative h-5 bg-gray-800 rounded overflow-hidden">
        <div
          className="h-full rounded transition-all duration-300"
          style={{ width: `${barPx}px`, backgroundColor: '#6366f1', opacity: 0.8, maxWidth: '100%' }}
        />
        {isAtMax && (
          <span className="absolute right-2 top-0.5 text-xs text-gray-400">← mucho mayor que la pantalla</span>
        )}
      </div>
      <div className="flex justify-between text-xs text-gray-600 mt-1">
        <span>1λ = {formatWavelength(lambdaM)}</span>
        <span>{isAtMin ? 'sub-pixélico (zoom ×10⁶ requerido)' : getWavelengthReference(lambdaM)}</span>
      </div>
    </div>
  )
}

export default function WaveInfoCard() {
  const { selectedFrequencyHz, selectedWaveId } = useAppStore()
  const selectedWave = WAVE_TYPES.find(w => w.id === selectedWaveId)

  const freq = selectedWave ? selectedWave.frequencyHz : selectedFrequencyHz
  const λ = wavelength(freq)
  const eV = photonEnergyEV(freq)

  const wave = selectedWave ?? {
    label: 'Custom Frequency',
    band: '—',
    description: 'Use the spectrum bar or slider to select a wave type.',
    useCases: [],
    ionizing: eV > 12,
    penetratesWalls: 'medium' as const,
    color: '#6366f1',
    safetyNote: undefined,
    category: '—',
  }

  const energyContext = getEnergyContext(eV)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-4 h-4 rounded-full mt-1 shrink-0" style={{ backgroundColor: wave.color }} />
        <div>
          <h2 className="text-base font-bold text-white">{wave.label}</h2>
          <span className="text-xs text-gray-500">{wave.band} band · {wave.category}</span>
        </div>
      </div>

      {/* Key properties grid */}
      <div className="grid grid-cols-3 gap-3">
        <Prop label="Frecuencia" value={formatFreq(freq)} />
        <Prop label="Longitud de onda" value={formatWavelength(λ)} />
        <Prop label="Energía del fotón" value={formatEnergy(eV)} />
      </div>

      {/* Energy context */}
      <div className="bg-gray-800 rounded p-2.5 text-xs">
        <span className="text-gray-500 font-medium uppercase tracking-wide">Contexto energético: </span>
        <span className="text-gray-300">{energyContext}</span>
      </div>

      {/* Wavelength visual ruler */}
      <WavelengthRuler lambdaM={λ} />

      {/* Description */}
      <p className="text-sm text-gray-300 leading-relaxed">{wave.description}</p>

      {/* Use cases */}
      {wave.useCases.length > 0 && (
        <div>
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Radio size={12} /> Applications
          </div>
          <div className="flex flex-wrap gap-1.5">
            {wave.useCases.map(uc => (
              <span key={uc} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">{uc}</span>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {wave.ionizing && (
          <span className="flex items-center gap-1 text-xs bg-red-900/40 text-red-400 border border-red-800 px-2 py-0.5 rounded">
            <Zap size={10} /> Ionizing
          </span>
        )}
        <span className="flex items-center gap-1 text-xs bg-gray-800 text-gray-400 border border-gray-700 px-2 py-0.5 rounded">
          <Shield size={10} /> Wall penetration: {wave.penetratesWalls}
        </span>
      </div>

      {/* Safety note */}
      {wave.safetyNote && (
        <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-900/20 border border-amber-800/40 rounded p-2">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          <span>{wave.safetyNote}</span>
        </div>
      )}
    </div>
  )
}

function Prop({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800 rounded p-2.5">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm font-mono font-semibold text-white">{value}</div>
    </div>
  )
}
