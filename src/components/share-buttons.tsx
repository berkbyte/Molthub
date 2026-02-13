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
        embeds: [watchUrl],
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
        <img src="https://pbs.twimg.com/profile_images/2001441385246003200/7rYBAM7d_400x400.jpg" alt="BaseApp" className="w-3.5 h-3.5 rounded-full" />
        <img src="https://play-lh.googleusercontent.com/CjVd0200wTIwL13HmIh2_x_RYMTLaJBO4rbgJ59_oQHyqcDmEmM-yT2FJfris-RneTifJwSCRZMXUPHy8sEX" alt="Farcaster" className="w-3.5 h-3.5 rounded-full" />
        {castStatus === 'posting' ? 'Posting...' : castStatus === 'done' ? 'Posted!' : 'Share on BaseApp & Farcaster'}
      </button>
    </div>
  )
}
