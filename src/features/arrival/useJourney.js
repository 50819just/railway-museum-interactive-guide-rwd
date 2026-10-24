import { useSyncExternalStore } from 'react'
import { getJourneySnapshot, subscribeJourney } from './journeyStore'
export default function useJourney() { return useSyncExternalStore(subscribeJourney, getJourneySnapshot) }
