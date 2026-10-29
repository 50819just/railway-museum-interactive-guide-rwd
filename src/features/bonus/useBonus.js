import { useSyncExternalStore } from 'react'
import { getBonusSnapshot, subscribeBonus } from './bonusStore.js'

export default function useBonus() { return useSyncExternalStore(subscribeBonus, getBonusSnapshot) }
