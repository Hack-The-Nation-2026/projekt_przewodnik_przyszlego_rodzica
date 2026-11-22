import { AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { Label } from './Label'
import { theme } from '../theme'

const CLIP_W = 400
const CLIP_H = 860
const BEZEL = 14

/** Kadr z telefonu pokazany w ramce, obok krótkiego opisu układu mobilnego. */
export function MobileScene({ clip, from, durationInFrames }: { clip: string; from: number; durationInFrames: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const drift = interpolate(frame, [0, durationInFrames], [1.0, 1.035], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const rise = interpolate(frame, [12, 34], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (value) => 1 - Math.pow(1 - value, 3),
  })

  return (
    <AbsoluteFill
      style={{
        fontFamily: theme.font,
        background: `radial-gradient(120% 90% at 26% 40%, rgba(0,120,52,0.14) 0%, rgba(0,120,52,0) 62%), linear-gradient(160deg, #ffffff 0%, #eef4f0 100%)`,
      }}
    >
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingLeft: 380, paddingRight: 140, gap: 100, flexDirection: 'row' }}>
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
              src={staticFile(`clips/${clip}.mp4`)}
              startFrom={Math.round(from * fps)}
              muted
              style={{ width: CLIP_W, height: CLIP_H, objectFit: 'cover' }}
            />
          </div>
        </div>

        <div style={{ maxWidth: 570, opacity: rise, transform: `translateY(${(1 - rise) * 26}px)` }}>
          <p style={{ margin: 0, color: theme.green, fontSize: 24, fontWeight: 600, letterSpacing: '0.08em' }}>
            UKŁAD MOBILNY
          </p>
          <h2 style={{ margin: '18px 0 0', color: theme.navy, fontSize: 60, fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.02em' }}>
            Ten sam serwis na telefonie
          </h2>
          <p style={{ margin: '22px 0 0', color: theme.muted, fontSize: 27, lineHeight: 1.5 }}>
            Układ zwęża się do jednej kolumny, przyciski mają 44 piksele wysokości, a poziome
            przewijanie nie pojawia się na żadnym ekranie.
          </p>
        </div>
      </AbsoluteFill>
      <Label text="Sprawdzone od 320 do 1920 pikseli" durationInFrames={durationInFrames} />
    </AbsoluteFill>
  )
}