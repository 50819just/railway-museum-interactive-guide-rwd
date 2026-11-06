// Isolated Chrome only; never clears the user's browser data.
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const options = { headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) }
const browser = await chromium.launch(options)
const url = process.env.ENTRY_QA_URL || 'http://127.0.0.1:5194/'
const out = process.env.ENTRY_QA_OUT || '/tmp/railway-combined-entry-qa'
await mkdir(out, { recursive: true })
const errors = []
let matrix = 0
const entryKey = 'railway.entry.v1', modeKey = 'railway.exploration-mode.v1', journeyKey = 'railway.journey-demo.v2'
const storedEntry = JSON.stringify({ version: 1, provider: 'line', party: 'solo', completed: true })
const journey = completed => JSON.stringify({ version: 2, completed })
async function setup(viewport, seed = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' })
  await context.addInitScript(() => localStorage.setItem('railway.entry-guide.v1', '1'))
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(url)
  await page.evaluate(seed => { for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v) }, seed)
  await page.reload()
  return { context, page }
}
const noOverflow = async page => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
const openSettings = async page => { await page.getByRole('button', { name: '旅程設定', exact: true }).click() }
try {
  for (const [name, viewport] of [['desktop', { width: 1440, height: 1000 }], ['mobile', { width: 390, height: 844 }], ['narrow', { width: 320, height: 740 }]]) {
    for (const provider of ['Google', 'LINE']) for (const party of ['solo', 'family']) for (const mode of ['sequential', 'free']) {
      const { context, page } = await setup(viewport)
      assert.equal(await page.locator('.app-shell').count(), 0)
      await page.getByRole('button', { name: `${provider} 模擬登入`, exact: true }).click()
      await page.reload()
      await page.waitForSelector('.entry-combined-settings')
      assert.equal(await page.locator('input[name=entry-party]').count(), 2)
      assert.equal(await page.locator('input[name=entry-mode]').count(), 2)
      assert.equal(await page.locator('.entry-image-option img').count(), 4)
      await page.locator(`input[name=entry-party][value=${party}]`).check()
      await page.locator(`input[name=entry-mode][value=${mode}]`).check()
      assert.equal(await page.evaluate(key => localStorage.getItem(key), modeKey), null, 'draft must not change mode')
      if (party === 'family') assert.match(await page.locator('.entry-family-note').innerText(), /兩人一起到場/)
      await noOverflow(page)
      if (provider === 'Google' && party === 'family' && mode === 'free') await page.screenshot({ path: `${out}/${name}-combined.png`, fullPage: true, animations: 'disabled' })
      await page.getByRole('button', { name: '確認設定', exact: true }).click()
      const dialog = page.locator('.entry-confirm-dialog[open]')
      assert.match(await dialog.innerText(), /不能切換玩法/)
      assert.match(await dialog.innerText(), /重新開始/)
      assert.match(await dialog.locator('.entry-confirm-combination').innerText(), new RegExp(`${party === 'family' ? '親子同行' : '單人探索'} × ${mode === 'free' ? '自在漫遊' : '推薦路線'}`))
      assert.equal(await page.locator('.app-shell').count(), 0, 'confirmation is mandatory')
      await page.keyboard.press('Escape')
      await page.waitForSelector('.entry-confirm-dialog', { state: 'detached' })
      assert.equal(await page.locator('input[name=entry-party]:checked').inputValue(), party)
      assert.equal(await page.locator('input[name=entry-mode]:checked').inputValue(), mode)
      await page.getByRole('button', { name: '確認設定', exact: true }).click()
      await page.waitForTimeout(250)
      if (provider === 'Google' && party === 'family' && mode === 'free') await page.screenshot({ path: `${out}/${name}-confirm.png`, animations: 'disabled' })
      await page.getByRole('button', { name: '確認設定，開始遊玩', exact: true }).click()
      await page.waitForSelector('.app-shell')
      assert.equal(await page.evaluate(key => localStorage.getItem(key), modeKey), mode)
      assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), entryKey), { version: 1, provider: provider.toLowerCase(), party, completed: true })
      await page.reload(); await page.waitForSelector('.app-shell')
      assert.equal(await page.locator('.entry-page').count(), 0)
      await context.close(); matrix++
    }
  }
  const viewport = { width: 390, height: 844 }
  // Before the first piece, edits are allowed but cancel must be non-destructive.
  {
    const { context, page } = await setup(viewport, { [entryKey]: storedEntry, [modeKey]: 'sequential', [journeyKey]: journey([]) })
    await openSettings(page)
    await page.locator('.settings-option > button').first().click()
    await page.locator('input[name=entry-party][value=family]').check(); await page.locator('input[name=entry-mode][value=free]').check()
    await page.getByRole('button', { name: '確認設定', exact: true }).click()
    await page.getByRole('button', { name: '返回修改', exact: true }).click()
    await page.getByRole('button', { name: '取消修改，返回旅程', exact: true }).click()
    assert.equal(await page.evaluate(key => localStorage.getItem(key), entryKey), storedEntry)
    assert.equal(await page.evaluate(key => localStorage.getItem(key), modeKey), 'sequential')
    await context.close()
  }
  // Both arrival pieces and bonus-only pieces lock the whole combination.
  const bonus = { version: 1, bonusPieces: [4], checks: [], generalIssued: 0, availableChances: 0, quiz: null, pendingDraw: false, drawsUsed: 1, departureAt: '2026-11-05T12:00:00+08:00', timeIssued: true, lastVisitCount: 0 }
  for (const bonusOnly of [false, true]) {
    const originalProgress = journey(bonusOnly ? [] : [1, 2])
    const seed = { [entryKey]: storedEntry, [modeKey]: 'sequential', [journeyKey]: originalProgress, 'railway.family-demo.v1': 'keep-family', 'railway.photos-marker': 'keep-photo', 'railway.redemption-marker': 'keep-receipts' }
    if (bonusOnly) seed['railway.puzzle-bonus-demo.v1'] = JSON.stringify(bonus)
    const { context, page } = await setup(viewport, seed)
    await openSettings(page)
    assert.equal(await page.locator('.settings-option > button').first().isDisabled(), true)
    await page.getByRole('button', { name: /重新開始旅程/, exact: false }).click()
    assert.equal(await page.evaluate(key => localStorage.getItem(key), journeyKey), originalProgress, 'opening reset is not consent')
    await page.getByRole('button', { name: '返回設定', exact: true }).click()
    await page.getByRole('button', { name: /重新開始旅程/, exact: false }).click()
    await page.getByRole('button', { name: '確認清除進度，重新開始', exact: true }).click()
    await page.waitForSelector('.entry-combined-settings')
    assert.equal(await page.locator('input[name=entry-mode][value=free]').isDisabled(), false)
    assert.deepEqual(JSON.parse(await page.evaluate(key => localStorage.getItem(key), journeyKey)).completed, [])
    for (const key of ['railway.family-demo.v1', 'railway.photos-marker', 'railway.redemption-marker']) assert.equal(await page.evaluate(key => localStorage.getItem(key), key), seed[key])
    await page.locator('input[name=entry-party][value=family]').check(); await page.locator('input[name=entry-mode][value=free]').check()
    await page.getByRole('button', { name: '確認設定', exact: true }).click()
    await page.getByRole('button', { name: '確認設定，開始遊玩', exact: true }).click()
    await page.waitForSelector('.app-shell')
    assert.equal(await page.evaluate(key => localStorage.getItem(key), modeKey), 'free')
    await context.close()
  }
  // A piece received in another tab while confirming must not bypass the lock.
  {
    const { context, page } = await setup(viewport, { [entryKey]: storedEntry, [modeKey]: 'sequential', [journeyKey]: journey([]) })
    await openSettings(page); await page.locator('.settings-option > button').first().click()
    await page.locator('input[name=entry-mode][value=free]').check()
    await page.getByRole('button', { name: '確認設定', exact: true }).click()
    const other = await context.newPage(); await other.goto(url)
    await other.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: journeyKey, value: journey([1]) })
    await page.getByRole('button', { name: '確認設定，開始遊玩', exact: true }).click()
    assert.match(await page.getByRole('alert').innerText(), /已開始收集拼圖/)
    assert.equal(await page.evaluate(key => localStorage.getItem(key), modeKey), 'sequential')
    await context.close()
  }
  // Real browser process restart with the same isolated profile.
  const profile = await mkdtemp(join(tmpdir(), 'railway-combined-restart-'))
  let persistent
  try {
    persistent = await chromium.launchPersistentContext(profile, options)
    await persistent.addInitScript(() => localStorage.setItem('railway.entry-guide.v1', '1'))
    let page = persistent.pages()[0]; await page.goto(url)
    await page.getByRole('button', { name: 'LINE 模擬登入', exact: true }).click()
    await page.locator('input[name=entry-party][value=family]').check(); await page.locator('input[name=entry-mode][value=free]').check()
    await page.getByRole('button', { name: '確認設定', exact: true }).click()
    await page.getByRole('button', { name: '確認設定，開始遊玩', exact: true }).click()
    await page.waitForSelector('.app-shell'); await persistent.close()
    persistent = await chromium.launchPersistentContext(profile, options)
    await persistent.addInitScript(() => localStorage.setItem('railway.entry-guide.v1', '1'))
    page = persistent.pages()[0]; await page.goto(url); await page.waitForSelector('.app-shell')
    assert.equal(await page.evaluate(key => localStorage.getItem(key), modeKey), 'free')
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).party, entryKey), 'family')
  } finally { await persistent?.close(); await rm(profile, { recursive: true, force: true }) }
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ matrix, extraCases: 5, errors, out }))
} finally { await browser.close() }
