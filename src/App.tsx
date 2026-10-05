import { useMemo, useState } from 'react'
import {
  Activity, Atom, BookOpen, ChevronRight, CirclePause, CirclePlay, FlaskConical,
  Gauge, Info, Layers3, Lightbulb, Link2, Plus, Radio, RotateCcw,
  ShieldCheck, Sparkles, Trash2, TriangleAlert, Waves,
} from 'lucide-react'
import './App.css'
import Sidebar from './components/layout/Sidebar'
import FieldCanvas from './components/lab/FieldCanvas'
import LineChart, { type ChartPoint } from './components/lab/LineChart'
import { useAppStore } from './store/appStore'
import {
  SCIENTIFIC_MATERIALS, SPECTRUM_BANDS, WAVE_PRESETS, materialById,
  type SpectrumBand, type WavePreset,
} from './science/catalog'
import {
  layerInteraction, linkBudget, materialProperties,
  photonEnergyEv, stackInteraction, wattsToDbm, wavelengthM,
  type LayerInput, type Polarization,
} from './science/engine'

type LayerState = LayerInput & { key: string }

const SECTION_COPY = {
  simulator: ['Laboratorio de propagación', 'De la fuente al receptor, con cada supuesto a la vista.'],
  spectrum: ['Atlas del espectro', 'Veintidós órdenes de magnitud en una sola escala.'],
  materials: ['Biblioteca de materiales', 'Propiedades eléctricas dependientes de la frecuencia.'],
  distance: ['Presupuesto de enlace', 'Distancia, potencia y obstáculos expresados en dB.'],
  compare: ['Comparador de ondas', 'Dos frecuencias, el mismo escenario, diferencias medibles.'],
} as const

export default function App() {
  const { activeSection } = useAppStore()
  const [frequencyHz, setFrequencyHz] = useState(2.4e9)
  const [distanceM, setDistanceM] = useState(18)
  const [powerWatts, setPowerWatts] = useState(.1)
  const [angleDeg, setAngleDeg] = useState(0)
  const [polarization, setPolarization] = useState<Polarization>('unpolarized')
  const [isPlaying, setIsPlaying] = useState(true)
  const [layers, setLayers] = useState<LayerState[]>([
    { key: 'layer-1', materialId: 'plasterboard', thicknessM: .0125 },
    { key: 'layer-2', materialId: 'concrete', thicknessM: .2 },
  ])

  const shared = { frequencyHz, setFrequencyHz, distanceM, setDistanceM, powerWatts, setPowerWatts, angleDeg, setAngleDeg, polarization, setPolarization, layers, setLayers }
  const [title, subtitle] = SECTION_COPY[activeSection]

  return (
    <div className="app-frame">
      <Sidebar />
      <main className="app-main">
        <header className="topbar">
          <div>
            <div className="eyebrow"><span /> WAVE PHYSICS · EM LAB</div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="model-chip"><ShieldCheck size={14} /> Motor determinista <span>v2.0</span></div>
        </header>

        {activeSection === 'simulator' && <LabPanel {...shared} isPlaying={isPlaying} setIsPlaying={setIsPlaying} />}
        {activeSection === 'spectrum' && <SpectrumPanel frequencyHz={frequencyHz} setFrequencyHz={setFrequencyHz} />}
        {activeSection === 'materials' && <MaterialsPanel frequencyHz={frequencyHz} setFrequencyHz={setFrequencyHz} angleDeg={angleDeg} setAngleDeg={setAngleDeg} polarization={polarization} setPolarization={setPolarization} />}
        {activeSection === 'distance' && <LinkPanel {...shared} />}
        {activeSection === 'compare' && <ComparePanel distanceM={distanceM} setDistanceM={setDistanceM} powerWatts={powerWatts} />}

        <footer className="site-footer">
          <div><Atom size={15} /> Wave Physics</div>
          <p>Modelo educativo determinista. No sustituye una medición de campo ni una simulación FDTD.</p>
          <div className="footer-links"><a href="https://www.itu.int/rec/R-REC-P.2040/en" target="_blank" rel="noreferrer">ITU‑R P.2040</a><a href="https://www.nist.gov/image/electromagnetic-spectrum-graphic" target="_blank" rel="noreferrer">NIST</a></div>
        </footer>
      </main>
    </div>
  )
}

interface SharedControls {
  frequencyHz: number
  setFrequencyHz: (value: number) => void
  distanceM: number
  setDistanceM: (value: number) => void
  powerWatts: number
  setPowerWatts: (value: number) => void
  angleDeg: number
  setAngleDeg: (value: number) => void
  polarization: Polarization
  setPolarization: (value: Polarization) => void
  layers: LayerState[]
  setLayers: React.Dispatch<React.SetStateAction<LayerState[]>>
}

