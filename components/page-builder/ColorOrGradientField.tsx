'use client'

import { useState, useEffect } from 'react'

const DIRECTIONS = [
  { value: 'to right',  label: '→' },
  { value: 'to left',   label: '←' },
  { value: 'to bottom', label: '↓' },
  { value: 'to top',    label: '↑' },
  { value: '135deg',    label: '↘' },
  { value: '45deg',     label: '↗' },
]

function buildGradient(dir: string, c1: string, c2: string) {
  return `linear-gradient(${dir}, ${c1}, ${c2})`
}

function parseGradient(css: string) {
  const m = css.match(/linear-gradient\(\s*([^,]+?)\s*,\s*(#[0-9a-fA-F]{3,8})\s*,\s*(#[0-9a-fA-F]{3,8})\s*\)/)
  if (m) return { dir: m[1].trim(), c1: m[2], c2: m[3] }
  return null
}

interface Props {
  value: string
  onChange: (v: string) => void
}

export default function ColorOrGradientField({ value, onChange }: Props) {
  const isGrad = value.startsWith('linear-gradient')
  const [mode, setMode] = useState<'solid' | 'gradient'>(isGrad ? 'gradient' : 'solid')

  const parsed = parseGradient(value)
  const [solidColor, setSolidColor] = useState(!isGrad ? (value || '#003366') : '#003366')
  const [gradDir, setGradDir] = useState(parsed?.dir ?? 'to right')
  const [gradC1,  setGradC1]  = useState(parsed?.c1  ?? '#003366')
  const [gradC2,  setGradC2]  = useState(parsed?.c2  ?? '#01a0dc')

  useEffect(() => {
    const p = parseGradient(value)
    if (p) {
      setMode('gradient'); setGradDir(p.dir); setGradC1(p.c1); setGradC2(p.c2)
    } else {
      setMode('solid'); setSolidColor(value || '#003366')
    }
  }, [value])

  function switchMode(m: 'solid' | 'gradient') {
    setMode(m)
    if (m === 'solid') onChange(solidColor)
    else onChange(buildGradient(gradDir, gradC1, gradC2))
  }

  function updateGradient(dir = gradDir, c1 = gradC1, c2 = gradC2) {
    setGradDir(dir); setGradC1(c1); setGradC2(c2)
    onChange(buildGradient(dir, c1, c2))
  }

  const colorPicker = 'h-8 w-10 rounded border border-gray-200 cursor-pointer p-0.5'
  const hexInp = 'w-20 border border-gray-200 rounded-lg px-2 py-1 text-[13px] font-mono focus:border-[#003366] outline-none'

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {(['solid', 'gradient'] as const).map(m => (
          <button key={m} type="button" onClick={() => switchMode(m)}
            className={`flex-1 py-1 rounded-lg text-[12px] border transition-colors ${
              mode === m ? 'bg-[#003366] text-white border-[#003366]' : 'border-gray-200 text-gray-500 hover:border-gray-400'
            }`}>
            {m === 'solid' ? 'Ühtne' : 'Gradient'}
          </button>
        ))}
      </div>

      {mode === 'solid' ? (
        <div className="flex items-center gap-2">
          <input type="color" value={solidColor}
            onChange={e => { setSolidColor(e.target.value); onChange(e.target.value) }}
            className={colorPicker} />
          <input type="text" value={solidColor} maxLength={7}
            onChange={e => {
              const v = e.target.value
              if (/^#[0-9a-fA-F]{0,6}$/.test(v)) { setSolidColor(v); if (v.length === 7) onChange(v) }
            }}
            className={hexInp} placeholder="#000000" />
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-start gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-gray-400">C1</span>
              <input type="color" value={gradC1}
                onChange={e => updateGradient(gradDir, e.target.value, gradC2)}
                className={colorPicker} />
              <input type="text" value={gradC1} maxLength={7}
                onChange={e => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) { setGradC1(v); if (v.length === 7) updateGradient(gradDir, v, gradC2) } }}
                className={hexInp} />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-gray-400">C2</span>
              <input type="color" value={gradC2}
                onChange={e => updateGradient(gradDir, gradC1, e.target.value)}
                className={colorPicker} />
              <input type="text" value={gradC2} maxLength={7}
                onChange={e => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) { setGradC2(v); if (v.length === 7) updateGradient(gradDir, gradC1, v) } }}
                className={hexInp} />
            </div>
            <select value={gradDir} onChange={e => updateGradient(e.target.value, gradC1, gradC2)}
              className="border border-gray-200 rounded-lg px-2 py-1 text-[13px] outline-none bg-white">
              {DIRECTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="h-5 rounded-lg border border-gray-200"
            style={{ background: buildGradient(gradDir, gradC1, gradC2) }} />
        </div>
      )}
    </div>
  )
}
