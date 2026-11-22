// Okładka zgłoszenia jako plik 800 na 600 pikseli. Renderuje `okladka.html`,
// czyli jedną kartkę 4:3 z nazwą, zdjęciem rodziny i ekranem aplikacji.
//
//   node do-okladki.mjs
//
// Playwright leży w `video/node_modules`, bo tam powstał film.

import { chromium } from '../video/node_modules/playwright/index.mjs'
import path from 'node:path'

const CHROME = '/home/mati/.local/share/chrome-mcp/chrome-linux64/chrome'
const HERE = import.meta.dirname
const PAGE = 'file://' + path.join(HERE, 'okladka.html')
const OUT = path.join(HERE, 'assets/okladka.png')

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--hide-scrollbars', '--force-color-profile=srgb'],
})
// Jedna pikselka na piksel, żeby plik miał dokładnie 800 na 600.
const page = await browser.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 })
await page.goto(PAGE, { waitUntil: 'networkidle' })
// Krój i zdjęcia muszą być na miejscu, inaczej okładka wychodzi zapasowym krojem.
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(400)

await page.locator('.card').screenshot({ path: OUT })
await browser.close()
console.log(`zapisane ${OUT}, 800 na 600 pikseli`)
