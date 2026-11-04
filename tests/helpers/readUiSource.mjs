import { readFileSync } from 'node:fs'
import { parse } from '@babel/parser'
import { zhTW } from '../../src/i18n/resources.js'
// Resolve registered default-locale copy for existing source-structure regressions.
// Layout/action tests can inspect the same wording after it moves to a catalogue.
export function readUiSource(file, encoding = 'utf8') {
  const source = readFileSync(file, encoding)
  if (!String(file).endsWith('.jsx')) return source
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] })
  const edits = []
  const argumentSource = node => node?.type === 'CallExpression' && node.callee.name === 'localize' ? argumentSource(node.arguments[0]) : source.slice(node.start, node.end)
  function visit(node, parent) {
    if (!node || typeof node !== 'object') return
    if (node.type === 'JSXExpressionContainer' && node.expression.type === 'CallExpression' && node.expression.callee.name === 't') {
      const call = node.expression
      const text = zhTW[call.arguments[0]?.value]
      if (text !== undefined) {
        const params = Object.fromEntries((call.arguments[1]?.properties || []).map(property => [property.key.name, argumentSource(property.value)]))
        const copy = text.replace(/\{(\w+)\}/g, (token, name) => params[name] == null ? token : `{${params[name]}}`)
        edits.push({ start: node.start, end: node.end, text: parent?.type === 'JSXAttribute' ? JSON.stringify(copy) : copy })
        return
      }
    }
    if (node.type === 'CallExpression' && node.callee.name === 'localize') {
      edits.push({ start: node.start, end: node.end, text: argumentSource(node.arguments[0]) })
      return
    }
    for (const [key, value] of Object.entries(node)) {
      if (['loc', 'comments', 'extra'].includes(key)) continue
      if (Array.isArray(value)) value.forEach(child => visit(child, node))
      else if (value?.type) visit(value, node)
    }
  }
  visit(ast)
  let projected = source
  for (const edit of edits.sort((a, b) => b.start - a.start)) projected = projected.slice(0, edit.start) + edit.text + projected.slice(edit.end)
  return projected
}
