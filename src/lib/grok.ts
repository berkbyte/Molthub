import { put } from '@vercel/blob'

const GROK_API_KEY = process.env.GROK_API_KEY!
const GROK_IMAGE_ENDPOINT = 'https://api.x.ai/v1/images/generations'
const GROK_VIDEO_ENDPOINT = 'https://api.x.ai/v1/videos/generations'

interface GrokImageResponse {
  data?: Array<{
    url?: string
    b64_json?: string
    revised_prompt?: string
  }>
}

export async function generateGrokImage(
  prompt: string,
): Promise<{ url: string | null; error?: string }> {
  try {
    const res = await fetch(GROK_IMAGE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-imagine-image',
        prompt,
        n: 1,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error('Grok image generation failed:', error)
      return { url: null, error: `Image generation failed: ${res.status}` }
    }

    const data: GrokImageResponse = await res.json()

    if (data.data?.[0]?.url) {
      return { url: data.data[0].url }
    }

    if (data.data?.[0]?.b64_json) {
      const buffer = Buffer.from(data.data[0].b64_json, 'base64')
      const blob = await put(`generated/img_${Date.now()}.png`, buffer, {
        access: 'public',
        contentType: 'image/png',
      })
      return { url: blob.url }
    }

    return { url: null, error: 'No image data in response' }
  } catch (error) {
    console.error('Grok image generation error:', error)
    return { url: null, error: 'Image generation failed' }
  }
}

// Start video generation — returns request_id immediately, no polling
export async function startGrokVideo(
  prompt: string
): Promise<{ requestId: string | null; url?: string; error?: string }> {
  try {
    const res = await fetch(GROK_VIDEO_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-imagine-video',
        prompt,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error('Grok video generation failed:', error)
      return { requestId: null, error: `Video generation failed: ${res.status}` }
    }

    const data = await res.json()

    // xAI returns { request_id: "..." }
    if (data.request_id) {
      return { requestId: data.request_id }
    }

    // Handle direct URL response (unlikely but fallback)
    if (data.video?.url) return { requestId: null, url: data.video.url }
    if (data.data?.[0]?.url) return { requestId: null, url: data.data[0].url }

    return { requestId: null, error: 'No request_id or video in response' }
  } catch (error) {
    console.error('Grok video start error:', error)
    return { requestId: null, error: 'Video generation failed' }
  }
}

// Check video generation status — single poll, no looping
export async function checkGrokVideoStatus(
  requestId: string
): Promise<{ status: 'pending' | 'done' | 'expired' | 'error'; url?: string; error?: string }> {
  try {
    const res = await fetch(`https://api.x.ai/v1/videos/${requestId}`, {
      headers: { 'Authorization': `Bearer ${GROK_API_KEY}` },
    })

    if (!res.ok) {
      return { status: 'pending' }
    }

    const data = await res.json()

    // Grok returns video.url directly when done (no explicit status field)
    if (data.video?.url) {
      return { status: 'done', url: data.video.url }
    }

    if (data.status === 'done') {
      const url = data.data?.[0]?.url || data.url
      if (url) return { status: 'done', url }
      return { status: 'error', error: 'Video done but no URL found' }
    }

    if (data.status === 'expired') {
      return { status: 'expired', error: 'Video generation expired' }
    }

    return { status: 'pending' }
  } catch (e) {
    return { status: 'pending' }
  }
}

export async function generateThumbnail(
  videoPrompt: string
): Promise<{ url: string | null; error?: string }> {
  const thumbnailPrompt = `${videoPrompt} - make it like a fun generic youtuber thumbnail`
  return generateGrokImage(thumbnailPrompt)
}

export async function generateLobsterAvatar(): Promise<{ url: string | null; error?: string }> {
  const styles = [
    'pirate', 'astronaut', 'chef', 'wizard', 'detective', 'ninja',
    'samurai', 'viking', 'cowboy', 'DJ', 'scientist', 'artist',
    'gamer', 'superhero', 'rockstar', 'surfer', 'pilot', 'boxer',
    'knight', 'pharaoh', 'rapper', 'punk rocker', 'mad professor',
  ]
  const colors = [
    'red', 'blue', 'golden', 'purple', 'neon green', 'orange',
    'pink', 'cyan', 'crimson', 'turquoise', 'electric blue',
    'sunset orange', 'emerald', 'ruby red', 'sapphire',
  ]
  const style = styles[Math.floor(Math.random() * styles.length)]
  const color = colors[Math.floor(Math.random() * colors.length)]

  const prompt = `A unique ${color} lobster character as a ${style}, portrait style, Bored Ape Yacht Club NFT aesthetic, digital art, vibrant colors, distinctive accessories, expressive face, solid colorful background, cartoon style, high quality, collectible NFT art`
  return generateGrokImage(prompt)
}

export async function downloadAndUploadToBlob(
  sourceUrl: string,
  filename: string,
  contentType: string
): Promise<string | null> {
  try {
    const response = await fetch(sourceUrl)
    if (!response.ok) return null

    const buffer = Buffer.from(await response.arrayBuffer())
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType,
    })

    return blob.url
  } catch (error) {
    console.error('Download and upload error:', error)
    return null
  }
}
