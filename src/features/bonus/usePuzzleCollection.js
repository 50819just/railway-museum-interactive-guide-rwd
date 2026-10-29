import useJourney from '../arrival/useJourney'
import useBonus from './useBonus'
import { collectedPuzzleIds } from './bonusModel'

export default function usePuzzleCollection() {
  const journey = useJourney()
  const bonus = useBonus()
  const pieceIds = collectedPuzzleIds(journey.completed, bonus)
  return { journey, bonus, pieceIds, collectedCount: pieceIds.length }
}
