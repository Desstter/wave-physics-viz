import { useEffect, useRef, useState } from 'react'

export function useCanvasSize(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 })
  const obs = useRef<ResizeObserver | null>(null)

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    obs.current = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const dpr = window.devicePixelRatio || 1
      el.width = width * dpr
      el.height = height * dpr
      const ctx = el.getContext('2d')
      if (ctx) ctx.scale(dpr, dpr)
      setSize({ w: width, h: height })
    })
    obs.current.observe(el)
    return () => obs.current?.disconnect()
  }, [canvasRef])

  return size
}
