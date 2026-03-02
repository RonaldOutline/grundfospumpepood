import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const client = new Anthropic()

const CATEGORIES = [
  { label: 'Küte',         slug: 'kute' },
  { label: 'Jahutus',      slug: 'jahutus' },
  { label: 'Soe tarbevesi', slug: 'sooja-tarbevee-tsirkulatsioonipump' },
  { label: 'Puurkaevud',   slug: 'puurkaevud' },
  { label: 'Drenaaž',      slug: 'drenaaz' },
  { label: 'Salvkaevud',   slug: 'salvkaevud' },
  { label: 'Rõhutõste',    slug: 'rohutoste' },
  { label: 'Reovesi',      slug: 'reovesi' },
]

const VALID_SLUGS = new Set(CATEGORIES.map(c => c.slug))

/**
 * POST /api/search-ai
 * Body: { query: string }
 * Returns: { categorySlug: string | null }
 *
 * Called only when DB search returns no results.
 * Checks synonym cache first, then falls back to Claude.
 * Caches new AI results so the same query never hits Claude twice.
 */
export async function POST(req: NextRequest) {
  const { query } = await req.json().catch(() => ({}))
  if (!query?.trim()) return NextResponse.json({ categorySlug: null })

  const normalized = query.trim().toLowerCase()
  const cacheKey   = `search:${normalized}`

  // 1. Check synonym cache in settings table
  const { data: cached } = await supabaseAdmin
    .from('settings')
    .select('value')
    .eq('key', cacheKey)
    .single()

  if (cached) {
    const slug = cached.value === 'none' ? null : cached.value
    return NextResponse.json({ categorySlug: slug })
  }

  // 2. Ask Claude — tiny prompt, ~100-300 tokens in, ~5 tokens out
  const categoryList = CATEGORIES.map(c => `${c.label} (${c.slug})`).join(', ')

  let categorySlug: string | null = null
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 20,
      messages: [{
        role: 'user',
        content: `User searched for: "${normalized}"
Available pump categories: ${categoryList}
If the search clearly matches one category, reply with only its slug. Otherwise reply with "none".`,
      }],
    })

    const text = response.content[0].type === 'text'
      ? response.content[0].text.trim().toLowerCase()
      : 'none'

    categorySlug = VALID_SLUGS.has(text) ? text : null
  } catch (e) {
    console.error('Claude search-ai error:', e)
    return NextResponse.json({ categorySlug: null })
  }

  // 3. Cache result so this query never hits Claude again
  await supabaseAdmin.from('settings').upsert(
    { key: cacheKey, value: categorySlug ?? 'none', updated_at: new Date().toISOString() },
    { onConflict: 'key' },
  )

  return NextResponse.json({ categorySlug })
}
