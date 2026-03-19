import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/haldus/export — exports all products as a formatted .xlsx file

export async function GET(req: NextRequest) {
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

  // ── Fetch data ─────────────────────────────────────────────────────────────
  const [
    { data: products, error },
    { data: pcs },
    { data: cats },
    { data: allProds },
    { data: attrs },
  ] = await Promise.all([
    supabaseAdmin
      .from('products')
      .select('id, sku, name, short_description_et, price, sale_price, in_stock, published, image_url, weight_kg, length_cm, width_cm, height_cm, slug, tags, importance, curve_url, drawing_url, category_gf, url_gf')
      .order('name'),
    supabaseAdmin.from('product_categories').select('product_id, category_slug'),
    supabaseAdmin.from('categories').select('slug, name_et'),
    supabaseAdmin.from('products').select('id, sku'),
    supabaseAdmin.from('product_attributes').select('product_id, attribute_name, attribute_value').order('attribute_name'),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── Lookup maps ────────────────────────────────────────────────────────────
  const catMap   = Object.fromEntries((cats  ?? []).map(c  => [c.slug,       c.name_et]))
  const pcMap    = Object.fromEntries((pcs   ?? []).map(pc => [String(pc.product_id), pc.category_slug]))
  const idToSku  = Object.fromEntries((allProds ?? []).map(p => [String(p.id), p.sku ?? '']))
  const skuToId  = Object.fromEntries((allProds ?? []).map(p => [p.sku ?? '', String(p.id)]))

  // Group attributes by product_id
  const attrsByProduct: Record<string, Array<{ name: string; value: string }>> = {}
  for (const a of (attrs ?? [])) {
    const pid = String(a.product_id)
    if (!attrsByProduct[pid]) attrsByProduct[pid] = []
    attrsByProduct[pid].push({ name: a.attribute_name, value: a.attribute_value })
  }

  // Collect all unique attribute names (sorted) for column headers
  const allAttrNames = Array.from(
    new Set((attrs ?? []).map(a => a.attribute_name))
  ).sort((a, b) => a.localeCompare(b, 'et'))

  // ── Build workbook ─────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook()
  wb.creator  = 'iPumps'
  wb.created  = new Date()
  wb.modified = new Date()

  // ── Sheet 1: Products ──────────────────────────────────────────────────────
  const ws = wb.addWorksheet('Tooted', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  // Column definitions — key, header label, width
  const COLS: { key: string; header: string; width: number }[] = [
    { key: 'sku',          header: 'SKU',               width: 14  },
    { key: 'name',         header: 'Nimi',              width: 40  },
    { key: 'category',     header: 'Kategooria',        width: 24  },
    { key: 'importance',   header: 'Tähtsus (1–10)',    width: 14  },
    { key: 'price',        header: 'Hind (€)',          width: 12  },
    { key: 'sale_price',   header: 'Müügihind (€)',     width: 14  },
    { key: 'in_stock',     header: 'Laos',              width: 10  },
    { key: 'published',    header: 'Avaldatud',         width: 12  },
    { key: 'short_desc',   header: 'Lühikirjeldus',     width: 50  },
    { key: 'tags',         header: 'Sildid',            width: 40  },
    { key: 'weight_kg',    header: 'Kaal (kg)',         width: 12  },
    { key: 'length_cm',    header: 'Pikkus (cm)',       width: 12  },
    { key: 'width_cm',     header: 'Laius (cm)',        width: 12  },
    { key: 'height_cm',    header: 'Kõrgus (cm)',       width: 12  },
    { key: 'slug',         header: 'Slug',              width: 44  },
    { key: 'image_url',    header: 'Pilt URL',          width: 60  },
    { key: 'curve_url',    header: 'Kõver URL',         width: 60  },
    { key: 'drawing_url',  header: 'Joonis URL',        width: 60  },
    { key: 'category_gf',  header: 'Grundfos kategooria', width: 28 },
    { key: 'url_gf',       header: 'Grundfos URL',      width: 70  },
  ]

  ws.columns = COLS.map(c => ({ key: c.key, header: c.header, width: c.width }))

  // ── Header styling ─────────────────────────────────────────────────────────
  const headerRow = ws.getRow(1)
  headerRow.height = 22

  const BLUE  = '003366'
  const WHITE = 'FFFFFF'
  const GREEN_LIGHT = 'E8F5E9'
  const BLUE_LIGHT  = 'E3F0FB'
  const GRAY_LIGHT  = 'F5F5F5'
  const ORANGE_LIGHT = 'FFF3E0'

  COLS.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.font      = { bold: true, color: { argb: WHITE }, name: 'Arial', size: 10 }
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false }
    cell.border    = {
      bottom: { style: 'thin', color: { argb: '5580AA' } },
      right:  { style: 'thin', color: { argb: '5580AA' } },
    }
  })

  // Enable auto-filter on header row
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLS.length } }

  // ── Importance colour scale helper ─────────────────────────────────────────
  function importanceColour(v: number | null): string {
    if (!v) return GRAY_LIGHT
    // 1=light red, 5=yellow, 10=green
    if (v >= 8) return 'C8E6C9'   // green
    if (v >= 6) return 'DCEDC8'   // light green
    if (v >= 4) return 'FFF9C4'   // yellow
    if (v >= 2) return 'FFE0B2'   // orange
    return 'FFCDD2'               // red
  }

  // ── Data rows ──────────────────────────────────────────────────────────────
  const priceFormat = '#,##0.00 "€"'
  const boolLabel   = (v: boolean) => v ? 'Jah' : 'Ei'

  ;(products ?? []).forEach(p => {
    const prodId  = skuToId[p.sku ?? ''] ?? ''
    const catSlug = pcMap[prodId] ?? ''
    const catName = catMap[catSlug] ?? catSlug

    const row = ws.addRow({
      sku:         p.sku         ?? '',
      name:        p.name        ?? '',
      category:    catName,
      importance:  p.importance  ?? null,
      price:       p.price       ?? null,
      sale_price:  p.sale_price  ?? null,
      in_stock:    boolLabel(p.in_stock),
      published:   boolLabel(p.published),
      short_desc:  p.short_description_et ?? '',
      tags:        p.tags        ?? '',
      weight_kg:   p.weight_kg   ?? null,
      length_cm:   p.length_cm   ?? null,
      width_cm:    p.width_cm    ?? null,
      height_cm:   p.height_cm   ?? null,
      slug:        p.slug        ?? '',
      image_url:   p.image_url   ?? '',
      curve_url:   p.curve_url   ?? '',
      drawing_url: p.drawing_url ?? '',
      category_gf: p.category_gf ?? '',
      url_gf:      p.url_gf      ?? '',
    })

    row.height = 18
    row.font   = { name: 'Arial', size: 10 }
    row.alignment = { vertical: 'middle' }

    // Price formatting
    const priceCol     = COLS.findIndex(c => c.key === 'price')     + 1
    const salePriceCol = COLS.findIndex(c => c.key === 'sale_price') + 1
    row.getCell(priceCol).numFmt     = priceFormat
    row.getCell(salePriceCol).numFmt = priceFormat

    // Column background colours
    COLS.forEach((col, i) => {
      const cell = row.getCell(i + 1)
      let bg = 'FFFFFF'
      if (['price', 'sale_price'].includes(col.key))                bg = GREEN_LIGHT
      else if (['sku'].includes(col.key))                           bg = GRAY_LIGHT
      else if (['category', 'tags'].includes(col.key))              bg = BLUE_LIGHT
      else if (['curve_url', 'drawing_url'].includes(col.key))      bg = ORANGE_LIGHT
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
    })

    // Importance cell — coloured background
    const impIdx = COLS.findIndex(c => c.key === 'importance') + 1
    const impCell = row.getCell(impIdx)
    impCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: importanceColour(p.importance ?? null) } }
    impCell.alignment = { horizontal: 'center', vertical: 'middle' }
    impCell.font      = { bold: true, name: 'Arial', size: 10 }

    // Stock cell — green/red
    const stockIdx  = COLS.findIndex(c => c.key === 'in_stock') + 1
    const stockCell = row.getCell(stockIdx)
    stockCell.font      = { bold: true, color: { argb: p.in_stock ? '2E7D32' : 'C62828' }, name: 'Arial', size: 10 }
    stockCell.alignment = { horizontal: 'center', vertical: 'middle' }
  })

  // ── Sheet 2: Technical specs ───────────────────────────────────────────────
  const ws2 = wb.addWorksheet('Tehnilised andmed', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 1 }],
  })

  // First 2 columns: SKU, name — then one column per attribute
  const specCols: { key: string; header: string; width: number }[] = [
    { key: 'sku',  header: 'SKU',  width: 14 },
    { key: 'name', header: 'Nimi', width: 36 },
    ...allAttrNames.map(n => ({ key: n, header: n, width: 22 })),
  ]
  ws2.columns = specCols.map(c => ({ key: c.key, header: c.header, width: c.width }))

  // Header styling for sheet 2
  const h2 = ws2.getRow(1)
  h2.height = 22
  specCols.forEach((_, i) => {
    const cell = h2.getCell(i + 1)
    cell.font      = { bold: true, color: { argb: WHITE }, name: 'Arial', size: 9 }
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false }
    cell.border    = { bottom: { style: 'thin', color: { argb: '5580AA' } } }
  })
  ws2.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: specCols.length } }

  ;(products ?? []).forEach(p => {
    const pid    = skuToId[p.sku ?? ''] ?? ''
    const pAttrs = attrsByProduct[pid] ?? []
    const attrMap = Object.fromEntries(pAttrs.map(a => [a.name, a.value]))

    const rowData: Record<string, string> = {
      sku:  p.sku  ?? '',
      name: p.name ?? '',
    }
    for (const n of allAttrNames) rowData[n] = attrMap[n] ?? ''

    const row = ws2.addRow(rowData)
    row.height = 16
    row.font   = { name: 'Arial', size: 9 }
    row.alignment = { vertical: 'middle' }

    // Colour SKU and name cells
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRAY_LIGHT } }
    row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRAY_LIGHT } }
    row.getCell(1).font = { bold: true, name: 'Arial', size: 9 }
  })

  // ── Serialise and return ───────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer()
  const date   = new Date().toISOString().slice(0, 10)

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="tooted-${date}.xlsx"`,
    },
  })
}
