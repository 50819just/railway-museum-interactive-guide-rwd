import { useEffect, useState } from 'react'
import { nextGiftSlide, startGiftCarouselTimer } from './giftCarouselModel'

const motionQuery = '(prefers-reduced-motion: reduce)'
export default function useGiftCarousel(count, enabled, root) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [readingOverride, setReadingOverride] = useState(false)
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
  useEffect(() => startGiftCarouselTimer(() => setIndex(current => nextGiftSlide(current, count)), { count, paused, hovered: hovered && !readingOverride, focused: focused && !readingOverride, inView, reducedMotion, hidden, enabled }), [count, paused, hovered, focused, readingOverride, inView, reducedMotion, hidden, enabled])
  function select(next) {
    if (!Number.isInteger(next) || next < 0 || next >= count) return
    setIndex(next)
    setPaused(true)
    setReadingOverride(false)
  }
  function togglePlayback() {
    setPaused(!paused)
    setReadingOverride(paused)
    // Explicit Play resumes even while the control still has focus or hover.
    setFocused(false)
    setHovered(false)
  }
  return { index, paused, reducedMotion, select, togglePlayback,
    interactionProps: {
      onMouseEnter: () => { setHovered(true); setReadingOverride(false) },
      onMouseLeave: () => setHovered(false),
      onFocusCapture: event => { if (!event.target.closest('.redeem-hero-playback')) { setFocused(true); setReadingOverride(false) } },
      onBlurCapture: event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) },
    },
  }
}
