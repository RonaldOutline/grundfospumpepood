'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

const canManageProducts = (role: string) => role === 'superadmin'

type Status = 'idle' | 'uploading' | 'done' | 'error'

interface Result {
  updated: number
  skipped: number
  errors: string[]
  total_errors: number
}

export default function ImportPage() {
  const { profile } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [file, setFile]       = useState<File | null>(null)
  const [status, setStatus]   = useState<Status>('idle')
  const [result, setResult]   = useState<Result | null>(null)
  const [errMsg, setErrMsg]   = useState('')

  if (profile && !canManageProducts(profile.role)) return null

  const handleFile = (f: File) => {
    setFile(f)
    setStatus('idle')
    setResult(null)
    setErrMsg('')
  }

  const handleImport = async () => {
    if (!file) return
    setStatus('uploading')
    setErrMsg('')

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/haldus/import', {
        method: 'POST',
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        body: form,
      })

      const json = await res.json()
      if (!res.ok) {
        setErrMsg(json.error ?? 'Viga importimisel')
        setStatus('error')
        return
      }

      setResult(json)
      setStatus('done')
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'Tundmatu viga')
      setStatus('error')
    }
  }

  const reset = () => {
    setFile(null)
    setStatus('idle')
    setResult(null)
    setErrMsg('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/haldus/tooted" className="text-gray-400 hover:text-[#003366] transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Impordi tooted</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

        {/* Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-[14px] text-blue-800 space-y-1">
          <p className="font-semibold">Kuidas kasutada:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-blue-700">
            <li>Lae alla eksportfail toodete lehelt (Ekspordi CSV nupp)</li>
            <li>Muuda failis soovitud andmeid — tooteinfo, hinnad, sildid, tehnilised andmed</li>
            <li>Lae muudetud fail siia üles</li>
          </ol>
          <p className="text-blue-600 mt-1">SKU peab jääma muutmata — selle järgi leitakse toode.</p>
        </div>

        {/* Drop zone */}
        {!file && (
          <div
            onClick={() => fileRef.current?.click()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            onDragOver={e => e.preventDefault()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-[#003366] hover:bg-blue-50/30 transition-colors"
          >
            <Upload size={30} className="mx-auto mb-3 text-gray-300" />
            <p className="text-[15px] text-gray-600 mb-1">
              Lohista fail siia või <span className="text-[#003366] font-medium">vali fail</span>
            </p>
            <p className="text-[13px] text-gray-400">XLSX</p>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
        />

        {/* File selected */}
        {file && status === 'idle' && (
          <div className="flex items-center justify-between gap-4 bg-gray-50 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <FileSpreadsheet size={20} className="text-green-600 flex-shrink-0" />
              <span className="text-[15px] font-medium text-gray-800 truncate">{file.name}</span>
              <span className="text-[13px] text-gray-400 flex-shrink-0">
                {(file.size / 1024).toFixed(0)} KB
              </span>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={reset}
                className="px-3 py-1.5 text-[14px] text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg transition-colors"
              >
                Tühista
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-1.5 text-[14px] font-semibold text-white bg-[#003366] rounded-lg hover:bg-[#004080] transition-colors"
              >
                Impordi
              </button>
            </div>
          </div>
        )}

        {/* Uploading */}
        {status === 'uploading' && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-4">
            <div className="w-5 h-5 border-2 border-[#003366] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span className="text-[15px] text-blue-800 font-medium">Importin andmeid, palun oota...</span>
          </div>
        )}

        {/* Success */}
        {status === 'done' && result && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-4">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-[15px] text-green-800">
                <p className="font-semibold">Import lõpetatud</p>
                <p className="mt-0.5">
                  <span className="font-bold">{result.updated}</span> toodet uuendatud
                  {result.skipped > 0 && <>, <span className="font-bold">{result.skipped}</span> vahele jäetud (SKU puudub)</>}
                  {result.total_errors > 0 && <>, <span className="font-bold text-red-600">{result.total_errors}</span> viga</>}
                </p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-[13px] font-semibold text-red-700 mb-1">Vead:</p>
                <ul className="text-[13px] text-red-600 space-y-0.5">
                  {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
                  {result.total_errors > result.errors.length && (
                    <li className="text-gray-400">... ja {result.total_errors - result.errors.length} rohkem</li>
                  )}
                </ul>
              </div>
            )}

            <button
              onClick={reset}
              className="w-full py-2.5 text-[15px] font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
            >
              Impordi uus fail
            </button>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-4">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[15px] font-semibold text-red-700">Import ebaõnnestus</p>
                <p className="text-[14px] text-red-600 mt-0.5">{errMsg}</p>
              </div>
            </div>
            <button
              onClick={reset}
              className="w-full py-2.5 text-[15px] font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
            >
              Proovi uuesti
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
