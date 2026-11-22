import { launch, openScene, moveTo, settle, center, BASE } from './lib.mjs'
import { writeFile } from 'node:fs/promises'

const ROUTES = [
  '/', '/wejscie', '/swiadczenia', '/kalkulator', '/dokumenty',
  '/sprawy', '/planowanie', '/urlop', '/odwolanie', '/zus', '/panel', '/wsparcie',
]

const browser = await launch()
const scene = await openScene(browser, 'inventory', { url: '/' })
const { page } = scene

// Logujemy się, bo część ekranów zależy od sesji.
await page.goto(`${BASE}/wejscie`, { waitUntil: 'networkidle' })
await page.getByRole('link', { name: /Zaloguj przez mObywatel/i }).first().click()
await page.waitForSelector('#identifier')
await page.locator('#identifier').fill('anna.k')
await page.locator('#password').fill('demo1234')
await page.getByRole('button', { name: 'Zaloguj', exact: true }).click()
await page.getByRole('heading', { name: /Jesteś w środku/i }).waitFor({ timeout: 15000 })
await settle(page, 800)

const dump = async (route) => {
  await page.goto(`${BASE}` + route, { waitUntil: 'networkidle' })
  await settle(page, 900)
  const data = await page.evaluate(() => {
    const visible = (el) => {
      const rect = el.getBoundingClientRect()
      const style = getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
      return rect.width > 4 && rect.height > 4
    }
    const label = (el) =>
      (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 90)
    const describe = (el) => ({
      id: el.id || null,
      name: el.getAttribute('name') || null,
      kind: el.tagName.toLowerCase(),
      role: el.getAttribute('role') || null,
      text: label(el),
      value: el.value ?? null,
      options: el.tagName === 'SELECT' ? [...el.options].map((o) => o.value).slice(0, 14) : null,
      box: (() => { const r = el.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] })(),
    })
    return {
      headings: [...document.querySelectorAll('h1,h2,h3')].filter(visible).map(label).slice(0, 14),
      comboboxes: [...document.querySelectorAll('[role=combobox],[data-slot=select-trigger]')].filter(visible).map(describe),
      sliders: [...document.querySelectorAll('[role=slider],[data-slot=slider]')].filter(visible).map(describe),
      switches: [...document.querySelectorAll('[role=switch],button[data-slot=switch]')].filter(visible).map(describe),
      buttons: [...document.querySelectorAll('button')].filter(visible).map(describe).slice(0, 26),
      fields: [...document.querySelectorAll('input,textarea')].filter(visible).map(describe).slice(0, 26),
    }
  })
  return { route, ...data }
}

const report = []
for (const route of ROUTES) {
  try {
    report.push(await dump(route))
  } catch (error) {
    report.push({ route, error: error.message })
  }
}

await writeFile('out/check/inventory.json', JSON.stringify(report, null, 1))
for (const entry of report) {
  console.log(`\n===== ${entry.route}${entry.error ? ' BŁĄD ' + entry.error : ''}`)
  if (entry.error) continue
  console.log('H:', entry.headings.join(' | '))
  if (entry.nativeSelects.length) console.log('SELECT:', entry.nativeSelects.map((s) => `${s.id ?? s.name}[${(s.options ?? []).join(',')}]`).join(' | '))
  if (entry.comboboxes.length) console.log('COMBO:', entry.comboboxes.map((s) => `${s.id ?? ''}"${s.text}"@${s.box[0]},${s.box[1]}`).join(' | '))
  if (entry.sliders.length) console.log('SLIDER:', entry.sliders.map((s) => `${s.id ?? ''}"${s.text}"@${s.box.join(',')}`).join(' | '))
  if (entry.switches.length) console.log('SWITCH:', entry.switches.map((s) => `"${s.text}"@${s.box[0]},${s.box[1]}`).join(' | '))
  console.log('BTN:', entry.buttons.map((b) => `${b.id ? '#' + b.id : ''}"${b.text}"@${b.box[0]},${b.box[1]}`).join(' | '))
  console.log('IN:', entry.fields.map((f) => `${f.id ? '#' + f.id : f.name}@${f.box[0]},${f.box[1]}`).join(' | '))
}

await scene.context.close()
await browser.close()
console.log('\ngotowe')
