import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import type { CSSProperties } from 'react'
import type { CameraKey, Scene } from '../edl'
import { ease, theme } from '../theme'
import { Label } from './Label'

const WIDTH = 1920
const HEIGHT = 1080

/** Ruch kamery: powiększenie i punkt kadru, zawsze wewnątrz nagrania. */
function useCamera(keys: CameraKey[], frame: number, fps: number) {
  const times = keys.map((key) => key.t * fps)
  const read = (pick: (key: CameraKey) => number) =>
    interpolate(frame, times, keys.map(pick), {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: ease.inOut,
    })
  const z = read((key) => key.z)
  const halfW = WIDTH / 2 / z
  const halfH = HEIGHT / 2 / z
  const x = Math.min(Math.max(read((key) => key.x), halfW), WIDTH - halfW)
  const y = Math.min(Math.max(read((key) => key.y), halfH), HEIGHT - halfH)
  return { z, x, y }
}

export function ScreenScene({
  scene,
  fadeIn = 0,
  fadeOut = 0,
}: {
  scene: Scene
  fadeIn?: number
  fadeOut?: number
}) {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()
  const { z, x, y } = useCamera(scene.camera, frame, fps)
  const rate = scene.rate ?? 1

  // Wejście z delikatnym dociągnięciem kadru, żeby cięcia nie były skokowe.
  const enter = spring({ frame, fps, config: { damping: 22, mass: 0.6 }, durationInFrames: 14 })
  const scale = z * (0.995 + 0.005 * enter)

  const opacity =
    interpolate(frame, [0, Math.max(fadeIn, 1)], [0, 1], { extrapolateRight: 'clamp' }) *
    interpolate(frame, [durationInFrames - fadeOut, durationInFrames], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })

  const transform: CSSProperties = {
    transform: `scale(${scale}) translate(${WIDTH / 2 - x}px, ${HEIGHT / 2 - y}px)`,
    transformOrigin: '50% 50%',
  }

  return (
    <AbsoluteFill style={{ opacity, backgroundColor: theme.paper }}>
      <AbsoluteFill style={transform}>
        <OffthreadVideo
          src={staticFile(`clips/${scene.clip}.mp4`)}
          startFrom={Math.round(scene.from * fps)}
          playbackRate={rate}
          muted
          style={{ width: WIDTH, height: HEIGHT }}
        />
      </AbsoluteFill>
      <Label text={scene.label} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  )
}

export { WIDTH, HEIGHT, theme }