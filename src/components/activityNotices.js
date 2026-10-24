// Journey tips only: no event, staff service, booking, or live-feed claims.
export const MARQUEE_DURATION_SECONDS = 42
export const activityNotices = [
  { id: 'guide', label: '鐵道故事', text: '跟著站點介紹，讀懂鐵道故事', target: 'explore' },
  { id: 'family', label: '親子任務', text: '親子找線索，一站集一片', target: 'explore' },
  { id: 'memory', label: '旅程合照', text: '旅程合照，把今天帶回家', target: 'photos' },
]
export function nextNoticeIndex(index) { return (index + 1) % activityNotices.length }
