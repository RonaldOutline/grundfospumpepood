import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { supabaseAdmin } from '@/lib/supabase-admin'

// POST /api/haldus/import — full product data import from the exported xlsx
// Matches the export format: fixed columns + attr__ prefixed attribute columns

const BOOL_FALSE = new Set(['false', '0', 'ei', 'otsas', 'no'])

function parseBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  return !BOOL_FALSE.has(String(v ?? '').toLowerCase().trim())
}

function parseNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = parseFloat(String(v).replace(',', '.'))
  return isNaN(n) ? null : n
}

function parseStr(v: unknown): string | null {
  const s = String(v ?? '').trim()
  return s === '' ? null : s
}

export async function POST(req: NextRequest) {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const token = (req.headers.get('authorization') ?? '').replace('Bearer ', '').trim()
  if (token) {
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabaseAdmin
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'superadmin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Parse multipart form ───────────────────────────────────────────────────
  let buffer: Buffer
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Fail puudub' }, { status: 400 })
    buffer = Buffer.from(await file.arrayBuffer())
  } catch {
    return NextResponse.json({ error: 'Faili lugemine ebaõnnestus' }, { status: 400 })
  }

  // ── Read xlsx ──────────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)
  const ws = wb.worksheets[0]
  if (!ws) return NextResponse.json({ error: 'Tühi fail' }, { status: 400 })

  // Build header map: column index → key
  const headerRow = ws.getRow(1)
  const headers: string[] = []
  headerRow.eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col - 1] = String(cell.value ?? '').trim()
  })

  // Identify fixed vs attribute columns
  const fixedKeys = new Set([
    'SKU', 'Nimi', 'Kategooria', 'Tähtsus (1–10)', 'Hind (€)', 'Müügihind (€)',
    'Laos', 'Avaldatud', 'Lühikirjeldus', 'Sildid',
    'Kaal (kg)', 'Pikkus (cm)', 'Laius (cm)', 'Kõrgus (cm)',
    'Slug', 'Pilt URL', 'Kõver URL', 'Joonis URL',
    'Grundfos kategooria', 'Grundfos URL',
  ])

  // Also support raw key names from older exports
  const HEADER_TO_FIELD: Record<string, string> = {
    'SKU':               'sku',
    'Nimi':              'name',
    'Kategooria':        'category',
    'Tähtsus (1–10)':    'importance',
    'Hind (€)':          'price',
    'Müügihind (€)':     'sale_price',
    'Laos':              'in_stock',
    'Avaldatud':         'published',
    'Lühikirjeldus':     'short_description_et',
    'Sildid':            'tags',
    'Kaal (kg)':         'weight_kg',
    'Pikkus (cm)':       'length_cm',
    'Laius (cm)':        'width_cm',
    'Kõrgus (cm)':       'height_cm',
    'Slug':              'slug',
    'Pilt URL':          'image_url',
    'Kõver URL':         'curve_url',
    'Joonis URL':        'drawing_url',
    'Grundfos kategooria': 'category_gf',
    'Grundfos URL':      'url_gf',
  }

  // Map: colIndex → { type: 'fixed'|'attr', field: string }
  const colMap: Array<{ type: 'fixed' | 'attr'; field: string }> = headers.map(h => {
    if (HEADER_TO_FIELD[h]) return { type: 'fixed', field: HEADER_TO_FIELD[h] }
    // Attribute columns are everything else that's non-empty and not a known fixed key
    if (h && !fixedKeys.has(h)) return { type: 'attr', field: h }
    return { type: 'fixed', field: '' }
  })

  // ── Process rows ───────────────────────────────────────────────────────────
  let updated = 0, skipped = 0
  const errors: string[] = []

  const rowCount = ws.rowCount
  for (let r = 2; r <= rowCount; r++) {
    const row = ws.getRow(r)

    // Build cell value array
    const cells: unknown[] = []
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      cells[col - 1] = cell.value
    })

    // Extract SKU
    const skuIdx = headers.indexOf('SKU')
    const sku = parseStr(cells[skuIdx])
    if (!sku) { skipped++; continue }

    // Find product
    const { data: prod } = await supabaseAdmin
      .from('products').select('id').eq('sku', sku).single()
    if (!prod) { skipped++; continue }

    // Build product update object
    const productUpdate: Record<string, unknown> = {}
    const attrUpdates: Array<{ name: string; value: string }> = []

    colMap.forEach((col, i) => {
      if (!col.field) return
      const raw = cells[i]

      if (col.type === 'fixed') {
        switch (col.field) {
          case 'sku':
          case 'slug':
          case 'name':
          case 'short_description_et':
          case 'tags':
          case 'image_url':
          case 'curve_url':
          case 'drawing_url':
          case 'category_gf':
          case 'url_gf':
          case 'category':  // skip — handled via product_categories separately
            if (col.field !== 'category') productUpdate[col.field] = parseStr(raw)
            break
          case 'price':
          case 'sale_price':
          case 'weight_kg':
          case 'length_cm':
          case 'width_cm':
          case 'height_cm':
          case 'importance':
            productUpdate[col.field] = parseNum(raw)
            break
          case 'in_stock':
          case 'published':
            productUpdate[col.field] = parseBool(raw)
            break
        }
      } else if (col.type === 'attr') {
        const val = parseStr(raw)
        if (val) attrUpdates.push({ name: col.field, value: val })
      }
    })

    // Remove nullish SKU/slug to avoid overwriting with null
    delete productUpdate['sku']

    try {
      // Update product
      const { error: pErr } = await supabaseAdmin
        .from('products')
        .update({ ...productUpdate, updated_at: new Date().toISOString() })
        .eq('id', prod.id)

      if (pErr) {
        errors.push(`${sku}: ${pErr.message}`)
        continue
      }

      // Replace attributes if any attr columns exist in this file
      if (colMap.some(c => c.type === 'attr')) {
        await supabaseAdmin.from('product_attributes').delete().eq('product_id', prod.id)
        if (attrUpdates.length > 0) {
          await supabaseAdmin.from('product_attributes').insert(
            attrUpdates.map(a => ({ product_id: prod.id, attribute_name: a.name, attribute_value: a.value }))
          )
        }
      }

      updated++
    } catch (e) {
      errors.push(`${sku}: ${e instanceof Error ? e.message : 'Tundmatu viga'}`)
    }
  }

  return NextResponse.json({
    updated,
    skipped,
    errors: errors.slice(0, 20),   // cap error list
    total_errors: errors.length,
  })
}
