'use client'

import {
  Flame, Snowflake, Thermometer, Drill, Waves,
  ArrowUpCircle, Filter, CircleDot,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { TegevusaladBlock } from './types'

const CATEGORIES = [
  { nameKey: 'heating',  icon: Flame,         slug: 'kute' },
  { nameKey: 'cooling',  icon: Snowflake,      slug: 'jahutus' },
  { nameKey: 'hotWater', icon: Thermometer,    slug: 'sooja-tarbevee-tsirkulatsioonipump' },
  { nameKey: 'borewell', icon: Drill,          slug: 'puurkaevud' },
  { nameKey: 'drainage', icon: Waves,          slug: 'drenaaz' },
  { nameKey: 'wells',    icon: CircleDot,      slug: 'salvkaevud' },
  { nameKey: 'pressure', icon: ArrowUpCircle,  slug: 'rohutoste' },
  { nameKey: 'sewage',   icon: Filter,         slug: 'reovesi' },
]

const ICON_PX: Record<TegevusaladBlock['icon_size'], number> = {
  small: 20,
  medium: 32,
  large: 48,
}

const COL_CLASS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
}

export default function TegevusaladBlockRenderer({ block }: { block: TegevusaladBlock }) {
  const tCat = useTranslations('categories')
  const iconPx = ICON_PX[block.icon_size]
  const colClass = COL_CLASS[block.columns] ?? 'grid-cols-2 sm:grid-cols-4'

  const cardBase =
    block.card_style === 'filled'
      ? 'shadow-sm hover:shadow-md'
      : 'border border-gray-200 hover:border-[#003366]/40'

  const cardBgStyle = block.card_style === 'filled'
    ? { backgroundColor: block.card_bg_color || 'transparent' }
    : {}

  return (
    <div className={`grid ${colClass} gap-3`}>
      {CATEGORIES.map(cat => (
        <Link
          key={cat.slug}
          href={`/tooted?tegevusala=${cat.slug}`}
          className={`flex flex-col items-center gap-2.5 px-4 py-5 rounded-xl transition-all group ${cardBase} hover:bg-blue-50`}
          style={cardBgStyle}
        >
          <cat.icon
            size={iconPx}
            className="text-[#003366] group-hover:text-[#01a0dc] transition-colors flex-shrink-0"
          />
          <span className="text-[14px] font-medium text-gray-800 group-hover:text-[#003366] transition-colors text-center leading-tight">
            {tCat(cat.nameKey)}
          </span>
        </Link>
      ))}
    </div>
  )
}
