import { chromium } from 'playwright'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'

export const CHROME = '/home/mati/.local/share/chrome-mcp/chrome-linux64/chrome'
export const BASE = 'http://localhost:5173'
export const OUT = path.resolve('public/clips')

/** Kursor rysowany w DOM, bo screencast Playwrighta nie łapie kursora systemowego. */
const CURSOR_SCRIPT = () => {
  if (window.__cursorReady) return
  window.__cursorReady = true
  const mount = () => {
  const root = document.body
  if (!root) return
  const style = document.createElement('style')
  style.textContent = `
    #demo-cursor, #demo-ripple {
      position: fixed; left: 0; top: 0; z-index: 2147483647;
      pointer-events: none; will-change: transform;
    }
    #demo-cursor { width: 30px; height: 30px; filter: drop-shadow(0 2px 3px rgba(9,26,44,.35)); }
    #demo-ripple {
      width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 999px;
      border: 3px solid rgba(0,120,52,.65); background: rgba(0,120,52,.14);
      opacity: 0; transform: scale(.2);
    }
    #demo-ripple.ping { animation: demo-ping .5s cubic-bezier(.2,.7,.3,1) forwards; }
    @keyframes demo-ping {
      0% { opacity: .95; transform: scale(.25); }
      100% { opacity: 0; transform: scale(1.4); }
    }
  `
  const cursor = document.createElement('div')
  cursor.id = 'demo-cursor'
  cursor.innerHTML = `<svg viewBox="0 0 30 30" width="30" height="30">
    <path d="M4 2.2 L25.2 15.1 L15.4 16.6 L11.2 26.4 Z"
      fill="#ffffff" stroke="#0b1f33" stroke-width="1.7" stroke-linejoin="round"/>
  </svg>`
  const ripple = document.createElement('div')
  ripple.id = 'demo-ripple'
  root.appendChild(style)
  root.appendChild(cursor)
  root.appendChild(ripple)

  const target = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.55 }
  const current = { ...target }
  let pressed = false

  const draw = () => {
    cursor.style.transform = `translate3d(${current.x - 4}px, ${current.y - 2}px, 0) scale(${pressed ? 0.86 : 1})`
    ripple.style.left = `${current.x}px`
    ripple.style.top = `${current.y}px`
  }
  draw()

  const loop = () => {
    const ease = pressed ? 0.55 : 0.32
    current.x += (target.x - current.x) * ease
    current.y += (target.y - current.y) * ease
    draw()
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)

  window.addEventListener('mousemove', (event) => {
    target.x = event.clientX
    target.y = event.clientY
  }, { capture: true, passive: true })

  window.addEventListener('mousedown', (event) => {
    target.x = event.clientX
    target.y = event.clientY
    pressed = true
    ripple.classList.remove('ping')
    void ripple.offsetWidth
    ripple.classList.add('ping')
  }, { capture: true, passive: true })

  window.addEventListener('mouseup', () => { pressed = false }, { capture: true, passive: true })
  }
  if (document.body) mount()
  else document.addEventListener('DOMContentLoaded', mount, { once: true })
}

export async function launch({ width = 1920, height = 1080, scale = 1 } = {}) {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none'],
  })
  return browser
}

export async function openScene(browser, name, { width = 1920, height = 1080, url = '/', storage = null, mobile = false } = {}) {
  await rm(path.join(OUT, `${name}.mp4`), { force: true })
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: 'no-preference',
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',
    recordVideo: { dir: OUT, size: { width, height } },
    storageState: storage ?? undefined,
  })
  const page = await context.newPage()
  await page.addInitScript(CURSOR_SCRIPT)
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('asystent-zaproszenie', '1')
    } catch {
      /* brak dostępu do sessionStorage */
    }
  })
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log(`  [console] ${msg.text()}`)
  })
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' })
  // Ukrywamy panel deweloperski kalkulatora i nakładkę devtoolsów, żeby nie weszły w kadr.
  await page.addStyleTag({
    content: `
      .tsqd-parent-container, [data-tanstack-query-devtools] { display: none !important; }
      .border-fuchsia-600 { display: none !important; }
    `,
  })
  await settle(page)
  return { context, page, video: page.video() }
}

export async function finishScene(scene) {
  const { context, video, name } = scene
  await context.close()
  const source = await video.path()
  const { rename } = await import('node:fs/promises')
  await rename(source, path.join(OUT, `${name}.mp4`))
}

export async function settle(page, ms = 400) {
  await page.waitForTimeout(ms)
}

export async function moveTo(page, x, y, { steps = 26, settleMs = 220 } = {}) {
  await page.mouse.move(x, y, { steps })
  if (settleMs) await page.waitForTimeout(settleMs)
}

/** Środek elementu w oknie, z opcjonalnym przesunięciem. */
export async function center(locator, offset = { x: 0, y: 0 }) {
  const box = await locator.boundingBox()
  if (!box) throw new Error('Element nie ma ramki')
  return { x: box.x + box.width / 2 + offset.x, y: box.y + box.height / 2 + offset.y }
}

export async function clickAt(page, locator, offset, settleMs = 450) {
  const point = await center(locator, offset)
  await moveTo(page, point.x, point.y)
  await page.mouse.down()
  await page.waitForTimeout(70)
  await page.mouse.up()
  await page.waitForTimeout(settleMs)
}

export async function typeInto(page, locator, text, { delay = 65, settleMs = 200 } = {}) {
  const point = await center(locator)
  await moveTo(page, point.x, point.y)
  await page.mouse.down()
  await page.mouse.up()
  await page.waitForTimeout(120)
  await locator.type(text, { delay })
  await page.waitForTimeout(settleMs)
}

/** Płynne przewijanie kółkiem myszy, żeby screencast nie gubił klatek. */
export async function wheel(page, amount, { step = 90, between = 28 } = {}) {
  const rounds = Math.ceil(Math.abs(amount) / step)
  const sign = Math.sign(amount)
  for (let index = 0; index < rounds; index += 1) {
    await page.mouse.wheel(0, sign * step)
    await page.waitForTimeout(between)
  }
}