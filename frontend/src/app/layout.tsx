import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ShadowShare - Secure File Sharing',
  description: 'Secure temporary file sharing for credentials and text files',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {children}
      </body>
    </html>
  )
}