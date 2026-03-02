// Edge-Runtime safe — imported by middleware AND server/client code.
// Contains ONLY the routing definition; no React/navigation imports.
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['et', 'en', 'ru', 'lv', 'lt', 'pl'] as const,
  defaultLocale: 'et',
  localePrefix: 'always',
})

export type Locale = (typeof routing.locales)[number]
