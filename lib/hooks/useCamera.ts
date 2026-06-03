'use client'

import { useState, useRef, useCallback } from 'react'
import type { CameraState } from '../types'

export function useCamera() {
  const [state, setState] = useState<CameraState>({ status: 'idle' })
  const streamRef = useRef<MediaStream | null>(null)

  const start = useCallback(async (videoEl: HTMLVideoElement) => {
    setState({ status: 'requesting' })
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      })
      streamRef.current = stream
      videoEl.srcObject = stream
      setState({ status: 'active', stream })
    } catch (err) {
      setState({
        status: 'denied',
        error: err instanceof Error ? err.message : 'Camera access denied',
      })
    }
  }, [])

  const capture = useCallback((videoEl: HTMLVideoElement): string | null => {
    const canvas = document.createElement('canvas')
    canvas.width  = videoEl.videoWidth
    canvas.height = videoEl.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    // Mirror horizontally (selfie)
    ctx.scale(-1, 1)
    ctx.drawImage(videoEl, -canvas.width, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    stop()
    setState({ status: 'captured', capturedDataUrl: dataUrl })
    return dataUrl
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const reset = useCallback(() => {
    stop()
    setState({ status: 'idle' })
  }, [stop])

  return { state, start, capture, stop, reset }
}
