import { launch, openScene, finishScene, moveTo, clickAt, center, wheel, settle } from './lib.mjs'

const TAKE = process.argv[2] ?? 'all'
const NAV = {
  home: /^Start$/,
  kalkulator: /^Kalkulator$/,
  dokumenty: /^Dokumenty$/,
  sprawy: /^Sprawy$/,
  zus: /^ZUS$/,
  wsparcie: /^Wsparcie$/,
  panel: /^Panel administracyjny$/,
}

async function take(name, browser, url, run) {
  const start = Date.now()
  const scene = await openScene(browser, name, { url })
  scene.name = name
  console.log(`▶ ${name}`)
  try {
    await run(scene.page, scene)
    console.log(`  ${name}: ${((Date.now() - start) / 1000).toFixed(1)}s`)
  } catch (error) {
    console.error(`✖ ${name}: ${error.message}`)
    await scene.page.screenshot({ path: `public/clips/error-${name}.png` }).catch(() => {})
    await finishScene(scene)
    throw error
  }
  await finishScene(scene)
}

/** Logowanie przez mObywatela i przejście do wskazanej strony. Ten fragment wycinamy w montażu. */
async function prep(page, target) {
  const mOby = page.getByRole('link', { name: /Zaloguj przez mObywatel/i }).first()
  await mOby.click()
  await page.waitForSelector('#identifier')
  await page.locator('#identifier').fill('anna.k')
  await page.locator('#password').fill('demo1234')
  await page.getByRole('button', { name: 'Zaloguj', exact: true }).click()
  await page.getByRole('heading', { name: /Jesteś w środku/i }).waitFor({ timeout: 15000 })
  if (target) {
    const nav = page.getByRole('navigation', { name: 'Nawigacja główna' })
    const link = target === 'panel'
      ? page.getByRole('contentinfo').getByRole('link', { name: NAV.panel })
      : nav.getByRole('link', { name: NAV[target] })
    await link.click()
    await page.waitForTimeout(1200)
  }
  // Kursor wraca na neutralne miejsce, żeby wejście w kadr zaczynało się spokojnie.
  await page.mouse.move(880, 620, { steps: 10 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(900)
}

const pick = async (page, index, value) => {
  const select = page.locator('select').nth(index)
  const box = await select.boundingBox()
  if (!box) throw new Error(`Brak listy numer ${index}`)
  await moveTo(page, box.x + box.width * 0.35, box.y + box.height / 2, { steps: 14 })
  await select.selectOption(value).catch(async () => {
    await select.evaluate((element, chosen) => {
      element.value = chosen
      element.dispatchEvent(new Event('change', { bubbles: true }))
    }, value)
  })
  await settle(page, 380)
}

const typeBox = async (page, locator, value) => {
  const point = await center(locator)
  await moveTo(page, point.x, point.y)
  await locator.click()
  await locator.fill(value)
  await settle(page, 240)
}

const browser = await launch()

if (TAKE === 'all' || TAKE === 'login') {
  await take('01-home-login', browser, '/', async (page) => {
    await settle(page, 1500)
    await moveTo(page, 700, 500, { steps: 28, settleMs: 350 })
    await moveTo(page, 760, 545, { steps: 8, settleMs: 250 })
    await clickAt(page, page.getByRole('link', { name: /Rozpocznij sprawdzenie/i }), { x: -120, y: 0 }, 1100)
    await settle(page, 500)
    await moveTo(page, 700, 520, { steps: 22 })
    await clickAt(page, page.getByRole('link', { name: /Zaloguj przez mObywatel/i }).first(), { x: -60, y: 0 }, 1500)
    await settle(page, 700)
    await page.locator('#identifier').click()
    await page.locator('#identifier').type('anna.k', { delay: 120 })
    await settle(page, 350)
    await page.locator('#password').click()
    await page.locator('#password').type('demo1234', { delay: 90 })
    await settle(page, 450)
    await clickAt(page, page.getByRole('button', { name: 'Zaloguj', exact: true }), { x: 0, y: 0 }, 1800)
    await settle(page, 900)
    await wheel(page, 110)
    await settle(page, 700)
    await moveTo(page, 560, 640, { steps: 18 })
    await clickAt(page, page.getByRole('link', { name: /Przejdź dalej/i }), { x: -40, y: 0 }, 1400)
    await settle(page, 900)
  })
}

if (TAKE === 'all' || TAKE === 'kalkulator') {
  await take('02-kalkulator', browser, '/wejscie', async (page) => {
    await prep(page, 'kalkulator')
    await settle(page, 600)
    const next = page.getByRole('button', { name: 'Dalej' })

    await pick(page, 0, 'mother')
    await clickAt(page, next, { x: 0, y: 0 }, 700)

    await pick(page, 0, 'born')
    await typeBox(page, page.locator('input[type=date]').first(), '2026-09-01')
    await typeBox(page, page.locator('input[inputmode=numeric]').first(), '1')
    await clickAt(page, next, { x: 0, y: 0 }, 700)

    await pick(page, 0, 'no')
    await clickAt(page, next, { x: 0, y: 0 }, 700)

    await pick(page, 0, 'employee')
    await pick(page, 1, 'yes')
    await typeBox(page, page.locator('input[inputmode=decimal]').first(), '8000')
    await clickAt(page, next, { x: 0, y: 0 }, 700)

    await pick(page, 0, 'employee')
    await pick(page, 1, 'yes')
    await typeBox(page, page.locator('input[inputmode=decimal]').first(), '6000')
    await clickAt(page, next, { x: 0, y: 0 }, 700)

    await clickAt(page, next, { x: 0, y: 0 }, 700)

    await pick(page, 0, 'no')
    await pick(page, 1, 'no')
    await clickAt(page, page.getByRole('button', { name: 'Sprawdź świadczenia' }), { x: 0, y: 0 }, 2400)
    await settle(page, 1800)

    await wheel(page, 380)
    await settle(page, 1000)
    await moveTo(page, 700, 560, { steps: 18 })
    await settle(page, 800)
    await wheel(page, 460)
    await settle(page, 1200)
    await moveTo(page, 700, 470, { steps: 16 })
    await settle(page, 900)
    await wheel(page, -900)
    await settle(page, 1200)
    await moveTo(page, 500, 690, { steps: 16 })
    await settle(page, 1000)

    const root = page.locator('[data-slot=slider]').first()
    const thumb = page.locator('[data-slot=slider-thumb]').first()
    const track = await root.boundingBox()
    const knob = await thumb.boundingBox()
    if (!track || !knob) throw new Error('Brak suwaka podziału urlopu')
    const y = knob.y + knob.height / 2
    await moveTo(page, knob.x + knob.width / 2, y, { steps: 14 })
    await page.mouse.down()
    await page.mouse.move(track.x + track.width * 0.3, y, { steps: 34 })
    await settle(page, 1000)
    await page.mouse.move(track.x + track.width * 0.62, y, { steps: 34 })
    await settle(page, 1500)
    await page.mouse.up()
    await settle(page, 1400)

    const docs = page.getByRole('button', { name: /Dokumenty i terminy — Zasiłek macierzyński/i })
    await docs.scrollIntoViewIfNeeded()
    await settle(page, 900)
    await clickAt(page, docs, { x: 0, y: 0 }, 1600)
    await settle(page, 900)
    await wheel(page, 420)
    await settle(page, 1500)
    await wheel(page, 300)
    await settle(page, 1300)
    await moveTo(page, 1100, 700, { steps: 14 })
    await settle(page, 1000)
    await clickAt(page, page.getByRole('button', { name: 'Zamknij okno' }), { x: 0, y: 0 }, 1000)
  })
}

if (TAKE === 'all' || TAKE === 'dokumenty') {
  await take('03-dokumenty', browser, '/wejscie', async (page) => {
    await prep(page, 'dokumenty')
    await settle(page, 800)
    await moveTo(page, 640, 500, { steps: 18 })
    await settle(page, 600)
    // Wybór świadczenia z listy
    await clickAt(page, page.locator('#document-benefit'), { x: -120, y: 0 }, 900)
    await settle(page, 600)
    const option = page.getByRole('option', { name: /ojcowski/i }).first()
    if (await option.count()) await clickAt(page, option, { x: 0, y: 0 }, 1100)
    await settle(page, 900)
    await clickAt(page, page.getByRole('button', { name: /^Dalej/ }), { x: 0, y: 0 }, 1200)
    await settle(page, 900)
    // Dopasowanie do sytuacji: tytuł ubezpieczenia
    await clickAt(page, page.locator('#document-employment'), { x: -100, y: 0 }, 900)
    await settle(page, 600)
    const employment = page.getByRole('option', { name: /Umowa o pracę/i }).first()
    if (await employment.count()) await clickAt(page, employment, { x: 0, y: 0 }, 1000)
    await settle(page, 700)
    await clickAt(page, page.getByRole('button', { name: /Pokaż dokumenty/ }), { x: 0, y: 0 }, 1600)
    await settle(page, 1100)
    await moveTo(page, 700, 520, { steps: 16 })
    await wheel(page, 380)
    await settle(page, 1300)
    // Rozwinięcie listy dokumentów
    const accordion = page.getByRole('button', { name: /Dokumenty do przygotowania/i }).first()
    if (await accordion.count()) {
      await clickAt(page, accordion, { x: -200, y: 0 }, 1100)
      await settle(page, 1200)
    }
    await wheel(page, 300)
    await settle(page, 1400)
    await moveTo(page, 780, 520, { steps: 16 })
    await settle(page, 1100)
    await wheel(page, 300)
    await settle(page, 1400)
  })
}

if (TAKE === 'all' || TAKE === 'sprawy') {
  await take('04-sprawy', browser, '/wejscie', async (page) => {
    await prep(page, 'sprawy')
    await settle(page, 800)
    await moveTo(page, 620, 520, { steps: 18 })
    await settle(page, 600)
    await clickAt(page, page.locator('li button[aria-pressed]').nth(2), { x: 60, y: 10 }, 1600)
    await settle(page, 1500)
    await wheel(page, 420)
    await settle(page, 1400)
    await moveTo(page, 780, 470, { steps: 18 })
    await settle(page, 1000)
    await wheel(page, 300)
    await settle(page, 1400)
    await moveTo(page, 900, 430, { steps: 14 })
    await settle(page, 1000)
    await wheel(page, 280)
    await settle(page, 1400)
  })
}

if (TAKE === 'all' || TAKE === 'zus') {
  await take('05-zus', browser, '/wejscie', async (page) => {
    await prep(page, 'zus')
    await settle(page, 900)
    await moveTo(page, 900, 560, { steps: 18 })
    await wheel(page, 340)
    await settle(page, 1300)
    const off = page.getByRole('button', { name: 'Bez ubezpieczenia', exact: true }).first()
    if (await off.count()) {
      await clickAt(page, off, { x: 0, y: 0 }, 1600)
      await settle(page, 1000)
      await clickAt(page, page.getByRole('button', { name: 'Ubezpieczona', exact: true }).first(), { x: 0, y: 0 }, 1500)
    }
    await wheel(page, 440)
    await settle(page, 1300)
    await moveTo(page, 720, 480, { steps: 16 })
    await settle(page, 1000)
    await wheel(page, 420)
    await settle(page, 1400)
    await moveTo(page, 760, 460, { steps: 16 })
    await settle(page, 1100)
    const pue = page.getByRole('button', { name: /Połącz z PUE\/eZUS/i })
    if (await pue.count()) {
      await pue.scrollIntoViewIfNeeded()
      await settle(page, 900)
      await clickAt(page, pue, { x: 0, y: 0 }, 1900)
      await settle(page, 1200)
    }
    await wheel(page, 420)
    await settle(page, 1500)
    await moveTo(page, 800, 470, { steps: 16 })
    await settle(page, 1300)
    await wheel(page, 380)
    await settle(page, 1500)
  })
}

if (TAKE === 'all' || TAKE === 'wsparcie') {
  await take('06-wsparcie', browser, '/wejscie', async (page) => {
    await prep(page, 'wsparcie')
    await settle(page, 800)
    await moveTo(page, 700, 450, { steps: 20 })
    await settle(page, 700)
    const card = page.getByRole('link', { name: /wcześniak/i }).first()
    await clickAt(page, card, { x: -120, y: 0 }, 1700)
    await settle(page, 1000)
    await wheel(page, 340)
    await settle(page, 1400)
    await moveTo(page, 780, 500, { steps: 16 })
    await settle(page, 1000)
    await wheel(page, 320)
    await settle(page, 1400)
    await moveTo(page, 620, 520, { steps: 14 })
    await settle(page, 1200)
  })
}

if (TAKE === 'all' || TAKE === 'panel') {
  await take('07-panel', browser, '/wejscie', async (page) => {
    await prep(page, 'panel')
    await settle(page, 900)
    await moveTo(page, 700, 500, { steps: 18 })
    const parental = page.locator('#rate-parental')
    if (await parental.count()) {
      const point = await center(parental)
      await moveTo(page, point.x, point.y)
      await parental.fill('')
      await parental.type('50', { delay: 130 })
      await settle(page, 500)
      await parental.blur()
      await settle(page, 1000)
      const save = page.getByRole('button', { name: /Zapisz/i })
      if (await save.count()) await clickAt(page, save, { x: 0, y: 0 }, 1900)
      await settle(page, 1300)
    }
    await wheel(page, 400)
    await settle(page, 1300)
    await moveTo(page, 800, 500, { steps: 16 })
    await settle(page, 1100)
    const toggle = page.getByRole('switch').first()
    if (await toggle.count()) {
      await toggle.scrollIntoViewIfNeeded()
      await settle(page, 800)
      await clickAt(page, toggle, { x: 0, y: 0 }, 1300)
      await settle(page, 1000)
      await clickAt(page, toggle, { x: 0, y: 0 }, 1300)
    }
    await wheel(page, 400)
    await settle(page, 1500)
    await moveTo(page, 900, 480, { steps: 16 })
    await settle(page, 1400)
  })
}

if (TAKE === 'all' || TAKE === 'asystent') {
  await take('08-asystent', browser, '/wejscie', async (page) => {
    await prep(page, 'home')
    await settle(page, 900)
    await wheel(page, 120)
    await settle(page, 900)
    const launcher = page.getByRole('button', { name: 'Otwórz asystenta' })
    const point = await center(launcher)
    await moveTo(page, point.x - 10, point.y, { steps: 24 })
    await settle(page, 700)
    await clickAt(page, launcher, { x: 0, y: 0 }, 1100)
    await settle(page, 800)
    await page.locator('#asystent-pytanie').click()
    await page.locator('#asystent-pytanie').type('Gdzie złożyć wniosek?', { delay: 70 })
    await settle(page, 500)
    await clickAt(page, page.getByRole('button', { name: 'Zapytaj asystenta' }), { x: 0, y: 0 }, 2400)
    await settle(page, 1800)
    await moveTo(page, 1640, 720, { steps: 14 })
    await settle(page, 1400)
    const link = page.locator('#asystent-panel a[href^="/"]').first()
    if (await link.count()) {
      const linkBox = await center(link)
      await moveTo(page, linkBox.x - 40, linkBox.y)
      await settle(page, 800)
      await clickAt(page, link, { x: 0, y: 0 }, 1700)
      await settle(page, 1000)
      await wheel(page, 280)
      await settle(page, 1400)
    }
  })
}

if (TAKE === 'all' || TAKE === 'swiadczenia') {
  await take('09-swiadczenia', browser, '/wejscie', async (page) => {
    await prep(page, null)
    await page.getByRole('link', { name: /^Świadczenia$/ }).first().click()
    await settle(page, 1200)
    await wheel(page, 260)
    await settle(page, 1100)
    await moveTo(page, 700, 520, { steps: 18 })
    await settle(page, 1000)
    await wheel(page, 280)
    await settle(page, 1300)
  })
}

await browser.close()
console.log('koniec')