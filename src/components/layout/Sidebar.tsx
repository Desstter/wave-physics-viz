import { useAppStore } from '../../store/appStore'
import type { Section } from '../../types/simulation.types'
import { Radio, Waves, Layers3, Ruler, GitCompare, Atom } from 'lucide-react'
import clsx from 'clsx'

const NAV: Array<{ id: Section; label: string; icon: React.ReactNode; desc: string }> = [
  { id: 'simulator', label: 'Laboratorio', icon: <Waves size={17} />, desc: 'Propagación interactiva' },
  { id: 'spectrum',  label: 'Espectro',    icon: <Radio size={17} />, desc: 'De radio a rayos gamma' },
  { id: 'materials', label: 'Materiales',  icon: <Layers3 size={17} />, desc: 'Reflexión y absorción' },
  { id: 'distance',  label: 'Enlace',      icon: <Ruler size={17} />, desc: 'Distancia y potencia' },
  { id: 'compare',   label: 'Comparar',    icon: <GitCompare size={17} />, desc: 'Escenarios lado a lado' },
]

export default function Sidebar() {
  const { activeSection, setActiveSection } = useAppStore()

  return (
    <aside className="app-sidebar">
      <div className="brand-lockup">
        <div className="brand-mark"><Atom size={20} /></div>
        <div>
          <div className="brand-name">Wave Physics</div>
          <div className="brand-kicker">LABORATORIO · EM</div>
        </div>
      </div>

      <nav className="app-nav" aria-label="Secciones del laboratorio">
        {NAV.map(({ id, label, icon, desc }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={clsx('nav-item', activeSection === id && 'is-active')}
          >
            <span className="nav-icon">{icon}</span>
            <div className="nav-copy">
              <div className="nav-label">{label}</div>
              <div className="nav-desc">{desc}</div>
            </div>
          </button>
        ))}
      </nav>

      <div className="sidebar-proof">
        <span className="proof-dot" />
        <div><strong>Modelo verificable</strong><br />ITU-R P.2040 · Friis · Fresnel</div>
      </div>
    </aside>
  )
}
