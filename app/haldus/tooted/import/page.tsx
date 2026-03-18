'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, AlertCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import ImportPreview, { type ImportRow } from '@/components/haldus/ImportPreview'

const canManageProducts = (role: string) => role === 'superadmin'

// Veerunimede kaardistamine (auto-detekt)
const COL_MAP: Record<string, string[]> = {
  sku:                  ['sku', 'artikkel', 'article', 'kood'],
  name:                 ['name', 'nimi', 'toode', 'product'],
  short_description_et: ['short_description', 'lühikirjeldus', 'short_desc'],
  description_et:       ['description', 'kirjeldus', 'desc'],
  price:                ['price', 'hind', 'price_eur'],
  in_stock:             ['in_stock', 'laoseis', 'stock', 'ladu'],
  category_slug:        ['category', 'kategooria', 'category_slug'],
}

function detectColumn(headers: string[], field: string): number {
  const variants = COL_MAP[field] ?? []
  for (const v of variants) {
    const i = headers.findIndex(h => h.toLowerCase().trim() === v)
    if (i !== -1) return i
  }
  return -1
}

function parseRows(raw: unknown[][]): ImportRow[] {
  if (raw.length < 2) return []
  const headers = (raw[0] as string[]).map(h => String(h ?? ''))
  const cols = Object.fromEntries(
    Object.keys(COL_MAP).map(f => [f, detectColumn(headers, f)])
  )

  return raw.slice(1)
    .filter(row => row.some(c => c !== null && c !== undefined && c !== ''))
    .map(row => {
      const get = (f: string) => cols[f] >= 0 ? row[cols[f]] : undefined
      const stockVal = String(get('in_stock') ?? 'true').toLowerCase()
      return {
        sku:                  String(get('sku') ?? ''),
        name:                 String(get('name') ?? ''),
        short_description_et: get('short_description_et') ? String(get('short_description_et')) : undefined,
        description_et:       get('description_et') ? String(get('description_et')) : undefined,
        price:                parseFloat(String(get('price') ?? '0').replace(',', '.')) || 0,
        in_stock:             !['false', '0', 'ei', 'otsas', 'no'].includes(stockVal),
        category_slug:        get('category_slug') ? String(get('category_slug')) : undefined,
      }
    })
    .filter(r => r.name)
}

export default function ImportPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [tab, setTab]       = useState<'new' | 'upsert'>('new')
  const [rows, setRows]     = useState<ImportRow[] | null>(null)
  const [parseErr, setParseErr] = useState('')

  if (profile && !canManageProducts(profile.role)) {
    router.replace('/haldus')
    return null
  }

  const handleFile = (file: File) => {
    setParseErr(''); setRows(null)
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = e.target?.result
        const wb   = XLSX.read(data, { type: 'binary' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const raw  = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 })
        const parsed = parseRows(raw)
        if (parsed.length === 0) { setParseErr('Failis ei leitud ridu. Kontrolli veerge.'); return }
        setRows(parsed)
      } catch {
        setParseErr('Faili lugemine ebaõnnestus. Kontrolli faili formaati.')
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleImport = async (importRows: ImportRow[]) => {
    let imported = 0; let errors = 0

    if (tab === 'new') {
      for (const row of importRows) {
        const { data, error } = await supabase.from('products').insert({
          name: row.name, sku: row.sku || null,
          short_description_et: row.short_description_et ?? null,
          description_et: row.description_et ?? null,
          price: row.price, in_stock: row.in_stock,
          published: true,
          slug: row.sku?.toLowerCase().replace(/[^a-z0-9]/g, '-') || null,
        }).select('id').single()

        if (error) { errors++; continue }
        if (row.category_slug && data) {
          await supabase.from('product_categories').insert({ product_id: data.id, category_slug: row.category_slug })
        }
        imported++
      }
    } else {
      // Upsert SKU järgi
      for (const row of importRows) {
        if (!row.sku) { errors++; continue }

        const { data: existing } = await supabase.from('products').select('id').eq('sku', row.sku).single()

        if (existing) {
          const { error } = await supabase.from('products').update({
            name: row.name,
            short_description_et: row.short_description_et ?? null,
            description_et: row.description_et ?? null,
            price: row.price, in_stock: row.in_stock,
            updated_at: new Date().toISOString(),
          }).eq('id', existing.id)

          if (error) { errors++; continue }
          if (row.category_slug) {
            await supabase.from('product_categories').delete().eq('product_id', existing.id)
            await supabase.from('product_categories').insert({ product_id: existing.id, category_slug: row.category_slug })
          }
        } else {
          const { data, error } = await supabase.from('products').insert({
            name: row.name, sku: row.sku,
            short_description_et: row.short_description_et ?? null,
            description_et: row.description_et ?? null,
            price: row.price, in_stock: row.in_stock, published: true,
            slug: row.sku.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          }).select('id').single()

          if (error) { errors++; continue }
          if (row.category_slug && data) {
            await supabase.from('product_categories').insert({ product_id: data.id, category_slug: row.category_slug })
          }
        }
        imported++
      }
    }

    return { imported, errors }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/haldus/tooted" className="text-gray-400 hover:text-[#003366] transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Impordi tooted</h1>
      </div>

      {/* Vahekaarti */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex border-b border-gray-100">
          {(['new', 'upsert'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setRows(null); setParseErr('') }}
              className={`px-6 py-3.5 text-[15px] font-medium border-b-2 transition-colors ${
                tab === t ? 'border-[#003366] text-[#003366]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'new' ? 'Lisa uued tooted' : 'Asenda olemasolevad (SKU järgi)'}
            </button>
          ))}
        </div>

        <div className="p-6">
          <p className="text-[15px] text-gray-600 mb-4">
            {tab === 'new'
              ? 'Lae üles CSV või Excel fail uute toodete lisamiseks. Oodatavad veerud: sku, name, price, in_stock, category.'
              : 'Lae üles CSV või Excel fail olemasolevate toodete uuendamiseks SKU järgi. Tooted mida ei leita, lisatakse uutena.'}
          </p>

          {/* Faili üleslaadimisala */}
          {!rows && (
            <div
              onClick={() => fileRef.current?.click()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              onDragOver={e => e.preventDefault()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-[#003366] hover:bg-blue-50/30 transition-colors"
            >
              <Upload size={30} className="mx-auto mb-3 text-gray-300" />
              <p className="text-[15px] text-gray-600 mb-1">Lohista fail siia või <span className="text-[#003366] font-medium">vali fail</span></p>
              <p className="text-[13px] text-gray-400">CSV, XLS, XLSX</p>
            </div>
          )}

          <input ref={fileRef} type="file" accept=".csv,.xls,.xlsx" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />

          {parseErr && (
            <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-[15px]">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              {parseErr}
            </div>
          )}

          {rows && (
            <ImportPreview
              rows={rows}
              mode={tab}
              onConfirm={handleImport}
              onCancel={() => { setRows(null); if (fileRef.current) fileRef.current.value = '' }}
            />
          )}
        </div>
      </div>

      {/* CSV näidis */}
      {!rows && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-3">CSV näidisformaat</h3>
          <pre className="bg-gray-50 rounded-xl p-4 text-[13px] text-gray-600 overflow-x-auto font-mono">
{`sku,name,price,in_stock,description,category
PUMP-001,Grundfos CM 3-5,285.00,true,"Keskmise rõhuga pump",kute
PUMP-002,Grundfos UP 15-14,89.50,false,"Tsirkulatsioonipump",sooja-tarbevee-tsirkulatsioonipump`}
          </pre>
        </div>
      )}
    </div>
  )
}
