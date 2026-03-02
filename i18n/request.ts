import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

// Static import map — avoids dynamic template-literal imports that can fail
// in production bundlers (webpack/Vercel).
const messageImports: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  et: () => import('../messages/et.json'),
  en: () => import('../messages/en.json'),
  ru: () => import('../messages/ru.json'),
  lv: () => import('../messages/lv.json'),
  lt: () => import('../messages/lt.json'),
  pl: () => import('../messages/pl.json'),
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as typeof routing.locales[number])) {
    locale = routing.defaultLocale
  }
  const messages = (await messageImports[locale]()).default
  return { locale, messages }
})
