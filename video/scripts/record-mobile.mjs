import { launch, openScene, finishScene, moveTo, settle, wheel } from './lib.mjs'

const browser = await launch()

// Widok telefonu: ten sam serwis, wąski układ.
const scene = await openScene(browser, '10-mobile', {
  url: '/',
  width: 400,
  height: 860,
  mobile: true,
})
scene.name = '10-mobile'
console.log('▶ 10-mobile')
await settle(scene.page, 2200)
await moveTo(scene.page, 200, 500, { steps: 20 })
await settle(scene.page, 800)
await wheel(scene.page, 600, { step: 60, between: 40 })
await settle(scene.page, 1200)
await wheel(scene.page, -320, { step: 60, between: 40 })
await settle(scene.page, 1600)
await finishScene(scene)
await browser.close()
console.log('koniec')