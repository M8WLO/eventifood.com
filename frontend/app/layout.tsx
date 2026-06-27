import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Eventifood — Your Food Van\'s Online Store',
  description: 'Give your food truck a fully branded QR-code ordering store. Live kitchen board, profit tracking, inventory management and secure MFA. Open in 30 minutes.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white antialiased">
        {children}
      </body>
    </html>
  )
}
