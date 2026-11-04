import { zhTW, en, ko, ja } from './resources.js'

export const LOCALE_KEY = 'railway.locale.v1'
export const LOCALES = ['zh-TW', 'en', 'ja', 'ko']
const resources = { 'zh-TW': zhTW, en, ko, ja }
const listeners = new Set()
let current = 'zh-TW'
let sessionOnly = false
try { const saved = globalThis.localStorage?.getItem(LOCALE_KEY); if (LOCALES.includes(saved)) current = saved } catch { sessionOnly = true }
export const getLocale = () => current
export const getLocaleSnapshot = () => `${current}:${sessionOnly}`
export const subscribeLocale = listener => { listeners.add(listener); return () => listeners.delete(listener) }
export const isLocaleSessionOnly = () => sessionOnly
export function setLocale(locale) {
  if (!LOCALES.includes(locale)) return false
  current = locale
  try { globalThis.localStorage?.setItem(LOCALE_KEY, locale); sessionOnly = !globalThis.localStorage } catch { sessionOnly = true }
  if (globalThis.document) { document.documentElement.lang = current; document.title = t('app.title') }
  for (const listener of listeners) listener()
  return true
}
if (globalThis.addEventListener) globalThis.addEventListener('storage', event => {
  if (event.key !== LOCALE_KEY || !LOCALES.includes(event.newValue)) return
  current = event.newValue
  if (globalThis.document) { document.documentElement.lang = current; document.title = t('app.title') }
  for (const listener of listeners) listener()
})
export function t(key, values = {}, locale = current) {
  const text = resources[locale]?.[key] ?? zhTW[key]
  if (text === undefined) return zhTW['common.unavailable']
  return text.replace(/\{([a-zA-Z][\w]*)\}/g, (match, name) => values[name] == null || typeof values[name] === 'boolean' ? '' : String(values[name]))
}
export const formatNumber = (value, options = {}) => new Intl.NumberFormat(current, options).format(value)
export const formatDate = (value, options = {}) => new Intl.DateTimeFormat(current, options).format(new Date(value))
export const formatList = items => new Intl.ListFormat(current, { style: 'long', type: 'conjunction' }).format(items)
export const formatMoney = value => formatNumber(value, { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 })
// Compatibility boundary for immutable question banks and pre-existing saved messages.
// Only registered source messages are matched; no model or stored record is rewritten.
const exact = new Map(Object.entries(zhTW).map(([key, text]) => [text, key]))
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const patterns = Object.entries(zhTW).filter(([, text]) => /\{value\d+\}/.test(text)).map(([key, text]) => {
  const names = [...text.matchAll(/\{(value\d+)\}/g)].map(match => match[1])
  const parts = text.split(/\{value\d+\}/g)
  return { key, names, specificity: parts.join('').length, regex: new RegExp('^' + parts.map(escape).join('([\\s\\S]+?)') + '$', 'u') }
}).sort((a, b) => b.specificity - a.specificity)
export function localize(value, depth = 0) {
  if (Array.isArray(value)) return value.map(item => localize(item, depth + 1))
  if (typeof value === 'number' && Number.isFinite(value)) return formatNumber(value)
  if (typeof value !== 'string' || current === 'zh-TW' || depth > 4) return value
  const key = exact.get(value.trim())
  if (key) return t(key)
  for (const pattern of patterns) {
    const match = value.match(pattern.regex)
    if (match) return t(pattern.key, Object.fromEntries(pattern.names.map((name, i) => [name, localize(match[i + 1], depth + 1)])))
  }
  return value
}
export function translationCoverage(locale) {
  const missing = Object.keys(zhTW).filter(key => !Object.hasOwn(resources[locale] || {}, key))
  return { total: Object.keys(zhTW).length, translated: Object.keys(zhTW).length - missing.length, missing }
}
