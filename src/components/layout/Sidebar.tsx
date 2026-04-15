import { useAppStore } from '../../store/appStore'
import type { Section } from '../../types/simulation.types'
import { Radio, Wifi, Layers, Ruler, GitCompare, Zap } from 'lucide-react'
import clsx from 'clsx'

const NAV: Array<{ id: Section; label: string; icon: React.ReactNode; desc: string }> = [
  { id: 'spectrum',  label: 'Spectrum',   icon: <Radio size={18} />,      desc: 'Full EM spectrum explorer' },
  { id: 'simulator', label: 'Simulator',  icon: <Wifi size={18} />,       desc: 'Wave propagation' },
  { id: 'materials', label: 'Materials',  icon: <Layers size={18} />,     desc: 'Wave-material interaction' },
  { id: 'distance',  label: 'Distance',   icon: <Ruler size={18} />,      desc: 'Path loss & range' },
  { id: 'compare',   label: 'Compare',    icon: <GitCompare size={18} />, desc: 'Side-by-side comparison' },
]

export default function Sidebar() {
  const { activeSection, setActiveSection } = useAppStore()

  return (
    <aside className="w-56 shrink-0 border-r border-gray-800 flex flex-col bg-gray-900 h-full min-h-screen">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-800 flex items-center gap-2">
        <Zap size={20} className="text-indigo-400" />
        <div>
          <div className="text-sm font-bold text-white leading-tight">Wave Physics</div>
          <div className="text-xs text-gray-500">EM Spectrum Visualizer</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {NAV.map(({ id, label, icon, desc }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={clsx(
              'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors',
              activeSection === id
                ? 'bg-indigo-600/20 text-indigo-300 border-r-2 border-indigo-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            )}
          >
            <span className="mt-0.5 shrink-0">{icon}</span>
            <div>
              <div className="text-sm font-medium leading-tight">{label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
            </div>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-600">
        Physics: ITU-R P.2040 · IEEE 802.11
      </div>
    </aside>
  )
}
