'use client'

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Chismecito - Red Social Local',
  description: 'Comparte los chismes del barrio con fotos, videos y texto',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  )
}
