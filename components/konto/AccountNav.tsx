'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, User, MapPin, LogOut, Shield } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const links = [
  { href: '/konto',            label: 'Ülevaade',   icon: LayoutDashboard },
  { href: '/konto/tellimused', label: 'Tellimused', icon: ShoppingBag },
  { href: '/konto/profiil',    label: 'Profiil',    icon: User },
  { href: '/konto/aadressid',  label: 'Aadressid',  icon: MapPin },
]

export default function AccountNav() {
  const pathname = usePathname()
  const { signOut, profile } = useAuth()
  const isAdmin = profile?.role === 'superadmin' || profile?.role === 'manager'

  return (
    <>
      {/* Mobiil: horisontaalne */}
      <nav className="md:hidden flex overflow-x-auto gap-1 pb-1 border-b border-gray-100 mb-6">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[14px] font-medium whitespace-nowrap transition-colors ${
                active
                  ? 'text-[#003366] border-b-2 border-[#003366] bg-blue-50'
                  : 'text-gray-600 hover:text-[#003366] hover:bg-blue-50'
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
        {isAdmin && (
          <Link
            href="/haldus"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[14px] font-medium whitespace-nowrap text-[#003366] bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <Shield size={15} />
            Haldus
          </Link>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[14px] font-medium whitespace-nowrap text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={15} />
          Logi välja
        </button>
      </nav>

      {/* Desktop: vertikaalne */}
      <aside className="hidden md:flex flex-col gap-1 w-52 flex-shrink-0">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[15px] font-medium transition-colors ${
                active
                  ? 'text-[#003366] border-l-2 border-[#003366] bg-blue-50 pl-[14px]'
                  : 'text-gray-600 hover:text-[#003366] hover:bg-blue-50'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
        {isAdmin && (
          <>
            <div className="my-2 border-t border-gray-100" />
            <Link
              href="/haldus"
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[15px] font-semibold text-[#003366] bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <Shield size={16} />
              Haldus paneel
            </Link>
          </>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[15px] font-medium text-red-500 hover:bg-red-50 transition-colors mt-2"
        >
          <LogOut size={16} />
          Logi välja
        </button>
      </aside>
    </>
  )
}
