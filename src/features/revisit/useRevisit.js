import { useSyncExternalStore } from 'react'
import { getRevisitSnapshot, subscribeRevisit } from './revisitStore.js'
export default function useRevisit() { return useSyncExternalStore(subscribeRevisit, getRevisitSnapshot) }
