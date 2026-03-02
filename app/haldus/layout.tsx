'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import HaldusNav from '@/components/haldus/HaldusNav'

const canManageOrders = (role: string) => ['manager', 'superadmin'].includes(role)

function HaldusContent({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/konto/sisselogimine'); return }
    if (profile && !canManageOrders(profile.role)) {
      router.replace('/konto')
    }
  }, [user, profile, loading, router])

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!canManageOrders(profile.role)) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top header bar */}
      <div className="bg-[#003366] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/">
            <img src="/ipumps-logo-white.svg" alt="iPumps" className="h-7 w-auto" />
          </a>
          <div className="flex items-center gap-5 text-[14px]">
            <a href="/" className="text-white/70 hover:text-white transition-colors">← Pood</a>
            <span className="text-white/50">{profile.full_name || profile.email}</span>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6 items-start">
          <HaldusNav />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default function HaldusLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <HaldusContent>{children}</HaldusContent>
    </AuthProvider>
  )
}
