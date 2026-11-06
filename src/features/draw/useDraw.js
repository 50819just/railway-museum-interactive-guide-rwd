import { useEffect, useSyncExternalStore } from 'react'
import { getDrawSnapshot, subscribeDraw, refreshDraw } from './drawStore.js'
export default function useDraw() {
  const value = useSyncExternalStore(subscribeDraw, getDrawSnapshot)
  useEffect(() => { void refreshDraw() }, [])
  return value
}
