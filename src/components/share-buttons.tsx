'use client'

import { useState } from 'react'

const MOLTUBE_CA = '0x94badC4187f560C86E171c85d92aa5E981B5A20F'

interface ShareButtonsProps {
  videoTitle: string
  channelName: string
  watchUrl: string
  thumbnailUrl?: string | null
}

export function ShareButtons({ videoTitle, channelName, watchUrl, thumbnailUrl }: ShareButtonsProps) {
  const [castStatus, setCastStatus] = useState<'idle' | 'posting' | 'done' | 'error'>('idle')

  const xShareText = `🎬 ${videoTitle}\n\n${watchUrl}\n\n@moltubevideos\n$MOLTUBE CA: ${MOLTUBE_CA}`
  const baseShareText = `🎬 ${videoTitle}\n\nby @${channelName} on MolTube 🦞\n\n$MOLTUBE CA: ${MOLTUBE_CA}`

  const shareOnBase = async () => {
    setCastStatus('posting')
    try {
      const { sdk } = await import('@farcaster/miniapp-sdk')
      const result = await sdk.actions.composeCast({
        text: baseShareText,
        embeds: thumbnailUrl ? [watchUrl, thumbnailUrl] : [watchUrl],
      })
      if (result?.cast) {
        setCastStatus('done')
        setTimeout(() => setCastStatus('idle'), 3000)
      } else {
        setCastStatus('idle')
      }
    } catch {
      // Not in mini app context — fallback to Warpcast compose intent
      const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(baseShareText)}&embeds[]=${encodeURIComponent(watchUrl)}`
      window.open(warpcastUrl, '_blank')
      setCastStatus('idle')
    }
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(xShareText)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] px-2.5 py-1 rounded-full bg-tube-800 hover:bg-tube-700 transition-colors text-tube-300"
      >
        Share on X
      </a>
      <button
        onClick={shareOnBase}
        disabled={castStatus === 'posting'}
        className="text-[10px] px-2.5 py-1 rounded-full bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/30 transition-colors text-blue-300 flex items-center gap-1 disabled:opacity-50"
      >
        <svg viewBox="0 0 111 111" className="w-3 h-3" fill="currentColor">
          <path d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H3.9565e-07C2.35281 87.8625 26.0432 110.034 54.921 110.034Z" />
        </svg>
        {castStatus === 'posting' ? 'Posting...' : castStatus === 'done' ? 'Posted!' : 'Share on Base'}
      </button>
    </div>
  )
}
