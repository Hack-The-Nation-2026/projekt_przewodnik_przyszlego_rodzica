import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

/**
 * Zrzuty ekranu do katalogu `zrzuty/` w repozytorium. Wymagania formalne
 * zadania proszą o zrzuty obok filmu, więc powstają z tej samej działającej
 * aplikacji, tylko bez kursora i nagrywania.
 *
 *   node scripts/shots.mjs            # cała lista
 *   node scripts/shots.mjs zus panel  # wybrane ekrany
 */

const CHROME = '/home/mati/.local/share/chrome-mcp/chrome-linux64/chrome'
const BASE = process.env.DEMO_BASE ?? 'http://localhost:5173'
const OUT = path.resolve(import.meta.dirname, '..', '..', 'zrzuty')

const DESKTOP = { width: 1600, height: 1000 }
const MOBILE = { width: 390, height: 844 }

const sleep = (page, ms) => page.waitForTimeout(ms)

/** Sesja żyje tylko w pamięci, więc każdy ekran logujemy osobno, bez przeładowania. */
async function login(page, route) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Zaloguj przez mObywatel/i }).first().click()
  await page.waitForSelector('#identifier')
  await page.locator('#identifier').fill('anna.k')
  await page.locator('#password').fill('demo1234')
  await page.getByRole('button', { name: 'Zaloguj', exact: true }).click()
  await page
    .getByRole('button', { name: /Menu konta|Wyloguj|Anna/i })
    .first()
    .waitFor({ timeout: 15000 })
    .catch(() => {})
  await sleep(page, 900)
}

/** Krótki wywiad, ten sam co w nagraniu, żeby wynik na ekranie był prawdziwy. */
async function quickInterview(page) {
  const select = async (name, pattern) => {
    await page.locator(`[data-field=${name}]`).click()
    await page.getByRole('option', { name: pattern }).first().click()
    await sleep(page, 120)
  }
  const fill = async (name, value) => {
    await page.locator(`[name=${name}]`).fill(value)
    await sleep(page, 120)
  }
  const next = async () => {
    await page.getByRole('button', { name: 'Dalej' }).click()
    await sleep(page, 350)
  }
  await select('role', /Matka dziecka/)
  await select('birthStage', /Dziecko już się urodziło/)
  await next()
  await fill('eventDate', '2026-09-01')
  await fill('childCount', '1')
  await next()
  await select('hospitalization', /^Nie$/)
  await next()
  await next()
  await select('employment', /Umowa o pracę/)
  await select('insured', /^Tak$/)
  await fill('basis', '8000')
  await next()
  await select('partnerEmployment', /Umowa o pracę/)
  await select('partnerInsured', /^Tak$/)
  await fill('partnerBasis', '6000')
  await next()
  await next()
  await select('sickness', /^Nie$/)
  await select('rehabilitation', /^Nie$/)
  await page.getByRole('button', { name: 'Sprawdź świadczenia' }).click()
  await page.getByText('Wynik sprawdzenia').first().waitFor({ timeout: 20000 })
  await sleep(page, 700)
}

/** Lista Radixa: klikamy w pole, potem w opcję po nazwie. */
async function pick(page, trigger, pattern) {
  await page.locator(trigger).click()
  await page.getByRole('option', { name: pattern }).first().click()
  await sleep(page, 400)
}

const SHOTS = {
  '01-start': { route: '/', gated: false },
  '02-swiadczenia': { route: '/swiadczenia', gated: false },
  '03-kalkulator-wywiad': { route: '/kalkulator', gated: true },
  '04-kalkulator-wynik': { route: '/kalkulator', gated: true, after: quickInterview },
  '05-karta-uprawnien': {
    route: '/kalkulator',
    gated: true,
    after: async (page) => {
      // Karta powstaje z wyniku, a sesja żyje w pamięci, więc liczymy wywiad
      // i przechodzimy na kartę kliknięciem, bez przeładowania strony.
      await quickInterview(page)
      await page.getByRole('button', { name: /Pobierz kartę uprawnień/i }).first().click()
      await page.waitForURL(/\/karta/)
      await sleep(page, 900)
    },
  },
  '06-dokumenty': { route: '/dokumenty', gated: true },
  '07-sprawy': {
    route: '/sprawy',
    gated: true,
    after: async (page) => {
      await pick(page, '#sample-list', /Agnieszka Wa_05/)
      await sleep(page, 600)
    },
  },
  '08-system-zus': { route: '/zus', gated: true },
  '09-urlop': { route: '/urlop', gated: true },
  '10-odwolanie': { route: '/odwolanie', gated: true },
  '11-planowanie': { route: '/planowanie', gated: true },
  '12-panel': { route: '/panel', gated: true },
  '13-asystent': {
    route: '/',
    gated: true,
    after: async (page) => {
      await page.getByRole('button', { name: /Otwórz asystenta/i }).first().click()
      await sleep(page, 900)
      await page.locator('#asystent-pytanie').fill('Gdzie złożyć wniosek o zasiłek macierzyński?')
      await sleep(page, 300)
    },
  },
  '14-wsparcie': { route: '/wsparcie', gated: true },
}

// Telefon: strona startowa zwija nagłówek do jednego przycisku, więc nie ma tam
// przycisku logowania w kadrze i zrzut nie potrzebuje sesji.
const MOBILE_SHOT = { route: '/', gated: false }

async function main() {
  await mkdir(OUT, { recursive: true })
  const wanted = process.argv.slice(2)
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--hide-scrollbars', '--force-color-profile=srgb'],
  })

  const capture = async (name, spec, viewport) => {
    const context = await browser.newContext({
      viewport,
      locale: 'pl-PL',
      timezoneId: 'Europe/Warsaw',
      reducedMotion: 'no-preference',
    })
    const page = await context.newPage()
    // Ta sama zasłona co w nagraniu: panel deweloperski kalkulatora i nakładka
    // devtoolsów nie mają wchodzić w kadr zrzutu.
    await page.addInitScript(() => {
      const style = document.createElement('style')
      style.textContent =
        '.border-fuchsia-600, .tsqd-parent-container, [data-tanstack-query-devtools] { display: none !important; }'
      const install = () => document.head && document.head.appendChild(style)
      if (document.head) install()
      else document.addEventListener('DOMContentLoaded', install, { once: true })
    })
    if (spec.gated) await login(page, spec.route)
    else {
      await page.goto(`${BASE}${spec.route}`, { waitUntil: 'networkidle' })
      await sleep(page, 700)
    }
    if (spec.after) await spec.after(page)
    await page.screenshot({ path: path.join(OUT, `${name}.png`) })
    console.log(`✓ ${name}.png`)
    await context.close()
  }

  for (const [name, spec] of Object.entries(SHOTS)) {
    if (wanted.length && !wanted.some((key) => name.includes(key))) continue
    await capture(name, spec, DESKTOP)
  }
  if (!wanted.length || wanted.includes('mobile')) {
    await capture('15-mobile-start', MOBILE_SHOT, MOBILE)
  }

  await browser.close()
}

await main()
