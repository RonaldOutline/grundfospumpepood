'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Flame, Snowflake, Thermometer, Drill, Waves,
  ArrowUpCircle, Filter, CircleDot,
  Search, ShoppingCart, User, ChevronDown,
  Phone, Mail, Menu, X, ChevronRight,
  LayoutDashboard, ShoppingBag, LogOut, Settings,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import ObfuscatedEmail from './ObfuscatedEmail'
import { useLocale } from 'next-intl'
import { Link, usePathname, useRouter } from '@/i18n/routing'

// ─── ANDMED ────────────────────────────────────────────────────────────────

const languageOptions = [
  { code: 'et', label: 'ET', flag: '🇪🇪' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'lv', label: 'LV', flag: '🇱🇻' },
  { code: 'lt', label: 'LT', flag: '🇱🇹' },
  { code: 'pl', label: 'PL', flag: '🇵🇱' },
  { code: 'ru', label: 'RU', flag: '🇷🇺' },
]

const categories = [
  { name: 'Küte',            icon: Flame,         count: 155, slug: 'kute' },
  { name: 'Jahutus',         icon: Snowflake,      count: 155, slug: 'jahutus' },
  { name: 'Soe tarbevesi',   icon: Thermometer,    count: 48,  slug: 'sooja-tarbevee-tsirkulatsioonipump' },
  { name: 'Puurkaevud',      icon: Drill,          count: 43,  slug: 'puurkaevud' },
  { name: 'Drenaaž',         icon: Waves,          count: 31,  slug: 'drenaaz' },
  { name: 'Salvkaevud',      icon: CircleDot,      count: 22,  slug: 'salvkaevud' },
  { name: 'Rõhutõste',       icon: ArrowUpCircle,  count: 23,  slug: 'rohutoste' },
  { name: 'Reovesi',         icon: Filter,         count: 9,   slug: 'reovesi' },
]

// ─── OSTUKORV HELPER ───────────────────────────────────────────────────────

function getCartCount(): number {
  if (typeof window === 'undefined') return 0
  try {
    const cart = JSON.parse(localStorage.getItem('ipumps_cart') || '[]')
    return cart.reduce((sum: number, i: { qty: number }) => sum + i.qty, 0)
  } catch {
    return 0
  }
}

// ─── HEADER ────────────────────────────────────────────────────────────────

