// Local click feedback only: never delays or changes a control's action.
const feedback = new WeakMap()
const pointerTimes = new WeakMap()
function controlFor(event) {
  const target = event.target
  const control = target.closest?.('button, .entry-image-option')
  if (!control || control.matches(':disabled') || control.querySelector('input:disabled')) return null
  return control
}
function animate(control) {
  if (!control || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !control.animate) return
  feedback.get(control)?.cancel()
  const motion = control.animate([
    { transform: 'scale(1) rotate(0deg)' },
    { transform: 'scale(.97) rotate(-1.4deg)', offset: .22 },
    { transform: 'scale(1.015) rotate(1deg)', offset: .55 },
    { transform: 'scale(1) rotate(-.35deg)', offset: .78 },
    { transform: 'scale(1) rotate(0deg)' },
  ], { duration: 280, easing: 'ease-out' })
  feedback.set(control, motion)
}
export function entryPointerFeedback(event) {
  if (event.button !== 0) return
  const control = controlFor(event)
  if (!control) return
  pointerTimes.set(control, performance.now())
  animate(control)
}
export function entryClickFeedback(event) {
  const control = controlFor(event)
  if (!control) return
  // Pointerdown starts feedback early, before navigation can replace the control.
  // Keyboard/programmatic clicks get the same feedback; radio label forwarding is deduplicated.
  if (control.matches('.entry-image-option') && event.target.tagName !== 'INPUT') return
  if (performance.now() - (pointerTimes.get(control) ?? -Infinity) < 600) {
    pointerTimes.delete(control)
    return
  }
  animate(control)
}
