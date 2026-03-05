'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, Trash2, Settings2, ImageIcon, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ColumnEditor from './ColumnEditor'
import type { Section, Column, SectionSettings } from './types'

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:border-[#003366] outline-none transition-colors bg-white'

// Column presets for 1-6 columns
function defaultColumns(count: number): Column[] {
  const widths: Record<number, number[]> = {
    1: [100],
    2: [50, 50],
    3: [33, 34, 33],
    4: [25, 25, 25, 25],
    5: [20, 20, 20, 20, 20],
    6: [17, 17, 17, 17, 16, 16],
  }
  return (widths[count] ?? [100]).map(w => ({
    id: crypto.randomUUID(),
    width: w,
    vertical_align: 'top' as const,
    blocks: [],
  }))
}

const TWO_COL_PRESETS: { label: string; widths: [number, number] }[] = [
  { label: '50/50', widths: [50, 50] },
  { label: '33/67', widths: [33, 67] },
  { label: '67/33', widths: [67, 33] },
  { label: '25/75', widths: [25, 75] },
  { label: '75/25', widths: [75, 25] },
  { label: '40/60', widths: [40, 60] },
]

const PADDING_OPTS = [
  { value: 'small',  label: 'Väike (16px)' },
  { value: 'medium', label: 'Keskmine (48px)' },
  { value: 'large',  label: 'Suur (96px)' },
  { value: 'custom', label: 'Kohandatud' },
] as const

interface Props {
  section: Section
  onChange: (s: Section) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  isFirst: boolean
  isLast: boolean
}

export default function SectionEditor({ section, onChange, onMoveUp, onMoveDown, onDelete, isFirst, isLast }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  function updSettings(fields: Partial<SectionSettings>) {
    onChange({ ...section, settings: { ...section.settings, ...fields } })
  }

  function updateColumn(i: number, col: Column) {
    const columns = section.columns.map((c, idx) => idx === i ? col : c)
    onChange({ ...section, columns })
  }

  function setColCount(count: number) {
    const existing = section.columns
    if (count === existing.length) return
    if (count > existing.length) {
      const extra = defaultColumns(count).slice(existing.length)
      // Redistribute widths equally
      const totalWidth = 100
      const newCols = [...existing, ...extra].map((c, i, arr) => ({
        ...c,
        width: i < arr.length - 1 ? Math.floor(totalWidth / arr.length) : totalWidth - Math.floor(totalWidth / arr.length) * (arr.length - 1),
      }))
      onChange({ ...section, columns: newCols })
    } else {
      // Shrink — last column absorbs extra width
      const kept = existing.slice(0, count)
      const totalUsed = kept.slice(0, -1).reduce((s, c) => s + c.width, 0)
      kept[kept.length - 1] = { ...kept[kept.length - 1], width: 100 - totalUsed }
      onChange({ ...section, columns: kept })
    }
  }

  function applyTwoColPreset(widths: [number, number]) {
    const cols = section.columns.slice(0, 2)
    while (cols.length < 2) cols.push(defaultColumns(2)[cols.length])
    onChange({ ...section, columns: cols.map((c, i) => ({ ...c, width: widths[i] })) })
  }

  async function uploadBg(file: File) {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const name = `bg/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('pages').upload(name, file, { cacheControl: '3600', upsert: false })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('pages').getPublicUrl(name)
      updSettings({ background_image_url: publicUrl })
    }
    setUploading(false)
  }

  const s = section.settings

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50">
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-100">
        <span className="text-[13px] font-semibold text-gray-700 flex-1">
          Sektsioon · {section.columns.length} veerg{section.columns.length !== 1 ? 'u' : ''}
        </span>
        <button type="button" onClick={() => setSettingsOpen(o => !o)}
          className={`p-1.5 rounded-lg transition-colors ${settingsOpen ? 'bg-[#003366] text-white' : 'text-gray-400 hover:text-[#003366] hover:bg-blue-50'}`}
          title="Sektsioon seaded">
          <Settings2 size={15} />
        </button>
        <button type="button" onClick={onMoveUp} disabled={isFirst}
          className="p-1.5 text-gray-400 hover:text-[#003366] disabled:opacity-25 rounded-lg hover:bg-blue-50 transition-colors">
          <ChevronUp size={15} />
        </button>
        <button type="button" onClick={onMoveDown} disabled={isLast}
          className="p-1.5 text-gray-400 hover:text-[#003366] disabled:opacity-25 rounded-lg hover:bg-blue-50 transition-colors">
          <ChevronDown size={15} />
        </button>
        <button type="button" onClick={onDelete}
          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
          <Trash2 size={15} />
        </button>
      </div>

      {/* Settings panel */}
      {settingsOpen && (
        <div className="bg-white border-b border-gray-100 px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Width */}
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Laius</label>
              <div className="flex gap-2">
                {(['boxed', 'full'] as const).map(v => (
                  <button key={v} type="button" onClick={() => updSettings({ width: v })}
                    className={`flex-1 py-1.5 rounded-lg text-[13px] border transition-colors ${
                      s.width === v ? 'bg-[#003366] text-white border-[#003366]' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}>
                    {v === 'boxed' ? 'Boxed (1200px)' : 'Full laius'}
                  </button>
                ))}
              </div>
            </div>

            {/* Column count */}
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Veergude arv</label>
              <div className="flex gap-1">
                {[1,2,3,4,5,6].map(n => (
                  <button key={n} type="button" onClick={() => setColCount(n)}
                    className={`flex-1 py-1.5 rounded-lg text-[13px] border transition-colors ${
                      section.columns.length === n ? 'bg-[#003366] text-white border-[#003366]' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2-col width presets */}
          {section.columns.length === 2 && (
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Veeru laiuse jaotus</label>
              <div className="flex gap-1.5 flex-wrap">
                {TWO_COL_PRESETS.map(p => (
                  <button key={p.label} type="button" onClick={() => applyTwoColPreset(p.widths)}
                    className={`px-2.5 py-1 rounded-lg text-[12px] border transition-colors ${
                      section.columns[0].width === p.widths[0] && section.columns[1].width === p.widths[1]
                        ? 'bg-[#003366] text-white border-[#003366]'
                        : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Background */}
          <div>
            <label className="block text-[12px] font-medium text-gray-600 mb-1">Taust</label>
            <div className="flex gap-2 mb-2">
              {(['color', 'image'] as const).map(v => (
                <button key={v} type="button" onClick={() => updSettings({ background_type: v })}
                  className={`px-3 py-1.5 rounded-lg text-[13px] border transition-colors ${
                    s.background_type === v ? 'bg-[#003366] text-white border-[#003366]' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}>
                  {v === 'color' ? 'Värv' : 'Pilt'}
                </button>
              ))}
            </div>
            {s.background_type === 'color' && (
              <div className="flex items-center gap-3">
                <input type="color" value={s.background_color}
                  onChange={e => updSettings({ background_color: e.target.value })}
                  className="h-9 w-16 rounded border border-gray-200 cursor-pointer" />
                <span className="text-[13px] text-gray-500 font-mono">{s.background_color}</span>
              </div>
            )}
            {s.background_type === 'image' && (
              <div className="space-y-2">
                {s.background_image_url ? (
                  <div className="relative inline-flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.background_image_url} alt="Taust" className="h-14 w-24 object-cover rounded-lg border border-gray-200" />
                    <button type="button" onClick={() => updSettings({ background_image_url: null })}
                      className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className={`flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:border-[#003366]/40 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <ImageIcon size={16} className="text-gray-400" />
                    <span className="text-[13px] text-gray-500">{uploading ? 'Laadin...' : 'Lae üles taustatpilt'}</span>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadBg(f) }} />
                  </label>
                )}
                <div>
                  <label className="block text-[12px] font-medium text-gray-600 mb-1">
                    Overlay tumedus: {Math.round(s.background_overlay * 100)}%
                  </label>
                  <input type="range" min={0} max={1} step={0.05} value={s.background_overlay}
                    onChange={e => updSettings({ background_overlay: Number(e.target.value) })}
                    className="w-full" />
                </div>
              </div>
            )}
          </div>

          {/* Padding */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Polsterdus üles</label>
              <select value={s.padding_top} onChange={e => updSettings({ padding_top: e.target.value as SectionSettings['padding_top'] })} className={inp}>
                {PADDING_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {s.padding_top === 'custom' && (
                <input type="number" value={s.padding_top_custom ?? 0} min={0} max={400}
                  onChange={e => updSettings({ padding_top_custom: Number(e.target.value) })}
                  className={`${inp} mt-1`} placeholder="px" />
              )}
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Polsterdus alla</label>
              <select value={s.padding_bottom} onChange={e => updSettings({ padding_bottom: e.target.value as SectionSettings['padding_bottom'] })} className={inp}>
                {PADDING_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {s.padding_bottom === 'custom' && (
                <input type="number" value={s.padding_bottom_custom ?? 0} min={0} max={400}
                  onChange={e => updSettings({ padding_bottom_custom: Number(e.target.value) })}
                  className={`${inp} mt-1`} placeholder="px" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Columns */}
      <div
        className="p-4 grid gap-4"
        style={{ gridTemplateColumns: section.columns.map(c => `${c.width}fr`).join(' ') }}
      >
        {section.columns.map((col, i) => (
          <ColumnEditor
            key={col.id}
            column={col}
            onChange={c => updateColumn(i, c)}
            index={i}
          />
        ))}
      </div>
    </div>
  )
}
