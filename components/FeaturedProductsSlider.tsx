'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Product {
  id: number
  slug: string
  name: string
  sku: string | null
  price: number
  sale_price: number | null
  image_url: string | null
  in_stock: boolean
}

export default function FeaturedProductsSlider() {
  const [products, setProducts] = useState<Product[]>([])
  const [page,     setPage]     = useState(0)
  const [animate,  setAnimate]  = useState(true)
  // Responsive: how many cards are visible at once
  const [visible,  setVisible]  = useState(4)

  // ── Load first 8 products ─────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from('products')
      .select('id, slug, name, sku, price, sale_price, image_url, in_stock')
      .order('id')
      .limit(8)
      .then(({ data }) => { if (data) setProducts(data) })
  }, [])

  // ── Responsive visible count ──────────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      setVisible(w < 640 ? 1 : w < 1024 ? 2 : 4)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Reset page to 0 when visible changes (prevents out-of-range position)
  useEffect(() => {
    setAnimate(false)
    setPage(0)
  }, [visible])

  // ── Derived ───────────────────────────────────────────────────────────────
  // Number of pages needed to show all 8 products once (e.g. 2 for 4-visible)
  const totalPages = products.length > 0 ? Math.ceil(products.length / visible) : 0

  // Duplicate the array so the last real page seamlessly wraps to the first
  // e.g. 8 items → [p0..p7, p0..p7] = 16 cards, 4 "phantom" pages at the end
  const slides = [...products, ...products]

  // ── Auto-advance every 3 s ────────────────────────────────────────────────
  useEffect(() => {
    if (products.length === 0) return
    const id = setInterval(() => setPage(p => p + 1), 3000)
    return () => clearInterval(id)
  }, [products.length])

  // ── Infinite-loop reset ───────────────────────────────────────────────────
  // When page reaches totalPages the viewport shows the cloned cards which
  // look identical to page 0. After the transition finishes, jump to page 0
  // without animation (same visual → no visible jump).
  useEffect(() => {
    if (page !== totalPages || totalPages === 0) return
    const id = setTimeout(() => { setAnimate(false); setPage(0) }, 680)
    return () => clearTimeout(id)
  }, [page, totalPages])

  // Re-enable animation a frame after the instant reset
  useEffect(() => {
    if (animate) return
    const id = setTimeout(() => setAnimate(true), 30)
    return () => clearTimeout(id)
  }, [animate])

  // ── Navigation helpers ────────────────────────────────────────────────────
  const dotActive = totalPages > 0 ? page % totalPages : 0

  const prev = () => {
    setAnimate(true)
    // Navigate backwards: if on page 0, jump to the real last page
    setPage(p => (p <= 0 ? totalPages - 1 : p - 1))
  }
  const next = () => { setAnimate(true); setPage(p => p + 1) }

  // ── translateX logic ──────────────────────────────────────────────────────
  // Each card has flex-basis = 100% / visible (e.g. 25% for 4-visible).
  // The flex track has width: 100% (= container width).
  // translateX(-100%) therefore always equals exactly one container width
  // = one full "page" of `visible` cards, regardless of the visible count.
  // So: translateX = -(page * 100%) in all responsive variants.

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">

        {/* Section header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-[13px] font-semibold text-[#01a0dc] uppercase tracking-widest mb-1">Populaarsed</div>
            <h2 className="text-2xl font-bold text-gray-900">Esiletõstetud tooted</h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Prev / Next buttons */}
            <div className="flex gap-1.5">
              <button
                onClick={prev}
                className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:border-[#003366] hover:text-[#003366] transition-colors shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={next}
                className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:border-[#003366] hover:text-[#003366] transition-colors shadow-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <a href="/tooted" className="text-[15px] text-[#003366] hover:underline font-medium hidden sm:block">
              Vaata kõiki →
            </a>
          </div>
        </div>

        {/* Loading skeleton */}
        {products.length === 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        )}

        {/* Slider */}
        {products.length > 0 && (
          <>
            <div className="overflow-hidden">
              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  transform: `translateX(${-page * 100}%)`,
                  transition: animate ? 'transform 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
                }}
              >
                {slides.map((product, i) => {
                  const price = product.sale_price ?? product.price
                  return (
                    <div
                      key={`${product.id}-${i}`}
                      style={{
                        flex: `0 0 ${100 / visible}%`,
                        maxWidth: `${100 / visible}%`,
                        boxSizing: 'border-box',
                        padding: '0 8px',
                      }}
                    >
                      <Link
                        href={`/toode/${product.slug}`}
                        className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#003366]/20 hover:shadow-lg transition-all duration-300 flex flex-col h-full"
                      >
                        {/* Image area */}
                        <div className="relative bg-gray-50 p-5 flex items-center justify-center h-44 flex-shrink-0">
                          {product.sale_price && (
                            <span className="absolute top-3 left-3 bg-[#01a0dc] text-white text-[13px] font-bold px-2 py-0.5 rounded-full z-10">
                              -{Math.round((1 - product.sale_price / product.price) * 100)}%
                            </span>
                          )}
                          <span className={`absolute top-3 right-3 flex items-center gap-1 text-[12px] font-medium px-2 py-0.5 rounded-full ${product.in_stock ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${product.in_stock ? 'bg-green-500' : 'bg-gray-400'}`} />
                            {product.in_stock ? 'Laos' : 'Otsas'}
                          </span>
                          <img
                            src={product.image_url || '/placeholder.png'}
                            alt={product.name}
                            className="h-28 object-contain group-hover:scale-105 transition-transform duration-300"
                            onError={e => { (e.target as HTMLImageElement).src = '/placeholder.png' }}
                          />
                        </div>

                        {/* Info area */}
                        <div className="p-4 flex flex-col flex-1">
                          {product.sku && (
                            <div className="text-[13px] text-gray-400 font-mono mb-1">{product.sku}</div>
                          )}
                          <div className="font-semibold text-gray-800 text-[15px] leading-tight mb-3 group-hover:text-[#003366] transition-colors line-clamp-2 flex-1">
                            {product.name}
                          </div>
                          <div className="flex items-end justify-between mt-auto">
                            <div>
                              <div className="text-lg font-bold text-[#003366]">
                                {Number(price).toFixed(2).replace('.', ',')} €
                              </div>
                              {product.sale_price && (
                                <div className="text-[13px] text-gray-400 line-through">
                                  {Number(product.price).toFixed(2).replace('.', ',')} €
                                </div>
                              )}
                            </div>
                            <span className="text-[13px] text-[#01a0dc] font-semibold group-hover:underline flex-shrink-0">
                              Vaata →
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Page dots */}
            <div className="flex justify-center items-center gap-2 mt-6">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setAnimate(true); setPage(i) }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    dotActive === i ? 'bg-[#003366] w-6' : 'bg-gray-300 w-2 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </>
        )}

      </div>
    </section>
  )
}
