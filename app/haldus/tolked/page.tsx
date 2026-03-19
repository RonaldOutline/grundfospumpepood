'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { RefreshCw, CheckCircle2, AlertCircle, Globe } from 'lucide-react'

const LANG_LABELS: Record<string, string> = {
  en: '🇬🇧 English',
  ru: '🇷🇺 Русский',
  lv: '🇱🇻 Latviešu',
  lt: '🇱🇹 Lietuvių',
  pl: '🇵🇱 Polski',
}

type LocaleStat = { translated: number; missing: number; total: number }
type Stats = Record<string, LocaleStat>

export default function TolkedPage() {
  const router  = useRouter()
  const { profile } = useAuth()

  const [stats,       setStats]       = useState<Stats | null>(null)
  const [total,       setTotal]       = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [translating, setTranslating] = useState<string | null>(null) // locale | 'all' | null
  const [results,     setResults]     = useState<Record<string, { translated: number; error?: string }> | null>(null)
  const [error,       setError]       = useState('')

  useEffect(() => {
    if (profile && profile.role !== 'superadmin') router.replace('/haldus')
  }, [profile, router])

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/haldus/ui-translate')
      const data = await res.json()
      setStats(data.stats)
      setTotal(data.total)
    } catch {
      setError('Statistika laadimine ebaõnnestus')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  async function runTranslation(locale?: string, force = false) {
    setError('')
    setResults(null)
    setTranslating(locale ?? 'all')
    try {
      const res  = await fetch('/api/haldus/ui-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(locale ? { locale } : {}), force }),
      })
      const data = await res.json()
      setResults(data.results)
      await loadStats()
    } catch {
      setError('Tõlkimine ebaõnnestus')
    } finally {
      setTranslating(null)
    }
  }

  if (profile?.role !== 'superadmin') return null

  const totalMissing = stats
    ? Object.values(stats).reduce((s, l) => s + l.missing, 0)
    : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tõlgid</h1>
          <p className="text-[14px] text-gray-500 mt-0.5">
            Liidese tekstide automaattõlge eesti keelest teistesse keeltesse
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors text-[14px] disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Värskenda
          </button>
          <button
            onClick={() => runTranslation(undefined, false)}
            disabled={translating !== null || totalMissing === 0}
            className="flex items-center gap-2 px-5 py-2 bg-[#003366] text-white font-semibold rounded-xl hover:bg-[#004080] transition-colors disabled:opacity-50 text-[14px]"
          >
            {translating === 'all'
              ? <><RefreshCw size={15} className="animate-spin" /> Tõlgin...</>
              : <><Globe size={15} /> Tõlgi kõik puuduvad</>
            }
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-[14px] flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Summary bar */}
      {stats && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[15px] font-semibold text-gray-900">Üldine katvus</span>
            <span className={`text-[13px] font-semibold px-2.5 py-1 rounded-full ${
              totalMissing === 0 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {totalMissing === 0 ? 'Kõik tõlgitud ✓' : `${totalMissing} tõlget puudub`}
            </span>
          </div>
          <div className="text-[13px] text-gray-500">
            Põhikeel: 🇪🇪 Eesti · {total} teksti kokku · {Object.keys(stats).length} sihtkeelt
          </div>
        </div>
      )}

      {/* Per-locale cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading && !stats
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                <div className="h-5 bg-gray-100 rounded w-1/2 mb-3" />
                <div className="h-2 bg-gray-100 rounded mb-2" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
              </div>
            ))
          : Object.entries(stats ?? {}).map(([locale, stat]) => {
              const pct     = total > 0 ? Math.round((stat.translated / total) * 100) : 0
              const isBusy  = translating === locale
              const locResult = results?.[locale]

              return (
                <div key={locale} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-semibold text-gray-900">{LANG_LABELS[locale] ?? locale}</span>
                    <span className={`text-[13px] font-semibold ${pct === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                      {pct}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-500' : 'bg-[#003366]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[13px] text-gray-500">
                    <span>{stat.translated} / {total} tõlgitud</span>
                    {stat.missing > 0 && (
                      <span className="text-amber-600">{stat.missing} puudub</span>
                    )}
                  </div>

                  {/* Result feedback */}
                  {locResult && (
                    <div className={`flex items-center gap-1.5 text-[13px] ${
                      locResult.error ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {locResult.error
                        ? <><AlertCircle size={13} /> {locResult.error}</>
                        : <><CheckCircle2 size={13} /> +{locResult.translated} tõlget lisatud</>
                      }
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => runTranslation(locale, false)}
                      disabled={translating !== null || stat.missing === 0}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#003366] text-white text-[13px] font-medium rounded-xl hover:bg-[#004080] transition-colors disabled:opacity-40"
                    >
                      {isBusy
                        ? <><RefreshCw size={12} className="animate-spin" /> Tõlgin...</>
                        : `Tõlgi puuduvad (${stat.missing})`
                      }
                    </button>
                    <button
                      onClick={() => runTranslation(locale, true)}
                      disabled={translating !== null}
                      title="Tõlgi kõik uuesti, sh olemasolevad"
                      className="px-3 py-2 border border-gray-200 text-gray-500 text-[13px] rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40"
                    >
                      {isBusy ? <RefreshCw size={13} className="animate-spin" /> : '↺'}
                    </button>
                  </div>
                </div>
              )
            })
        }
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-[14px] text-blue-800 space-y-1.5">
        <p className="font-semibold">Kuidas see töötab?</p>
        <ul className="space-y-1 text-blue-700 list-disc list-inside">
          <li>Eestikeelne tekst (<code>messages/et.json</code>) on alati alustekst</li>
          <li>Tõlgid salvestatakse Supabase andmebaasi ja rakendatakse reaalajas</li>
          <li>Puuduvad tõlked — tekstid mida sihtkeeles ei leidu</li>
          <li>↺ nupp tõlgib kõik uuesti (sh juba tõlgitud, kulukas)</li>
        </ul>
      </div>
    </div>
  )
}
