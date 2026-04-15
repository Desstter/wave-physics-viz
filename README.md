# Wave Physics Visualizer

An interactive physics education tool for exploring wave behavior across different media. Built with React, TypeScript, D3, and KaTeX for real-time visualization with rendered mathematical equations.

## Overview

The app lets users explore the physics of waves interactively — adjusting parameters, comparing wave types, and seeing how waves propagate through different materials — all with live visual feedback and the corresponding equations displayed in proper mathematical notation.

## Features

### Simulation Panels

| Panel | Description |
|-------|-------------|
| **Propagation Simulator** | Real-time animation of wave propagation with adjustable frequency, amplitude, and wavelength |
| **Material Interaction** | Visualize how waves reflect, refract, and attenuate in different materials |
| **Spectrum Explorer** | Explore the electromagnetic and acoustic spectrums interactively |
| **Comparison Mode** | Display multiple wave types side by side for direct comparison |
| **Distance Calculator** | Calculate wave properties (period, velocity, energy) at any distance |

### Physics Engine

- Wave equations rendered with KaTeX
- Material interaction models (reflection, refraction, absorption)
- Multiple wave types: mechanical, electromagnetic, acoustic
- Prebuilt material library with real physical constants

## Tech Stack

- **React 19** with TypeScript
- **Vite** — build tool and dev server
- **D3.js** — canvas-based wave rendering
- **KaTeX / react-katex** — mathematical equation display
- **Recharts** — data charts
- **Tailwind CSS** — styling
- **Framer Motion** — UI animations
- **Lucide React** — icons

## Getting Started

```bash
# Clone the repo
git clone https://github.com/Desstter/wave-physics-viz.git
cd wave-physics-viz

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Lint source files |

## Project Structure

```
src/
├── components/
│   ├── canvas/         # D3-powered wave rendering components
│   ├── controls/       # Parameter control UI
│   ├── layout/         # App shell and navigation
│   ├── panels/         # Feature panels (simulator, spectrum, etc.)
│   └── shared/         # Reusable UI components
├── data/               # Materials library and wave type definitions
├── hooks/              # Custom React hooks
├── physics/            # Wave equations and material interaction models
├── store/              # State management
├── types/              # TypeScript type definitions
└── utils/              # Helper functions
```

## License

MIT
