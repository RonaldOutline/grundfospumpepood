'use client'

import { useState } from 'react'
import {
  Flame, Snowflake, Thermometer, Drill, Waves,
  ArrowUpCircle, Filter, CircleDot,
  Search, ChevronRight, Loader2,
  Phone, MapPin, Truck, Wrench, Shield, Clock
} from 'lucide-react'
import ObfuscatedEmail from '@/components/ObfuscatedEmail'
import PumpCalculator from '@/components/PumpCalculator'
import FeaturedProductsSlider from '@/components/FeaturedProductsSlider'
import { supabase } from '@/lib/supabase'
import { useTranslations } from 'next-intl'

// ─── ANDMED ────────────────────────────────────────────────────────────────

const categoryDefs = [
  { nameKey: 'heating',  icon: Flame,         count: 155, slug: 'kute',                              color: 'from-[#01a0dc]/20 to-red-500/10' },
  { nameKey: 'cooling',  icon: Snowflake,      count: 155, slug: 'jahutus',                           color: 'from-sky-500/20 to-blue-500/10' },
  { nameKey: 'hotWater', icon: Thermometer,    count: 48,  slug: 'sooja-tarbevee-tsirkulatsioonipump', color: 'from-amber-500/20 to-[#01a0dc]/10' },
  { nameKey: 'borewell', icon: Drill,          count: 43,  slug: 'puurkaevud',                        color: 'from-stone-500/20 to-gray-500/10' },
  { nameKey: 'drainage', icon: Waves,          count: 31,  slug: 'drenaaz',                           color: 'from-teal-500/20 to-cyan-500/10' },
  { nameKey: 'wells',    icon: CircleDot,      count: 22,  slug: 'salvkaevud',                        color: 'from-green-500/20 to-emerald-500/10' },
  { nameKey: 'pressure', icon: ArrowUpCircle,  count: 23,  slug: 'rohutoste',                         color: 'from-violet-500/20 to-purple-500/10' },
  { nameKey: 'sewage',   icon: Filter,         count: 9,   slug: 'reovesi',                           color: 'from-slate-500/20 to-gray-500/10' },
]

const benefitDefs = [
  { icon: Truck,  titleKey: 'shipping',      descKey: 'shippingDesc' },
  { icon: Wrench, titleKey: 'installation',  descKey: 'installationDesc' },
  { icon: Shield, titleKey: 'warranty',      descKey: 'warrantyDesc' },
  { icon: Clock,  titleKey: 'support',       descKey: 'supportDesc' },
]

// ─── SEKTSIONID ────────────────────────────────────────────────────────────

