import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { napisy } from '../napisy'
import { FONT_FAMILY } from '../font-faces'

/**
 * Napisy pod obrazem. Film idzie też bez lektora, a wtedy podpisy mówią to
 * samo, więc plansze są zrozumiałe same. Tło jest granatowe i półprzezroczyste,
 * żeby tekst był czytelny nad każdą sceną.
 */
export function Captions() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const sekunda = frame / fps

  const napis = napisy.find((kandydat) => sekunda >= kandydat.od && sekunda < kandydat.do)
  if (!napis) return null

  // Wjazd i zjazd: napis pojawia się przez 4 klatki i tyle samo gaśnie.
  const klatkiOd = napis.od * fps
  const klatkiDo = napis.do * fps
  const wejscie = interpolate(frame, [klatkiOd, klatkiOd + 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const wyjscie = interpolate(frame, [klatkiDo - 4, klatkiDo], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const widoczny = Math.min(wejscie, wyjscie)

  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 54, pointerEvents: 'none' }}>
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 46,
          lineHeight: 1.25,
          fontWeight: 500,
          color: '#ffffff',
          textAlign: 'center',
          textWrap: 'balance',
          maxWidth: 1560,
          padding: '16px 34px',
          borderRadius: 14,
          background: 'rgba(15, 28, 42, 0.78)',
          boxShadow: '0 12px 30px rgba(15, 28, 42, 0.28)',
          opacity: widoczny,
          transform: `translateY(${(1 - widoczny) * 10}px)`,
        }}
      >
        {napis.tekst}
      </div>
    </AbsoluteFill>
  )
}
