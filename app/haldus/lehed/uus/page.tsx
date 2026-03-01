import Link from 'next/link'
import PageForm from '@/components/haldus/PageForm'

export default function UusLehtPage() {
  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/haldus/lehed" className="text-gray-400 hover:text-[#003366] transition-colors text-[15px]">
          ← Lehed
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Lisa uus leht</h1>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <PageForm mode="create" />
      </div>
    </div>
  )
}
