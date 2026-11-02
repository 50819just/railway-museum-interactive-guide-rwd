import { useEffect, useState } from 'react'
import { nextGiftSlide, startGiftCarouselTimer } from './giftCarouselModel'

const motionQuery = '(prefers-reduced-motion: reduce)'
export default function useGiftCarousel(count, enabled, root) {
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [inView, setInView] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.(motionQuery).matches ?? false)
  const [hidden, setHidden] = useState(() => document.visibilityState === 'hidden')
  useEffect(() => {
    const motion = window.matchMedia?.(motionQuery)
    const visibilityChanged = () => setHidden(document.visibilityState === 'hidden')
    const motionChanged = event => setReducedMotion(event.matches)
    document.addEventListener('visibilitychange', visibilityChanged)
    motion?.addEventListener('change', motionChanged)
    const observer = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([entry]) => setInView(entry.isIntersecting)) : null
    if (root.current) observer?.observe(root.current)
    return () => {
      document.removeEventListener('visibilitychange', visibilityChanged)
      motion?.removeEventListener('change', motionChanged)
      observer?.disconnect()
    }
  }, [root])
  const paused = hovered || focused
  useEffect(() => startGiftCarouselTimer(() => setIndex(current => nextGiftSlide(current, count)), { count, paused, hovered, focused, inView, reducedMotion, hidden, enabled }), [count, paused, hovered, focused, inView, reducedMotion, hidden, enabled])
  function select(next) {
    if (!Number.isInteger(next) || next < 0 || next >= count) return
    setIndex(next)
  }
  return { index, paused, reducedMotion, select,
    interactionProps: {
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      onFocusCapture: () => setFocused(true),
      onBlurCapture: event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) },
    },
  }
}