function LabPanel(props: SharedControls & { isPlaying: boolean; setIsPlaying: (value: boolean) => void }) {
  const { frequencyHz, setFrequencyHz, distanceM, setDistanceM, powerWatts, setPowerWatts, angleDeg, setAngleDeg, polarization, setPolarization, layers, setLayers, isPlaying, setIsPlaying } = props
  const stack = useMemo(() => stackInteraction(frequencyHz, layers, angleDeg, polarization), [angleDeg, frequencyHz, layers, polarization])
  const budget = linkBudget(powerWatts, distanceM, frequencyHz, stack.lossDb)
  const preset = nearestPreset(frequencyHz)
  const λ = wavelengthM(frequencyHz)

  const reset = () => {
    setFrequencyHz(2.4e9); setDistanceM(18); setPowerWatts(.1); setAngleDeg(0); setPolarization('unpolarized')
    setLayers([{ key: crypto.randomUUID(), materialId: 'plasterboard', thicknessM: .0125 }, { key: crypto.randomUUID(), materialId: 'concrete', thicknessM: .2 }])
  }

  return (
    <div className="page-content lab-page">
      <section className="hero-lab panel">
        <div className="panel-heading">
          <div><span className="panel-index">01</span><h2>Campo propagado</h2><p>Geometría TX–RX a escala. La oscilación está comprimida para poder verla.</p></div>
          <div className="canvas-actions">
            <button className="icon-button" onClick={() => setIsPlaying(!isPlaying)} aria-label={isPlaying ? 'Pausar animación' : 'Reanudar animación'}>{isPlaying ? <CirclePause size={17} /> : <CirclePlay size={17} />}</button>
            <button className="icon-button" onClick={reset} aria-label="Restablecer escenario"><RotateCcw size={16} /></button>
          </div>
        </div>
        <div className="canvas-wrap">
          <FieldCanvas frequencyHz={frequencyHz} distanceM={distanceM} layers={layers} isPlaying={isPlaying} powerWatts={powerWatts} angleDeg={angleDeg} />
          <div className="canvas-badge"><span className={isPlaying ? 'live-dot' : 'pause-dot'} /> {isPlaying ? 'TIEMPO COMPRIMIDO' : 'PAUSADO'}</div>
          <div className="scale-disclosure">La distancia sí está a escala; λ y el espesor se amplían para inspección.</div>
        </div>
      </section>

      <div className="metric-strip">
        <Metric icon={<Waves size={16} />} label="Longitud de onda" value={formatLength(λ)} note={`${(distanceM / λ).toLocaleString('es-CO', { maximumFractionDigits: 0 })} λ en el trayecto`} />
        <Metric icon={<Gauge size={16} />} label="Pérdida espacio libre" value={`${budget.freeSpaceLossDb.toFixed(2)} dB`} note={budget.farFieldRuleOfThumb ? 'Antenas isotrópicas · criterio ≥ 10λ' : '⚠ distancia < 10λ · usa con cautela'} />
        <Metric icon={<Layers3 size={16} />} label="Pérdida en obstáculos" value={`${stack.lossDb.toFixed(2)} dB`} note={`${layers.length} ${layers.length === 1 ? 'capa' : 'capas'} · modelo incoherente`} />
        <Metric icon={<Radio size={16} />} label="Potencia recibida" value={formatDbm(budget.receivedDbm)} note={`${formatPower(budget.receivedWatts)} en RX`} accent />
      </div>

      <div className="workbench-grid">
        <section className="panel controls-panel">
          <div className="panel-heading compact"><div><span className="panel-index">02</span><h2>Variables del experimento</h2></div></div>
          <div className="control-grid">
            <Control label="Frecuencia" value={formatFrequency(frequencyHz)} detail={preset.name}>
              <input type="range" min={6} max={11} step={.002} value={Math.log10(frequencyHz)} onChange={(e) => setFrequencyHz(10 ** Number(e.target.value))} />
              <PresetRail value={frequencyHz} onChange={setFrequencyHz} />
            </Control>
            <Control label="Distancia TX—RX" value={formatLength(distanceM)} detail={`vuelo: ${formatTime(budget.flightTimeS)}`}>
              <input type="range" min={Math.log10(.5)} max={Math.log10(1000)} step={.002} value={Math.log10(distanceM)} onChange={(e) => setDistanceM(10 ** Number(e.target.value))} />
              <MinMax min="0.5 m" max="1 km" />
            </Control>
            <Control label="Potencia transmitida" value={formatPower(powerWatts)} detail={`${wattsToDbm(powerWatts).toFixed(1)} dBm`}>
              <input type="range" min={-4} max={1} step={.01} value={Math.log10(powerWatts)} onChange={(e) => setPowerWatts(10 ** Number(e.target.value))} />
              <MinMax min="0.1 mW" max="10 W" />
            </Control>
            <Control label="Ángulo de incidencia" value={`${angleDeg.toFixed(0)}°`} detail={`polarización ${polarization === 'unpolarized' ? 'promedio' : polarization}`}>
              <input type="range" min={0} max={75} step={1} value={angleDeg} onChange={(e) => setAngleDeg(Number(e.target.value))} />
              <div className="segmented compact-segmented">
                {(['unpolarized', 'TE', 'TM'] as Polarization[]).map((value) => <button key={value} className={polarization === value ? 'active' : ''} onClick={() => setPolarization(value)}>{value === 'unpolarized' ? 'Promedio' : value}</button>)}
              </div>
            </Control>
          </div>
        </section>

        <section className="panel layers-panel">
          <div className="panel-heading compact"><div><span className="panel-index">03</span><h2>Objetos en la trayectoria</h2></div><button className="text-button" disabled={layers.length >= 4} onClick={() => setLayers((current) => [...current, { key: crypto.randomUUID(), materialId: 'brick', thicknessM: .1 }])}><Plus size={14} /> Añadir</button></div>
          <div className="layers-list">
            {layers.length === 0 && <div className="empty-layer"><Sparkles size={18} /> Propagación en espacio libre. Añade una capa para observar reflexión y absorción.</div>}
            {layers.map((layer, index) => {
              const material = materialById(layer.materialId)
              const result = stack.details[index]?.result
              return (
                <div className="layer-row" key={layer.key}>
                  <span className="layer-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="material-swatch" style={{ background: material.color }} />
                  <select value={layer.materialId} onChange={(e) => setLayers((current) => current.map((item) => item.key === layer.key ? { ...item, materialId: e.target.value, thicknessM: materialById(e.target.value).defaultThicknessM } : item))}>
                    {SCIENTIFIC_MATERIALS.filter((item) => item.id !== 'air').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                  <label className="thickness-input"><input type="number" min="0.0001" max="2" step="0.001" value={Number(layer.thicknessM.toPrecision(4))} onChange={(e) => setLayers((current) => current.map((item) => item.key === layer.key ? { ...item, thicknessM: Math.max(.0001, Number(e.target.value)) } : item))} /><span>m</span></label>
                  <span className="layer-loss">{result ? `${result.lossDb.toFixed(1)} dB` : '—'}</span>
                  <button className="remove-button" onClick={() => setLayers((current) => current.filter((item) => item.key !== layer.key))} aria-label={`Quitar ${material.name}`}><Trash2 size={14} /></button>
                </div>
              )
            })}
          </div>
          <div className="energy-balance">
            <div><span>Potencia que atraviesa toda la pila</span><strong>{formatPercent(stack.transmission)}</strong></div>
            <div className="energy-bar"><span style={{ width: `${Math.max(.4, stack.transmission * 100)}%` }} /></div>
          </div>
        </section>
      </div>

      <section className="explain-grid">
        <article className="lesson-card lime"><div className="lesson-icon"><BookOpen size={18} /></div><div><span>IDEA CLAVE</span><h3>Una onda no “pierde velocidad” por estar más lejos.</h3><p>En espacio libre su frente se expande: la potencia se reparte sobre un área mayor. La frecuencia permanece igual; disminuyen densidad de potencia y amplitud del campo.</p></div></article>
        <article className="lesson-card"><div className="lesson-icon"><FlaskConical size={18} /></div><div><span>QUÉ RESUELVE EL MOTOR</span><h3>Fresnel en las superficies + pérdidas dentro del material.</h3><p>La atenuación de potencia usa e<sup>−2αd</sup>. El factor 2 importa: α describe amplitud de campo, no potencia.</p></div></article>
        {!stack.inValidatedRange && <article className="lesson-card warning"><div className="lesson-icon"><TriangleAlert size={18} /></div><div><span>FUERA DEL RANGO MEDIDO</span><h3>Alguna capa está extrapolando datos.</h3><p>Ajusta la frecuencia o revisa el rango de validez. El resultado continúa para exploración, pero se marca como extrapolado.</p></div></article>}
      </section>
    </div>
  )
}

function SpectrumPanel({ frequencyHz, setFrequencyHz }: { frequencyHz: number; setFrequencyHz: (value: number) => void }) {
  const minLog = Math.log10(3), maxLog = Math.log10(3e22)
  const band = SPECTRUM_BANDS.find((item) => frequencyHz >= item.minHz && frequencyHz < item.maxHz) ?? SPECTRUM_BANDS[SPECTRUM_BANDS.length - 1]
  const λ = wavelengthM(frequencyHz), energy = photonEnergyEv(frequencyHz)
  const cursor = (Math.log10(frequencyHz) - minLog) / (maxLog - minLog) * 100
  return (
    <div className="page-content spectrum-page">
      <section className="spectrum-hero panel">
        <div className="spectrum-kicker"><Activity size={15} /> POSICIÓN ACTUAL</div>
        <div className="spectrum-readout"><div><span>Frecuencia</span><strong>{formatFrequency(frequencyHz)}</strong></div><div><span>Longitud de onda</span><strong>{formatLength(λ)}</strong></div><div><span>Energía por fotón</span><strong>{formatEnergy(energy)}</strong></div></div>
        <div className="spectrum-track-wrap">
          <div className="spectrum-track">
            {SPECTRUM_BANDS.map((item) => {
              const width = (Math.log10(item.maxHz) - Math.log10(item.minHz)) / (maxLog - minLog) * 100
              return <button key={item.id} className={item.id === band.id ? 'active' : ''} style={{ width: `${width}%`, '--band': item.color } as React.CSSProperties} onClick={() => setFrequencyHz(Math.sqrt(item.minHz * item.maxHz))}><span>{item.name}</span></button>
            })}
            <i className="spectrum-cursor" style={{ left: `${Math.max(0, Math.min(100, cursor))}%` }} />
          </div>
          <input aria-label="Frecuencia en escala logarítmica" type="range" min={minLog} max={maxLog} step={.002} value={Math.log10(frequencyHz)} onChange={(e) => setFrequencyHz(10 ** Number(e.target.value))} />
          <MinMax min="3 Hz" max="30 ZHz" />
        </div>
      </section>

      <div className="spectrum-layout">
        <section className="panel band-catalog">
          <div className="panel-heading compact"><div><span className="panel-index">BANDAS</span><h2>Mapa conceptual</h2></div></div>
          {SPECTRUM_BANDS.map((item) => <BandRow key={item.id} band={item} active={item.id === band.id} onSelect={() => setFrequencyHz(Math.sqrt(item.minHz * item.maxHz))} />)}
        </section>
        <aside className="spectrum-insight">
          <div className="fact-card" style={{ '--fact': band.color } as React.CSSProperties}><Lightbulb size={19} /><span>DATO PARA RECORDAR</span><h3>{band.name}</h3><p>{band.fact}</p></div>
          <div className="equation-card"><span>RELACIONES FUNDAMENTALES</span><div><strong>λ = c / f</strong><p>Frecuencia más alta → longitud de onda más corta.</p></div><div><strong>E = h · f</strong><p>La energía por fotón crece linealmente con la frecuencia.</p></div><div><strong>c = 299 792 458 m/s</strong><p>Valor exacto de la velocidad de la luz en vacío.</p></div></div>
        </aside>
      </div>

      <section className="panel presets-table">
        <div className="panel-heading compact"><div><span className="panel-index">REFERENCIAS</span><h2>Tecnologías cotidianas</h2></div></div>
        <div className="preset-grid">{WAVE_PRESETS.map((preset) => <button key={preset.id} className={Math.abs(Math.log10(preset.frequencyHz / frequencyHz)) < .03 ? 'active' : ''} onClick={() => setFrequencyHz(preset.frequencyHz)}><span style={{ background: preset.color }} /><div><strong>{preset.name}</strong><small>{preset.example}</small></div><b>{formatFrequency(preset.frequencyHz)}</b><ChevronRight size={14} /></button>)}</div>
      </section>
    </div>
  )
}

function MaterialsPanel({ frequencyHz, setFrequencyHz, angleDeg, setAngleDeg, polarization, setPolarization }: Pick<SharedControls, 'frequencyHz' | 'setFrequencyHz' | 'angleDeg' | 'setAngleDeg' | 'polarization' | 'setPolarization'>) {
  const [selectedId, setSelectedId] = useState('concrete')
  const [thicknessM, setThicknessM] = useState(.2)
  const material = materialById(selectedId)
  const result = layerInteraction(frequencyHz, material, thicknessM, angleDeg, polarization)
  const props = materialProperties(material, frequencyHz)
  const points: ChartPoint[] = Array.from({ length: 100 }, (_, index) => {
    const min = Math.log10(material.minGHz * 1e9), max = Math.log10(material.maxGHz * 1e9)
    const f = 10 ** (min + (max - min) * index / 99)
    return { x: f, y: layerInteraction(f, material, thicknessM, angleDeg, polarization).lossDb }
  })

  return (
    <div className="page-content materials-page">
      <div className="material-layout">
        <section className="panel material-library">
          <div className="panel-heading compact"><div><span className="panel-index">CATÁLOGO</span><h2>Modelos ITU</h2><p>Parámetros medidos y ajustados por clase de material.</p></div></div>
          <div className="material-card-list">{SCIENTIFIC_MATERIALS.filter((item) => item.id !== 'air').map((item) => <button key={item.id} className={selectedId === item.id ? 'active' : ''} onClick={() => { setSelectedId(item.id); setThicknessM(item.defaultThicknessM); if (frequencyHz / 1e9 < item.minGHz || frequencyHz / 1e9 > item.maxGHz) setFrequencyHz(Math.sqrt(item.minGHz * item.maxGHz) * 1e9) }}><span className="material-swatch large" style={{ background: item.color }} /><div><strong>{item.name}</strong><small>{item.category} · {item.minGHz}–{item.maxGHz} GHz</small></div><ChevronRight size={15} /></button>)}</div>
        </section>

        <div className="material-detail">
          <section className="panel material-result">
            <div className="material-title"><div className="material-orb" style={{ background: material.color }} /><div><span>{material.category.toUpperCase()}</span><h2>{material.name}</h2><p>{material.context}</p></div><div className={`validity ${result.inValidatedRange ? 'valid' : 'invalid'}`}>{result.inValidatedRange ? <ShieldCheck size={13} /> : <TriangleAlert size={13} />}{result.inValidatedRange ? 'Dentro del rango' : 'Extrapolado'}</div></div>
            <div className="rta-grid"><EnergyStat label="Reflejada" value={result.reflectance} color="#9a8cff" /><EnergyStat label="Transmitida" value={result.transmittance} color="#d5ff5f" /><EnergyStat label="Absorbida" value={result.absorptance} color="#ff806b" /></div>
            <div className="rta-bar"><span style={{ width: `${result.reflectance * 100}%`, background: '#9a8cff' }} /><span style={{ width: `${result.transmittance * 100}%`, background: '#d5ff5f' }} /><span style={{ width: `${result.absorptance * 100}%`, background: '#ff806b' }} /></div>
            <div className="material-numbers"><div><span>ε′ relativa</span><strong>{props.epsilonR.toFixed(3)}</strong></div><div><span>Conductividad</span><strong>{formatConductivity(props.conductivitySm)}</strong></div><div><span>Profundidad 1/e</span><strong>{result.penetrationDepthM ? formatLength(result.penetrationDepthM) : '∞'}</strong></div><div><span>Pérdida de inserción</span><strong>{result.lossDb.toFixed(2)} dB</strong></div></div>
          </section>

          <section className="panel material-controls">
            <Control label="Frecuencia" value={formatFrequency(frequencyHz)} detail={`válido ${material.minGHz}–${material.maxGHz} GHz`}><input type="range" min={6} max={11} step={.002} value={Math.log10(frequencyHz)} onChange={(e) => setFrequencyHz(10 ** Number(e.target.value))} /><MinMax min="1 MHz" max="100 GHz" /></Control>
            <Control label="Espesor" value={formatLength(thicknessM)} detail={`trayectoria ${formatLength(thicknessM / Math.cos(result.refractedAngleDeg * Math.PI / 180))}`}><input type="range" min={-3} max={Math.log10(.5)} step={.002} value={Math.log10(thicknessM)} onChange={(e) => setThicknessM(10 ** Number(e.target.value))} /><MinMax min="1 mm" max="50 cm" /></Control>
            <Control label="Incidencia" value={`${angleDeg.toFixed(0)}° → ${result.refractedAngleDeg.toFixed(1)}°`} detail="Snell sobre la parte real de ε"><input type="range" min={0} max={75} step={1} value={angleDeg} onChange={(e) => setAngleDeg(Number(e.target.value))} /><div className="segmented compact-segmented">{(['unpolarized', 'TE', 'TM'] as Polarization[]).map((value) => <button key={value} className={polarization === value ? 'active' : ''} onClick={() => setPolarization(value)}>{value === 'unpolarized' ? 'Promedio' : value}</button>)}</div></Control>
          </section>

          <section className="panel chart-panel"><div className="panel-heading compact"><div><span className="panel-index">CURVA</span><h2>Pérdida frente a frecuencia</h2><p>{formatLength(thicknessM)} de {material.name.toLowerCase()} · incidencia {angleDeg}°</p></div></div><LineChart points={points} xLabel="frecuencia" yLabel="pérdida (dB)" xLog markerX={frequencyHz} xFormatter={formatFrequencyShort} yFormatter={(v) => `${v.toFixed(v < 10 ? 1 : 0)}`} /></section>
        </div>
      </div>

      <article className="method-note"><Info size={18} /><div><strong>Por qué estos resultados son más honestos</strong><p>El modelo usa ε′r y σ dependientes de la frecuencia de ITU‑R P.2040. Trata cada objeto como una placa homogénea de caras paralelas y suma reflexiones internas de forma incoherente. No inventa precisión para humedad, rugosidad, varillas, juntas o recubrimientos que no se especificaron.</p></div></article>
    </div>
  )
}

function LinkPanel(props: SharedControls) {
  const { frequencyHz, setFrequencyHz, distanceM, setDistanceM, powerWatts, setPowerWatts, angleDeg, polarization, layers } = props
  const stack = stackInteraction(frequencyHz, layers, angleDeg, polarization)
  const budget = linkBudget(powerWatts, distanceM, frequencyHz, stack.lossDb)
  const points: ChartPoint[] = Array.from({ length: 120 }, (_, index) => {
    const d = 10 ** (Math.log10(.5) + (Math.log10(2000) - Math.log10(.5)) * index / 119)
    return { x: d, y: linkBudget(powerWatts, d, frequencyHz, stack.lossDb).receivedDbm }
  })
  const thresholds = [{ name: 'Excelente', value: -50 }, { name: 'Útil', value: -67 }, { name: 'Débil', value: -80 }]
  return (
    <div className="page-content link-page">
      <div className="link-grid">
        <section className="panel link-chart-panel"><div className="panel-heading"><div><span className="panel-index">CURVA DE ALCANCE</span><h2>Potencia recibida vs. distancia</h2><p>Escala logarítmica · antenas isotrópicas · mismas capas del laboratorio</p></div><div className="current-rx"><span>RX ACTUAL</span><strong>{formatDbm(budget.receivedDbm)}</strong></div></div><LineChart points={points} xLabel="distancia" yLabel="dBm" color="#5fe3ff" xLog markerX={distanceM} xFormatter={formatLengthShort} yFormatter={(v) => v.toFixed(0)} /><div className="thresholds">{thresholds.map((item) => <span key={item.name}><i />{item.name} ≳ {item.value} dBm</span>)}</div></section>
        <aside className="panel link-controls"><div className="panel-heading compact"><div><span className="panel-index">ESCENARIO</span><h2>Ajustes</h2></div></div><Control label="Distancia" value={formatLength(distanceM)} detail={formatTime(budget.flightTimeS)}><input type="range" min={Math.log10(.5)} max={Math.log10(2000)} step={.002} value={Math.log10(distanceM)} onChange={(e) => setDistanceM(10 ** Number(e.target.value))} /><MinMax min="0.5 m" max="2 km" /></Control><Control label="Frecuencia" value={formatFrequency(frequencyHz)} detail={nearestPreset(frequencyHz).name}><input type="range" min={6} max={11} step={.002} value={Math.log10(frequencyHz)} onChange={(e) => setFrequencyHz(10 ** Number(e.target.value))} /><MinMax min="1 MHz" max="100 GHz" /></Control><Control label="Potencia TX" value={formatPower(powerWatts)} detail={`${wattsToDbm(powerWatts).toFixed(1)} dBm`}><input type="range" min={-4} max={1} step={.01} value={Math.log10(powerWatts)} onChange={(e) => setPowerWatts(10 ** Number(e.target.value))} /><MinMax min="0.1 mW" max="10 W" /></Control></aside>
      </div>

      <section className="panel budget-panel"><div className="panel-heading compact"><div><span className="panel-index">CONTABILIDAD EN dB</span><h2>Presupuesto del enlace</h2></div></div><div className="budget-flow"><BudgetStep label="Potencia TX" value={`+${budget.transmitDbm.toFixed(1)} dBm`} amount={1} /><ChevronRight size={17} /><BudgetStep label="Espacio libre" value={`−${budget.freeSpaceLossDb.toFixed(1)} dB`} amount={.72} negative /><ChevronRight size={17} /><BudgetStep label="Materiales" value={`−${budget.obstacleLossDb.toFixed(1)} dB`} amount={.46} negative /><ChevronRight size={17} /><BudgetStep label="Potencia RX" value={formatDbm(budget.receivedDbm)} amount={.28} final /></div></section>

      <div className="link-facts"><article><Gauge size={18} /><span>Densidad de potencia</span><strong>{formatDensity(budget.powerDensityWm2)}</strong><p>Cae como 1/r² para una fuente isotrópica.</p></article><article><Waves size={18} /><span>Campo eléctrico RMS</span><strong>{formatField(budget.electricFieldVm)}</strong><p>{budget.farFieldRuleOfThumb ? 'Criterio educativo de campo lejano ≥ 10λ cumplido.' : 'Distancia menor que 10λ: la aproximación de Friis pierde fiabilidad.'}</p></article><article><Link2 size={18} /><span>Supuesto de antena</span><strong>0 dBi / 0 dBi</strong><p>Sin ganancia, cableado ni margen de desvanecimiento.</p></article></div>
    </div>
  )
}

function ComparePanel({ distanceM, setDistanceM, powerWatts }: { distanceM: number; setDistanceM: (value: number) => void; powerWatts: number }) {
  const [aId, setAId] = useState('wifi24'), [bId, setBId] = useState('mmwave')
  const a = WAVE_PRESETS.find((item) => item.id === aId) ?? WAVE_PRESETS[0]
  const b = WAVE_PRESETS.find((item) => item.id === bId) ?? WAVE_PRESETS[1]
  const wall = materialById('concrete')
  const scenario = (wave: WavePreset) => {
    const interaction = layerInteraction(wave.frequencyHz, wall, .2)
    const budget = linkBudget(powerWatts, distanceM, wave.frequencyHz, interaction.lossDb)
    return { wave, interaction, budget, λ: wavelengthM(wave.frequencyHz), energy: photonEnergyEv(wave.frequencyHz) }
  }
  const left = scenario(a), right = scenario(b)
  const delta = right.budget.receivedDbm - left.budget.receivedDbm
  return (
    <div className="page-content compare-page">
      <section className="compare-intro"><div><span>ESCENARIO COMÚN</span><h2>{formatLength(distanceM)} · {formatPower(powerWatts)} · muro de concreto de 20 cm</h2></div><label><span>Distancia</span><input type="range" min={Math.log10(.5)} max={Math.log10(1000)} step={.002} value={Math.log10(distanceM)} onChange={(e) => setDistanceM(10 ** Number(e.target.value))} /><b>{formatLength(distanceM)}</b></label></section>
      <div className="compare-selects"><WaveChoice label="ONDA A" value={aId} onChange={setAId} accent={a.color} /><div className="versus">VS</div><WaveChoice label="ONDA B" value={bId} onChange={setBId} accent={b.color} /></div>
      <section className="panel compare-table">
        <CompareHeader left={a} right={b} />
        <CompareRow label="Frecuencia" a={formatFrequency(left.wave.frequencyHz)} b={formatFrequency(right.wave.frequencyHz)} />
        <CompareRow label="Longitud de onda" a={formatLength(left.λ)} b={formatLength(right.λ)} winner={left.λ > right.λ ? 'a' : 'b'} note="Una λ mayor suele favorecer difracción alrededor de objetos." />
        <CompareRow label={`Pérdida libre a ${formatLength(distanceM)}`} a={`${left.budget.freeSpaceLossDb.toFixed(2)} dB`} b={`${right.budget.freeSpaceLossDb.toFixed(2)} dB`} winner={left.budget.freeSpaceLossDb < right.budget.freeSpaceLossDb ? 'a' : 'b'} />
        <CompareRow label="Concreto · 20 cm" a={`${left.interaction.lossDb.toFixed(2)} dB`} b={`${right.interaction.lossDb.toFixed(2)} dB`} winner={left.interaction.lossDb < right.interaction.lossDb ? 'a' : 'b'} />
        <CompareRow label="Potencia recibida" a={formatDbm(left.budget.receivedDbm)} b={formatDbm(right.budget.receivedDbm)} winner={left.budget.receivedDbm > right.budget.receivedDbm ? 'a' : 'b'} highlight />
        <CompareRow label="Energía por fotón" a={formatEnergy(left.energy)} b={formatEnergy(right.energy)} />
        <CompareRow label="Tiempo de vuelo" a={formatTime(left.budget.flightTimeS)} b={formatTime(right.budget.flightTimeS)} note="La frecuencia no cambia la velocidad en vacío." />
      </section>
      <article className="compare-verdict"><div className="verdict-mark">Δ</div><div><span>RESULTADO DEL ESCENARIO</span><h3>{Math.abs(delta).toFixed(1)} dB de diferencia en el receptor</h3><p>{delta < 0 ? a.name : b.name} entrega mayor potencia en este enlace idealizado. La comparación a igual potencia y antenas isotrópicas separa el efecto de frecuencia y material; una antena real puede cambiar el balance.</p></div></article>
    </div>
  )
}

function Metric({ icon, label, value, note, accent = false }: { icon: React.ReactNode; label: string; value: string; note: string; accent?: boolean }) { return <div className={`metric ${accent ? 'accent' : ''}`}><div className="metric-label">{icon}{label}</div><strong>{value}</strong><small>{note}</small></div> }
function Control({ label, value, detail, children }: { label: string; value: string; detail: string; children: React.ReactNode }) { return <div className="control"><div className="control-head"><label>{label}</label><strong>{value}</strong></div><div className="control-detail">{detail}</div>{children}</div> }
function MinMax({ min, max }: { min: string; max: string }) { return <div className="minmax"><span>{min}</span><span>{max}</span></div> }
function PresetRail({ value, onChange }: { value: number; onChange: (value: number) => void }) { return <div className="preset-rail">{WAVE_PRESETS.filter((item) => item.id === 'am' || item.id === 'wifi24' || item.id === 'xradar' || item.id === 'mmwave').map((item) => <button key={item.id} className={Math.abs(Math.log10(item.frequencyHz / value)) < .03 ? 'active' : ''} onClick={() => onChange(item.frequencyHz)}>{item.name.replace('Radio ', '').replace('Wi‑Fi ', '')}</button>)}</div> }
function EnergyStat({ label, value, color }: { label: string; value: number; color: string }) { return <div><span style={{ color }}>{label}</span><strong>{formatPercent(value)}</strong><small>{(value * 100).toFixed(3)} %</small></div> }
function BandRow({ band, active, onSelect }: { band: SpectrumBand; active: boolean; onSelect: () => void }) { return <button className={`band-row ${active ? 'active' : ''}`} onClick={onSelect}><span className="band-pip" style={{ background: band.color }} /><div><strong>{band.name}</strong><small>{band.range}</small></div><ChevronRight size={15} /></button> }
function BudgetStep({ label, value, amount, negative = false, final = false }: { label: string; value: string; amount: number; negative?: boolean; final?: boolean }) { return <div className={`budget-step ${negative ? 'negative' : ''} ${final ? 'final' : ''}`}><div className="budget-meter"><span style={{ height: `${20 + amount * 65}%` }} /></div><span>{label}</span><strong>{value}</strong></div> }
function WaveChoice({ label, value, onChange, accent }: { label: string; value: string; onChange: (value: string) => void; accent: string }) { return <label className="wave-choice" style={{ '--wave-accent': accent } as React.CSSProperties}><span>{label}</span><select value={value} onChange={(e) => onChange(e.target.value)}>{WAVE_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select><i /></label> }
function CompareHeader({ left, right }: { left: WavePreset; right: WavePreset }) { return <div className="compare-header"><span>MAGNITUD</span><div><i style={{ background: left.color }} /><strong>{left.name}</strong><small>{left.family}</small></div><div><i style={{ background: right.color }} /><strong>{right.name}</strong><small>{right.family}</small></div></div> }
function CompareRow({ label, a, b, winner, note, highlight = false }: { label: string; a: string; b: string; winner?: 'a' | 'b'; note?: string; highlight?: boolean }) { return <div className={`compare-row ${highlight ? 'highlight' : ''}`}><div><span>{label}</span>{note && <small>{note}</small>}</div><strong className={winner === 'a' ? 'winner' : ''}>{a}{winner === 'a' && <Sparkles size={11} />}</strong><strong className={winner === 'b' ? 'winner' : ''}>{b}{winner === 'b' && <Sparkles size={11} />}</strong></div> }

function nearestPreset(frequencyHz: number) { return WAVE_PRESETS.reduce((best, item) => Math.abs(Math.log10(item.frequencyHz / frequencyHz)) < Math.abs(Math.log10(best.frequencyHz / frequencyHz)) ? item : best) }
function formatFrequency(value: number) { if (value >= 1e21) return `${(value / 1e21).toFixed(3)} ZHz`; if (value >= 1e18) return `${(value / 1e18).toFixed(3)} EHz`; if (value >= 1e15) return `${(value / 1e15).toFixed(3)} PHz`; if (value >= 1e12) return `${(value / 1e12).toFixed(3)} THz`; if (value >= 1e9) return `${(value / 1e9).toFixed(3)} GHz`; if (value >= 1e6) return `${(value / 1e6).toFixed(3)} MHz`; if (value >= 1e3) return `${(value / 1e3).toFixed(3)} kHz`; return `${value.toFixed(2)} Hz` }
function formatFrequencyShort(value: number) { if (value >= 1e9) return `${(value / 1e9).toFixed(0)}G`; if (value >= 1e6) return `${(value / 1e6).toFixed(0)}M`; return `${(value / 1e3).toFixed(0)}k` }
function formatLength(value: number) { if (value >= 1000) return `${(value / 1000).toFixed(2)} km`; if (value >= 1) return `${value.toFixed(value < 10 ? 3 : 2)} m`; if (value >= .01) return `${(value * 100).toFixed(2)} cm`; if (value >= 1e-3) return `${(value * 1e3).toFixed(2)} mm`; if (value >= 1e-6) return `${(value * 1e6).toFixed(2)} µm`; if (value >= 1e-9) return `${(value * 1e9).toFixed(2)} nm`; if (value >= 1e-12) return `${(value * 1e12).toFixed(2)} pm`; return value.toExponential(2) + ' m' }
function formatLengthShort(value: number) { if (value >= 1000) return `${(value / 1000).toFixed(0)}k`; if (value >= 1) return `${value.toFixed(value < 10 ? 1 : 0)}`; return `${(value * 100).toFixed(0)}c` }
function formatEnergy(value: number) { if (value >= 1e6) return `${(value / 1e6).toFixed(3)} MeV`; if (value >= 1e3) return `${(value / 1e3).toFixed(3)} keV`; if (value >= 1) return `${value.toFixed(3)} eV`; if (value >= 1e-3) return `${(value * 1e3).toFixed(3)} meV`; return `${value.toExponential(3)} eV` }
function formatPower(value: number) { if (value >= 1) return `${value.toFixed(2)} W`; if (value >= 1e-3) return `${(value * 1e3).toFixed(2)} mW`; if (value >= 1e-6) return `${(value * 1e6).toFixed(2)} µW`; if (value >= 1e-9) return `${(value * 1e9).toFixed(2)} nW`; if (value >= 1e-12) return `${(value * 1e12).toFixed(2)} pW`; return `${value.toExponential(2)} W` }
function formatDbm(value: number) { return `${value >= 0 ? '+' : ''}${value.toFixed(2)} dBm` }
function formatTime(value: number) { if (value >= 1e-3) return `${(value * 1e3).toFixed(3)} ms`; if (value >= 1e-6) return `${(value * 1e6).toFixed(3)} µs`; return `${(value * 1e9).toFixed(2)} ns` }
function formatPercent(value: number) { if (value >= .001) return `${(value * 100).toFixed(value < .1 ? 2 : 1)}%`; if (value <= 0) return '0%'; return `${(value * 100).toExponential(2)}%` }
function formatConductivity(value: number) { if (value >= 1e6) return `${(value / 1e6).toFixed(2)} MS/m`; if (value >= 1e3) return `${(value / 1e3).toFixed(2)} kS/m`; return `${value.toPrecision(4)} S/m` }
function formatDensity(value: number) { if (value >= 1) return `${value.toFixed(3)} W/m²`; if (value >= 1e-3) return `${(value * 1e3).toFixed(3)} mW/m²`; return `${(value * 1e6).toFixed(3)} µW/m²` }
function formatField(value: number) { if (value >= 1) return `${value.toFixed(3)} V/m`; if (value >= 1e-3) return `${(value * 1e3).toFixed(3)} mV/m`; return `${(value * 1e6).toFixed(3)} µV/m` }
