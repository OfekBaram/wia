'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nProvider'

interface StepSelfieProps {
  onCaptured: (dataUrl: string) => void
}

type State =
  | { status: 'empty' }
  | { status: 'compressing' }
  | { status: 'captured'; dataUrl: string }
  | { status: 'error'; message: string }

const MAX_DIM    = 800   // Resize longest side to this many pixels
const JPEG_QUALITY = 0.85

/**
 * Downscale + re-encode to JPEG via canvas. Avoids uploading 10MB phone photos.
 */
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the photo'))
    reader.onload  = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not decode the photo'))
      img.onload  = () => {
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height))
        const w = Math.round(img.width  * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width  = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas not supported'))
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function StepSelfie({ onCaptured }: StepSelfieProps) {
  const { t } = useI18n()
  const [state,     setState]     = useState<State>({ status: 'empty' })
  const fileInputRef              = useRef<HTMLInputElement>(null)

  const openCamera = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // reset so picking the same file twice still fires
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setState({ status: 'error', message: t('selfie.notPhoto') })
      return
    }
    setState({ status: 'compressing' })
    try {
      const dataUrl = await compressImage(file)
      setState({ status: 'captured', dataUrl })
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : 'Failed to process photo' })
    }
  }

  function confirm() {
    if (state.status === 'captured') onCaptured(state.dataUrl)
  }

  return (
    <div className="text-center space-y-6">
      <div>
        <h2 className="font-display text-3xl font-bold text-wia-ink mb-3">
          {t('selfie.title')}
        </h2>
        <p className="text-wia-ink/50 text-sm max-w-sm mx-auto">
          {t('selfie.sub')}
        </p>
      </div>

      {/* Hidden native camera input — `capture="user"` triggers front camera on
          iOS Safari, Chrome Android, etc. Works in every mobile browser. */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFile}
        className="hidden"
      />

      {/* Viewfinder / preview */}
      <div className="relative mx-auto w-72 h-72 rounded-3xl overflow-hidden glass-strong">
        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-wia-purple/60 rounded-tl-lg z-10" />
        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-wia-purple/60 rounded-tr-lg z-10" />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-wia-purple/60 rounded-bl-lg z-10" />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-wia-purple/60 rounded-br-lg z-10" />

        {state.status === 'empty' && (
          <button
            onClick={openCamera}
            className="w-full h-full flex flex-col items-center justify-center gap-3 text-wia-ink/70 hover:text-wia-ink transition-colors"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-wia-purple to-wia-pink flex items-center justify-center shadow-xl shadow-purple-500/30">
              <Camera size={28} className="text-white" />
            </div>
            <span className="text-sm font-medium">{t('selfie.tapOpen')}</span>
          </button>
        )}

        {state.status === 'compressing' && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-wia-ink/60">
            <div className="w-10 h-10 rounded-full border-2 border-wia-purple/30 border-t-wia-purple animate-spin" />
            <span className="text-sm">{t('selfie.processing')}</span>
          </div>
        )}

        {state.status === 'captured' && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={state.dataUrl}
              alt={t('selfie.alt')}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-emerald-500 border-2 border-wia-bg flex items-center justify-center">
              <CheckCircle size={16} className="text-white" />
            </div>
          </>
        )}

        {state.status === 'error' && (
          <button
            onClick={openCamera}
            className="w-full h-full flex flex-col items-center justify-center gap-3 text-red-400/70 px-6"
          >
            <AlertCircle size={32} />
            <span className="text-sm text-center">{state.message}</span>
            <span className="text-xs underline opacity-60">{t('selfie.tapRetry')}</span>
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3">
        {state.status === 'captured' && (
          <>
            <button
              onClick={openCamera}
              className="flex items-center gap-2 px-5 py-3 rounded-xl glass text-wia-ink/60 hover:text-wia-ink transition-all text-sm"
            >
              <RefreshCw size={16} />
              {t('selfie.retake')}
            </button>
            <button
              onClick={confirm}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-wia-purple to-wia-pink text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
            >
              <CheckCircle size={16} />
              {t('selfie.usePhoto')}
            </button>
          </>
        )}
      </div>

      <p className="text-xs text-wia-ink/50 max-w-sm mx-auto">
        {t('selfie.privacy')}
      </p>
    </div>
  )
}
