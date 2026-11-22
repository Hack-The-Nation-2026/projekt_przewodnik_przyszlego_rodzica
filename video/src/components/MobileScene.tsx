import { AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import type { Scene } from '../edl'
import { FONT_FAMILY } from '../font-faces'
import { theme } from '../theme'

const CLIP_W = 400
const CLIP_H = 860
const BEZEL = 14

/**
 * Telefon w ramce obok krótkiego opisu. Nagranie z wąskiego widoku samo się
 * przewija, więc ramka tylko delikatnie się dociąga, bez sztucznych przejazdów.
 */
export function MobileScene({ scene, durationInFrames }: { scene: Scene; durationInFrames: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const drift = interpolate(frame, [0, durationInFrames], [1.0, 1.03], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const rise = interpolate(frame, [10, 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (value) => 1 - Math.pow(1 - value, 3),
  })
  const riseLate = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (value) => 1 - Math.pow(1 - value, 3),
  })

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT_FAMILY,
        background:
          'radial-gradient(120% 90% at 24% 40%, rgba(0,120,52,0.13) 0%, rgba(0,120,52,0) 62%), linear-gradient(160deg, #ffffff 0%, #eef4f0 100%)',
      }}
    >
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingLeft: 380,
          paddingRight: 140,
          gap: 100,
          flexDirection: 'row',
        }}
      >
        <div
          style={{
            position: 'relative',
            padding: BEZEL,
            borderRadius: 52,
            background: '#101a24',
            boxShadow: '0 50px 90px -30px rgba(9, 24, 38, 0.55), 0 10px 30px rgba(9, 24, 38, 0.18)',
            transform: `scale(${drift})`,
          }}
        >
          <div style={{ overflow: 'hidden', borderRadius: 40, width: CLIP_W, height: CLIP_H, background: '#ffffff' }}>
            <OffthreadVideo
              src={staticFile(`clips/${scene.clip}.mp4`)}
              startFrom={Math.round(scene.from * fps)}
              playbackRate={scene.rate ?? 1}
              muted
              style={{ width: CLIP_W, height: CLIP_H, objectFit: 'cover' }}
            />
          </div>
        </div>

        <div style={{ maxWidth: 570 }}>
          <p style={{ margin: 0, color: theme.green, fontSize: 23, fontWeight: 600, letterSpacing: '0.1em' }}>
            TAK SAMO NA TELEFONIE
          </p>
          <h2
            style={{
              margin: '18px 0 0',
              color: theme.navy,
              fontSize: 58,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: '-0.02em',
              opacity: rise,
              transform: `translateY(${(1 - rise) * 26}px)`,
            }}
          >
            {scene.title}
          </h2>
          <p
            style={{
              margin: '22px 0 0',
              color: theme.muted,
              fontSize: 27,
              lineHeight: 1.5,
              opacity: riseLate,
              transform: `translateY(${(1 - riseLate) * 22}px)`,
            }}
          >
            {scene.caption}
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