function HeroSearch() {
  const t = useTranslations('hero')
  const [query,     setQuery]     = useState('')
  const [searching, setSearching] = useState(false)

  const handleSearch = async () => {
    const q = query.trim()
    if (!q) return
    setSearching(true)

    // 1. Fast DB check — does any product name match?
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .ilike('name', `%${q}%`)

    if ((count ?? 0) > 0) {
      window.location.href = `/tooted?q=${encodeURIComponent(q)}`
      return
    }

    // 2. AI fallback — maps unknown terms to a category (cached after first call)
    try {
      const res  = await fetch('/api/search-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      const data = await res.json()
      if (data.categorySlug) {
        window.location.href = `/tooted?tegevusala=${data.categorySlug}`
        return
      }
    } catch { /* fall through */ }

    // 3. Default — show whatever products match (may be empty list)
    window.location.href = `/tooted?q=${encodeURIComponent(q)}`
  }

  return (
    <section className="bg-gradient-to-br from-[#2c3d4e] via-[#1e2d3d] to-[#19222c] py-14">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
          {t('title')}
        </h1>
        <p className="text-white/60 mb-8 text-lg">
          {t('subtitle')}
        </p>
        <div className="relative max-w-2xl mx-auto">
          {searching
            ? <Loader2 size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
            : <Search  size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          }
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            disabled={searching}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-12 pr-32 py-4 rounded-xl text-gray-800 text-[15px] shadow-2xl outline-none focus:ring-2 focus:ring-[#01a0dc] bg-white disabled:opacity-70"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#01a0dc] hover:bg-[#0190c5] text-white px-5 py-2.5 rounded-lg text-[15px] font-semibold transition-colors disabled:opacity-70"
          >
            {searching ? t('searching') : t('searchButton')}
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {(['magna3', 'alpha', 'borewell', 'scala'] as const).map(tag => (
            <button
              key={tag}
              onClick={() => setQuery(t(`tags.${tag}`))}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-[15px] rounded-full transition-colors border border-white/10"
            >
              {t(`tags.${tag}`)}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function SeasonalPromo() {
  const t = useTranslations('promo')

  return (
    <section className="bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="rounded-2xl overflow-hidden flex flex-col lg:flex-row shadow-xl min-h-[380px]">

          {/* Vasakpoolne osa — pakkumine (40%) */}
          <div className="lg:w-2/5 relative bg-gradient-to-br from-[#00c270] via-[#00a75d] to-[#007a44] p-8 lg:p-10 flex flex-col justify-between overflow-hidden">
            {/* Kaunistused */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-24 -translate-y-24 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full -translate-x-16 translate-y-16 pointer-events-none" />

            {/* Sisu */}
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 bg-white/20 text-white/90 border border-white/30 text-[13px] font-semibold px-3 py-1 rounded-full mb-5">
                {t('badge')}
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight whitespace-pre-line">
                {t('title')}
              </h2>
              <p className="text-white/70 text-[15px] leading-relaxed mb-5 max-w-sm">
                {t('description')}
              </p>
              <ul className="space-y-2.5 mb-7">
                {(['bullet1', 'bullet2', 'bullet3'] as const).map(key => (
                  <li key={key} className="flex items-center gap-2.5 text-white/80 text-[15px]">
                    <div className="w-4 h-4 rounded-full bg-white/30 border border-white/50 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>

            {/* Alumine rida: nupp + tootepilt */}
            <div className="relative z-10 flex items-end justify-between gap-4">
              <a
                href="/tooted?seeria=jp-veeautomaat"
                className="inline-flex items-center gap-2 bg-[#01a0dc] hover:bg-[#0190c5] text-white px-5 py-3 rounded-xl font-semibold text-[15px] transition-colors shadow-lg flex-shrink-0"
              >
                {t('cta')}
                <ChevronRight size={16} />
              </a>
              <img
                src="/heroPump.png"
                alt="JP veeautomaat"
                className="h-28 md:h-36 object-contain drop-shadow-2xl -mb-2 flex-shrink-0"
              />
            </div>
          </div>

          {/* Parempoolne osa — taustafoto (60%) */}
          <div className="hidden lg:block lg:flex-1 relative overflow-hidden">
            <img
              src="/aiapump.jpg"
              alt="Aiatoimetused"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Pehmendab üleminekut vasaku veeruga */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#007a44]/40 to-transparent pointer-events-none" />
          </div>

        </div>
      </div>
    </section>
  )
}

function CategoriesSection() {
  const t    = useTranslations('categories')

  return (
    <section id="kategooriad" className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-[13px] font-semibold text-[#01a0dc] uppercase tracking-widest mb-1">{t('subtitle')}</div>
            <h2 className="text-2xl font-bold text-gray-900">{t('title')}</h2>
          </div>
          <a href="/kategooriad" className="text-[15px] text-[#003366] hover:underline font-medium">{t('allCategories')}</a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categoryDefs.map(cat => (
            <a key={cat.slug} href={`/tooted?tegevusala=${cat.slug}`}
              className="group relative bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-6 hover:border-[#003366]/20 hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-50 group-hover:bg-[#003366]/10 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <cat.icon size={22} className="text-[#003366]" />
                </div>
                <div className="font-semibold text-gray-800 group-hover:text-[#003366] transition-colors text-[15px] leading-tight mb-1">
                  {t(cat.nameKey)}
                </div>
                <div className="text-[13px] text-gray-400">{cat.count} {t('products')}</div>
              </div>
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={14} className="text-[#003366]" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

function InstallationBlock() {
  const t = useTranslations('installation')

  return (
    <section id="kontakt" className="py-12 bg-[#003366]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-[13px] font-semibold text-[#01a0dc] uppercase tracking-widest mb-3">{t('label')}</div>
            <h2 className="text-3xl font-bold text-white mb-4 leading-tight whitespace-pre-line">
              {t('title')}
            </h2>
            <p className="text-white/70 mb-6 leading-relaxed text-[15px]">
              {t('description')}
            </p>
            <ul className="space-y-3 mb-8">
              {(['bullet1', 'bullet2', 'bullet3', 'bullet4'] as const).map(key => (
                <li key={key} className="flex items-center gap-3 text-white/80 text-[15px]">
                  <div className="w-5 h-5 rounded-full bg-[#01a0dc]/20 border border-[#01a0dc]/40 flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#01a0dc]" />
                  </div>
                  {t(key)}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <a href="tel:+3725033978"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-colors text-[15px] border border-white/20">
                <Phone size={16} /> +372 503 3978
              </a>
            </div>
          </div>

          {/* Kontaktvorm */}
          <div className="bg-white rounded-2xl p-6 shadow-2xl">
            <h3 className="font-bold text-gray-800 mb-5 text-lg">{t('inquiry')}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-medium text-gray-500 mb-1 block">{t('name')}</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[15px] text-gray-900 outline-none focus:border-[#003366] transition-colors" placeholder={t('namePlaceholder')} />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-gray-500 mb-1 block">{t('phone')}</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[15px] text-gray-900 outline-none focus:border-[#003366] transition-colors" placeholder={t('phonePlaceholder')} />
                </div>
              </div>
              <div>
                <label className="text-[13px] font-medium text-gray-500 mb-1 block">{t('email')}</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[15px] text-gray-900 outline-none focus:border-[#003366] transition-colors" placeholder={t('emailPlaceholder')} />
              </div>
              <div>
                <label className="text-[13px] font-medium text-gray-500 mb-1 block">{t('descriptionLabel')}</label>
                <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[15px] text-gray-900 outline-none focus:border-[#003366] transition-colors resize-none" placeholder={t('descriptionPlaceholder')} />
              </div>
              <button className="w-full bg-[#003366] hover:bg-[#004080] text-white py-3 rounded-xl font-semibold transition-colors text-[15px]">
                {t('send')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function LocationBlock() {
  const t = useTranslations('location')

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div>
            <div className="text-[13px] font-semibold text-[#01a0dc] uppercase tracking-widest mb-3">{t('label')}</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h2>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin size={18} className="text-[#003366]" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800 mb-0.5">{t('address')}</div>
                  <a
                    href="https://www.google.com/maps/dir/?api=1&destination=Vana-Narva+mnt+3,+Tallinn"
                    target="_blank" rel="noopener noreferrer"
                    className="text-gray-500 text-[15px] hover:text-[#003366] transition-colors"
                  >
                    {t('addressValue')}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock size={18} className="text-[#003366]" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800 mb-0.5">{t('hours')}</div>
                  <div className="text-gray-500 text-[15px]">{t('weekdays')}</div>
                  <div className="text-gray-500 text-[15px]">{t('weekend')}</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Phone size={18} className="text-[#003366]" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800 mb-0.5">{t('contact')}</div>
                  <a href="tel:+3725033978" className="block text-gray-500 text-[15px] hover:text-[#003366] transition-colors">
                    +372 503 3978
                  </a>
                  <ObfuscatedEmail
                    user="info" domain="ipumps.ee"
                    className="block text-gray-500 text-[15px] hover:text-[#003366] transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-lg h-72">
            <iframe
              src="https://maps.google.com/maps?q=Vana-Narva+mnt+3,+Tallinn&t=&z=16&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="iPumps asukoht"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function Benefits() {
  const t = useTranslations('benefits')

  return (
    <section className="py-12 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {benefitDefs.map(b => (
            <div key={b.titleKey} className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <b.icon size={18} className="text-[#003366]" />
              </div>
              <div>
                <div className="font-semibold text-gray-800 text-[15px]">{t(b.titleKey)}</div>
                <div className="text-gray-400 text-[13px] mt-0.5 leading-relaxed">{t(b.descKey)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── PEALEHT ────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSearch />
      <SeasonalPromo />
      <CategoriesSection />
      <FeaturedProductsSlider />
      <PumpCalculator />
      <InstallationBlock />
      <LocationBlock />
      <Benefits />
    </div>
  )
}
