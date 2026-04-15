import { useAppStore } from '../../store/appStore'
import { MATERIALS } from '../../data/materials'

export default function MaterialSelector() {
  const { selectedMaterialId, setSelectedMaterialId } = useAppStore()

  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Material</label>
      <select
        value={selectedMaterialId}
        onChange={(e) => setSelectedMaterialId(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
      >
        {MATERIALS.map(m => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>
      {(() => {
        const mat = MATERIALS.find(m => m.id === selectedMaterialId)
        if (!mat) return null
        return (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-3 h-3 rounded shrink-0 border border-gray-600" style={{ backgroundColor: mat.color }} />
            <span className="text-xs text-gray-500 truncate">{mat.description.split('.')[0]}</span>
          </div>
        )
      })()}
    </div>
  )
}
