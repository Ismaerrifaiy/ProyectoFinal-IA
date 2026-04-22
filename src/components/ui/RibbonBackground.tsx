'use client'

import { useEffect } from 'react'

export default function RibbonBackground() {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Gradient } = require('stripe-gradient')
    const gradient = new Gradient()
    gradient.initGradient('#stripe-gradient-canvas')
  }, [])

  return (
    <canvas
      id="stripe-gradient-canvas"
      data-transition-in
      style={
        {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
          '--gradient-color-1': '#F9D68C',
          '--gradient-color-2': '#F5A56E',
          '--gradient-color-3': '#EE7BB0',
          '--gradient-color-4': '#C48FE0',
        } as React.CSSProperties
      }
    />
  )
}
