'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SearchBarBlockRenderer() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleSearch() {
    if (query.trim()) {
      router.push(`/tooted?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className="w-full flex items-center bg-[#003366] rounded-xl overflow-hidden shadow-sm">
      <Search size={18} className="ml-4 text-white/50 flex-shrink-0" />
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSearch()}
        placeholder="Otsi tooteid..."
        className="flex-1 px-3 py-3.5 text-[15px] outline-none bg-transparent text-white placeholder-white/40"
      />
      <button
        onClick={handleSearch}
        className="bg-[#01a0dc] hover:bg-[#0190c9] text-white px-6 py-3.5 text-[14px] font-semibold transition-colors"
      >
        Otsi
      </button>
    </div>
  )
}
