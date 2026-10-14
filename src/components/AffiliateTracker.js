'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

export default function AffiliateTracker() {
  const searchParams = useSearchParams()
  const lastTrackedRef = useRef(null)

  useEffect(() => {
    const rawRef = searchParams?.get('ref')
    if (!rawRef) return

    const ref = rawRef.trim().toLowerCase()
    if (!ref || ref === lastTrackedRef.current) return
    lastTrackedRef.current = ref

    try {
      // 1. Store in localStorage for client-side forms
      localStorage.setItem('affiliate_ref', ref)
    } catch (e) {
      // Storage blocked in strict privacy mode
    }

    try {
      // 2. Store in cookie (30 days) for server actions & OAuth callbacks
      const maxAge = 60 * 60 * 24 * 30 // 30 days
      document.cookie = `affiliate_ref=${encodeURIComponent(ref)}; path=/; max-age=${maxAge}; SameSite=Lax`
    } catch (e) {
      // Cookie blocked
    }

    // 3. Avoid duplicate API pings within the same session
    const sessionKey = `tracked_ref_${ref}`
    try {
      if (sessionStorage.getItem(sessionKey)) return
      sessionStorage.setItem(sessionKey, '1')
    } catch (e) {
      // Session storage blocked
    }

    // 4. Ping the tracker API to record the unique visit
    fetch('/api/affiliates/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref })
    }).catch(err => {
      console.warn('[AffiliateTracker] track error:', err?.message || err)
    })
  }, [searchParams])

  return null
}
