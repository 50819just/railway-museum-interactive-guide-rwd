import { useSyncExternalStore } from 'react'
import { getFamilyParty, subscribeFamilyParty } from './familyExperience.js'
export default function useFamilyParty() {
  return useSyncExternalStore(subscribeFamilyParty, getFamilyParty, () => 'solo')
}
