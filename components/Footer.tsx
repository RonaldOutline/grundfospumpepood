'use client'

import Link from 'next/link'
import { Phone, Mail } from 'lucide-react'
import ObfuscatedEmail from './ObfuscatedEmail'
import { useTranslations } from 'next-intl'

const categoryKeys = [
  { nameKey: 'heating',  slug: 'kute' },
  { nameKey: 'cooling',  slug: 'jahutus' },
  { nameKey: 'hotWater', slug: 'sooja-tarbevee-tsirkulatsioonipump' },
  { nameKey: 'borewell', slug: 'puurkaevud' },
  { nameKey: 'drainage', slug: 'drenaaz' },
  { nameKey: 'wells',    slug: 'salvkaevud' },
  { nameKey: 'pressure', slug: 'rohutoste' },
  { nameKey: 'sewage',   slug: 'reovesi' },
]

const team = [
  { name: 'Rivo',  eUser: 'rivo',  phone: '+372 510 2376', tel: '+3725102376' },
  { name: 'Karol', eUser: 'karol', phone: '+372 503 3978', tel: '+3725033978' },
  { name: 'Jüri',  eUser: 'juri',  phone: null,            tel: null },
]

const legalHrefs = [
  { labelKey: 'privacy', href: '/leht/privaatsuspoliitika' },
  { labelKey: 'terms',   href: '/leht/ostutingimused' },
  { labelKey: 'returns', href: '/leht/tagastamine' },
]

export default function Footer() {
  const t    = useTranslations('footer')
  const tCat = useTranslations('categories')

  return (
    <footer className="bg-[#001f40] text-white/70">
      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* ── 4 veergu ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          {/* Veerg 1 — Logo + kirjeldus + kontaktandmed */}
          <div className="col-span-2 lg:col-span-1">
            <div className="mb-4">
              <img src="/ipumps-logo-white.svg" alt="iPumps" className="h-7 w-auto" />
            </div>
            <p className="text-[14px] leading-relaxed mb-4">
              {t('description')}
            </p>
            <div className="text-[13px] text-white/50 space-y-0.5">
              <div className="text-white/70 font-medium">{t('company')}</div>
              <div>Sepamäe tee 11-2</div>
              <div>74009 Leppneeme küla</div>
              <div>Viimsi vald, Harju maakond</div>
              <a href="tel:+3725033978" className="block hover:text-white transition-colors pt-1">+372 503 3978</a>
              <div className="pt-1 text-white/30">{t('reg')}</div>
            </div>
          </div>

          {/* Veerg 2 — Tegevusalad */}
          <div>
            <div className="text-white font-semibold text-[14px] uppercase tracking-wider mb-4">{t('categories')}</div>
            <div className="space-y-2">
              {categoryKeys.map(cat => (
                <a
                  key={cat.slug}
                  href={`/tooted?tegevusala=${cat.slug}`}
                  className="block text-[14px] hover:text-white transition-colors"
                >
                  {tCat(cat.nameKey)}
                </a>
              ))}
            </div>
          </div>

          {/* Veerg 3 — Lingid */}
          <div>
            <div className="text-white font-semibold text-[14px] uppercase tracking-wider mb-4">{t('enterprise')}</div>
            <div className="space-y-2">
              <a
                href="https://ipumps.ee/kontakt/"
                target="_blank" rel="noopener noreferrer"
                className="block text-[14px] hover:text-white transition-colors"
              >
                {t('projectSales')}
              </a>
              <Link href="/leht/kontakt" className="block text-[14px] hover:text-white transition-colors">
                {t('contact')}
              </Link>
            </div>

            <div className="mt-6">
              <div className="text-white font-semibold text-[14px] uppercase tracking-wider mb-4">{t('legal')}</div>
              <div className="space-y-2">
                {legalHrefs.map(({ labelKey, href }) => (
                  <Link key={href} href={href} className="block text-[14px] hover:text-white transition-colors">
                    {t(labelKey)}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Veerg 4 — Kontakt */}
          <div>
            <div className="text-white font-semibold text-[14px] uppercase tracking-wider mb-4">{t('contactTitle')}</div>

            {/* Meeskond */}
            <div className="space-y-3">
              {team.map(({ name, eUser, phone, tel }) => (
                <div key={name} className="text-[13px]">
                  <div className="text-white/50 mb-0.5">{name}</div>
                  <ObfuscatedEmail
                    user={eUser} domain="ipumps.ee"
                    prefix={<Mail size={12} className="flex-shrink-0" />}
                    className="flex items-center gap-1.5 hover:text-white transition-colors mb-0.5"
                  />
                  {phone && tel && (
                    <a href={`tel:${tel}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                      <Phone size={12} className="flex-shrink-0" /> {phone}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Alumine riba ──────────────────────────────────────────────── */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[13px]">
          <span>© {new Date().getFullYear()} {t('company')}. {t('copyright')}</span>
          <div className="flex flex-wrap gap-4">
            {legalHrefs.map(({ labelKey, href }) => (
              <Link key={href} href={href} className="hover:text-white transition-colors">
                {t(labelKey)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
