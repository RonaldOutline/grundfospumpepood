import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'iPumps — Grundfos pumbad Eestis',
    template: '%s | iPumps',
  },
  description:
    'Grundfos pumpade ametlik edasimüüja Eestis. 321 toodet laos — küte, jahutus, puurkaevud, drenaaž ja palju muud.',
  keywords: [
    'Grundfos',
    'pumbad',
    'küte',
    'jahutus',
    'puurkaev',
    'drenaaž',
    'tsirkulatsioonipump',
  ],
  openGraph: {
    siteName: 'iPumps',
    locale: 'et_EE',
    type: 'website',
  },
}

// Root layout owns <html> and <body> — required by Next.js / Vercel.
// All locale-specific providers, Header and Footer are in app/[locale]/layout.tsx.
// The actual html lang attribute is set dynamically by SetHtmlLang (client component).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="et" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
