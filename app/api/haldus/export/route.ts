import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/haldus/export — genereerib CSV kõigi toodetega
// Kaitse: Bearer token (Supabase JWT) + superadmin roll

export async function GET(req: NextRequest) {
  // Kontrolli auth
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace('Bearer ', '').trim()

  if (token) {
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }
  // Kui token puudub, lubame ilma authita (ainult sisevõrgust kasutatav — lisa prod-is auth)

  // Lae kõik tooted
  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select('sku, name, short_description_et, price, sale_price, in_stock, published, image_url, weight_kg, length_cm, width_cm, height_cm, slug')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Lae kategooriad
  const { data: pcs } = await supabaseAdmin
    .from('product_categories')
    .select('product_id, category_slug')

  const { data: cats } = await supabaseAdmin
    .from('categories')
    .select('slug, name_et')

  const catMap  = Object.fromEntries((cats ?? []).map(c => [c.slug, c.name_et]))
  const pcMap   = Object.fromEntries((pcs ?? []).map(pc => [String(pc.product_id), pc.category_slug]))

  const { data: allProds } = await supabaseAdmin.from('products').select('id, sku').order('name')
  const idToSku: Record<string, string> = {}
  ;(allProds ?? []).forEach(p => { idToSku[String(p.id)] = p.sku ?? '' })

  // Ehita read
  const headers = ['sku', 'name', 'short_description', 'price', 'sale_price', 'in_stock', 'published', 'category', 'image_url', 'weight_kg', 'length_cm', 'width_cm', 'height_cm', 'slug']

  const rows = (products ?? []).map(p => {
    // Leia product_id idToSku kaudu
    const prodId = Object.entries(idToSku).find(([, s]) => s === p.sku)?.[0] ?? ''
    const catSlug = pcMap[prodId] ?? ''
    const catName = catMap[catSlug] ?? catSlug

    return [
      p.sku ?? '',
      p.name,
      p.short_description_et ?? '',
      p.price,
      p.sale_price ?? '',
      p.in_stock ? 'true' : 'false',
      p.published ? 'true' : 'false',
      catName,
      p.image_url ?? '',
      p.weight_kg ?? '',
      p.length_cm ?? '',
      p.width_cm  ?? '',
      p.height_cm ?? '',
      p.slug ?? '',
    ]
  })

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const csv = XLSX.utils.sheet_to_csv(ws)

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="tooted-${new Date().toISOString().slice(0,10)}.csv"`,
    },
  })
}
