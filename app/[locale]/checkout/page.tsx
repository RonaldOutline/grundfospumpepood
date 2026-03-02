'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  ChevronRight, Lock, Loader2, AlertCircle,
  Search, MapPin, Package, ShieldCheck, Truck, Check
} from 'lucide-react'
import CouponInput from '@/components/checkout/CouponInput'
import { useTranslations } from 'next-intl'

// ─── TÜÜBID ─────────────────────────────────────────────────────────────────

interface AppliedCoupon {
  id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  discountAmount: number
}

interface CartItem {
  id: number
  slug: string
  name: string
  price: number
  image_url: string | null
  qty: number
}

interface ParcelPoint {
  uuid:        string
  name:        string
  address:     string
  city:        string
  postal_code: string
}

const VAT_RATE = 0.22

// ─── OSTUKORV ────────────────────────────────────────────────────────────────

function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('ipumps_cart') || '[]')
  } catch { return [] }
}

// ─── POSTIAUTOMAADI OTSING ──────────────────────────────────────────────────

function ParcelSelect({
  carrier,
  country,
  selected,
  onSelect,
}: {
  carrier: string
  country: string
  selected: ParcelPoint | null
  onSelect: (p: ParcelPoint) => void
}) {
  const t = useTranslations('checkout')
  const [points, setPoints]   = useState<ParcelPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [query, setQuery]     = useState('')
  const [open, setOpen]       = useState(false)
  const wrapRef               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!carrier || !country) return
    setLoading(true)
    setError('')
    setPoints([])

    fetch(`/api/shipping?carrier=${carrier}&country=${country}`)
      .then(r => r.json())
      .then((data: { points?: ParcelPoint[]; error?: string }) => {
        if (data.points && data.points.length > 0) {
          setPoints(data.points)
        } else {
          setError(data.error || t('noParcelsFound'))
        }
      })
      .catch(() => setError(t('connectionError')))
      .finally(() => setLoading(false))
  }, [carrier, country, t])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = points.filter(p =>
    `${p.name} ${p.city} ${p.address}`.toLowerCase().includes(query.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-[15px] text-gray-400">
        <Loader2 size={16} className="animate-spin" />
        {t('loadingParcels')}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-3 text-[15px] text-red-500">
        <AlertCircle size={16} />
        {error}
      </div>
    )
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 border rounded-xl text-left text-[15px] transition-colors ${
          open ? 'border-[#003366]' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <MapPin size={16} className="text-gray-400 flex-shrink-0" />
        <span className={selected ? 'text-gray-800 flex-1 min-w-0' : 'text-gray-400 flex-1'}>
          {selected ? (
            <span className="block truncate">
              <span className="font-medium">{selected.name}</span>
              <span className="text-gray-400"> — {selected.city}</span>
            </span>
          ) : t('selectParcel')}
        </span>
        <ChevronRight
          size={14}
          className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                type="search"
                placeholder={t('searchParcel')}
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[15px] text-gray-900 outline-none bg-gray-50 rounded-lg"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-[15px] text-gray-400">
                {t('noMachinesFound')}
              </div>
            ) : (
              filtered.map(point => (
                <button
                  key={point.uuid}
                  type="button"
                  onClick={() => {
                    onSelect(point)
                    setOpen(false)
                    setQuery('')
                  }}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 ${
                    selected?.uuid === point.uuid ? 'bg-blue-50' : ''
                  }`}
                >
                  <MapPin size={14} className="text-[#003366] flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-medium text-gray-800 truncate">
                      {point.name}
                    </div>
                    <div className="text-[13px] text-gray-400">
                      {point.address}{point.address && point.city ? ', ' : ''}{point.city}
                    </div>
                  </div>
                  {selected?.uuid === point.uuid && (
                    <Check size={14} className="text-[#003366] flex-shrink-0 mt-0.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PEAKOMPONENT ────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const t    = useTranslations('checkout')
  const tNav = useTranslations('nav')

  const countries = [
    {
      code: 'EE', name: t('countryEE'), carriers: [
        { code: 'omniva',    name: 'Omniva' },
        { code: 'dpd',       name: 'DPD' },
        { code: 'smartpost', name: 'Itella SmartPost' },
      ],
    },
    {
      code: 'LV', name: t('countryLV'), carriers: [
        { code: 'omniva',   name: 'Omniva' },
        { code: 'dpd',      name: 'DPD' },
        { code: 'venipak',  name: 'Venipak' },
      ],
    },
    {
      code: 'LT', name: t('countryLT'), carriers: [
        { code: 'omniva',   name: 'Omniva' },
        { code: 'dpd',      name: 'DPD' },
        { code: 'venipak',  name: 'Venipak' },
      ],
    },
    {
      code: 'FI', name: t('countryFI'), carriers: [
        { code: 'smartpost', name: 'Itella SmartPost' },
      ],
    },
  ]

  const [items, setItems]         = useState<CartItem[]>([])
  const [mounted, setMounted]     = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [email, setEmail]         = useState('')
  const [phone, setPhone]         = useState('')
  const [company, setCompany]     = useState('')
  const [notes, setNotes]         = useState('')

  const [countryCode, setCountryCode]   = useState('EE')
  const [carrierCode, setCarrierCode]   = useState('omniva')
  const [selectedPoint, setSelectedPoint] = useState<ParcelPoint | null>(null)

  const [coupon, setCoupon]     = useState<AppliedCoupon | null>(null)

  const [errors, setErrors]     = useState<Record<string, string>>({})
  const [loading, setLoading]   = useState(false)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    setItems(getCart())
    setMounted(true)
  }, [])

  const handleCountryChange = (code: string) => {
    setCountryCode(code)
    const country = countries.find(c => c.code === code)
    setCarrierCode(country?.carriers[0]?.code || 'omniva')
    setSelectedPoint(null)
  }

  const handleCarrierChange = (code: string) => {
    setCarrierCode(code)
    setSelectedPoint(null)
  }

  const subtotal  = items.reduce((s, i) => s + i.price * i.qty, 0)
  const discount  = coupon ? coupon.discountAmount : 0
  const vat       = (subtotal - discount) * VAT_RATE
  const total     = subtotal - discount + vat

  const currentCountry  = countries.find(c => c.code === countryCode)!
  const currentCarrier  = currentCountry.carriers.find(c => c.code === carrierCode)!

  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {}
    if (!firstName.trim()) e.firstName = t('required')
    if (!lastName.trim())  e.lastName  = t('required')
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = t('invalidEmail')
    if (!phone.trim())     e.phone     = t('required')
    if (!selectedPoint)    e.point     = t('selectParcelError')
    setErrors(e)
    return Object.keys(e).length === 0
  }, [firstName, lastName, email, phone, selectedPoint, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setApiError('')

    try {
      const res = await fetch('/api/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            first_name: firstName,
            last_name:  lastName,
            email,
            phone,
            ...(company.trim() && { company: company.trim() }),
          },
          shipping: {
            carrier:              carrierCode,
            carrier_name:         currentCarrier.name,
            country:              countryCode,
            pickup_point_uuid:    selectedPoint!.uuid,
            pickup_point_name:    selectedPoint!.name,
            pickup_point_address: selectedPoint!.address,
            pickup_point_city:    selectedPoint!.city,
            pickup_point_postal:  selectedPoint!.postal_code,
          },
          notes:      notes.trim() || undefined,
          coupon_id:  coupon?.id || undefined,
          items: items.map(i => ({
            id: i.id, slug: i.slug, name: i.name,
            price: i.price, qty: i.qty,
          })),
        }),
      })

      const data = await res.json() as { payment_url?: string; error?: string }

      if (!res.ok || !data.payment_url) {
        setApiError(data.error || t('orderFailed'))
        setLoading(false)
        return
      }

      localStorage.removeItem('ipumps_cart')
      window.dispatchEvent(new Event('cart_updated'))
      window.location.href = data.payment_url
    } catch {
      setApiError(t('connectionFailed'))
      setLoading(false)
    }
  }

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🛒</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">{t('emptyCart')}</h1>
          <p className="text-[15px] text-gray-500 mb-5">{t('emptyCartHint')}</p>
          <Link href="/tooted"
            className="bg-[#003366] text-white px-6 py-3 rounded-xl font-semibold text-[15px] hover:bg-[#004080] transition-colors">
            {t('viewProducts')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Leivaküljed */}
        <nav className="flex items-center gap-2 text-[15px] text-gray-400 mb-6">
          <Link href="/" className="hover:text-[#003366] transition-colors">{tNav('home')}</Link>
          <ChevronRight size={14} />
          <Link href="/ostukorv" className="hover:text-[#003366] transition-colors">{tNav('cart')}</Link>
          <ChevronRight size={14} />
          <span className="text-gray-700 font-medium">{t('title')}</span>
        </nav>

        <h1 className="text-2xl md:text-3xl font-bold text-[#003366] mb-8">{t('title')}</h1>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* ── Vasak veerg ─────────────────────────────────────────── */}
            <div className="lg:col-span-3 space-y-5">

              {/* Kontaktandmed */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 text-[17px] mb-5">{t('contactDetails')}</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[15px] font-medium text-gray-700 mb-1.5">
                      {t('firstName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text" value={firstName}
                      onChange={e => { setFirstName(e.target.value); setErrors(p => ({...p, firstName:''})) }}
                      className={`w-full px-4 py-3 border rounded-xl text-[15px] text-gray-900 outline-none transition-colors ${errors.firstName ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-[#003366]'}`}
                    />
                    {errors.firstName && <p className="text-[13px] text-red-500 mt-1">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-[15px] font-medium text-gray-700 mb-1.5">
                      {t('lastName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text" value={lastName}
                      onChange={e => { setLastName(e.target.value); setErrors(p => ({...p, lastName:''})) }}
                      className={`w-full px-4 py-3 border rounded-xl text-[15px] text-gray-900 outline-none transition-colors ${errors.lastName ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-[#003366]'}`}
                    />
                    {errors.lastName && <p className="text-[13px] text-red-500 mt-1">{errors.lastName}</p>}
                  </div>

                  <div>
                    <label className="block text-[15px] font-medium text-gray-700 mb-1.5">
                      {t('emailAddress')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email" value={email} placeholder="mina@firma.ee"
                      onChange={e => { setEmail(e.target.value); setErrors(p => ({...p, email:''})) }}
                      className={`w-full px-4 py-3 border rounded-xl text-[15px] text-gray-900 outline-none transition-colors ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-[#003366]'}`}
                    />
                    {errors.email && <p className="text-[13px] text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-[15px] font-medium text-gray-700 mb-1.5">
                      {t('phone')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel" value={phone} placeholder="+372 5XXX XXXX"
                      onChange={e => { setPhone(e.target.value); setErrors(p => ({...p, phone:''})) }}
                      className={`w-full px-4 py-3 border rounded-xl text-[15px] text-gray-900 outline-none transition-colors ${errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-[#003366]'}`}
                    />
                    {errors.phone && <p className="text-[13px] text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-[15px] font-medium text-gray-700 mb-1.5">
                    {t('companyName')} <span className="text-gray-400 font-normal">{t('optional')}</span>
                  </label>
                  <input
                    type="text" value={company} placeholder="OÜ Näidis"
                    onChange={e => setCompany(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366] transition-colors"
                  />
                </div>
              </div>

              {/* Tarne */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 text-[17px] mb-5">{t('shippingTitle')}</h2>

                <div className="space-y-4">

                  {/* Riik */}
                  <div>
                    <label className="block text-[15px] font-medium text-gray-700 mb-1.5">
                      {t('country')} <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {countries.map(c => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => handleCountryChange(c.code)}
                          className={`py-2.5 rounded-xl border text-[15px] font-medium transition-colors ${
                            countryCode === c.code
                              ? 'bg-[#003366] text-white border-[#003366]'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-[#003366] hover:text-[#003366]'
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Kandja */}
                  <div>
                    <label className="block text-[15px] font-medium text-gray-700 mb-1.5">
                      {t('carrier')} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {currentCountry.carriers.map(c => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => handleCarrierChange(c.code)}
                          className={`px-4 py-2.5 rounded-xl border text-[15px] font-medium transition-colors ${
                            carrierCode === c.code
                              ? 'bg-[#003366] text-white border-[#003366]'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-[#003366] hover:text-[#003366]'
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Postiautomaad */}
                  <div>
                    <label className="block text-[15px] font-medium text-gray-700 mb-1.5">
                      {t('parcelMachine')} <span className="text-red-500">*</span>
                    </label>
                    <ParcelSelect
                      carrier={carrierCode}
                      country={countryCode}
                      selected={selectedPoint}
                      onSelect={p => { setSelectedPoint(p); setErrors(prev => ({...prev, point:''})) }}
                    />
                    {errors.point && (
                      <p className="text-[13px] text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.point}
                      </p>
                    )}

                    {selectedPoint && (
                      <div className="mt-2 flex items-start gap-2 bg-blue-50 rounded-xl px-4 py-3">
                        <MapPin size={14} className="text-[#003366] mt-0.5 flex-shrink-0" />
                        <div className="text-[13px] text-[#003366]">
                          <div className="font-semibold">{selectedPoint.name}</div>
                          <div className="text-[#003366]/70">
                            {selectedPoint.address}{selectedPoint.address ? ', ' : ''}
                            {selectedPoint.city} {selectedPoint.postal_code}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Märkused */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 text-[17px] mb-3">{t('notes')}</h2>
                <textarea
                  placeholder={t('notesPlaceholder')}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366] transition-colors resize-none placeholder:text-gray-400"
                />
              </div>

              {/* API viga */}
              {apiError && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[15px] text-red-700">{apiError}</p>
                </div>
              )}
            </div>

            {/* ── Parem veerg — kokkuvõte ─────────────────────────────── */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
                <h2 className="font-bold text-gray-900 text-[17px] mb-5">{t('orderSummary')}</h2>

                {/* Tooted */}
                <div className="space-y-3 mb-5 max-h-64 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 p-1">
                        <img
                          src={item.image_url || '/placeholder.png'}
                          alt={item.name}
                          className="h-9 object-contain"
                          onError={e => { (e.target as HTMLImageElement).src = '/placeholder.png' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-gray-700 line-clamp-1">{item.name}</div>
                        <div className="text-[13px] text-gray-400">
                          {item.qty} × {Number(item.price).toFixed(2).replace('.', ',')} €
                        </div>
                      </div>
                      <div className="text-[15px] font-semibold text-gray-800 flex-shrink-0">
                        {(item.price * item.qty).toFixed(2).replace('.', ',')} €
                      </div>
                    </div>
                  ))}
                </div>

                {/* Kupongikood */}
                <div className="mb-4">
                  <CouponInput subtotal={subtotal} applied={coupon} onApply={setCoupon} />
                </div>

                {/* Hinnad */}
                <div className="border-t border-gray-100 pt-4 space-y-2.5 mb-5">
                  <div className="flex justify-between text-[15px]">
                    <span className="text-gray-500">{t('subtotalExVat')}</span>
                    <span className="font-medium">{subtotal.toFixed(2).replace('.', ',')} €</span>
                  </div>
                  {coupon && (
                    <div className="flex justify-between text-[15px]">
                      <span className="text-green-600">{t('discount')} ({coupon.code})</span>
                      <span className="font-medium text-green-600">−{coupon.discountAmount.toFixed(2).replace('.', ',')} €</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[15px]">
                    <span className="text-gray-500">{t('vatAmount')}</span>
                    <span className="font-medium">{vat.toFixed(2).replace('.', ',')} €</span>
                  </div>
                  <div className="flex justify-between text-[15px]">
                    <span className="text-gray-500">{t('delivery')}</span>
                    <span className="text-[#01a0dc] font-medium">{t('free')}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-2.5 flex justify-between items-baseline">
                    <span className="font-bold text-gray-900 text-[17px]">{t('total')}</span>
                    <span className="font-bold text-[#003366] text-xl">
                      {total.toFixed(2).replace('.', ',')} €
                    </span>
                  </div>
                </div>

                {/* Valitud tarne kokkuvõte */}
                {selectedPoint && (
                  <div className="mb-4 bg-gray-50 rounded-xl p-3 text-[13px]">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Truck size={13} />
                      <span className="font-medium">{currentCarrier.name}</span>
                    </div>
                    <div className="text-gray-700 font-medium">{selectedPoint.name}</div>
                    <div className="text-gray-400">{selectedPoint.city}</div>
                  </div>
                )}

                {/* Maksa nupp */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[#003366] text-white py-4 rounded-xl font-bold text-[15px] hover:bg-[#004080] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin" /> {t('redirectingToPayment')}</>
                  ) : (
                    <><Lock size={16} /> {t('orderAndPay')} {total.toFixed(2).replace('.', ',')} €</>
                  )}
                </button>

                {/* Usalduse indikaatorid */}
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2">
                  {[
                    { icon: Lock,        label: t('secure') },
                    { icon: Package,     label: t('original') },
                    { icon: ShieldCheck, label: t('guarantee') },
                  ].map(b => (
                    <div key={b.label} className="flex flex-col items-center gap-1">
                      <b.icon size={15} className="text-[#003366]" />
                      <span className="text-[13px] text-gray-400">{b.label}</span>
                    </div>
                  ))}
                </div>

                <p className="text-[13px] text-gray-400 text-center mt-3">
                  {t('paymentVia')}{' '}
                  <span className="font-semibold text-gray-500">Montonio</span>{' '}
                  {t('secureBankLink')}
                </p>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  )
}
