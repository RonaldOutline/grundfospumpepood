'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { useTranslations } from 'next-intl'
import {
  ChevronRight, Package, Truck, Shield,
  Phone, ZoomIn, Check, Share2, Printer, ShoppingCart
} from 'lucide-react'

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
  category_id: number | null
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

// ─── OSTUKORV UTILIIDID (localStorage) ────────────────────────────────────

interface CartItem {
  id: number
  slug: string
  name: string
  price: number
  image_url: string
  qty: number
}

function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('ipumps_cart') || '[]')
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem('ipumps_cart', JSON.stringify(items))
  window.dispatchEvent(new Event('cart_updated'))
}

function addToCart(product: Product, qty: number) {
  const cart = getCart()
  const existing = cart.find(i => i.id === product.id)
  if (existing) {
    existing.qty += qty
  } else {
    cart.push({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.sale_price ?? product.price,
      image_url: product.image_url,
      qty,
    })
  }
  saveCart(cart)
}

// ─── LEIVAKÜLJED ───────────────────────────────────────────────────────────

function Breadcrumb({ product }: { product: Product }) {
  const tNav = useTranslations('nav')
  return (
    <nav className="bg-gray-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-[15px] text-gray-500 flex-wrap">
        <a href="/" className="hover:text-[#003366] transition-colors">{tNav('home')}</a>
        <ChevronRight size={14} className="text-gray-300" />
        <a href="/tooted" className="hover:text-[#003366] transition-colors">{tNav('products')}</a>
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

function ProductInfo({ product }: { product: Product }) {
  const t = useTranslations('product')
  const tBenefits = useTranslations('benefits')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addToCart(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const displayPrice = product.sale_price ?? product.price
  const discount = product.sale_price
    ? Math.round((1 - product.sale_price / product.price) * 100)
    : null

  const benefits = [
    { icon: Truck,   text: tBenefits('shipping') },
    { icon: Shield,  text: tBenefits('warranty') },
    { icon: Package, text: t('original') },
  ]

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

      {/* Lühikirjeldus */}
      {product.short_description_et && (
        <p className="text-[15px] text-gray-600 leading-relaxed border-l-2 border-[#01a0dc] pl-4">
          {product.short_description_et}
        </p>
      )}

      {/* Hind */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-[#003366]">
          {Number(displayPrice).toFixed(2).replace('.', ',')} €
        </span>
        {product.sale_price && (
          <>
            <span className="text-[15px] text-gray-400 line-through">
              {Number(product.price).toFixed(2).replace('.', ',')} €
            </span>
            <span className="bg-[#01a0dc] text-white text-[15px] font-bold px-2 py-0.5 rounded-lg">
              -{discount}%
            </span>
          </>
        )}
        <span className="text-[15px] text-gray-400">{t('vatExcl')}</span>
      </div>

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
          {added
            ? <><Check size={18} /> {t('added')}</>
            : <><ShoppingCart size={18} /> {t('addToCart')}</>
          }
        </button>
      </div>

      {/* Päring */}
      <a
        href="/#kontakt"
        className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl border-2 border-[#003366] text-[#003366] hover:bg-[#003366] hover:text-white font-semibold text-[15px] transition-all"
      >
        <Phone size={16} /> {t('requestQuote')}
      </a>

      {/* Eelised */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
        {benefits.map(b => (
          <div key={b.text} className="flex flex-col items-center gap-1.5 text-center">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <b.icon size={16} className="text-[#003366]" />
            </div>
            <span className="text-[15px] text-gray-500">{b.text}</span>
          </div>
        ))}
      </div>

      {/* Jaga / Prindi */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => navigator.share?.({ title: product.name, url: window.location.href }).catch(() => {})}
          className="flex items-center gap-1.5 text-[15px] text-gray-400 hover:text-[#003366] transition-colors"
        >
          <Share2 size={15} /> {t('share')}
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-[15px] text-gray-400 hover:text-[#003366] transition-colors"
        >
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
              <img
                src={p.image_url}
                alt={p.name}
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

// FIX: Next.js 15+ async params — kasutame React.use()
export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const t = useTranslations('product')

  const [product, setProduct] = useState<Product | null>(null)
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [related, setRelated] = useState<RelatedProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProduct() {
      setLoading(true)

      const { data: prod } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!prod) { setLoading(false); return }
      setProduct(prod)

      const { data: attrs } = await supabase
        .from('product_attributes')
        .select('attribute_name, attribute_value')
        .eq('product_id', prod.id)
        .order('attribute_name')

      setAttributes(attrs || [])

      if (prod.category_id) {
        const { data: relProds } = await supabase
          .from('products')
          .select('id, name, slug, price, image_url, short_description_et')
          .eq('category_id', prod.category_id)
          .neq('id', prod.id)
          .limit(4)

        setRelated(relProds || [])
      }

      setLoading(false)
    }

    loadProduct()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="w-10 h-10 border-2 border-[#003366] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <div className="text-[15px]">{t('loading')}</div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
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
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb product={product} />

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Peamine sektsioon */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <ProductGallery image={product.image_url} name={product.name} />
          <ProductInfo product={product} />
        </div>

        {/* Kirjeldus + atribuudid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {product.description_et && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-bold text-gray-900 text-[17px]">{t('descriptionTitle')}</h2>
              </div>
              <div className="p-6 text-[15px] text-gray-600 leading-relaxed">
                {product.description_et}
              </div>
            </div>
          )}
          <AttributesTable attributes={attributes} product={product} />
        </div>

        {/* Seotud tooted */}
        <RelatedProducts products={related} />
      </div>
    </div>
  )
}
