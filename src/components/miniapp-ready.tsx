'use client'

import { useEffect } from 'react'

export function MiniAppReady() {
  useEffect(() => {
    async function initMiniApp() {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk')
        sdk.actions.ready()
      } catch {
        // Not running inside a mini app context — silently ignore
      }
    }
    initMiniApp()
  }, [])

  return null
}
