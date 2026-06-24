// Drives MyPathDops (Vite + React + Supabase) with Playwright Chromium.
// Usage: node driver.mjs <script.txt> [outDir]
// Script is a newline-separated list of commands (see SKILL.md for the list).
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const [, , scriptPath, outDirArg] = process.argv
if (!scriptPath) {
  console.error('usage: node driver.mjs <script.txt> [outDir]')
  process.exit(1)
}

const outDir = outDirArg || path.join(path.dirname(scriptPath), 'screenshots')
fs.mkdirSync(outDir, { recursive: true })

const lines = fs.readFileSync(scriptPath, 'utf8')
  .split('\n')
  .map(l => l.trim())
  .filter(l => l && !l.startsWith('#'))

const browser = await chromium.launch()
const page = await browser.newPage()
const consoleErrors = []
page.on('console', msg => {
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})
page.on('pageerror', err => consoleErrors.push(String(err)))

let shotIndex = 0

function splitArgs(s) {
  // splits on whitespace but keeps quoted "..." groups intact
  const out = []
  const re = /"([^"]*)"|(\S+)/g
  let m
  while ((m = re.exec(s))) out.push(m[1] !== undefined ? m[1] : m[2])
  return out
}

for (const line of lines) {
  const sp = line.indexOf(' ')
  const cmd = sp === -1 ? line : line.slice(0, sp)
  const rest = sp === -1 ? '' : line.slice(sp + 1)
  console.log('>', line)

  try {
    switch (cmd) {
      case 'nav':
        await page.goto(rest, { waitUntil: 'domcontentloaded' })
        break
      case 'wait-for': {
        const text = rest.startsWith('text=') ? rest.slice(5) : rest
        await page.getByText(text, { exact: false }).first().waitFor({ timeout: 15000 })
        break
      }
      case 'wait-selector':
        await page.waitForSelector(rest, { timeout: 15000 })
        break
      case 'click': {
        const args = splitArgs(rest)
        if (args[0] === 'text') {
          const label = args.slice(1).join(' ')
          const byRole = page.getByRole('button', { name: label, exact: false })
          if (await byRole.count() > 0) await byRole.first().click()
          else await page.getByText(label, { exact: false }).first().click()
        }
        else await page.click(rest)
        break
      }
      case 'fill': {
        const args = splitArgs(rest)
        const selector = args[0]
        const value = args.slice(1).join(' ')
        await page.fill(selector, value)
        break
      }
      case 'press':
        await page.keyboard.press(rest)
        break
      case 'sleep':
        await page.waitForTimeout(Number(rest))
        break
      case 'draw': {
        const box = await page.locator(rest).first().boundingBox()
        if (!box) throw new Error(`no bounding box for ${rest}`)
        const cx = box.x + box.width / 2
        const cy = box.y + box.height / 2
        await page.mouse.move(cx - box.width / 3, cy)
        await page.mouse.down()
        await page.mouse.move(cx, cy - box.height / 3, { steps: 5 })
        await page.mouse.move(cx + box.width / 3, cy + box.height / 3, { steps: 5 })
        await page.mouse.up()
        break
      }
      case 'dblclick':
        await page.dblclick(rest)
        break
      case 'upload': {
        const args = splitArgs(rest)
        await page.locator(args[0]).setInputFiles(args[1])
        break
      }
      case 'geo': {
        const [latStr, lngStr] = splitArgs(rest)
        const origin = new URL(page.url()).origin
        await page.context().grantPermissions(['geolocation'], { origin })
        await page.context().setGeolocation({ latitude: parseFloat(latStr), longitude: parseFloat(lngStr) })
        break
      }
      case 'screenshot': {
        const file = path.join(outDir, `${String(++shotIndex).padStart(2, '0')}-${rest || 'shot'}.png`)
        await page.screenshot({ path: file, fullPage: true })
        console.log('  saved', file)
        break
      }
      default:
        console.warn('  unknown command, skipping:', cmd)
    }
  } catch (err) {
    console.error('  ERROR on line:', line, '\n ', err.message)
  }
}

console.log('console errors:', consoleErrors.length ? consoleErrors : 'none')
await browser.close()
