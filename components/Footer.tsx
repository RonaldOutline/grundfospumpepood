'use client'

import Link from 'next/link'
import { Phone, Mail, MapPin } from 'lucide-react'

const categories = [
  { name: 'Küte',            slug: 'kute' },
  { name: 'Jahutus',         slug: 'jahutus' },
  { name: 'Soe tarbevesi',   slug: 'sooja-tarbevee-tsirkulatsioonipump' },
  { name: 'Puurkaevud',      slug: 'puurkaevud' },
  { name: 'Drenaaž',         slug: 'drenaaz' },
  { name: 'Salvkaevud',      slug: 'salvkaevud' },
  { name: 'Rõhutõste',       slug: 'rohutoste' },
  { name: 'Reovesi',         slug: 'reovesi' },
]

const team = [
  { name: 'Rivo',  email: 'rivo@ipumps.ee',  phone: '+372 510 2376', tel: '+3725102376' },
  { name: 'Karol', email: 'karol@ipumps.ee', phone: '+372 503 3978', tel: '+3725033978' },
  { name: 'Jüri',  email: 'juri@ipumps.ee',  phone: null,            tel: null },
]

const legalLinks = [
  { label: 'Privaatsuspoliitika', href: '/leht/privaatsuspoliitika' },
  { label: 'Ostutingimused',      href: '/leht/ostutingimused' },
  { label: 'Tagastamine',         href: '/leht/tagastamine' },
]

export default function Footer() {
  return (
    <footer className="bg-[#001f40] text-white/70">
      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* ── 4 veergu ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          {/* Veerg 1 — Logo + kirjeldus */}
          <div className="col-span-2 lg:col-span-1">
            <div className="mb-4">
              <img src="/ipumps-logo-white.svg" alt="iPumps" className="h-7 w-auto" />
            </div>
            <p className="text-[14px] leading-relaxed mb-4">
              Grundfos pumpade ametlik edasimüüja Eestis. Tooted, paigaldus ja hooldus.
            </p>
            <div className="text-[13px] text-white/40 space-y-0.5">
              <div className="text-white/60 font-medium">Intelligent Pump Solutions OÜ</div>
              <div>Reg: 11417625 · KMKR: EE101173603</div>
            </div>
          </div>

          {/* Veerg 2 — Tegevusalad */}
          <div>
            <div className="text-white font-semibold text-[14px] uppercase tracking-wider mb-4">Tegevusalad</div>
            <div className="space-y-2">
              {categories.map(cat => (
                <a
                  key={cat.slug}
                  href={`/tooted?tegevusala=${cat.slug}`}
                  className="block text-[14px] hover:text-white transition-colors"
                >
                  {cat.name}
                </a>
              ))}
            </div>
          </div>

          {/* Veerg 3 — Lingid */}
          <div>
            <div className="text-white font-semibold text-[14px] uppercase tracking-wider mb-4">Ettevõte</div>
            <div className="space-y-2">
              <a
                href="https://ipumps.ee/kontakt/"
                target="_blank" rel="noopener noreferrer"
                className="block text-[14px] hover:text-white transition-colors"
              >
                Projektimüük
              </a>
              <Link href="/leht/kontakt" className="block text-[14px] hover:text-white transition-colors">
                Kontakt
              </Link>
            </div>

            <div className="mt-6">
              <div className="text-white font-semibold text-[14px] uppercase tracking-wider mb-4">Õiguslik</div>
              <div className="space-y-2">
                {legalLinks.map(({ label, href }) => (
                  <Link key={href} href={href} className="block text-[14px] hover:text-white transition-colors">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Veerg 4 — Kontakt */}
          <div>
            <div className="text-white font-semibold text-[14px] uppercase tracking-wider mb-4">Kontakt</div>
            <div className="space-y-3 mb-5">
              <div className="flex items-start gap-2.5 text-[14px]">
                <MapPin size={14} className="flex-shrink-0 mt-0.5" />
                <span>
                  Sepamäe tee 11-2<br />
                  74009 Leppneeme küla<br />
                  Viimsi vald, Harju maakond
                </span>
              </div>
              <a href="tel:+3725033978" className="flex items-center gap-2.5 text-[14px] hover:text-white transition-colors">
                <Phone size={14} className="flex-shrink-0" /> +372 503 3978
              </a>
            </div>

            {/* Meeskond */}
            <div className="border-t border-white/10 pt-4 space-y-3">
              {team.map(({ name, email, phone, tel }) => (
                <div key={name} className="text-[13px]">
                  <div className="text-white/50 mb-0.5">{name}</div>
                  <a href={`mailto:${email}`} className="flex items-center gap-1.5 hover:text-white transition-colors mb-0.5">
                    <Mail size={12} className="flex-shrink-0" /> {email}
                  </a>
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
          <span>© {new Date().getFullYear()} Intelligent Pump Solutions OÜ. Kõik õigused kaitstud.</span>
          <div className="flex flex-wrap gap-4">
            {legalLinks.map(({ label, href }) => (
              <Link key={href} href={href} className="hover:text-white transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
