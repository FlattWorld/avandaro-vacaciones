import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#3d4852',
          fontFamily: 'Georgia, serif',
          fontSize: 19,
          fontWeight: 700,
          letterSpacing: -1.5,
          color: '#f5f1e8',
        }}
      >
        AV
      </div>
    ),
    { ...size }
  )
}
