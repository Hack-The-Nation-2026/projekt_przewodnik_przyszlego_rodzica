import {
  launch, openScene, finishScene, moveTo, clickAt, center, ensureVisible, settle, typeInto, typeDate,
  scrollPage, scrollBy, reveal, scrollToTop, openSelect, dragSlider,
  login, navigate, cursor, BASE,
} from './lib.mjs'
import { writeFile } from 'node:fs/promises'

const TAKE = process.argv[2] ?? 'all'

/** Znaczniki czasu: montaż bierze z nich początki scen, zamiast zgadywać sekundy. */
const marks = {}
let takeStart = 0
function mark(label) {
  marks[label] = Number(((Date.now() - takeStart) / 1000).toFixed(1))
  console.log(`  ⏱ ${label} @ ${marks[label]}s`)
}

async function take(name, browser, options, run) {
  const started = Date.now()
  takeStart = started
  const scene = await openScene(browser, name, options)
  console.log(`▶ ${name}`)
  try {
    await run(scene.page, scene)
    const seconds = (Date.now() - started) / 1000
    console.log(`  ${name}: ${seconds.toFixed(1)}s`)
    marks['__koniec'] = Number(seconds.toFixed(1))
    await writeFile(`out/marks-${name}.json`, JSON.stringify(marks, null, 1))
    for (const key of Object.keys(marks)) delete marks[key]
  } catch (error) {
    console.error(`✖ ${name}: ${error.message}`)
    const summary = await scene.page.evaluate(() => ({
      url: location.pathname,
      buttons: [...document.querySelectorAll('button')].map((b) => b.getAttribute('aria-label') || (b.textContent || '').trim().slice(0, 24)).slice(0, 14),
      controls: [...document.querySelectorAll('select,input')].map((c) => c.name || c.id).filter(Boolean).slice(0, 14),
    })).catch(() => null)
    if (summary) console.error('  stan:', JSON.stringify(summary))
    await scene.page.screenshot({ path: `public/clips/error-${name}.png` }).catch(() => {})
    await finishScene(scene)
    throw error
  }
  await finishScene(scene)
}

/** Przejście na trasę po pełnym przeładowaniu: kursor wraca tam, gdzie myśli licznik. */
async function gotoRoute(page, route, { settleMs = 900 } = {}) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' })
  await settle(page, 400)
  await page.mouse.move(cursor.x, cursor.y)
  await settle(page, settleMs)
}

