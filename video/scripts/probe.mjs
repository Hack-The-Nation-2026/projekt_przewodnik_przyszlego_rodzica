import { launch, openScene, finishScene, moveTo, clickAt, settle } from './lib.mjs'

const browser = await launch()
const scene = await openScene(browser, 'probe')
scene.name = 'probe'
await settle(scene.page, 600)
await moveTo(scene.page, 1500, 36)
await settle(scene.page, 300)
await moveTo(scene.page, 700, 500)
await settle(scene.page, 700)
await clickAt(scene.page, scene.page.getByRole('link', { name: 'Kalkulator' }))
await settle(scene.page, 900)
await finishScene(scene)
await browser.close()
console.log('gotowe')