'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  ShoppingCart, ChevronRight, Package, Truck, Shield,
  Phone, ChevronLeft, ZoomIn, Check, Share2, Printer
} from 'lucide-react'
import { useTranslations } from 'next-intl'

// ─── TÜÜBID ────────────────────────────────────────────────────────────────

interface Product {
  id: number
  sku: string
  slug: string
  name: string
  short_description_et: string
  description_et: string
  price: number
  sale_price: number | null
  image_url: string
  in_stock: boolean
  weight_kg: number | null
  length_cm: number | null
  width_cm: number | null
  height_cm: number | null
  tags: string | null
  curve_url: string | null
  drawing_url: string | null
}

interface Attribute {
  attribute_name: string
  attribute_value: string
}

interface RelatedProduct {
  id: number
  name: string
  slug: string
  price: number
  image_url: string
  short_description_et: string
}

interface BulkPrice {
  id: string
  min_quantity: number
  price: number
}

// ─── PÄIS ──────────────────────────────────────────────────────────────────

function Header() {
  const t = useTranslations('nav')

  return (
    <header className="bg-[#003366] sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center flex-shrink-0">
          <img src="/ipumps-logo-white.svg" alt="iPumps" className="h-8 w-auto" />
        </a>
        <nav className="hidden lg:flex items-center gap-1">
          {[
            { labelKey: 'buildings', href: '/#kategooriad' },
            { labelKey: 'products', href: '/tooted' },
            { labelKey: 'projectSales', href: 'https://ipumps.ee/kontakt/' },
            { labelKey: 'contact', href: '/#kontakt' },
          ].map(item => (
            <a key={item.labelKey} href={item.href}
              className="text-white/90 hover:text-white px-3 py-2 rounded text-[15px] font-medium transition-colors hover:bg-white/10">
              {t(item.labelKey)}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href="/ostukorv" className="relative p-2.5 text-white/80 hover:text-white transition-colors hover:bg-white/10 rounded-lg">
            <ShoppingCart size={18} />
            <span className="absolute top-1 right-1 bg-[#01a0dc] text-white text-[11px] w-4 h-4 rounded-full flex items-center justify-center font-bold">0</span>
          </a>
        </div>
      </div>
    </header>
  )
}

// ─── LEIVAKÜLJED ───────────────────────────────────────────────────────────

function Breadcrumb({ product }: { product: Product }) {
  const t = useTranslations('nav')
  const tCommon = useTranslations('common')

  return (
    <nav className="bg-gray-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-[15px] text-gray-500 flex-wrap">
        <a href="/" className="hover:text-[#003366] transition-colors">{tCommon('home')}</a>
        <ChevronRight size={14} className="text-gray-300" />
        <a href="/tooted" className="hover:text-[#003366] transition-colors">{t('products')}</a>
        <ChevronRight size={14} className="text-gray-300" />
        <span className="text-gray-800 font-medium truncate max-w-xs">{product.name}</span>
      </div>
    </nav>
  )
}

// ─── PILDIGALERII ──────────────────────────────────────────────────────────

function ProductGallery({ image, name }: { image: string; name: string }) {
  const [zoomed, setZoomed] = useState(false)

  return (
    <div className="relative">
      <div
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-zoom-in group shadow-sm"
        onClick={() => setZoomed(true)}
      >
        <div className="relative aspect-square flex items-center justify-center p-8">
          <img
            src={image || '/placeholder.png'}
            alt={name}
            className="max-h-80 object-contain group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png' }}
          />
          <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
            <ZoomIn size={16} className="text-gray-600" />
          </div>
        </div>
      </div>

      {zoomed && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8 cursor-zoom-out"
          onClick={() => setZoomed(false)}
        >
          <img
            src={image}
            alt={name}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}
    </div>
  )
}

// ─── TOOTE INFO ────────────────────────────────────────────────────────────

function ProductInfo({
  product, onAddToCart, bulkPrices,
}: {
  product: Product
  onAddToCart: (qty: number, effectivePrice: number) => void
  bulkPrices: BulkPrice[]
}) {
  const t = useTranslations('product')
  const tBenefits = useTranslations('benefits')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const basePrice = product.sale_price ?? product.price

  function getEffectivePrice(q: number): number {
    if (bulkPrices.length === 0) return basePrice
    const sorted = [...bulkPrices].sort((a, b) => b.min_quantity - a.min_quantity)
    const match  = sorted.find(bp => q >= bp.min_quantity)
    return match ? match.price : basePrice
  }

  const effectivePrice = getEffectivePrice(qty)

  const handleAdd = () => {
    onAddToCart(qty, effectivePrice)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* SKU */}
      <div className="text-[15px] text-gray-400">
        {t('productCode')}: <span className="font-mono text-gray-600">{product.sku}</span>
      </div>

      {/* Nimi */}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
        {product.name}
      </h1>

      {/* Sildid */}
      {product.tags && (
        <div className="flex flex-wrap gap-1.5">
          {product.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
            <span key={tag} className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#003366]/8 text-[#003366] text-[13px] font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Lühikirjeldus */}
      {product.short_description_et && (
        <p className="text-[15px] text-gray-600 leading-relaxed border-l-2 border-[#01a0dc] pl-4">
          {product.short_description_et}
        </p>
      )}

      {/* Hind */}
      <div className="flex items-baseline gap-3">
        {effectivePrice < product.price ? (
          <>
            <span className="text-3xl font-bold text-[#003366]">
              {effectivePrice.toFixed(2).replace('.', ',')} €
            </span>
            <span className="text-[15px] text-gray-400 line-through">
              {product.price.toFixed(2).replace('.', ',')} €
            </span>
            <span className="bg-[#01a0dc] text-white text-[15px] font-bold px-2 py-0.5 rounded-lg">
              -{Math.round((1 - effectivePrice / product.price) * 100)}%
            </span>
          </>
        ) : (
          <span className="text-3xl font-bold text-[#003366]">
            {Number(product.price).toFixed(2).replace('.', ',')} €
          </span>
        )}
        <span className="text-[15px] text-gray-400">{t('vatExcl')}</span>
      </div>

      {/* Hulgihinnad */}
      <BulkPricingTable prices={bulkPrices} basePrice={product.price} />

      {/* Laoseis */}
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${product.in_stock ? 'bg-green-500' : 'bg-red-400'}`} />
        <span className={`text-[15px] font-medium ${product.in_stock ? 'text-green-700' : 'text-red-600'}`}>
          {product.in_stock ? t('inStockFull') : t('outOfStockFull')}
        </span>
      </div>

      {/* Kogus + ostukorv */}
      <div className="flex items-center gap-3">
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setQty(q => Math.max(1, q - 1))}
            className="w-10 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-[15px] font-bold transition-colors"
          >−</button>
          <span className="w-12 text-center text-[15px] font-semibold text-gray-800">{qty}</span>
          <button
            onClick={() => setQty(q => q + 1)}
            className="w-10 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-[15px] font-bold transition-colors"
          >+</button>
        </div>
        <button
          onClick={handleAdd}
          disabled={!product.in_stock}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-[15px] transition-all ${
            added
              ? 'bg-green-500 text-white'
              : product.in_stock
              ? 'bg-[#003366] hover:bg-[#004080] text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {added ? <><Check size={18} /> {t('added')}</> : <><ShoppingCart size={18} /> {t('addToCart')}</>}
        </button>
      </div>

      {/* Päring */}
      <a href="/#kontakt"
        className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl border-2 border-[#003366] text-[#003366] hover:bg-[#003366] hover:text-white font-semibold text-[15px] transition-all">
        <Phone size={16} /> {t('requestQuote')}
      </a>

      {/* Eelised */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
        {([
          { icon: Truck,   label: tBenefits('shipping') },
          { icon: Shield,  label: tBenefits('warranty') },
          { icon: Package, label: t('original') },
        ] as const).map((b, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 text-center">
            <div className="w-9 h-9 bg-[#003366]/8 rounded-xl flex items-center justify-center">
              <b.icon size={16} className="text-[#003366]" />
            </div>
            <span className="text-[15px] text-gray-500">{b.label}</span>
          </div>
        ))}
      </div>

      {/* Jaga / Prindi */}
      <div className="flex items-center gap-3 pt-1">
        <button className="flex items-center gap-1.5 text-[15px] text-gray-400 hover:text-[#003366] transition-colors">
          <Share2 size={15} /> {t('share')}
        </button>
        <button onClick={() => window.print()}
          className="flex items-center gap-1.5 text-[15px] text-gray-400 hover:text-[#003366] transition-colors">
          <Printer size={15} /> {t('print')}
        </button>
      </div>
    </div>
  )
}

// ─── ATRIBUUDID ────────────────────────────────────────────────────────────

function AttributesTable({ attributes, product }: { attributes: Attribute[]; product: Product }) {
  const t = useTranslations('product')
  const [showAll, setShowAll] = useState(false)

  const physicalAttrs: Attribute[] = []
  if (product.weight_kg) physicalAttrs.push({ attribute_name: 'Kaal (kg)', attribute_value: String(product.weight_kg) })
  if (product.length_cm) physicalAttrs.push({ attribute_name: 'Pikkus (cm)', attribute_value: String(product.length_cm) })
  if (product.width_cm) physicalAttrs.push({ attribute_name: 'Laius (cm)', attribute_value: String(product.width_cm) })
  if (product.height_cm) physicalAttrs.push({ attribute_name: 'Kõrgus (cm)', attribute_value: String(product.height_cm) })

  const allAttrs = [...physicalAttrs, ...attributes]
  const visibleAttrs = showAll ? allAttrs : allAttrs.slice(0, 16)

  if (allAttrs.length === 0) return null

  const half = Math.ceil(visibleAttrs.length / 2)
  const col1 = visibleAttrs.slice(0, half)
  const col2 = visibleAttrs.slice(half)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-[17px]">{t('specs')}</h2>
        <span className="text-[15px] text-gray-400">{allAttrs.length} {t('parameters')}</span>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
          {[col1, col2].map((col, ci) => (
            <div key={ci}>
              {col.map((attr, i) => (
                <div
                  key={i}
                  className={`flex items-start justify-between py-2.5 ${i < col.length - 1 ? 'border-b border-gray-50' : ''}`}
                >
                  <span className="text-[15px] text-gray-500 pr-4 flex-shrink-0 w-1/2">{attr.attribute_name}</span>
                  <span className="text-[15px] font-medium text-gray-800 text-right">{attr.attribute_value}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {allAttrs.length > 16 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-4 w-full py-2.5 border border-gray-200 rounded-xl text-[15px] text-gray-500 hover:border-[#003366] hover:text-[#003366] transition-colors font-medium"
          >
            {showAll ? t('hide') : t('showAllParams', { count: allAttrs.length })}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── TOOTE TABID ───────────────────────────────────────────────────────────

function ProductTabs({
  product, attributes,
}: {
  product: Product
  attributes: Attribute[]
}) {
  const t = useTranslations('product')

  const tabs = [
    { key: 'description', label: t('tabDescription') },
    { key: 'specs',       label: t('tabSpecs') },
    { key: 'drawing',     label: t('tabDrawing') },
    { key: 'curves',      label: t('tabCurves') },
  ]

  const [active, setActive] = useState<string>('description')

  const physicalAttrs: Attribute[] = []
  if (product.weight_kg) physicalAttrs.push({ attribute_name: 'Kaal (kg)',    attribute_value: String(product.weight_kg) })
  if (product.length_cm) physicalAttrs.push({ attribute_name: 'Pikkus (cm)',  attribute_value: String(product.length_cm) })
  if (product.width_cm)  physicalAttrs.push({ attribute_name: 'Laius (cm)',   attribute_value: String(product.width_cm) })
  if (product.height_cm) physicalAttrs.push({ attribute_name: 'Kõrgus (cm)', attribute_value: String(product.height_cm) })
  const allAttrs = [...physicalAttrs, ...attributes]

  const [showAll, setShowAll] = useState(false)
  const visibleAttrs = showAll ? allAttrs : allAttrs.slice(0, 16)
  const half = Math.ceil(visibleAttrs.length / 2)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
      {/* Tab bar */}
      <div className="flex border-b border-gray-100 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`flex-shrink-0 px-6 py-4 text-[15px] font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              active === tab.key
                ? 'border-[#003366] text-[#003366]'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6">

        {/* Toote kirjeldus */}
        {active === 'description' && (
          <div className="text-[15px] text-gray-600 leading-relaxed">
            {product.description_et
              ? product.description_et
              : <span className="text-gray-400 italic">Kirjeldus puudub.</span>}
          </div>
        )}

        {/* Tehnilised andmed */}
        {active === 'specs' && (
          allAttrs.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[15px] text-gray-400">{allAttrs.length} {t('parameters')}</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
                {[visibleAttrs.slice(0, half), visibleAttrs.slice(half)].map((col, ci) => (
                  <div key={ci}>
                    {col.map((attr, i) => (
                      <div key={i} className={`flex items-start justify-between py-2.5 ${i < col.length - 1 ? 'border-b border-gray-50' : ''}`}>
                        <span className="text-[15px] text-gray-500 pr-4 flex-shrink-0 w-1/2">{attr.attribute_name}</span>
                        <span className="text-[15px] font-medium text-gray-800 text-right">{attr.attribute_value}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              {allAttrs.length > 16 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="mt-4 w-full py-2.5 border border-gray-200 rounded-xl text-[15px] text-gray-500 hover:border-[#003366] hover:text-[#003366] transition-colors font-medium"
                >
                  {showAll ? t('hide') : t('showAllParams', { count: allAttrs.length })}
                </button>
              )}
            </>
          ) : (
            <span className="text-gray-400 italic text-[15px]">Tehnilised andmed puuduvad.</span>
          )
        )}

        {/* Joonised */}
        {active === 'drawing' && (
          product.drawing_url
            ? <img src={product.drawing_url} alt={`${product.name} joonis`} className="max-w-full mx-auto" />
            : <span className="text-gray-400 italic text-[15px]">Joonis puudub.</span>
        )}

        {/* Kõverad */}
        {active === 'curves' && (
          product.curve_url
            ? <img src={product.curve_url} alt={`${product.name} kõver`} className="max-w-full mx-auto" />
            : <span className="text-gray-400 italic text-[15px]">Kõverad puuduvad.</span>
        )}

      </div>
    </div>
  )
}

// ─── HULGIHINNAD ───────────────────────────────────────────────────────────

function BulkPricingTable({ prices, basePrice }: { prices: BulkPrice[]; basePrice: number }) {
  const t = useTranslations('product')
  const tCart = useTranslations('cart')

  if (prices.length === 0) return null

  const sorted = [...prices].sort((a, b) => a.min_quantity - b.min_quantity)

  const rows = sorted.map((bp, i) => {
    const next = sorted[i + 1]
    const toLabel = next ? `${bp.min_quantity}–${next.min_quantity - 1} tk` : `${bp.min_quantity}+ tk`
    const saving = basePrice > 0 ? Math.round((1 - bp.price / basePrice) * 100) : 0
    return { label: toLabel, price: bp.price, saving }
  })

  return (
    <div className="mt-5 border-t border-gray-100 pt-4">
      <h3 className="text-[15px] font-semibold text-gray-700 mb-3">{t('bulkPrices')}</h3>
      <div className="space-y-1.5">
        <div className="grid grid-cols-[auto_1fr_auto] gap-3 text-[13px] font-medium text-gray-400 px-1">
          <span>{tCart('quantity')}</span><span /><span>{t('price')}</span>
        </div>
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[auto_1fr_auto] gap-3 items-center bg-gray-50 rounded-xl px-4 py-2.5">
            <span className="text-[15px] text-gray-600 font-medium w-24">{row.label}</span>
            <span>
              {row.saving > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#01a0dc]/10 text-[#01a0dc] text-[13px] font-semibold">
                  -{row.saving}%
                </span>
              )}
            </span>
            <span className="text-[17px] font-bold text-[#003366]">
              {row.price.toFixed(2).replace('.', ',')} €
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── SEOTUD TOOTED ─────────────────────────────────────────────────────────

function RelatedProducts({ products }: { products: RelatedProduct[] }) {
  const t = useTranslations('product')

  if (products.length === 0) return null

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold text-gray-900 mb-5">{t('relatedProductsTitle')}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map(p => (
          <a key={p.slug} href={`/toode/${p.slug}`}
            className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#003366]/20 hover:shadow-lg transition-all duration-300">
            <div className="bg-gray-50 p-5 flex items-center justify-center h-36">
              <img src={p.image_url} alt={p.name}
                className="h-24 object-contain group-hover:scale-105 transition-transform duration-300"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png' }}
              />
            </div>
            <div className="p-4">
              <div className="font-semibold text-gray-800 text-[15px] leading-tight mb-2 group-hover:text-[#003366] transition-colors line-clamp-2">
                {p.name}
              </div>
              <div className="text-[17px] font-bold text-[#003366]">
                {Number(p.price).toFixed(2).replace('.', ',')} €
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

// ─── PEAKOMPONENT ──────────────────────────────────────────────────────────

export default function ProductPage({ params }: { params: { slug: string } }) {
  const t = useTranslations('product')
  const tNav = useTranslations('nav')
  const tCommon = useTranslations('common')
  const [product, setProduct] = useState<Product | null>(null)
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [related, setRelated] = useState<RelatedProduct[]>([])
  const [bulkPrices, setBulkPrices] = useState<BulkPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    async function loadProduct() {
      setLoading(true)

      const { data: prod } = await supabase
        .from('products')
        .select('*')
        .eq('slug', params.slug)
        .single()

      if (!prod) { setLoading(false); return }
      setProduct(prod)

      const [attrsRes, bpRes] = await Promise.all([
        supabase.from('product_attributes')
          .select('attribute_name, attribute_value')
          .eq('product_id', prod.id)
          .order('attribute_name'),
        supabase.from('bulk_pricing')
          .select('id, min_quantity, price')
          .eq('product_id', prod.id)
          .order('min_quantity'),
      ])

      setAttributes(attrsRes.data || [])
      setBulkPrices((bpRes.data as BulkPrice[]) || [])

      const { data: cats } = await supabase
        .from('product_categories')
        .select('category_slug')
        .eq('product_id', prod.id)
        .limit(1)

      if (cats && cats.length > 0) {
        const { data: relIds } = await supabase
          .from('product_categories')
          .select('product_id')
          .eq('category_slug', cats[0].category_slug)
          .neq('product_id', prod.id)
          .limit(4)

        if (relIds && relIds.length > 0) {
          const ids = relIds.map(r => r.product_id)
          const { data: relProds } = await supabase
            .from('products')
            .select('id, name, slug, price, image_url, short_description_et')
            .in('id', ids)

          setRelated(relProds || [])
        }
      }

      setLoading(false)
    }

    loadProduct()
  }, [params.slug])

  const handleAddToCart = (qty: number, effectivePrice: number) => {
    if (!product) return
    const cart: Array<{ id: number; slug: string; name: string; price: number; image_url: string | null; qty: number }> =
      JSON.parse(localStorage.getItem('ipumps_cart') || '[]')

    const existing = cart.find(i => i.id === product.id)
    if (existing) {
      existing.qty   += qty
      existing.price  = effectivePrice
    } else {
      cart.push({
        id:        product.id,
        slug:      product.slug,
        name:      product.name,
        price:     effectivePrice,
        image_url: product.image_url,
        qty,
      })
    }
    localStorage.setItem('ipumps_cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart_updated'))
    setCartCount(c => c + qty)
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="w-10 h-10 border-2 border-[#003366] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <div className="text-[15px]">{t('loading')}</div>
          </div>
        </div>
      </>
    )
  }

  if (!product) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">{t('notFound')}</h1>
            <p className="text-[15px] text-gray-500 mb-5">{t('notFoundHint')}</p>
            <a href="/tooted" className="bg-[#003366] text-white px-6 py-3 rounded-xl font-semibold text-[15px] hover:bg-[#004080] transition-colors">
              {t('viewAllProducts')}
            </a>
          </div>
        </div>
      </>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <Breadcrumb product={product} />

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Peamine sektsioon — pilt + info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <ProductGallery image={product.image_url} name={product.name} />
          <ProductInfo product={product} onAddToCart={handleAddToCart} bulkPrices={bulkPrices} />
        </div>

        {/* Tabid — kirjeldus, tehnilised andmed, joonised, kõverad */}
        <ProductTabs product={product} attributes={attributes} />

        {/* Seotud tooted */}
        <RelatedProducts products={related} />
      </div>

      {/* Footer mini */}
      <footer className="bg-[#001f40] text-white/60 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[15px]">
          <span>© 2025 iPumps OÜ</span>
          <div className="flex gap-4">
            <a href="/" className="hover:text-white transition-colors">{tCommon('home')}</a>
            <a href="/tooted" className="hover:text-white transition-colors">{tNav('products')}</a>
            <a href="/#kontakt" className="hover:text-white transition-colors">{tNav('contact')}</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
