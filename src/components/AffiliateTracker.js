'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function AffiliateTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const ref = searchParams?.get('ref')
    if (ref) {
      // Store locally so signup can use it later
      localStorage.setItem('affiliate_ref', ref)
      
      // Ping the tracker API to record the PPC visit
      fetch('/api/affiliates/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref })
      }).catch(err => console.error('Tracker error:', err))
    }
  }, [searchParams])

  return null
}
