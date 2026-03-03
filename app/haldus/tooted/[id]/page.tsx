'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Trash2, Plus, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import StatusToggle from '@/components/haldus/StatusToggle'
import ProductImageUpload from '@/components/haldus/ProductImageUpload'
import ConfirmDialog from '@/components/haldus/ConfirmDialog'

const canManageProducts = (role: string) => role === 'superadmin'

interface BulkPriceRow {
  id?: string
  min_quantity: number
  price: number
  isNew?: boolean
}

interface Category { slug: string; name_et: string }

interface Product {
  id: string; sku: string | null; slug: string | null; name: string
  short_description_et: string | null; description_et: string | null
  price: number; sale_price: number | null; in_stock: boolean
  image_url: string | null; published: boolean
  weight_kg: number | null; length_cm: number | null
  width_cm: number | null; height_cm: number | null
}

export default function MuudaToode() {
  const router = useRouter()
  const { id }  = useParams<{ id: string }>()
  const { profile } = useAuth()

  const [product, setProduct]   = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError]       = useState('')
  const [saved, setSaved]       = useState(false)
  const [bulkPrices, setBulkPrices] = useState<BulkPriceRow[]>([])
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkSaved, setBulkSaved]   = useState(false)

  // form state
  const [name, setName]         = useState('')
  const [sku, setSku]           = useState('')
  const [slug, setSlug]         = useState('')
  const [shortDesc, setShortDesc] = useState('')
  const [desc, setDesc]         = useState('')
  const [price, setPrice]       = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [inStock, setInStock]   = useState(true)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [published, setPublished] = useState(true)
  const [catSlugs, setCatSlugs] = useState<string[]>([])
  const [weight, setWeight]     = useState('')
  const [length, setLength]     = useState('')
  const [width, setWidth]       = useState('')
  const [height, setHeight]     = useState('')

  useEffect(() => {
    if (profile && !canManageProducts(profile.role)) router.replace('/haldus')
  }, [profile, router])

  useEffect(() => {
    if (!id) return
    async function load() {
      const [prodRes, catRes, pcRes, bpRes] = await Promise.all([
        supabase.from('products').select('*').eq('id', id).single(),
        supabase.from('categories').select('slug, name_et').order('name_et'),
        supabase.from('product_categories').select('category_slug').eq('product_id', id),
        supabase.from('bulk_pricing').select('id, min_quantity, price').eq('product_id', id).order('min_quantity'),
      ])
      if (prodRes.error || !prodRes.data) { setNotFound(true); setLoading(false); return }

      const p = prodRes.data as Product
      setProduct(p)
      setCategories(catRes.data ?? [])

      setName(p.name)
      setSku(p.sku ?? '')
      setSlug(p.slug ?? '')
      setShortDesc(p.short_description_et ?? '')
      setDesc(p.description_et ?? '')
      setPrice(String(p.price))
      setSalePrice(p.sale_price ? String(p.sale_price) : '')
      setInStock(p.in_stock)
      setImageUrl(p.image_url)
      setPublished(p.published)
      setWeight(p.weight_kg ? String(p.weight_kg) : '')
      setLength(p.length_cm ? String(p.length_cm) : '')
      setWidth(p.width_cm  ? String(p.width_cm)  : '')
      setHeight(p.height_cm ? String(p.height_cm) : '')
      setCatSlugs((pcRes.data ?? []).map(r => r.category_slug))
      setBulkPrices((bpRes.data ?? []) as BulkPriceRow[])
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !price) { setError('Nimi ja hind on kohustuslikud'); return }
    setSaving(true); setError(''); setSaved(false)

    const { error: err } = await supabase.from('products').update({
      name: name.trim(), sku: sku.trim() || null, slug: slug.trim() || null,
      short_description_et: shortDesc.trim() || null,
      description_et: desc.trim() || null,
      price: parseFloat(price),
      sale_price: salePrice ? parseFloat(salePrice) : null,
      in_stock: inStock, image_url: imageUrl, published,
      weight_kg: weight ? parseFloat(weight) : null,
      length_cm: length ? parseFloat(length) : null,
      width_cm:  width  ? parseFloat(width)  : null,
      height_cm: height ? parseFloat(height) : null,
      updated_at: new Date().toISOString(),
    }).eq('id', id)

    if (err) { setError(err.message); setSaving(false); return }

    // Fire-and-forget auto-translation (non-blocking)
    const fieldsToTranslate: Record<string, string> = {}
    if (desc.trim()) fieldsToTranslate.description = desc.trim()
    if (shortDesc.trim()) fieldsToTranslate.short_description = shortDesc.trim()
    if (Object.keys(fieldsToTranslate).length > 0) {
      fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'products', id: Number(id), fields: fieldsToTranslate }),
      }).catch(console.error)
    }

    // Update categories
    await supabase.from('product_categories').delete().eq('product_id', id)
    if (catSlugs.length > 0) {
      await supabase.from('product_categories').insert(
        catSlugs.map(slug => ({ product_id: id, category_slug: slug }))
      )
    }

    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('product_categories').delete().eq('product_id', id)
    await supabase.from('products').delete().eq('id', id)
    router.push('/haldus/tooted')
  }

  async function handleSaveBulk() {
    setBulkSaving(true); setBulkSaved(false)
    // Kustuta vanad read
    await supabase.from('bulk_pricing').delete().eq('product_id', id)
    // Lisa uued
    const rows = bulkPrices.filter(r => r.min_quantity > 0 && r.price > 0)
    if (rows.length > 0) {
      await supabase.from('bulk_pricing').insert(
        rows.map(r => ({ product_id: Number(id), min_quantity: r.min_quantity, price: r.price }))
      )
    }
    setBulkSaving(false); setBulkSaved(true)
    setTimeout(() => setBulkSaved(false), 3000)
  }

  function addBulkRow() {
    setBulkPrices(prev => [...prev, { min_quantity: 0, price: 0, isNew: true }])
  }

  function updateBulkRow(idx: number, field: 'min_quantity' | 'price', val: string) {
    setBulkPrices(prev => prev.map((r, i) => i === idx ? { ...r, [field]: Number(val) } : r))
  }

  function removeBulkRow(idx: number) {
    setBulkPrices(prev => prev.filter((_, i) => i !== idx))
  }

  if (!canManageProducts(profile?.role ?? '')) return null

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">Toodet ei leitud.</p>
        <Link href="/haldus/tooted" className="text-[#003366] hover:underline">← Tagasi toodetele</Link>
      </div>
    )
  }

  const dimFields = [
    { label: 'Kaal (kg)',   value: weight, setter: setWeight },
    { label: 'Pikkus (cm)', value: length, setter: setLength },
    { label: 'Laius (cm)',  value: width,  setter: setWidth  },
    { label: 'Kõrgus (cm)', value: height, setter: setHeight },
  ]

  return (
    <>
      <ConfirmDialog
        open={confirmOpen}
        title="Kustuta toode"
        message={`Kas oled kindel, et soovid kustutada toote "${product.name}"? Seda toimingut ei saa tagasi võtta.`}
        confirmLabel={deleting ? 'Kustutan...' : 'Kustuta'}
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/haldus/tooted" className="text-gray-400 hover:text-[#003366] transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 line-clamp-1">{product.name}</h1>
          </div>
          <button type="button" onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-[14px] font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
            <Trash2 size={14} /> Kustuta toode
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-[15px]">{error}</div>}
        {saved  && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-[15px]">Muudatused salvestatud!</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Vasakpoolne */}
          <div className="lg:col-span-2 space-y-5">

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Põhiandmed</h2>
              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Nimi <span className="text-red-500">*</span></label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[15px] font-medium text-gray-700 mb-1.5">SKU</label>
                  <input value={sku} onChange={e => setSku(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 font-mono outline-none focus:border-[#003366]" />
                </div>
                <div>
                  <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Slug</label>
                  <input value={slug} onChange={e => setSlug(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 font-mono outline-none focus:border-[#003366]" />
                </div>
              </div>
              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Lühikirjeldus</label>
                <textarea value={shortDesc} onChange={e => setShortDesc(e.target.value)} rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366] resize-none" />
              </div>
              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Kirjeldus</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366] resize-y" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Hind ja laoseis</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Hind (€) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]" />
                </div>
                <div>
                  <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Soodushind (€)</label>
                  <input type="number" step="0.01" min="0" value={salePrice} onChange={e => setSalePrice(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]" placeholder="—" />
                </div>
              </div>
              <StatusToggle checked={inStock} onChange={setInStock} label="Toode on laos" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Mõõtmed ja kaal</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {dimFields.map(f => (
                  <div key={f.label}>
                    <label className="block text-[15px] font-medium text-gray-700 mb-1.5">{f.label}</label>
                    <input type="number" step="any" min="0" value={f.value} onChange={e => f.setter(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]" placeholder="—" />
                  </div>
                ))}
              </div>
            </div>

            {/* Hulgihinnad */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">Hulgihinnad</h2>
                  <p className="text-[13px] text-gray-400 mt-0.5">Hind rakendub automaatselt koguse põhjal</p>
                </div>
                {bulkSaved && <span className="text-[13px] text-green-600 font-medium">Salvestatud!</span>}
              </div>

              {bulkPrices.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-[13px] font-medium text-gray-500 px-1">
                    <span>Min kogus (tk)</span>
                    <span>Ühiku hind (€)</span>
                    <span />
                  </div>
                  {bulkPrices.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                      <input
                        type="number" min="1" step="1"
                        value={row.min_quantity || ''}
                        onChange={e => updateBulkRow(idx, 'min_quantity', e.target.value)}
                        placeholder="nt 5"
                        className="px-3 py-2.5 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]"
                      />
                      <input
                        type="number" min="0" step="0.01"
                        value={row.price || ''}
                        onChange={e => updateBulkRow(idx, 'price', e.target.value)}
                        placeholder="nt 89.99"
                        className="px-3 py-2.5 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]"
                      />
                      <button type="button" onClick={() => removeBulkRow(idx)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button type="button" onClick={addBulkRow}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-[15px] text-gray-600 hover:border-[#003366] hover:text-[#003366] transition-colors">
                  <Plus size={15} /> Lisa rida
                </button>
                <button type="button" onClick={handleSaveBulk} disabled={bulkSaving}
                  className="px-4 py-2.5 bg-[#003366] text-white font-semibold rounded-xl hover:bg-[#004080] transition-colors disabled:opacity-60 text-[15px]">
                  {bulkSaving ? 'Salvestan...' : 'Salvesta hulgihinnad'}
                </button>
              </div>
            </div>
          </div>

          {/* Parempoolne */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Staatus</h2>
              <StatusToggle checked={published} onChange={setPublished}
                label={published ? 'Aktiivne (nähtav klientidele)' : 'Peidetud'} />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Kategooriad</h2>
              <div className="space-y-2">
                {categories.map(c => (
                  <label key={c.slug} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={catSlugs.includes(c.slug)}
                      onChange={e => setCatSlugs(prev =>
                        e.target.checked ? [...prev, c.slug] : prev.filter(s => s !== c.slug)
                      )}
                      className="w-4 h-4 rounded border-gray-300 text-[#003366] accent-[#003366]"
                    />
                    <span className="text-[15px] text-gray-700 group-hover:text-gray-900">{c.name_et}</span>
                  </label>
                ))}
                {categories.length === 0 && (
                  <p className="text-[14px] text-gray-400">Kategooriaid pole</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Pilt</h2>
              <ProductImageUpload currentUrl={imageUrl} onUpload={setImageUrl} onRemove={() => setImageUrl(null)} />
            </div>

            <button type="submit" disabled={saving}
              className="w-full py-3 bg-[#003366] text-white font-semibold rounded-xl hover:bg-[#004080] transition-colors disabled:opacity-60">
              {saving ? 'Salvestan...' : 'Salvesta muudatused'}
            </button>
          </div>
        </div>
      </form>
    </>
  )
}
