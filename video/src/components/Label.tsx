import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { theme } from '../theme'

/**
 * Mała etykieta rozdziału w lewym dolnym rogu. Wchodzi po 8 klatkach,
 * trzyma się 2,4 s i chowa szybciej, niż weszła.
 */
export function Label({ text, durationInFrames }: { text?: string; durationInFrames: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  if (!text) return null

  const enterFrames = Math.round(fps * 0.42)
  const holdFrames = Math.round(fps * 2.4)
  const exitFrames = Math.round(fps * 0.3)
  const start = Math.round(fps * 0.22)
  const exitAt = Math.min(start + enterFrames + holdFrames, durationInFrames - exitFrames - 2)

  const enterProgress = interpolate(frame, [start, start + enterFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (value) => 1 - Math.pow(1 - value, 3),
  })
  const exitProgress = interpolate(frame, [exitAt, exitAt + exitFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (value) => value * value,
  })
  const opacity = enterProgress * exitProgress
  const translateY = (1 - enterProgress) * 16 - (1 - exitProgress) * 10

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: 60,
          bottom: 54,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '13px 24px 13px 20px',
          borderRadius: 999,
          background: 'rgba(20, 33, 46, 0.9)',
          boxShadow: '0 18px 44px rgba(9, 20, 30, 0.28)',
          opacity,
          transform: `translateY(${translateY}px)`,
          fontFamily: theme.font,
        }}
      >
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: 999,
            background: theme.green,
            boxShadow: `0 0 12px ${theme.green}`,
          }}
        />
        <span
          style={{
            color: '#ffffff',
            fontSize: 23,
            fontWeight: 600,
            letterSpacing: '0.01em',
          }}
        >
          {text}
        </span>
      </div>
    </AbsoluteFill>
  )
}