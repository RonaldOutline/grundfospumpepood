'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref') || ''

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-gray-100 p-12 max-w-md w-full text-center shadow-sm">
        <CheckCircle2 size={60} className="text-green-500 mx-auto mb-5" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tellimus vastu võetud!</h1>
        {ref && (
          <p className="text-[15px] text-gray-500 mb-1">
            Tellimuse nr: <span className="font-mono font-semibold text-gray-700">{ref}</span>
          </p>
        )}
        <p className="text-[15px] text-gray-500 mb-7">
          Saatsime kinnituse sinu e-postile. Võtame sinuga tarne osas ühendust.
        </p>
        <Link href="/tooted"
          className="inline-block bg-[#003366] text-white px-6 py-3 rounded-xl font-semibold text-[15px] hover:bg-[#004080] transition-colors">
          Jätka ostlemist
        </Link>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  )
}
