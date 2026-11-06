export const DRAW_TIMING = Object.freeze({ dealing: 860, returning: 420, focusing: 600, turning: 1100, revealing: 700 })
export const nextDrawPhase = phase => ({ dealing: 'choosing', returning: 'focusing', focusing: 'turning', turning: 'revealing', revealing: 'result' }[phase] || phase)
export const canChooseCard = phase => phase === 'choosing'
export const skipDrawPhase = (phase, hasResult) => hasResult ? 'result' : phase === 'dealing' ? 'choosing' : phase
