import { launch, openScene, settle, login, reveal, clickAt, center, scrollToTop, BASE } from './lib.mjs'

/**
 * Mierzy, gdzie naprawdę leży otwarta lista albo panel, żeby kamera w montażu
 * celowała w treść, a nie w puste tło. Współrzędne są w układzie nagrania 1920×1080.
 */
const browser = await launch()

const box = async (locator) => {
  const rect = await locator.boundingBox()
  if (!rect) return null
  return {
    x: Math.round(rect.x + rect.width / 2),
    y: Math.round(rect.y + rect.height / 2),
    box: [Math.round(rect.x), Math.round(rect.y), Math.round(rect.width), Math.round(rect.height)],
  }
}

{
  const scene = await openScene(browser, 'probe-cam', { url: '/' })
  const { page } = scene
  await login(page, { route: '/dokumenty' })
  await settle(page, 700)
  await reveal(page, page.getByRole('heading', { name: /Wybierz świadczenie/i }).first(), { at: 0.3 })
  await settle(page, 800)
  await clickAt(page, page.locator('#document-benefit'), { x: 0, y: 0 }, 900)
  await page.locator('[role=listbox]').waitFor({ state: 'visible', timeout: 6000 })
  await settle(page, 600)
  console.log('dokumenty #document-benefit', JSON.stringify(await box(page.locator('[role=listbox]'))))
  await page.keyboard.press('Escape')
  await settle(page, 400)

  await page.goto(`${BASE}/sprawy`, { waitUntil: 'networkidle' })
  await settle(page, 1200)
  await reveal(page, page.getByRole('heading', { name: /Zestaw przykładowy ZUS/i }).first(), { at: 0.3 })
  await settle(page, 800)
  await clickAt(page, page.locator('button[aria-label="Wybierz sprawę z zestawu przykładowego"]'), { x: 0, y: 0 }, 900)
  await page.locator('[role=listbox]').waitFor({ state: 'visible', timeout: 6000 })
  await settle(page, 600)
  console.log('sprawy lista spraw', JSON.stringify(await box(page.locator('[role=listbox]'))))
  await page.keyboard.press('Escape')
  await settle(page, 400)

  await page.goto(`${BASE}/zus`, { waitUntil: 'networkidle' })
  await settle(page, 1200)
  await reveal(page, page.locator('#certificate-copy'), { at: 0.42 })
  await settle(page, 800)
  await clickAt(page, page.locator('#certificate-copy'), { x: 0, y: 0 }, 900)
  await page.locator('[role=listbox]').waitFor({ state: 'visible', timeout: 6000 })
  await settle(page, 600)
  console.log('zus odpis', JSON.stringify(await box(page.locator('[role=listbox]'))))
  await page.keyboard.press('Escape')
  await settle(page, 400)

  // Menu konta i panel dostępności siedzą w nagłówku, więc mierzymy je na tej samej stronie.
  await page.goto(`${BASE}/wejscie`, { waitUntil: 'networkidle' })
  await settle(page, 1000)
  await page.getByRole('link', { name: /Zaloguj przez mObywatel/i }).first().click()
  await page.waitForSelector('#identifier')
  await page.locator('#identifier').fill('anna.k')
  await page.locator('#password').fill('demo1234')
  await page.getByRole('button', { name: 'Zaloguj', exact: true }).click()
  await page.getByRole('heading', { name: /Jesteś w środku/i }).first().waitFor({ timeout: 15000 })
  await settle(page, 1200)
  await clickAt(page, page.getByRole('button', { name: /Menu konta/i }), { x: 0, y: 0 }, 800)
  await page.locator('[role=menu]').first().waitFor({ state: 'visible', timeout: 4000 }).catch(() => {})
  await settle(page, 600)
  console.log('wejscie menu konta', JSON.stringify(await box(page.locator('[role=menu]').first())))
  await page.keyboard.press('Escape')
  await settle(page, 400)

  await clickAt(page, page.getByRole('button', { name: 'Ustawienia dostępności' }).first(), { x: 0, y: 0 }, 900)
  await settle(page, 700)
  console.log('panel dostępności', JSON.stringify(await box(page.locator('section[aria-label="Ustawienia dostępności"]'))))
  await page.keyboard.press('Escape')
  await settle(page, 400)

  await scene.context.close()
}

{
  const scene = await openScene(browser, 'probe-cam-m', { url: '/', width: 400, height: 860, mobile: true })
  const { page } = scene
  await page.goto(`${BASE}/dokumenty`, { waitUntil: 'networkidle' })
  await settle(page, 1200)
  await reveal(page, page.getByRole('heading', { name: /Wybierz świadczenie/i }).first(), { at: 0.28 })
  await settle(page, 700)
  await clickAt(page, page.locator('#document-benefit'), { x: 0, y: 0 }, 900)
  await page.locator('[role=listbox]').waitFor({ state: 'visible', timeout: 6000 }).catch(() => {})
  await settle(page, 500)
  console.log('mobile dokumenty lista', JSON.stringify(await box(page.locator('[role=listbox]'))))
  await scene.context.close()
}

await browser.close()
console.log('gotowe')
