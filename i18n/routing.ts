import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

export const routing = defineRouting({
  locales: ['et', 'en', 'ru', 'lv', 'lt', 'pl'] as const,
  defaultLocale: 'et',
  localePrefix: 'always',
})

export type Locale = (typeof routing.locales)[number]

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