export default function Header() {
  const [menuOpen, setMenuOpen]         = useState(false)
  const [langOpen, setLangOpen]         = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [seriesOpen, setSeriesOpen]     = useState(false)
  const [series, setSeries]             = useState<{ slug: string; name_et: string }[]>([])
  const [searchOpen, setSearchOpen]     = useState(false)
  const [searchQuery, setSearchQuery]   = useState('')
  const [cartCount, setCartCount]       = useState(0)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const { user, profile, signOut } = useAuth()

  // next-intl locale-aware routing
  const locale   = useLocale()
  const router   = useRouter()
  const pathname = usePathname()

  const currentLang = languageOptions.find(l => l.code === locale) ?? languageOptions[0]

  const switchLocale = (newLocale: string) => {
    router.push(pathname, { locale: newLocale as 'et' | 'en' | 'ru' | 'lv' | 'lt' | 'pl' })
    setLangOpen(false)
  }

  // Laadi tooteseeria dropdowni jaoks
  useEffect(() => {
    supabase
      .from('categories')
      .select('slug, name_et')
      .eq('parent_slug', 'tooted')
      .order('name_et')
      .then(({ data }) => { if (data) setSeries(data) })
  }, [])

  // Laadi cart count clientil + kuula muutusi
  useEffect(() => {
    setCartCount(getCartCount())
    const handler = () => setCartCount(getCartCount())
    window.addEventListener('cart_updated', handler)
    return () => window.removeEventListener('cart_updated', handler)
  }, [])

  // Sulge dropdown kliki väljas
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-lang-dropdown]')) {
        setLangOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (q: string) => {
    if (q.trim()) {
      router.push(`/tooted?q=${encodeURIComponent(q.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <header className="bg-[#003366] sticky top-0 z-50 shadow-lg">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex justify-between items-center">

          <div className="flex items-center gap-4 text-[15px] text-white/60">
            <a href="tel:+3725033978" className="flex items-center gap-1 hover:text-white/80 transition-colors">
              <Phone size={11} /> +372 503 3978
            </a>
            <ObfuscatedEmail
              user="info" domain="ipumps.ee"
              prefix={<Mail size={11} />}
              className="flex items-center gap-1 hover:text-white/80 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 text-[15px] text-white/60">
            <span>E-R 8:00–17:00</span>

            {/* Keelevalik */}
            <div className="relative" data-lang-dropdown>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors font-medium"
              >
                <span>{currentLang.flag}</span>
                <span>{currentLang.label}</span>
                <ChevronDown size={11} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-7 bg-white rounded-lg shadow-xl py-1 z-50 min-w-[90px] border border-gray-100">
                  {languageOptions.map(l => (
                    <button
                      key={l.code}
                      onClick={() => switchLocale(l.code)}
                      className={`w-full px-3 py-1.5 text-left text-[15px] hover:bg-blue-50 transition-colors flex items-center gap-2 ${
                        l.code === locale ? 'text-[#003366] font-bold' : 'text-gray-700'
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main nav ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <img src="/ipumps-logo-white.svg" alt="iPumps" className="h-8 w-auto" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1">

            {/* Dropdown — Elamud ja Ärihooned */}
            <div
              className="relative"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button className="flex items-center gap-1 text-white/90 hover:text-white px-3 py-2 rounded text-[15px] font-medium transition-colors hover:bg-white/10">
                Elamud ja Ärihooned
                <ChevronDown size={14} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 w-80 bg-white rounded-xl shadow-2xl py-3 z-50 border border-gray-100">
                  <div className="px-4 pb-2 text-[15px] font-semibold text-gray-400 uppercase tracking-wider">
                    Tegevusalad
                  </div>
                  <div className="grid grid-cols-2 gap-0.5 px-2">
                    {categories.map(cat => (
                      <Link
                        key={cat.slug}
                        href={`/tooted?tegevusala=${cat.slug}`}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors group"
                      >
                        <cat.icon size={16} className="text-[#003366] group-hover:text-[#01a0dc] flex-shrink-0 transition-colors" />
                        <div>
                          <div className="text-[15px] font-medium text-gray-800 leading-tight">{cat.name}</div>
                          <div className="text-[13px] text-gray-400">{cat.count} toodet</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tooted dropdown — Tooteseeria */}
            <div
              className="relative"
              onMouseEnter={() => setSeriesOpen(true)}
              onMouseLeave={() => setSeriesOpen(false)}
            >
              <button className="flex items-center gap-1 text-white/90 hover:text-white px-3 py-2 rounded text-[15px] font-medium transition-colors hover:bg-white/10">
                Tooted
                <ChevronDown size={14} className={`transition-transform duration-200 ${seriesOpen ? 'rotate-180' : ''}`} />
              </button>

              {seriesOpen && (
                <div className="absolute top-full left-0 w-72 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100">
                  <Link href="/tooted" className="flex items-center gap-2 px-4 py-2.5 text-[15px] font-semibold text-[#003366] hover:bg-blue-50 transition-colors">
                    Kõik tooted →
                  </Link>
                  {series.length > 0 && (
                    <>
                      <div className="mx-3 my-1 border-t border-gray-100" />
                      <div className="px-4 py-1 text-[13px] font-semibold text-gray-400 uppercase tracking-wider">Tooteseeria</div>
                      <div className="max-h-72 overflow-y-auto">
                        {series.map(s => (
                          <Link
                            key={s.slug}
                            href={`/tooted?seeria=${s.slug}`}
                            className="block px-4 py-2 text-[15px] text-gray-700 hover:bg-blue-50 hover:text-[#003366] transition-colors"
                          >
                            {s.name_et}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <a
              href="https://ipumps.ee/kontakt/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/90 hover:text-white px-3 py-2 rounded text-[15px] font-medium transition-colors hover:bg-white/10"
            >
              Projektimüük
            </a>
            <Link
              href="/leht/kontakt"
              className="text-white/90 hover:text-white px-3 py-2 rounded text-[15px] font-medium transition-colors hover:bg-white/10"
            >
              Kontakt
            </Link>
          </nav>

          {/* Parempoolsed nupud */}
          <div className="flex items-center gap-1 ml-auto">

            {/* Otsing */}
            <div className="relative hidden md:block">
              {searchOpen ? (
                <div className="flex items-center bg-white/10 rounded-lg overflow-hidden">
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSearch(searchQuery)
                      if (e.key === 'Escape') setSearchOpen(false)
                    }}
                    placeholder="Otsi tooteid, SKU, parameetreid..."
                    className="bg-transparent text-white placeholder-white/40 text-[15px] px-3 py-2 w-64 outline-none"
                  />
                  <button onClick={() => setSearchOpen(false)} className="p-2 text-white/60 hover:text-white transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center gap-2 text-white/80 hover:text-white px-3 py-2 rounded-lg text-[15px] transition-colors hover:bg-white/10"
                >
                  <Search size={16} />
                  <span className="text-white/40">Otsi...</span>
                </button>
              )}
            </div>

            {/* Kasutaja */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-[15px] font-medium transition-colors"
                >
                  <User size={16} />
                  <span className="hidden sm:inline max-w-[120px] truncate">
                    {profile?.full_name?.split(' ')[0] || 'Konto'}
                  </span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100">
                    {(profile?.role === 'superadmin' || profile?.role === 'manager') && (
                      <>
                        {/* /haldus is not locale-routed — use plain anchor */}
                        <a
                          href="/haldus"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-[#003366] font-medium hover:bg-blue-50 transition-colors"
                        >
                          <Settings size={14} /> Haldus paneel
                        </a>
                        <div className="border-t border-gray-100 my-1" />
                      </>
                    )}
                    <Link href="/konto" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-gray-700 hover:bg-blue-50 hover:text-[#003366] transition-colors">
                      <LayoutDashboard size={14} /> Ülevaade
                    </Link>
                    <Link href="/konto/tellimused" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-gray-700 hover:bg-blue-50 hover:text-[#003366] transition-colors">
                      <ShoppingBag size={14} /> Tellimused
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    <button onClick={() => { signOut(); setUserMenuOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-red-500 hover:bg-red-50 transition-colors">
                      <LogOut size={14} /> Logi välja
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/konto/sisselogimine"
                className="flex items-center gap-1.5 px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-[15px] font-medium transition-colors"
              >
                <User size={16} />
                <span className="hidden sm:inline">Logi sisse</span>
              </Link>
            )}

            {/* Ostukorv */}
            <Link href="/ostukorv" className="relative p-2.5 text-white/80 hover:text-white transition-colors hover:bg-white/10 rounded-lg">
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#01a0dc] text-white text-[11px] w-5 h-5 rounded-full flex items-center justify-center font-bold leading-none">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Mobiili hamburgeri nupp */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2.5 text-white/80 hover:text-white transition-colors hover:bg-white/10 rounded-lg"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobiilimenüü ────────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#002855]">
          <div className="px-4 py-3 space-y-1">

            {/* Otsing mobiilis */}
            <div className="pb-2">
              <div className="flex items-center bg-white/10 rounded-lg overflow-hidden">
                <Search size={15} className="ml-3 text-white/40 flex-shrink-0" />
                <input
                  placeholder="Otsi tooteid..."
                  className="flex-1 bg-transparent text-white placeholder-white/40 text-[15px] px-3 py-2.5 outline-none"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value
                      handleSearch(val)
                      setMenuOpen(false)
                    }
                  }}
                />
              </div>
            </div>

            <div className="text-[13px] font-semibold text-white/40 uppercase tracking-wider px-2 pt-1 pb-1">
              Elamud ja Ärihooned
            </div>
            {categories.map(cat => (
              <Link
                key={cat.slug}
                href={`/tooted?tegevusala=${cat.slug}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <cat.icon size={16} />
                <span className="text-[15px]">{cat.name}</span>
                <span className="ml-auto text-[13px] text-white/30">{cat.count}</span>
                <ChevronRight size={14} className="text-white/20" />
              </Link>
            ))}

            <div className="border-t border-white/10 pt-2 mt-1">
              <Link href="/tooted"
                className="block px-3 py-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-[15px]"
                onClick={() => setMenuOpen(false)}
              >
                Tooted
              </Link>
              <a
                href="https://ipumps.ee/kontakt/"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-[15px]"
              >
                Projektimüük
              </a>
              <Link href="/leht/kontakt"
                className="block px-3 py-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-[15px]"
                onClick={() => setMenuOpen(false)}
              >
                Kontakt
              </Link>
            </div>

            {/* Keelevalik mobiilis */}
            <div className="border-t border-white/10 pt-2 mt-1">
              <div className="text-[13px] font-semibold text-white/40 uppercase tracking-wider px-2 pb-1">
                Keel
              </div>
              <div className="flex flex-wrap gap-1 px-2">
                {languageOptions.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { switchLocale(l.code); setMenuOpen(false) }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[14px] font-medium transition-colors ${
                      l.code === locale
                        ? 'bg-white text-[#003366]'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {l.flag} {l.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </header>
  )
}
