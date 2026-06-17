'use client'

import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Printer, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '@/lib/i18n/I18nProvider'

interface QRCodePosterProps {
  venueName: string
  url:       string
  /** When true, shows a compact poster card. When false, shows just the code. */
  withPoster?: boolean
}

export function QRCodePoster({ venueName, url, withPoster = true }: QRCodePosterProps) {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function downloadSvg() {
    const svg = ref.current?.querySelector('svg')
    if (!svg) return
    const xml = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([xml], { type: 'image/svg+xml' })
    const dlUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = dlUrl
    a.download = `wia-${venueName.toLowerCase().replace(/\s+/g, '-')}-qr.svg`
    a.click()
    URL.revokeObjectURL(dlUrl)
  }

  function printPoster() {
    window.print()
  }

  if (!withPoster) {
    return (
      <div ref={ref} className="inline-block p-3 bg-white rounded-2xl">
        <QRCodeSVG value={url} size={160} level="H" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Poster preview */}
      <div
        ref={ref}
        className="relative mx-auto w-full max-w-sm aspect-[3/4] bg-gradient-to-br from-wia-purple to-wia-pink rounded-3xl p-8 flex flex-col items-center justify-between text-white shadow-2xl shadow-purple-500/30 overflow-hidden"
      >
        {/* Decorative blob */}
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-white/10 blur-3xl" />

        {/* Top */}
        <div className="relative z-10 text-center space-y-2">
          <div className="text-xs uppercase tracking-[0.2em] opacity-70">
            {t("qr.welcomeTo")}
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
            {venueName}
          </h2>
        </div>

        {/* QR */}
        <div className="relative z-10 bg-white p-4 rounded-2xl shadow-xl">
          <QRCodeSVG value={url} size={180} level="H" />
        </div>

        {/* Bottom */}
        <div className="relative z-10 text-center space-y-1">
          <div className="font-display text-lg font-bold">
            {t("qr.whoIsAround")}
          </div>
          <div className="text-xs opacity-80">
            {t("qr.scanToSee")}
          </div>
          <div className="text-[10px] opacity-50 pt-1">wia.com</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={copyLink}
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-wia-ink/15 hover:bg-white/10 text-wia-ink/70 hover:text-wia-ink text-sm font-medium transition-all"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          {copied ? t("qr.copied") : t("qr.copyLink")}
        </button>
        <button
          onClick={downloadSvg}
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-wia-ink/15 hover:bg-white/10 text-wia-ink/70 hover:text-wia-ink text-sm font-medium transition-all"
        >
          <Download size={14} />
          {t("qr.downloadQr")}
        </button>
        <button
          onClick={printPoster}
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-wia-ink/15 hover:bg-white/10 text-wia-ink/70 hover:text-wia-ink text-sm font-medium transition-all"
        >
          <Printer size={14} />
          {t("qr.print")}
        </button>
      </div>
    </div>
  )
}
