'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, ExternalLink, Eye } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

const canManage = (role: string) => role === 'superadmin'

interface Page {
  id: string
  slug: string
  title: string
  status: string | null
  show_in_nav: boolean | null
  created_at: string
}

export default function HaldusLehedPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile && !canManage(profile.role)) router.replace('/haldus')
  }, [profile, router])

  async function load() {
    const { data } = await supabase
      .from('pages')
      .select('id, slug, title, status, show_in_nav, created_at')
      .order('created_at', { ascending: false })
    setPages(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!canManage(profile?.role ?? '')) return null

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Kustuta leht "${title}"?`)) return
    await supabase.from('pages').delete().eq('id', id)
    await load()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lehed</h1>
          <p className="text-[14px] text-gray-500 mt-0.5">Page builderiga koostatud staatilised lehed</p>
        </div>
        <Link
          href="/haldus/lehed/uus"
          className="flex items-center gap-2 bg-[#003366] hover:bg-[#004080] text-white px-4 py-2.5 rounded-xl font-semibold text-[15px] transition-colors"
        >
          <Plus size={16} /> Lisa leht
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {pages.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[15px] text-gray-500 mb-4">Lehti pole lisatud.</p>
            <Link href="/haldus/lehed/uus" className="text-[#003366] font-semibold hover:underline text-[15px]">
              + Lisa esimene leht
            </Link>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-gray-100 text-[12px] font-semibold text-gray-400 uppercase tracking-wider">
              <span>Pealkiri / slug</span>
              <span className="text-center">Staatus</span>
              <span className="text-center">Menüüs</span>
              <span />
            </div>
            <div className="divide-y divide-gray-50">
              {pages.map(page => {
                const isPublished = page.status === 'published'
                const inNav       = !!page.show_in_nav
                return (
                  <div key={page.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-[15px]">{page.title}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[13px] text-gray-400">/leht/{page.slug}</span>
                        <a href={`/leht/${page.slug}`} target="_blank" rel="noopener noreferrer"
                          className="text-gray-300 hover:text-[#003366] transition-colors">
                          <ExternalLink size={12} />
                        </a>
                      </div>
                      <div className="text-[12px] text-gray-400 mt-0.5">
                        {new Date(page.created_at).toLocaleDateString('et-EE')}
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[12px] font-semibold flex-shrink-0 ${
                      isPublished ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {isPublished ? 'Avalik' : 'Mustand'}
                    </span>

                    <span className={`px-2.5 py-1 rounded-full text-[12px] font-semibold flex-shrink-0 flex items-center gap-1 ${
                      inNav ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {inNav ? 'Jah' : 'Ei'}
                    </span>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <a href={`/leht/${page.slug}`} target="_blank" rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-[#003366] transition-colors rounded-lg hover:bg-blue-50"
                        title="Eelvaade">
                        <Eye size={15} />
                      </a>
                      <Link href={`/haldus/lehed/${page.id}`}
                        className="p-2 text-gray-400 hover:text-[#003366] transition-colors rounded-lg hover:bg-blue-50"
                        title="Muuda">
                        <Pencil size={15} />
                      </Link>
                      <button onClick={() => handleDelete(page.id, page.title)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                        title="Kustuta">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
