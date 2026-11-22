// Prezentacja jako plik PDF. Otwiera `index.html` w Chromium i drukuje go tą samą
// regułą @page co `Ctrl+P`, więc wynik ma dziesięć plansz 16:9, po jednej na stronę.
//
//   node do-pdf.mjs
//
// Playwright leży w `video/node_modules`, bo tam powstał film.

import { chromium } from '../video/node_modules/playwright/index.mjs'
import path from 'node:path'

const CHROME = '/home/mati/.local/share/chrome-mcp/chrome-linux64/chrome'
const HERE = import.meta.dirname
const PAGE = 'file://' + path.join(HERE, 'index.html')
const OUT = path.join(HERE, 'Skrzydla-Rodzica-prezentacja.pdf')

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--hide-scrollbars', '--force-color-profile=srgb'],
})
const page = await browser.newPage({ viewport: { width: 1300, height: 780 } })
await page.goto(PAGE, { waitUntil: 'networkidle' })
// Fonty i kadry muszą być na miejscu, inaczej pierwsza strona drukuje się z zapasowym krojem.
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(400)

// Wszystkie plansze na raz, bez podmiany klasy `is-active`, bo reguła druku i tak je pokazuje.
const slides = await page.locator('.slide').count()
await page.pdf({ path: OUT, printBackground: true, preferCSSPageSize: true })

await browser.close()
console.log(`zapisane ${OUT} ze ${slides} plansz`)
