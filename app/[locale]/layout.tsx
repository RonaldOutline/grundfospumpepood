import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/lib/auth-context'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'

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

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <Header />
            <main>{children}</main>
            <Footer />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
