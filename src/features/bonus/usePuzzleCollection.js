import useDraw from '../draw/useDraw.js'
import { drawPieceIds } from '../draw/drawModel.js'
import useJourney from '../arrival/useJourney'
import useBonus from './useBonus'
import { collectedPuzzleIds } from './bonusModel'

export default function usePuzzleCollection() {
  const journey = useJourney()
  const bonus = useBonus()
  const draw = useDraw()
  const pieceIds = collectedPuzzleIds([...journey.completed, ...drawPieceIds(draw.state, journey.journeyId)], bonus)
  return { journey, bonus, pieceIds, collectedCount: pieceIds.length }
}