/** Ten sam wywiad, ale bez oglądania się na estetykę: używamy go w ujęciach, które i tak wytniemy. */
async function quickInterview(page) {
  // Pytania z listą wyboru są na Radiksie, więc wybieramy myszą z otwartej listy.
  const select = async (name, label) => {
    await openSelect(page, page.locator(`[data-field=${name}]`), label, { dwell: 220, scan: false, settleMs: 200 })
  }
  const fill = async (name, value) => {
    await page.locator(`[name=${name}]`).fill(value)
    await settle(page, 120)
  }
  const next = async () => {
    await page.getByRole('button', { name: 'Dalej' }).click()
    await settle(page, 400)
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
  await settle(page, 800)
}

/** Wywiad oglądany w filmie: mysz prowadzi przez kroki, ale bez dłużyzn. */
async function interviewOnCamera(page) {
  const next = page.getByRole('button', { name: 'Dalej' })
  const heading = () => page.locator('#interview-step, h2').first().textContent().catch(() => '')

  /** Klika "Dalej" i pilnuje, żeby krok naprawdę się zmienił. */
  const go = async (ms = 300) => {
    const before = await heading()
    await next.scrollIntoViewIfNeeded()
    await settle(page, 220)
    await clickAt(page, next, { x: 0, y: 0 }, ms)
    for (let attempt = 0; attempt < 20; attempt += 1) {
      if ((await heading()) !== before) return
      await settle(page, 250)
    }
    const errors = await page.locator('[role=alert], .text-destructive').allTextContents()
    throw new Error(`Krok się nie zmienił. Błędy formularza: ${errors.join(' | ') || 'brak'}`)
  }

  // Krok 1: rola i etap
  await settle(page, 400)
  mark('wyb-rola')
  await openSelect(page, page.locator('[data-field=role]'), /Matka dziecka/, { dwell: 1000 })
  await openSelect(page, page.locator('[data-field=birthStage]'), /Dziecko już się urodziło/, { dwell: 1000 })
  await go(420)

  // Krok 2: data i liczba dzieci
  await typeDate(page, page.locator('[name=eventDate]'), '2026-09-01')
  await typeInto(page, page.locator('[name=childCount]'), '1', { clear: true })
  await go(420)

  // Krok 3: szpital
  await openSelect(page, page.locator('[data-field=hospitalization]'), /^Nie$/, { dwell: 900 })
  await go(420)

  // Krok 4: dane dzieci. Po zwykłym porodzie pytamy tu o martwe urodzenie
  // i zgon dziecka, więc krok pokazujemy, choć nic nie wypełniamy.
  await settle(page, 500)
  await moveTo(page, 960, 520, { pause: 500 })
  await go(420)

  // Krok 5: zatrudnienie i podstawa
  mark('wyb-praca')
  await openSelect(page, page.locator('[data-field=employment]'), /Umowa o pracę/, { dwell: 900 })
  await openSelect(page, page.locator('[data-field=insured]'), /^Tak$/, { dwell: 900 })
  await typeInto(page, page.locator('[name=basis]'), '8000')
  await go(420)

  // Krok 6: drugi rodzic
  mark('wyb-rodzic')
  await openSelect(page, page.locator('[data-field=partnerEmployment]'), /Umowa o pracę/, { dwell: 900 })
  await openSelect(page, page.locator('[data-field=partnerInsured]'), /^Tak$/, { dwell: 900 })
  await typeInto(page, page.locator('[name=partnerBasis]'), '6000')
  await go(420)

  // Krok 7: powrót do pracy pomijamy
  await go(420)

  // Krok 8: świadczenia w ciąży
  await openSelect(page, page.locator('[data-field=sickness]'), /^Nie$/, { dwell: 900 })
  await openSelect(page, page.locator('[data-field=rehabilitation]'), /^Nie$/, { dwell: 900 })

  const submit = page.getByRole('button', { name: 'Sprawdź świadczenia' })
  await submit.scrollIntoViewIfNeeded()
  await settle(page, 300)
  await clickAt(page, submit, { x: 0, y: 0 }, 2600)
  await page.getByText('Wynik sprawdzenia').first().waitFor({ timeout: 20000 })
  await settle(page, 1400)
}

const browser = await launch()

/* ---------------------------------------------------------------- główne ujęcie */

if (TAKE === 'all' || TAKE === 'main') {
  await take('01-main', browser, { url: '/' }, async (page) => {
    // Strona główna: zajrzenie w dół i z powrotem, potem "Rozpocznij sprawdzenie".
    await settle(page, 1400)
    mark('start')
    await moveTo(page, 900, 620, { pause: 500 })
    await scrollBy(page, 420, { settleMs: 1500 })
    await settle(page, 600)
    await moveTo(page, 700, 520, { pause: 500 })
    await scrollToTop(page, { settleMs: 1400 })
    await settle(page, 400)
    await clickAt(page, page.getByRole('link', { name: /Rozpocznij sprawdzenie/i }), { x: -110, y: 0 }, 1400)

    // Wejście: dwie drogi do środka.
    await settle(page, 1100)
    mark('wejscie')
    await reveal(page, page.getByRole('heading', { name: /Wejdź do Skrzydeł Rodzica/i }), { at: 0.3 })
    await settle(page, 400)
    await moveTo(page, 700, 560, { pause: 420 })
    const moby = page.getByRole('link', { name: /Zaloguj przez mObywatel/i }).first()
    await reveal(page, moby, { at: 0.55 })
    await clickAt(page, moby, { x: -80, y: 0 }, 1700)

    // mObywatel: wpisujemy dane i logujemy się.
    await settle(page, 900)
    mark('mobywatel')
    await typeInto(page, page.locator('#identifier'), 'anna.k')
    await typeInto(page, page.locator('#password'), 'demo1234')
    await clickAt(page, page.getByRole('button', { name: 'Zaloguj', exact: true }), { x: 0, y: 0 }, 2000)

    // Wracamy na wejście jako zalogowana Anna: karta danych i menu konta.
    await settle(page, 1600)
    mark('dane')
    await reveal(page, page.getByRole('heading', { name: /Jesteś w środku/i }), { at: 0.4 })
    await settle(page, 500)
    await moveTo(page, 900, 620, { pause: 500 })
    const account = page.getByRole('button', { name: /Menu konta/i })
    if (await account.count()) {
      await clickAt(page, account, { x: 0, y: 0 }, 700)
      await page.locator('[role=menu]').first().waitFor({ state: 'visible', timeout: 4000 }).catch(() => {})
      await settle(page, 900)
      const firstItem = page.getByRole('menuitem').first()
      if (await firstItem.count()) {
        const box = await firstItem.boundingBox()
        if (box) await moveTo(page, box.x + box.width * 0.5, box.y + box.height / 2, { pause: 420 })
      }
      await page.keyboard.press('Escape')
      await settle(page, 500)
    }

    await reveal(page, page.getByRole('link', { name: /Przejdź dalej/i }), { at: 0.6 })
    await clickAt(page, page.getByRole('link', { name: /Przejdź dalej/i }), { x: -60, y: 0 }, 1500)

    await settle(page, 900)
    mark('wywiad')
    await interviewOnCamera(page)

    // Wynik: nagłówek, karty świadczeń, ostrzeżenia.
    await scrollToTop(page, { settleMs: 900 })
    mark('wynik')
    await reveal(page, page.getByRole('heading', { name: 'Wynik sprawdzenia' }), { at: 0.25 })
    await settle(page, 700)
    await scrollBy(page, 300, { settleMs: 1200 })
    await moveTo(page, 700, 520, { pause: 520 })
    await scrollBy(page, 380, { settleMs: 1300 })
    await settle(page, 500)
    await moveTo(page, 1100, 560, { pause: 500 })

    // "Dlaczego tak": podstawa prawna przy kwocie.
    mark('why')
    const why = page.getByRole('button', { name: /dlaczego tak/i }).first()
    if (await why.count()) {
      await why.scrollIntoViewIfNeeded()
      await settle(page, 600)
      await clickAt(page, why, { x: 0, y: 0 }, 1500)
      await settle(page, 1200)
      await scrollPage(page, await page.evaluate(() => window.scrollY + 180), { settleMs: 1100 })
      await settle(page, 600)
      await clickAt(page, page.getByRole('button', { name: /Zamknij okno/i }).first(), { x: 0, y: 0 }, 1100)
    }

    // Karta podziału urlopu: przeciąganie suwaka myszą.
    mark('slider')
    const plan = page.locator('#second-share')
    await reveal(page, plan, { at: 0.55 })
    await settle(page, 900)
    await dragSlider(page, {
      track: page.locator('[data-slot=slider]').first(),
      thumb: page.locator('[data-slot=slider-thumb]').first(),
      fraction: 0.42,
      sections: [0.5, 0.85, 1],
    })
    await settle(page, 1200)

    // Dokumenty i terminy z karty zasiłku macierzyńskiego.
    mark('dokumenty-dialog')
    const docs = page.getByRole('button', { name: /Dokumenty i terminy — Zasiłek macierzyński/i })
    if (await docs.count()) {
      await docs.scrollIntoViewIfNeeded()
      await settle(page, 700)
      await clickAt(page, docs, { x: 0, y: 0 }, 1800)
      await settle(page, 1100)
      const accordion = page.getByRole('button', { name: /Dokumenty do przygotowania/i }).first()
      if (await accordion.count()) {
        await accordion.scrollIntoViewIfNeeded()
        await settle(page, 600)
        await clickAt(page, accordion, { x: -180, y: 0 }, 1200)
      }
      await settle(page, 800)
      await scrollPage(page, await page.evaluate(() => window.scrollY + 300), { settleMs: 1200 })
      await settle(page, 700)
      await moveTo(page, 1150, 700, { pause: 600 })
      await clickAt(page, page.getByRole('button', { name: /Zamknij okno/i }).first(), { x: 0, y: 0 }, 1200)
    }

    // Ustawienia dostępności: lektor na wyniku czyta i podświetla zdania.
    await settle(page, 700)
    mark('a11y')
    await clickAt(page, page.getByRole('button', { name: 'Ustawienia dostępności' }).first(), { x: 0, y: 0 }, 800)
    await settle(page, 900)
    const readToggle = page.locator('#a11y-read')
    if (await readToggle.count()) {
      await clickAt(page, readToggle, { x: 0, y: 0 }, 900)
    }
    await settle(page, 700)
    await clickAt(page, page.getByRole('button', { name: 'Ustawienia dostępności' }).first(), { x: 0, y: 0 }, 900)
    await settle(page, 700)

    const readAloud = page.getByRole('button', { name: /Przeczytaj wynik/i }).first()
    if (await readAloud.count()) {
      await readAloud.scrollIntoViewIfNeeded()
      await settle(page, 700)
      mark('czytanie')
      await clickAt(page, readAloud, { x: 0, y: 0 }, 1400)
      await settle(page, 3600)
      await moveTo(page, 900, 620, { pause: 700 })
    }

    // Karta uprawnień: jedna strona do wydruku.
    mark('karta')
    const card = page.getByRole('button', { name: /Pobierz kartę uprawnień/i }).first()
    if (await card.count()) {
      await card.scrollIntoViewIfNeeded()
      await settle(page, 700)
      await clickAt(page, card, { x: 0, y: 0 }, 1800)
      await settle(page, 1200)
      await reveal(page, page.getByRole('heading', { name: /Karta uprawnień|Zasiłki przysługujące/i }).first(), { at: 0.35 })
      await settle(page, 800)
      await scrollBy(page, 420, { settleMs: 1500 })
      await settle(page, 700)
      await moveTo(page, 800, 560, { pause: 700 })
      await scrollBy(page, 320, { settleMs: 1500 })
      await settle(page, 700)
      // Zapisujemy kartę, żeby pokazać ją później na telefonie bez powtarzania wywiadu.
      const seed = await page.evaluate(() => sessionStorage.getItem('entitlement-card'))
      if (seed) await writeFile('public/clips/seed-card.json', seed)
    }
  })
}

/* ------------------------------------------------------------------ wnioski */

if (TAKE === 'all' || TAKE === 'wnioski') {
  await take('02-wnioski', browser, { url: '/' }, async (page) => {
    await page.goto(`${BASE}/kalkulator`, { waitUntil: 'networkidle' })
    await settle(page, 700)
    await quickInterview(page)
    mark('body')

    const button = page.getByRole('button', { name: /Przygotuj wniosek urlopowy/i }).first()
    await button.scrollIntoViewIfNeeded()
    await settle(page, 800)
    await clickAt(page, button, { x: 0, y: 0 }, 1800)
    await settle(page, 1400)

    // Wybór wniosku z listy wynikającej z sytuacji.
    await reveal(page, page.getByRole('heading', { name: /wynikają/i }).first(), { at: 0.32 })
    await settle(page, 700)
    await moveTo(page, 700, 640, { pause: 600 })
    const pick = page.locator('ul li button').filter({ hasText: /Macierzyński|macierzyński/ }).first()
    if (await pick.count()) {
      await reveal(page, pick, { at: 0.5 })
      await clickAt(page, pick, { x: -120, y: 0 }, 1500)
    }
    await settle(page, 1200)

    // Wniosek: pola, sprawdzenie przed wysłaniem, projekt pisma.
    await scrollBy(page, 320, { settleMs: 1300 })
    await settle(page, 700)
    await moveTo(page, 620, 520, { pause: 600 })
    await scrollBy(page, 420, { settleMs: 1400 })
    await settle(page, 700)
    await moveTo(page, 640, 560, { pause: 600 })
    await scrollBy(page, 460, { settleMs: 1500 })
    await settle(page, 800)
    await moveTo(page, 900, 600, { pause: 700 })
  })
}

/* ---------------------------------------------------------------- dokumenty */

if (TAKE === 'all' || TAKE === 'dokumenty') {
  await take('03-dokumenty', browser, { url: '/' }, async (page) => {
    await login(page, { route: '/dokumenty' })
    mark('body')
    await reveal(page, page.getByRole('heading', { name: /Wybierz świadczenie/i }).first(), { at: 0.3 })
    await settle(page, 800)

    // Rozwijana lista świadczeń (Radix): widać ją na nagraniu w całości.
    await openSelect(page, page.locator('#document-benefit'), /ojcowski/i, { dwell: 1500 })
    await settle(page, 700)
    await clickAt(page, page.getByRole('button', { name: /^Dalej/ }), { x: 0, y: 0 }, 1300)
    await settle(page, 900)

    // Tytuł ubezpieczenia: druga lista.
    const employment = page.locator('#document-employment')
    if (await employment.count()) {
      await openSelect(page, employment, /Umowa o pracę/i, { dwell: 1100 })
      await settle(page, 700)
    }
    await clickAt(page, page.getByRole('button', { name: /Pokaż dokumenty/ }), { x: 0, y: 0 }, 1800)
    await settle(page, 1300)

    await reveal(page, page.getByRole('heading', { name: /Gdzie złożyć|Dokumenty do przygotowania|Co przygotować/i }).first(), { at: 0.4 })
    await settle(page, 800)
    const accordion = page.getByRole('button', { name: /Dokumenty do przygotowania/i }).first()
    if (await accordion.count()) {
      await clickAt(page, accordion, { x: -180, y: 0 }, 1200)
      await settle(page, 900)
    }
    await scrollBy(page, 380, { settleMs: 1400 })
    await settle(page, 700)
    await moveTo(page, 760, 520, { pause: 600 })
    await scrollBy(page, 340, { settleMs: 1400 })
    await settle(page, 700)
    await moveTo(page, 900, 560, { pause: 700 })
  })
}

/* ------------------------------------------------------------------- sprawy */

if (TAKE === 'all' || TAKE === 'sprawy') {
  await take('04-sprawy', browser, { url: '/' }, async (page) => {
    await login(page, { route: '/sprawy' })
    mark('body')
    await reveal(page, page.getByRole('heading', { name: 'Sprawy', exact: true }).first(), { at: 0.3 })
    await settle(page, 800)

    // Lista rozwijana z dokumentami z zestawu ZUS.
    await openSelect(page, page.locator('#sample-list'), /Agnieszka Wa_05/, { dwell: 1400 })
    await settle(page, 1000)

    // Uzupełnienie liczb, których skan nie podaje. Podstawę czyścimy przed
    // wpisaniem, bo pole startuje z wartością 6000 i bez tego dopisalibyśmy
    // cyfry do niej, a kwota ponad limit API kończyła się błędem 422.
    const date = page.locator('#sample-event-date')
    if (await date.count()) {
      await typeDate(page, date, '2026-05-04')
      await typeInto(page, page.locator('#sample-basis'), '7000', { clear: true })
      await openSelect(page, page.locator('#sample-employment'), /umowa o pracę/i, { dwell: 1100 })
      await settle(page, 600)
      await clickAt(page, page.getByRole('button', { name: /Sprawdź ubezpieczenie i policz/i }), { x: 0, y: 0 }, 2400)
      await settle(page, 1400)
      await scrollBy(page, 320, { settleMs: 1400 })
      await settle(page, 700)
      await moveTo(page, 800, 520, { pause: 700 })
    }
  })
}

if (TAKE === 'all' || TAKE === 'sprawy-porownanie') {
  await take('05-sprawy-porownanie', browser, { url: '/' }, async (page) => {
    await login(page, { route: '/sprawy' })
    await settle(page, 900)
    mark('body')

    // Wybieramy dokument z zestawu, uzupełniamy liczby i schodzimy do porównania z decyzją.
    await openSelect(page, page.locator('#sample-list'), /Alicja Cho_3/, { dwell: 1400 })
    await settle(page, 900)
    const date = page.locator('#sample-event-date')
    if (await date.count()) {
      await typeDate(page, date, '2026-05-04')
      await typeInto(page, page.locator('#sample-basis'), '7000', { clear: true })
      await openSelect(page, page.locator('#sample-employment'), /umowa o pracę/i, { dwell: 1100 })
      await settle(page, 600)
      await clickAt(page, page.getByRole('button', { name: /Sprawdź ubezpieczenie i policz/i }), { x: 0, y: 0 }, 2400)
      await settle(page, 1500)
    }

    await reveal(page, page.getByRole('heading', { name: /Porównanie z decyzją/i }).first(), { at: 0.35 })
    await settle(page, 900)
    await moveTo(page, 700, 520, { pause: 600 })
    await scrollBy(page, 460, { settleMs: 1500 })
    await settle(page, 800)
    await moveTo(page, 980, 470, { pause: 600 })
    await scrollBy(page, 420, { settleMs: 1500 })
    await settle(page, 800)
    await moveTo(page, 820, 560, { pause: 700 })
  })
}

/* ---------------------------------------------------------------------- zus */

if (TAKE === 'all' || TAKE === 'zus') {
  await take('06-zus', browser, { url: '/' }, async (page) => {
    await login(page, { route: '/zus' })
    mark('body')
    await reveal(page, page.getByRole('heading', { name: /Ubezpieczenie i składki/i }).first(), { at: 0.3 })
    await settle(page, 800)
    await moveTo(page, 900, 600, { pause: 500 })

    // Przełączniki stanu ubezpieczenia.
    const off = page.getByRole('button', { name: 'Bez ubezpieczenia', exact: true }).first()
    const on = page.getByRole('button', { name: 'Ubezpieczona', exact: true }).first()
    if (await off.count()) {
      await clickAt(page, off, { x: 0, y: 0 }, 1600)
      await clickAt(page, on, { x: 0, y: 0 }, 1500)
    }
    await typeInto(page, page.locator('#zus-basis'), '7000')

    const owed = page.getByRole('button', { name: 'Jest zaległość', exact: true }).first()
    const clear = page.getByRole('button', { name: 'Brak zaległości', exact: true }).first()
    if (await owed.count()) {
      await reveal(page, owed, { at: 0.6 })
      await clickAt(page, owed, { x: 0, y: 0 }, 1700)
      await clickAt(page, clear, { x: 0, y: 0 }, 1500)
    }

    // e-ZLA i konto PUE/eZUS.
    const pue = page.getByRole('button', { name: /Połącz z PUE\/eZUS/i }).first()
    if (await pue.count()) {
      await reveal(page, pue, { at: 0.6 })
      await settle(page, 700)
      await clickAt(page, pue, { x: 0, y: 0 }, 2000)
      await settle(page, 1200)
    }

    // Odpis aktu urodzenia: lista rodzaju odpisu.
    const copy = page.locator('#certificate-copy')
    if (await copy.count()) {
      // Sekcja odpisu leży nisko, więc celujemy w samo pole, inaczej lista otwiera się pod krawędzią kadru.
      await reveal(page, copy, { at: 0.42 })
      await settle(page, 700)
      await openSelect(page, copy, /Zupełny/i, { dwell: 1400 })
      await settle(page, 700)
      await typeInto(page, page.locator('#certificate-child'), 'Anna K.')
      await typeInto(page, page.locator('#certificate-office'), 'USC Warszawa')
      const apply = page.getByRole('button', { name: /Złóż wniosek/i }).first()
      if (await apply.count()) {
        await clickAt(page, apply, { x: 0, y: 0 }, 2200)
        await settle(page, 1400)
      }
    }
    await scrollBy(page, 320, { settleMs: 1400 })
    await settle(page, 700)
    await moveTo(page, 900, 540, { pause: 700 })
  })
}

/* --------------------------------------------------------------- planowanie */

if (TAKE === 'all' || TAKE === 'planowanie') {
  await take('07-planowanie', browser, { url: '/' }, async (page) => {
    await login(page, { route: '/planowanie' })
    mark('body')
    await reveal(page, page.getByRole('heading', { name: /Pięć pytań/i }).first(), { at: 0.3 })
    await settle(page, 800)

    await openSelect(page, page.locator('#pl-employment'), /Umowa o pracę/, { dwell: 1000 })
    await openSelect(page, page.locator('#pl-payer'), /Tak, zgłasza/, { dwell: 1000 })
    await openSelect(page, page.locator('#pl-gaps'), /Żadnych przerw/, { dwell: 1000 })
    await openSelect(page, page.locator('#pl-business'), /Nie prowadzę działalności/, { dwell: 1000 })
    await typeInto(page, page.locator('#pl-horizon'), '12')

    // Lista przygotowań: przed ciążą i w ciąży.
    await reveal(page, page.getByRole('heading', { name: /Lista przygotowań przed ciążą/i }).first(), { at: 0.3 })
    await settle(page, 900)
    await moveTo(page, 700, 560, { pause: 600 })
    await scrollBy(page, 420, { settleMs: 1500 })
    await settle(page, 800)
    await moveTo(page, 700, 520, { pause: 600 })
    await scrollBy(page, 400, { settleMs: 1500 })
    await settle(page, 800)
    await moveTo(page, 820, 560, { pause: 600 })
    const calendar = page.getByRole('button', { name: /Dodaj termin do kalendarza/i }).first()
    if (await calendar.count()) {
      await ensureVisible(page, calendar)
      await settle(page, 800)
      await moveTo(page, ...Object.values(await center(calendar, { x: -40, y: 0 })), { pause: 600 })
      await settle(page, 700)
    }
  })
}

/* -------------------------------------------------------------------- urlop */

if (TAKE === 'all' || TAKE === 'urlop') {
  await take('08-urlop', browser, { url: '/' }, async (page) => {
    await login(page, { route: '/urlop' })
    mark('body')
    await reveal(page, page.getByRole('heading', { name: /Twoja sprawa|Uzupełnij/i }).first(), { at: 0.25 })
    await settle(page, 800)

    await typeDate(page, page.locator('#p-event'), '2026-05-04')
    await typeDate(page, page.locator('#p-start'), '2026-05-11')
    await openSelect(page, page.locator('#p-current'), /^Urlop macierzyński$/, { dwell: 1000 })
    await typeInto(page, page.locator('#p-basis'), '8000')
    await openSelect(page, page.locator('#p-partner'), /Umowa o pracę/, { dwell: 1000 })
    await typeInto(page, page.locator('#p-partner-days'), '0')
    await typeInto(page, page.locator('#p-partner-basis'), '6000')

    const calculate = page.getByRole('button', { name: /Zapisz i przelicz/i }).first()
    await calculate.scrollIntoViewIfNeeded()
    await settle(page, 800)
    await clickAt(page, calculate, { x: 0, y: 0 }, 2600)
    await settle(page, 1600)

    // Postęp urlopu i kwoty.
    await reveal(page, page.getByRole('heading', { name: /Postęp urlopu|Status/i }).first(), { at: 0.3 })
    await settle(page, 900)
    await moveTo(page, 760, 560, { pause: 600 })
    await scrollBy(page, 420, { settleMs: 1500 })
    await settle(page, 800)
    await moveTo(page, 900, 520, { pause: 600 })
    await scrollBy(page, 380, { settleMs: 1500 })
    await settle(page, 800)
    await moveTo(page, 700, 560, { pause: 700 })
  })
}

/* ----------------------------------------------------------------- odwolanie */

if (TAKE === 'all' || TAKE === 'odwolanie') {
  await take('09-odwolanie', browser, { url: '/' }, async (page) => {
    await login(page, { route: '/odwolanie' })
    mark('body')
    await reveal(page, page.getByRole('heading', { name: /Cztery pytania o decyzję/i }).first(), { at: 0.3 })
    await settle(page, 800)

    await openSelect(page, page.locator('#od-benefit'), /^Zasiłek macierzyński$/, { dwell: 1000 })
    await typeDate(page, page.locator('#od-delivered'), '2026-10-05')
    await openSelect(page, page.locator('#od-ground'), /podstawy wymiaru/, { dwell: 1000 })
    await openSelect(page, page.locator('#od-documents'), /Tak, komplet/, { dwell: 1000 })
    await typeInto(page, page.locator('#od-number'), 'ZAS/2026/4412')
    await typeInto(page, page.locator('#od-name'), 'Anna Kowalska')
    await typeInto(page, page.locator('#od-address'), 'ul. Zielona 4/12, 85-100 Bydgoszcz')
    await typeInto(page, page.locator('#od-place'), 'Bydgoszcz')

    await reveal(page, page.getByRole('heading', { name: /Diagnoza sporu/i }).first(), { at: 0.3 })
    await settle(page, 1000)
    await moveTo(page, 700, 560, { pause: 600 })
    await scrollBy(page, 440, { settleMs: 1500 })
    await settle(page, 800)
    await moveTo(page, 700, 520, { pause: 600 })
    await scrollBy(page, 460, { settleMs: 1500 })
    await settle(page, 800)
    await moveTo(page, 820, 540, { pause: 600 })
    await scrollBy(page, 420, { settleMs: 1500 })
    await settle(page, 900)
    await moveTo(page, 700, 560, { pause: 700 })
  })
}

/* ------------------------------------------------------------------ wsparcie */

if (TAKE === 'all' || TAKE === 'wsparcie') {
  await take('10-wsparcie', browser, { url: '/' }, async (page) => {
    await login(page, { route: '/wsparcie' })
    mark('body')
    await reveal(page, page.getByRole('heading', { name: /Wsparcie w trudnych sytuacjach/i }).first(), { at: 0.3 })
    await settle(page, 800)
    await moveTo(page, 700, 620, { pause: 600 })

    const card = page.getByRole('link', { name: /Wcześniak/i }).first()
    await reveal(page, card, { at: 0.55 })
    await clickAt(page, card, { x: -120, y: 0 }, 1800)
    await settle(page, 1300)

    await scrollBy(page, 360, { settleMs: 1400 })
    await settle(page, 800)
    await moveTo(page, 760, 520, { pause: 600 })
    await scrollBy(page, 400, { settleMs: 1500 })
    await settle(page, 800)
    await moveTo(page, 900, 540, { pause: 600 })
    await scrollBy(page, 360, { settleMs: 1400 })
    await settle(page, 800)
    await moveTo(page, 760, 560, { pause: 700 })
  })
}

/* -------------------------------------------------------------------- panel */

if (TAKE === 'all' || TAKE === 'panel') {
  await take('11-panel', browser, { url: '/' }, async (page) => {
    await login(page, { route: '/panel' })
    mark('body')
    await reveal(page, page.getByRole('heading', { name: /Stopy procentowe/i }).first(), { at: 0.3 })
    await settle(page, 900)

    // Zmiana stopy rodzicielskiego i zapis. Pokazujemy wartość inną niż domyślna,
    // żeby widać było przeliczenie, a na końcu przywracamy domyślne, bo inaczej
    // panel zostawiłby w aplikacji stawkę, od której liczą się kwoty.
    const rate = page.locator('#rate-parental')
    if (await rate.count()) {
      await ensureVisible(page, rate)
      const point = await center(rate)
      await moveTo(page, point.x, point.y, { pause: 300 })
      await rate.click()
      await page.keyboard.press('Control+a')
      await settle(page, 200)
      for (const character of '75') {
        await page.keyboard.type(character)
        await settle(page, 180)
      }
      await settle(page, 500)
      await page.keyboard.press('Tab')
      await settle(page, 700)
    }

    // Wymiary urlopów.
    await reveal(page, page.getByRole('heading', { name: /Wymiary urlopów/i }).first(), { at: 0.3 })
    await settle(page, 800)
    await moveTo(page, 760, 560, { pause: 600 })

    // Funkcje: przełącznik myszą i zapis zmian.
    await reveal(page, page.getByRole('heading', { name: /^Funkcje$/i }).first(), { at: 0.35 })
    await settle(page, 800)
    const toggle = page.getByRole('switch').nth(2)
    if (await toggle.count()) {
      await clickAt(page, toggle, { x: 0, y: 0 }, 1400)
      await settle(page, 900)
      await clickAt(page, toggle, { x: 0, y: 0 }, 1400)
    }
    const save = page.getByRole('button', { name: /Zapisz zmiany/i }).first()
    if (await save.count()) {
      await save.scrollIntoViewIfNeeded()
      await settle(page, 800)
      await clickAt(page, save, { x: 0, y: 0 }, 2000)
      await settle(page, 1400)
    }

    // Przywracamy domyślne, żeby nagranie nie zostawiło w aplikacji zmienionej stopy.
    const reset = page.getByRole('button', { name: /Przywróć domyślne/i }).first()
    if (await reset.count()) {
      await reset.scrollIntoViewIfNeeded()
      await settle(page, 700)
      await clickAt(page, reset, { x: 0, y: 0 }, 1800)
      await settle(page, 1200)
    }
    await moveTo(page, 900, 520, { pause: 700 })
  })
}

/* ----------------------------------------------------------------- asystent */

if (TAKE === 'all' || TAKE === 'asystent') {
  await take('12-asystent', browser, { url: '/' }, async (page) => {
    await login(page, { route: '/' })
    await scrollToTop(page, { settleMs: 800 })
    await settle(page, 900)
    mark('body')

    const launcher = page.getByRole('button', { name: 'Otwórz asystenta' })
    const point = await center(launcher)
    await moveTo(page, point.x - 24, point.y - 6, { pause: 700 })
    await clickAt(page, launcher, { x: 0, y: 0 }, 1200)
    await settle(page, 900)

    // Wybór pytania z listy podpowiedzi.
    const chip = page.locator('#asystent-panel button').filter({ hasText: /Ile dostanę zasiłku/i }).first()
    if (await chip.count()) {
      await moveTo(page, ...Object.values(await center(chip, { x: 12, y: 0 })), { pause: 600 })
      await clickAt(page, chip, { x: 0, y: 0 }, 2600)
      await settle(page, 1800)
      await moveTo(page, 1500, 720, { pause: 900 })
    }

    // Własne pytanie i odpowiedź z odnośnikiem.
    const input = page.locator('#asystent-pytanie')
    if (await input.count()) {
      await typeInto(page, input, 'Gdzie złożyć wniosek?')
      await clickAt(page, page.getByRole('button', { name: 'Zapytaj asystenta' }), { x: 0, y: 0 }, 2600)
      await settle(page, 2000)
      await moveTo(page, 1520, 700, { pause: 800 })
      const link = page.locator('#asystent-panel a[href^="/"]').first()
      if (await link.count()) {
        await moveTo(page, ...Object.values(await center(link, { x: -30, y: 0 })), { pause: 700 })
        await clickAt(page, link, { x: 0, y: 0 }, 2000)
        await settle(page, 1400)
        await scrollBy(page, 300, { settleMs: 1500 })
        await settle(page, 800)
        await moveTo(page, 800, 540, { pause: 700 })
      }
    }
  })
}

/* ------------------------------------------------------------------- telefon */

const MOBILE = { width: 400, height: 860, mobile: true }

if (TAKE === 'all' || TAKE === 'mobile-home') {
  await take('13-mobile-home', browser, { ...MOBILE, url: '/' }, async (page) => {
    await settle(page, 1500)
    mark('body')
    await moveTo(page, 200, 460, { pause: 600 })
    const menu = page.getByRole('button', { name: 'Otwórz menu' })
    if (await menu.count()) {
      await clickAt(page, menu, { x: 0, y: 0 }, 1100)
      await settle(page, 1200)
      await moveTo(page, 200, 300, { pause: 700 })
      await moveTo(page, 200, 420, { pause: 700 })
      await clickAt(page, page.getByRole('button', { name: 'Zamknij menu' }), { x: 0, y: 0 }, 1000)
      await settle(page, 900)
    }
    await scrollPage(page, 620, { settleMs: 1400 })
    await settle(page, 700)
    await moveTo(page, 200, 420, { pause: 700 })
    await scrollPage(page, 1180, { settleMs: 1500 })
    await settle(page, 800)
    await moveTo(page, 200, 500, { pause: 700 })
  })
}

if (TAKE === 'all' || TAKE === 'mobile-swiadczenia') {
  await take('14-mobile-swiadczenia', browser, { ...MOBILE, url: '/swiadczenia' }, async (page) => {
    await settle(page, 1400)
    mark('body')
    const chip = page.getByRole('button', { name: 'Ciąża', exact: true }).first()
    if (await chip.count()) {
      await clickAt(page, chip, { x: 0, y: 0 }, 1400)
      await settle(page, 900)
    }
    await scrollPage(page, 420, { settleMs: 1400 })
    await settle(page, 800)
    await moveTo(page, 200, 500, { pause: 600 })
    const more = page.getByRole('link', { name: /Zobacz dokumenty|Dokumenty/i }).first()
    if (await more.count()) {
      await moveTo(page, ...Object.values(await center(more, { x: 0, y: 0 })), { pause: 600 })
    }
    await scrollPage(page, 980, { settleMs: 1500 })
    await settle(page, 800)
    await moveTo(page, 200, 460, { pause: 700 })
  })
}

if (TAKE === 'all' || TAKE === 'mobile-karta') {
  await take('15-mobile-karta', browser, { ...MOBILE, url: '/' }, async (page) => {
    // Karta uprawnień jest zapisana w sesji, więc wystarczy ją wczytać.
    const seed = await import('node:fs/promises').then((fs) => fs.readFile('public/clips/seed-card.json', 'utf8').catch(() => null))
    if (seed) {
      await page.addInitScript((data) => {
        try {
          sessionStorage.setItem('entitlement-card', data)
        } catch {
          /* brak dostępu do sessionStorage */
        }
      }, seed)
    }
    await gotoRoute(page, '/karta', { settleMs: 1400 })
    await settle(page, 900)
    mark('body')
    await moveTo(page, 200, 420, { pause: 600 })
    await scrollPage(page, 620, { settleMs: 1500 })
    await settle(page, 800)
    await moveTo(page, 200, 460, { pause: 600 })
    await scrollPage(page, 1240, { settleMs: 1500 })
    await settle(page, 800)
    await moveTo(page, 200, 500, { pause: 600 })
    await scrollPage(page, 1860, { settleMs: 1600 })
    await settle(page, 900)
    await moveTo(page, 200, 440, { pause: 700 })
  })
}

if (TAKE === 'all' || TAKE === 'mobile-dokumenty') {
  await take('17-mobile-dokumenty', browser, { ...MOBILE, url: '/dokumenty' }, async (page) => {
    await settle(page, 1400)
    mark('body')
    await reveal(page, page.getByRole('heading', { name: /Wybierz świadczenie/i }).first(), { at: 0.28 })
    await settle(page, 700)
    // Ta sama lista rozwijana co na komputerze, tym razem w wąskim układzie.
    await openSelect(page, page.locator('#document-benefit'), /macierzyński/i, { dwell: 1400 })
    await settle(page, 700)
    // Przy zasiłku macierzyńskim ten kreator ma jeden krok, więc "Dalej" od razu
    // pokazuje dokumenty. Nie ma tu pytania o tytuł ubezpieczenia.
    await clickAt(page, page.getByRole('button', { name: /^Dalej/ }), { x: 0, y: 0 }, 1600)
    await settle(page, 1300)
    await scrollPage(page, await page.evaluate(() => window.scrollY + 420), { settleMs: 1400 })
    await settle(page, 700)
    await moveTo(page, 200, 480, { pause: 700 })
    await scrollPage(page, await page.evaluate(() => window.scrollY + 400), { settleMs: 1400 })
    await settle(page, 800)
    await moveTo(page, 200, 520, { pause: 700 })
  })
}

if (TAKE === 'all' || TAKE === 'mobile-asystent') {
  await take('16-mobile-asystent', browser, { ...MOBILE, url: '/' }, async (page) => {
    await settle(page, 1400)
    mark('body')
    const launcher = page.getByRole('button', { name: 'Otwórz asystenta' })
    if (await launcher.count()) {
      await clickAt(page, launcher, { x: 0, y: 0 }, 1300)
      await settle(page, 1000)
      const chip = page.locator('#asystent-panel button').filter({ hasText: /Ile dostanę zasiłku/i }).first()
      if (await chip.count()) {
        await clickAt(page, chip, { x: 0, y: 0 }, 2600)
        await settle(page, 1800)
        await moveTo(page, 200, 500, { pause: 700 })
        await scrollPage(page, await page.evaluate(() => window.scrollY + 380), { settleMs: 1400 })
        await settle(page, 700)
        await moveTo(page, 200, 520, { pause: 700 })
      }
    }
  })
}

await browser.close()
console.log('koniec')
