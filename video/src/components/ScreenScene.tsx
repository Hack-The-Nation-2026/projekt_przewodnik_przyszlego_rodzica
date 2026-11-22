import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, interpolate } from 'remotion'
import type { CSSProperties } from 'react'
import type { CameraKey, Scene } from '../edl'
import { ease, theme } from '../theme'

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
  // Kamera nie może wyjechać poza nagranie, inaczej w kadrze pojawia się tło kompozycji.
  const halfW = WIDTH / 2 / z
  const halfH = HEIGHT / 2 / z
  const x = Math.min(Math.max(read((key) => key.x), halfW), WIDTH - halfW)
  const y = Math.min(Math.max(read((key) => key.y), halfH), HEIGHT - halfH)
  return { z, x, y }
}

/** Nagranie pulpitu: całe okno serwisu z powolnym ruchem kamery. */
export function ScreenScene({ scene }: { scene: Scene }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const camera = scene.camera?.length ? scene.camera : [{ t: 0, z: 1, x: 960, y: 540 }]
  const { z, x, y } = useCamera(camera, frame, fps)

  const transform: CSSProperties = {
    transform: `scale(${z}) translate(${WIDTH / 2 - x}px, ${HEIGHT / 2 - y}px)`,
    transformOrigin: '50% 50%',
  }

  // Karta końcowa nie ma nagrania, więc ta scena zostaje pusta.
  if (!scene.clip) return <AbsoluteFill style={{ backgroundColor: theme.paper }} />

  return (
    <AbsoluteFill style={{ backgroundColor: theme.paper, overflow: 'hidden' }}>
      <AbsoluteFill style={transform}>
        <OffthreadVideo
          src={staticFile(`clips/${scene.clip}.mp4`)}
          startFrom={Math.round(scene.from * fps)}
          playbackRate={scene.rate ?? 1}
          muted
          style={{ width: WIDTH, height: HEIGHT }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

export { WIDTH, HEIGHT }
