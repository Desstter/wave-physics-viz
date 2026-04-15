import Sidebar from './Sidebar'
import { useAppStore } from '../../store/appStore'
import SpectrumExplorer from '../panels/SpectrumExplorer/SpectrumExplorer'
import PropagationSimulator from '../panels/PropagationSimulator/PropagationSimulator'
import MaterialInteraction from '../panels/MaterialInteraction/MaterialInteraction'
import DistanceCalculator from '../panels/DistanceCalculator/DistanceCalculator'
import ComparisonMode from '../panels/ComparisonMode/ComparisonMode'

export default function AppShell() {
  const { activeSection } = useAppStore()

  const sections = {
    spectrum: <SpectrumExplorer />,
    simulator: <PropagationSimulator />,
    materials: <MaterialInteraction />,
    distance: <DistanceCalculator />,
    compare: <ComparisonMode />,
  }

  return (
    <div className="flex h-full min-h-screen bg-gray-950 text-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {sections[activeSection]}
      </main>
    </div>
  )
}
