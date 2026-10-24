// Keep Tab within intro modals, including browsers that otherwise tab into chrome.
export function trapIntroDialogTab(event) {
  if (event.key !== 'Tab' || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
  const dialog = event.currentTarget
  const candidates = [...dialog.querySelectorAll('button, a[href], input, select, textarea, summary, [tabindex]')].filter(node => node.tabIndex >= 0 && !node.disabled && node.getAttribute('aria-disabled') !== 'true' && node.getClientRects().length > 0)
  if (!candidates.length) {
    event.preventDefault()
    dialog.focus()
    return
  }
  const first = candidates[0]
  const last = candidates[candidates.length - 1]
  const current = document.activeElement
  if (!candidates.includes(current)) {
    event.preventDefault()
    ;(event.shiftKey ? last : first).focus()
  } else if (event.shiftKey && current === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && current === last) {
    event.preventDefault()
    first.focus()
  }
}
