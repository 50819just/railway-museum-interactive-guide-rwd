import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { APP_VERSION, RELEASE_DATE, RELEASE_BASE_COMMIT } from '../src/data/release.js'

test('package, lock, visible version and release notes use the same semantic version', () => {
  const root = new URL('../', import.meta.url)
  const read = path => readFileSync(new URL(path, root), 'utf8')
  const pkg = JSON.parse(read('package.json'))
  const lock = JSON.parse(read('package-lock.json'))
  assert.match(APP_VERSION, /^\d+\.\d+\.\d+$/)
  assert.equal(pkg.version, APP_VERSION)
  assert.equal(lock.version, APP_VERSION)
  assert.equal(lock.packages[''].version, APP_VERSION)
  assert.ok(read('CHANGELOG.md').includes(`## v${APP_VERSION}`))
  assert.ok(read(`docs/releases/v${APP_VERSION}.md`).includes(RELEASE_DATE))
  assert.ok(read('src/features/more/MorePage.jsx').includes('V{APP_VERSION}'))
  assert.match(RELEASE_BASE_COMMIT, /^[a-f0-9]{40}$/)
})
