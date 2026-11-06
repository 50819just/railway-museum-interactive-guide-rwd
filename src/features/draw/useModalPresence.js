import { useEffect, useState } from 'react'
export function hasVisibleModal() {
  return [...document.querySelectorAll('dialog[open],[aria-modal="true"]')].some(node => node.getClientRects().length > 0 && !node.closest('[hidden]'))
}
export default function useModalPresence() {
  const [open,setOpen] = useState(false)
  useEffect(() => {
    const update = () => setOpen(hasVisibleModal())
    const observer = new MutationObserver(update)
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','aria-modal','hidden']})
    queueMicrotask(update)
    return () => observer.disconnect()
  },[])
  return open
}
