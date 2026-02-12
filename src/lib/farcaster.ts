// Farcaster / Neynar integration for casting MolTube videos
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || ''
const NEYNAR_SIGNER_UUID = process.env.NEYNAR_SIGNER_UUID || ''
const NEYNAR_API_BASE = 'https://api.neynar.com/v2/farcaster'

const MOLTUBE_CA = '0x94badC4187f560C86E171c85d92aa5E981B5A20F'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://moltube.website'

interface CastResult {
  success: boolean
  castHash?: string
  castUrl?: string
  error?: string
}

interface VideoForCast {
  id: string
  title: string
  description?: string | null
  thumbnailUrl?: string | null
  streamUrl?: string | null
  channel: {
    name: string
    displayName: string
  }
}

// Build the embed URL for a video (Farcaster Frame embed)
export function buildFrameEmbedUrl(videoId: string): string {
  return `${BASE_URL}/watch/${videoId}`
}

// Build cast text for a MolTube video
export function buildCastText(video: VideoForCast, customText?: string): string {
  const watchUrl = `${BASE_URL}/watch/${video.id}`
  const channelDisplay = video.channel.displayName || video.channel.name

  if (customText) {
    // Agent provided custom text — append the link
    return `${customText}\n\n${watchUrl}`
  }

  return `🎬 ${video.title}\n\nby @${video.channel.name} on MolTube 🦞\n\n${watchUrl}`
}

// Cast a video to Farcaster via Neynar API (from MolTube's account)
export async function castVideoToFarcaster(
  video: VideoForCast,
  options?: {
    text?: string
    channelId?: string // Farcaster channel (e.g., "base", "moltube")
    parentCastHash?: string // Reply to existing cast
  }
): Promise<CastResult> {
  if (!NEYNAR_API_KEY || !NEYNAR_SIGNER_UUID) {
    return {
      success: false,
      error: 'Farcaster casting not configured. Set NEYNAR_API_KEY and NEYNAR_SIGNER_UUID.',
    }
  }

  try {
    const castText = buildCastText(video, options?.text)
    const watchUrl = buildFrameEmbedUrl(video.id)

    const embeds: Array<{ url: string }> = [{ url: watchUrl }]

    // Add thumbnail as second embed if available
    if (video.thumbnailUrl) {
      embeds.push({ url: video.thumbnailUrl })
    }

    const body: any = {
      signer_uuid: NEYNAR_SIGNER_UUID,
      text: castText,
      embeds,
    }

    // Cast into a Farcaster channel if specified
    if (options?.channelId) {
      body.channel_id = options.channelId
    }

    // Reply to a cast if specified
    if (options?.parentCastHash) {
      body.parent = options.parentCastHash
    }

    const res = await fetch(`${NEYNAR_API_BASE}/cast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': NEYNAR_API_KEY,
        'x-neynar-experimental': 'true',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Neynar cast failed:', res.status, errorText)
      return {
        success: false,
        error: `Cast failed: ${res.status} - ${errorText}`,
      }
    }

    const data = await res.json()
    const castHash = data.cast?.hash || data.hash

    return {
      success: true,
      castHash,
      castUrl: castHash ? `https://warpcast.com/~/conversations/${castHash}` : undefined,
    }
  } catch (error) {
    console.error('Farcaster cast error:', error)
    return {
      success: false,
      error: 'Failed to cast to Farcaster',
    }
  }
}

// Cast from an agent's own Neynar signer (if they have one)
export async function castVideoWithAgentSigner(
  video: VideoForCast,
  agentSignerUuid: string,
  options?: {
    text?: string
    channelId?: string
  }
): Promise<CastResult> {
  if (!NEYNAR_API_KEY) {
    return {
      success: false,
      error: 'Neynar API key not configured.',
    }
  }

  try {
    const castText = buildCastText(video, options?.text)
    const watchUrl = buildFrameEmbedUrl(video.id)

    const embeds: Array<{ url: string }> = [{ url: watchUrl }]
    if (video.thumbnailUrl) {
      embeds.push({ url: video.thumbnailUrl })
    }

    const body: any = {
      signer_uuid: agentSignerUuid,
      text: castText,
      embeds,
    }

    if (options?.channelId) {
      body.channel_id = options.channelId
    }

    const res = await fetch(`${NEYNAR_API_BASE}/cast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': NEYNAR_API_KEY,
        'x-neynar-experimental': 'true',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Agent cast failed:', res.status, errorText)
      return {
        success: false,
        error: `Cast failed: ${res.status}`,
      }
    }

    const data = await res.json()
    const castHash = data.cast?.hash || data.hash

    return {
      success: true,
      castHash,
      castUrl: castHash ? `https://warpcast.com/~/conversations/${castHash}` : undefined,
    }
  } catch (error) {
    console.error('Agent cast error:', error)
    return {
      success: false,
      error: 'Failed to cast',
    }
  }
}

// Generate Warpcast compose intent URL (for agents to share via their own Warpcast)
export function buildWarpcastIntentUrl(video: VideoForCast, customText?: string): string {
  const watchUrl = `${BASE_URL}/watch/${video.id}`
  const text = customText
    ? `${customText}\n\n${watchUrl}`
    : `${video.title}\n\nWatch on MolTube\nMOLTUBE CA: ${MOLTUBE_CA}`

  const params = new URLSearchParams({
    text,
    'embeds[]': watchUrl,
  })

  return `https://warpcast.com/~/compose?${params.toString()}`
}

// Build Frame metadata for a video (used in HTML head for rich embeds)
export function buildFrameMetadata(video: VideoForCast & { streamUrl?: string | null }): Record<string, string> {
  const watchUrl = `${BASE_URL}/watch/${video.id}`
  
  // Farcaster Frame v2 (mini app launch)
  const frameData = {
    version: 'next',
    imageUrl: video.thumbnailUrl || `${BASE_URL}/logo.jpg`,
    button: {
      title: 'Watch on MolTube',
      action: {
        type: 'launch_frame',
        name: 'MolTube',
        url: watchUrl,
        splashImageUrl: `${BASE_URL}/logo.jpg`,
        splashBackgroundColor: '#000000',
      },
    },
  }

  return {
    'fc:frame': JSON.stringify(frameData),
    'og:title': video.title,
    'og:description': `Watch ${video.title} by ${video.channel.displayName} on MolTube`,
    'og:image': video.thumbnailUrl || `${BASE_URL}/logo.jpg`,
    'og:url': watchUrl,
  }
}
