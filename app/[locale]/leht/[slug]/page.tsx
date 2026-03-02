import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ContactForm from '@/components/ContactForm'
import { getTranslations } from 'next-intl/server'

interface Column { title: string; text: string }

interface PageRow {
  id: string
  title: string
  short_description: string | null
  content: string | null
  image_url: string | null
  published: boolean
  template: string
}

async function getPage(slug: string): Promise<PageRow | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase
    .from('pages')
    .select('id, title, short_description, content, image_url, published, template')
    .eq('slug', slug)
    .eq('published', true)
    .single()
  return data
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) return {}
  return {
    title: page.title,
    description: page.short_description ?? undefined,
    openGraph: { images: page.image_url ? [{ url: page.image_url }] : undefined },
  }
}

export default async function PublicPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) notFound()
  const tCommon = await getTranslations('common')

  const isContact = page.template === 'contact'

  let columns: Column[] = []
  if (isContact && page.content) {
    try {
      const parsed = JSON.parse(page.content)
      if (Array.isArray(parsed)) columns = parsed
    } catch {}
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Featured image */}
        {page.image_url && (
          <img
            src={page.image_url}
            alt={page.title}
            className="w-full h-64 object-cover rounded-2xl mb-8 shadow-sm"
          />
        )}

        {/* Pealkiri + lühikirjeldus */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{page.title}</h1>
        {page.short_description && (
          <p className="text-[17px] text-gray-600 mb-10 leading-relaxed">
            {page.short_description}
          </p>
        )}

        {isContact ? (
          <>
            {/* 4 infoveergu */}
            {columns.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                {columns.map((col, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    {col.title && (
                      <h3 className="font-semibold text-[#003366] text-[15px] mb-2">{col.title}</h3>
                    )}
                    {col.text && (
                      <p className="text-[14px] text-gray-600 leading-relaxed whitespace-pre-line">
                        {col.text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Kontaktvorm */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1">{tCommon('contactFormTitle')}</h2>
              <p className="text-[14px] text-gray-500 mb-6">{tCommon('contactFormSubtitle')}</p>
              <ContactForm pageId={page.id} />
            </div>
          </>
        ) : (
          /* Tavaline HTML sisu */
          page.content && (
            <div
              className="text-[15px] text-gray-700 leading-relaxed
                [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-8 [&_h1]:mb-3
                [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-6 [&_h2]:mb-2
                [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-4 [&_h3]:mb-2
                [&_p]:leading-relaxed [&_p]:mb-3
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ul]:mb-3
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1 [&_ol]:mb-3
                [&_a]:text-[#003366] [&_a]:underline [&_a:hover]:text-[#01a0dc]
                [&_strong]:font-semibold [&_strong]:text-gray-900
                [&_hr]:border-gray-200 [&_hr]:my-6"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          )
        )}
      </div>
    </div>
  )
}
