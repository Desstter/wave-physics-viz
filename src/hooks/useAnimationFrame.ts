import { useEffect, useRef } from 'react'

export function useAnimationFrame(callback: (deltaMs: number) => void, active: boolean = true) {
  const rafId = useRef<number>(0)
  const lastTime = useRef<number>(0)
  const cb = useRef(callback)
  cb.current = callback

  useEffect(() => {
    if (!active) return
    const tick = (time: number) => {
      const delta = lastTime.current ? time - lastTime.current : 0
      lastTime.current = time
      cb.current(delta)
      rafId.current = requestAnimationFrame(tick)
    }
    rafId.current = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(rafId.current); lastTime.current = 0 }
  }, [active])
}
