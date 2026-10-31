import { useSyncExternalStore } from 'react'
import { getOperationsSnapshot, subscribeOperations } from './redemptionOperationsStore.js'
export default function useRedemptionOperations() { return useSyncExternalStore(subscribeOperations, getOperationsSnapshot) }
