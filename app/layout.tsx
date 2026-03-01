import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/lib/auth-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'iPumps — Grundfos pumbad Eestis',
    template: '%s | iPumps',
  },
  description: 'Grundfos pumpade ametlik edasimüüja Eestis. 321 toodet laos — küte, jahutus, puurkaevud, drenaaž ja palju muud.',
  keywords: ['Grundfos', 'pumbad', 'küte', 'jahutus', 'puurkaev', 'drenaaž', 'tsirkulatsioonipump'],
  openGraph: {
    siteName: 'iPumps',
    locale: 'et_EE',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="et">
      <body className={inter.className}>
        <AuthProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
