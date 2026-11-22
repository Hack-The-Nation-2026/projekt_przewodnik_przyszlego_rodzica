import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { scenes, sceneDuration } from './edl'
import { ScreenScene } from './components/ScreenScene'
import { MobileScene } from './components/MobileScene'
import { Outro } from './components/Outro'
import { theme } from './theme'

const OUTRO_SECONDS = 6
/** Klatki przenikania między rozdziałami. */
const FADE = 7
/** Przenikanie z ostatniego rozdziału w planszę końcową. */
const CROSSFADE = 12

/** Początki rozdziałów w klatkach, z przenikaniem na stykach. */
function layout(fps: number) {
  const items: { scene: (typeof scenes)[number]; from: number; duration: number }[] = []
  let cursor = 0
  scenes.forEach((scene, index) => {
    const duration = sceneDuration(scene, fps)
    const from = index === 0 ? 0 : Math.max(0, cursor - FADE)
    items.push({ scene, from, duration })
    cursor = from + duration
  })
  return { items, outroFrom: cursor - CROSSFADE, total: cursor + OUTRO_SECONDS * fps }
}

export function Video() {
  const { fps } = useVideoConfig()
  const frame = useCurrentFrame()
  const { items, outroFrom, total } = layout(fps)

  // Wejście z czerni i wyjście do czerni na samym końcu.
  const fadeIn = interpolate(frame, [0, 8], [1, 0], { extrapolateRight: 'clamp' })
  const fadeOut = interpolate(frame, [total - 14, total - 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill style={{ backgroundColor: theme.paper }}>
      {items.map(({ scene, from, duration }, index) => (
        <Sequence key={scene.id} from={from} durationInFrames={duration} name={scene.label ?? scene.id}>
          {scene.kind === 'mobile' ? (
            <MobileScene clip={scene.clip} from={scene.from} durationInFrames={duration} />
          ) : (
            <ScreenScene scene={scene} fadeIn={index === 0 ? 0 : FADE} fadeOut={FADE} />
          )}
        </Sequence>
      ))}
      <Sequence from={outroFrom} durationInFrames={OUTRO_SECONDS * fps + CROSSFADE} name="Plansza końcowa">
        <Outro fadeIn={CROSSFADE} />
      </Sequence>
      <AbsoluteFill style={{ backgroundColor: '#000', opacity: Math.max(fadeIn, fadeOut), pointerEvents: 'none' }} />
    </AbsoluteFill>
  )
}

export const totalFrames = (fps: number) => layout(fps).total