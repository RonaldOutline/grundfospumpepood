import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SetHtmlLang from '@/components/SetHtmlLang'
import { AuthProvider } from '@/lib/auth-context'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'

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
    <NextIntlClientProvider messages={messages}>
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
