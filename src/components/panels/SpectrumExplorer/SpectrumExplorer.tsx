import SectionHeader from '../../shared/SectionHeader'
import SpectrumBar from './SpectrumBar'
import FrequencySlider from './FrequencySlider'
import WaveInfoCard from './WaveInfoCard'
import WaveSelector from '../../controls/WaveSelector'
import { WAVE_TYPES } from '../../../data/waveTypes'

export default function SpectrumExplorer() {
  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        title="Electromagnetic Spectrum Explorer"
        subtitle="Click on the spectrum bar or drag the slider to explore all EM wave types from 3 Hz to 3×10²⁴ Hz"
      />

      <div className="p-6 space-y-6 overflow-y-auto">
        {/* Spectrum bar */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">
            Click anywhere to select a frequency — {WAVE_TYPES.length} wave types cataloged
          </div>
          <SpectrumBar />
          <div className="mt-4">
            <FrequencySlider />
          </div>
        </div>

        {/* Wave info + selector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <WaveInfoCard />
          </div>
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <WaveSelector />
            </div>
            {/* Quick reference table */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Quick Reference</div>
              <div className="space-y-1.5 text-xs">
                {[
                  { label: 'AM Radio', val: '530 kHz – 1.7 MHz' },
                  { label: 'FM Radio', val: '87 – 108 MHz' },
                  { label: 'WiFi 2.4G', val: '2.4 GHz' },
                  { label: 'WiFi 5G', val: '5 GHz' },
                  { label: '5G Sub-6', val: '3.5 GHz' },
                  { label: '5G mmWave', val: '28 GHz' },
                  { label: 'Visible light', val: '430 – 789 THz' },
                  { label: 'X-rays', val: '30 PHz – 30 EHz' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between">
                    <span className="text-gray-400">{r.label}</span>
                    <span className="text-gray-300 font-mono">{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Physics formulas */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Fundamental Relations</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Formula sym="λ = c / f" desc="Wavelength (m) from frequency (Hz) — c = 3×10⁸ m/s" />
            <Formula sym="E = hf" desc="Photon energy (J) — h = 6.626×10⁻³⁴ J·s (Planck)" />
            <Formula sym="c = λ · f" desc="Wave speed equals wavelength × frequency" />
          </div>
        </div>
      </div>
    </div>
  )
}

function Formula({ sym, desc }: { sym: string; desc: string }) {
  return (
    <div className="bg-gray-800 rounded p-3">
      <div className="font-mono text-indigo-300 text-sm mb-1">{sym}</div>
      <div className="text-xs text-gray-500">{desc}</div>
    </div>
  )
}
