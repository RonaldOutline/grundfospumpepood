import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SetHtmlLang from '@/components/SetHtmlLang'
import { AuthProvider } from '@/lib/auth-context'
import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'

// Static imports — no dynamic template-literal imports that can fail in Vercel's bundler
import etMessages from '@/messages/et.json'
import enMessages from '@/messages/en.json'
import ruMessages from '@/messages/ru.json'
import lvMessages from '@/messages/lv.json'
import ltMessages from '@/messages/lt.json'
import plMessages from '@/messages/pl.json'

const allMessages = {
  et: etMessages,
  en: enMessages,
  ru: ruMessages,
  lv: lvMessages,
  lt: ltMessages,
  pl: plMessages,
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

  const messages = allMessages[locale as keyof typeof allMessages]

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {/* Updates <html lang="..."> on the client to match the locale */}
      <SetHtmlLang />
      <AuthProvider>
        <Header />
        <main>{children}</main>
        <Footer />
      </AuthProvider>
    </NextIntlClientProvider>
  )
}
