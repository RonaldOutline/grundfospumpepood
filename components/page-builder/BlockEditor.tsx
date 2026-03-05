'use client'

import { useState } from 'react'
import type React from 'react'
import { ChevronUp, ChevronDown, Trash2, ImageIcon, X, GripVertical } from 'lucide-react'
import { uploadFile } from '@/lib/upload'
import RichTextEditor from './RichTextEditor'
import type {
  ContentBlock, HeadingBlock, TextBlock, ImageBlock,
  ButtonBlock, VideoBlock, DividerBlock, SpacerBlock, Alignment,
} from './types'

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:border-[#003366] outline-none transition-colors bg-white'
const lbl = 'block text-[12px] font-medium text-gray-600 mb-1'

const LABELS: Record<string, string> = {
  heading: 'Pealkiri', text: 'Tekst', image: 'Pilt',
  button: 'Nupp', video: 'Video', divider: 'Eraldusjooon', spacer: 'Tühik',
}

function AlignBtns({ value, onChange }: { value: Alignment; onChange: (a: Alignment) => void }) {
  return (
    <div className="flex gap-1">
      {(['left', 'center', 'right'] as Alignment[]).map(a => (
        <button key={a} type="button" onClick={() => onChange(a)}
          className={`px-2 py-1 rounded text-[11px] border transition-colors ${
            value === a ? 'bg-[#003366] text-white border-[#003366]' : 'border-gray-200 text-gray-500 hover:border-gray-400'
          }`}>
          {a === 'left' ? '⇤' : a === 'center' ? '⇔' : '⇥'}
        </button>
      ))}
    </div>
  )
}

interface Props {
  block: ContentBlock
  onChange: (block: ContentBlock) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  isFirst: boolean
  isLast: boolean
  onGripDragStart?: (e: React.DragEvent) => void
}

export default function BlockEditor({ block, onChange, onMoveUp, onMoveDown, onDelete, isFirst, isLast, onGripDragStart }: Props) {
  const [open, setOpen] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  function upd(fields: Partial<ContentBlock>) {
    onChange({ ...block, ...fields } as ContentBlock)
  }

  async function uploadImg(file: File): Promise<string | null> {
    setUploading(true)
    setUploadError('')
    try {
      const url = await uploadFile(file, 'blocks')
      setUploading(false)
      return url
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Üleslaadimine ebaõnnestus')
      setUploading(false)
      return null
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border-b border-gray-100">
        <span draggable={!!onGripDragStart} onDragStart={onGripDragStart} className="flex-shrink-0 leading-none">
          <GripVertical size={16} className="text-gray-300 cursor-grab active:cursor-grabbing" />
        </span>
        <span className="text-[12px] font-semibold text-gray-600 flex-1">{LABELS[block.type] ?? block.type}</span>
        <button type="button" onClick={() => setOpen(o => !o)}
          className="text-[11px] text-gray-400 hover:text-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-200 transition-colors">
          {open ? '▲' : '▼'}
        </button>
        <button type="button" onClick={onMoveUp} disabled={isFirst}
          className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-25 rounded hover:bg-gray-200 transition-colors">
          <ChevronUp size={16} />
        </button>
        <button type="button" onClick={onMoveDown} disabled={isLast}
          className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-25 rounded hover:bg-gray-200 transition-colors">
          <ChevronDown size={16} />
        </button>
        <button type="button" onClick={onDelete}
          className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Body */}
      {open && (
        <div className="p-3 space-y-3">

          {/* HEADING */}
          {block.type === 'heading' && (() => {
            const b = block as HeadingBlock
            return (
              <>
                <div>
                  <label className={lbl}>Tase</label>
                  <div className="flex gap-1 flex-wrap">
                    {(['h1','h2','h3','h4','h5','h6'] as const).map(l => (
                      <button key={l} type="button" onClick={() => upd({ level: l })}
                        className={`px-2 py-1 rounded text-[12px] border transition-colors ${
                          b.level === l ? 'bg-[#003366] text-white border-[#003366]' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                        }`}>
                        {l.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={lbl}>Tekst</label>
                  <input type="text" value={b.text} onChange={e => upd({ text: e.target.value })}
                    className={inp} placeholder="Pealkiri" />
                </div>
                <div>
                  <label className={lbl}>
                    Suurus{' '}
                    <span className="font-normal text-gray-400">(tühi = taseme vaikeväärtus)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={b.custom_size ?? ''}
                      min={6} max={200}
                      onChange={e => upd({ custom_size: e.target.value ? Number(e.target.value) : undefined })}
                      className={`${inp} w-24`}
                      placeholder="auto"
                    />
                    <div className="flex gap-1">
                      {(['px', 'em'] as const).map(u => (
                        <button key={u} type="button"
                          onClick={() => upd({ custom_unit: u })}
                          className={`px-3 py-1 rounded-lg text-[13px] border transition-colors ${
                            (b.custom_unit ?? 'px') === u
                              ? 'bg-[#003366] text-white border-[#003366]'
                              : 'border-gray-200 text-gray-500 hover:border-gray-400'
                          }`}>
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <label className={lbl}>Joondus</label>
                    <AlignBtns value={b.alignment} onChange={a => upd({ alignment: a })} />
                  </div>
                  <div>
                    <label className={lbl}>Värv</label>
                    <input type="color" value={b.color} onChange={e => upd({ color: e.target.value })}
                      className="h-8 w-14 rounded border border-gray-200 cursor-pointer" />
                  </div>
                </div>
              </>
            )
          })()}

          {/* TEXT */}
          {block.type === 'text' && (() => {
            const b = block as TextBlock
            return (
              <>
                <div>
                  <label className={lbl}>Sisu</label>
                  <RichTextEditor value={b.content} onChange={html => upd({ content: html })} />
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <label className={lbl}>Joondus</label>
                    <AlignBtns value={b.alignment} onChange={a => upd({ alignment: a })} />
                  </div>
                  <div>
                    <label className={lbl}>Värv</label>
                    <input type="color" value={b.color} onChange={e => upd({ color: e.target.value })}
                      className="h-8 w-14 rounded border border-gray-200 cursor-pointer" />
                  </div>
                </div>
              </>
            )
          })()}

          {/* IMAGE */}
          {block.type === 'image' && (() => {
            const b = block as ImageBlock
            return (
              <>
                {b.url ? (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.url} alt={b.alt} className="h-28 object-cover rounded-lg border border-gray-200" />
                    <button type="button" onClick={() => upd({ url: '' })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <label className={`flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#003366]/40 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      <ImageIcon size={18} className="text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-[13px] text-gray-600 font-medium">{uploading ? 'Laadin üles...' : 'Kliki pildi lisamiseks'}</p>
                        <p className="text-[11px] text-gray-400">JPG, PNG, WebP</p>
                      </div>
                      <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="hidden" onChange={async e => {
                        const file = e.target.files?.[0]
                        if (file) { const url = await uploadImg(file); if (url) upd({ url }) }
                        e.target.value = ''
                      }} />
                    </label>
                    {uploadError && (
                      <p className="text-[12px] text-red-500 mt-1">{uploadError}</p>
                    )}
                  </>
                )}
                <div>
                  <label className={lbl}>Pildi URL (alternatiiv)</label>
                  <input type="text" value={b.url} onChange={e => upd({ url: e.target.value })}
                    className={inp} placeholder="https://..." />
                </div>
                <div>
                  <label className={lbl}>Alt tekst</label>
                  <input type="text" value={b.alt} onChange={e => upd({ alt: e.target.value })}
                    className={inp} placeholder="Pildi kirjeldus" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Link URL</label>
                    <input type="text" value={b.link_url ?? ''} onChange={e => upd({ link_url: e.target.value || null })}
                      className={inp} placeholder="/tooted" />
                  </div>
                  <div>
                    <label className={lbl}>Link target</label>
                    <select value={b.link_target} onChange={e => upd({ link_target: e.target.value as '_self'|'_blank' })} className={inp}>
                      <option value="_self">Sama aken</option>
                      <option value="_blank">Uus aken</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={lbl}>Object-fit</label>
                  <div className="flex gap-2">
                    {(['cover','contain'] as const).map(v => (
                      <button key={v} type="button" onClick={() => upd({ object_fit: v })}
                        className={`px-3 py-1 rounded text-[13px] border transition-colors ${
                          b.object_fit === v ? 'bg-[#003366] text-white border-[#003366]' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                        }`}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )
          })()}

          {/* BUTTON */}
          {block.type === 'button' && (() => {
            const b = block as ButtonBlock
            return (
              <>
                <div>
                  <label className={lbl}>Tekst</label>
                  <input type="text" value={b.text} onChange={e => upd({ text: e.target.value })}
                    className={inp} placeholder="Kliki siia" />
                </div>
                <div>
                  <label className={lbl}>URL</label>
                  <input type="text" value={b.url} onChange={e => upd({ url: e.target.value })}
                    className={inp} placeholder="/tooted" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Target</label>
                    <select value={b.target} onChange={e => upd({ target: e.target.value as '_self'|'_blank' })} className={inp}>
                      <option value="_self">Sama aken</option>
                      <option value="_blank">Uus aken</option>
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Stiil</label>
                    <select value={b.style} onChange={e => upd({ style: e.target.value as 'filled'|'outline'|'text' })} className={inp}>
                      <option value="filled">Täidetud</option>
                      <option value="outline">Äär</option>
                      <option value="text">Tekst</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <label className={lbl}>Joondus</label>
                    <AlignBtns value={b.alignment} onChange={a => upd({ alignment: a })} />
                  </div>
                  <div>
                    <label className={lbl}>Värv</label>
                    <input type="color" value={b.color} onChange={e => upd({ color: e.target.value })}
                      className="h-8 w-14 rounded border border-gray-200 cursor-pointer" />
                  </div>
                </div>
              </>
            )
          })()}

          {/* VIDEO */}
          {block.type === 'video' && (() => {
            const b = block as VideoBlock
            return (
              <>
                <div>
                  <label className={lbl}>YouTube / Vimeo URL</label>
                  <input type="text" value={b.url} onChange={e => upd({ url: e.target.value })}
                    className={inp} placeholder="https://youtube.com/watch?v=..." />
                </div>
                <div>
                  <label className={lbl}>Joondus</label>
                  <AlignBtns value={b.alignment} onChange={a => upd({ alignment: a })} />
                </div>
              </>
            )
          })()}

          {/* DIVIDER */}
          {block.type === 'divider' && (() => {
            const b = block as DividerBlock
            return (
              <div className="flex items-end gap-4">
                <div>
                  <label className={lbl}>Värv</label>
                  <input type="color" value={b.color} onChange={e => upd({ color: e.target.value })}
                    className="h-8 w-14 rounded border border-gray-200 cursor-pointer" />
                </div>
                <div className="flex-1">
                  <label className={lbl}>Paksus (px)</label>
                  <input type="number" value={b.thickness} min={1} max={20}
                    onChange={e => upd({ thickness: Number(e.target.value) })} className={inp} />
                </div>
              </div>
            )
          })()}

          {/* SPACER */}
          {block.type === 'spacer' && (() => {
            const b = block as SpacerBlock
            return (
              <div>
                <label className={lbl}>Kõrgus (px)</label>
                <input type="number" value={b.height} min={4} max={400}
                  onChange={e => upd({ height: Number(e.target.value) })} className={inp} />
              </div>
            )
          })()}

          {/* SLIDER */}
          {block.type === 'slider' && (
            <p className="text-[13px] text-gray-500 bg-blue-50 rounded-lg px-3 py-2">
              Toodete slider — renderdatakse automaatselt.
            </p>
          )}

          {/* CALCULATOR */}
          {block.type === 'calculator' && (
            <p className="text-[13px] text-gray-500 bg-blue-50 rounded-lg px-3 py-2">
              Pumbakalkulaator — renderdatakse automaatselt.
            </p>
          )}

          {/* CONTACT FORM */}
          {block.type === 'contact_form' && (
            <p className="text-[13px] text-gray-500 bg-blue-50 rounded-lg px-3 py-2">
              Kontaktvorm — renderdatakse automaatselt.
            </p>
          )}

        </div>
      )}
    </div>
  )
}
