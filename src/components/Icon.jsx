const paths = {
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a17 17 0 0 1 0 18 17 17 0 0 1 0-18Z"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/></>,
  userPlus: <><circle cx="9" cy="7" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M20 8v6m-3-3h6"/></>,
  chevronDown: <path d="m6 9 6 6 6-6"/>,
  restart: <><path d="M3 11a9 9 0 1 1 2.6 7M3 4v7h7"/></>,
  logout: <><path d="M9 21H4V3h5M9 12h12m-5-5 5 5-5 5"/></>,
  gift: <><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13"/><path d="M12 8H7.5A2.5 2.5 0 1 1 10 5.5L12 8Zm0 0h4.5A2.5 2.5 0 1 0 14 5.5L12 8Z"/></>,
  device: <><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></>,

  binoculars: <><path d="m4 12 2-7h3l1 8m10-1-2-7h-3l-1 8M10 15h4M9 7h6"/><circle cx="6" cy="16" r="4"/><circle cx="18" cy="16" r="4"/></>,
  chest: <><path d="M3 11V9a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v2M3 11h18v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8ZM7 5v6m10-6v6M7 12v7m10-7v7"/><rect x="10" y="9" width="4" height="5" rx="1"/><path d="M12 11v1"/></>,
  puzzle: <path d="M9 3H4v6h1a3 3 0 1 1 0 6H4v6h6v-1a3 3 0 1 1 6 0v1h5v-6h-1a3 3 0 1 1 0-6h1V3h-6v1a3 3 0 1 1-6 0V3Z"/>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  train: <><rect x="5" y="3" width="14" height="15" rx="4"/><path d="M5 10h14M9 3v7M15 3v7M8 21l2-3m6 3-2-3"/><path d="M9 14h.01M15 14h.01"/></>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/></>,
  camera: <><path d="M8 5 10 3h4l2 2h4a1 1 0 0 1 1 1v13H3V6a1 1 0 0 1 1-1z"/><circle cx="12" cy="12" r="4"/></>,
  more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  arrow: <path d="M9 6 18 12 9 18Z" fill="currentColor" stroke="none"/>,
  back: <path d="M15 6 6 12 15 18Z" fill="currentColor" stroke="none"/>,
  up: <path d="M6 15 12 6 18 15Z" fill="currentColor" stroke="none"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/></>,
  list: <path d="M9 6h12M9 12h12M9 18h12M3 6h.01M3 12h.01M3 18h.01"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4.3 1.7c-1 .7-1.8 1.2-1.8 2.8M12 17h.01"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>,
}
export default function Icon({ name, size = 22, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" data-icon={name} {...props}>{paths[name] || paths.info}</svg>
}
