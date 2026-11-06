import { countRecords } from './recordsModel.js'
export const inRecordFilter = (item,filter) => filter === 'all' || (filter === 'reward' ? item.source === 'reward' : item.group === filter)
export const recordFilterCounts = items => ({ ...countRecords(items), reward: items.filter(item => item.source === 'reward').length })
