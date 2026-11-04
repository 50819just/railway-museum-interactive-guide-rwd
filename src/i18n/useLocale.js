import { useSyncExternalStore } from 'react'
import { getLocale, getLocaleSnapshot, subscribeLocale } from './runtime.js'
export default function useLocale() {
  useSyncExternalStore(subscribeLocale, getLocaleSnapshot, () => 'zh-TW:false')
  return getLocale()
}
